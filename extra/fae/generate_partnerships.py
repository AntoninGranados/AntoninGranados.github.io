# -*- coding: utf-8 -*-
"""Generate partnerships CSV from Telecom Paris partnerships page."""

import csv
import time
import urllib.request
from html.parser import HTMLParser

import generate_abroad as ga
from mappings import CONTINENT_BY_COUNTRY, COUNTRY_ALIASES

PARTNERSHIPS_URL = "https://www.telecom-paris.fr/fr/international/strategie/partenariats"
OUT_PATH = "partnerships.csv"


def log(message):
    timestamp = time.strftime("%H:%M:%S")
    print(f"[{timestamp}] {message}")


def fetch_url(url, timeout=20):
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return resp.read().decode("utf-8", errors="ignore")


def clean_text(value):
    return " ".join(value.split()).strip()


def split_details(text):
    text = clean_text(text)
    if " (" in text and text.endswith(")"):
        name, details = text.rsplit(" (", 1)
        return clean_text(name), clean_text(details[:-1])
    return text, ""


class PartnershipParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.current_country = None
        self.in_h4 = False
        self.h4_text = []
        self.li_depth = 0
        self.current_item = None
        self.current_subitem = None
        self.rows = []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == "h4":
            self.in_h4 = True
            self.h4_text = []
        if tag == "li":
            self.li_depth += 1
            if self.li_depth == 1:
                self.current_item = {"text": "", "href": None, "subitems": []}
            elif self.li_depth == 2:
                self.current_subitem = {"text": "", "href": None}
        if tag == "a":
            href = attrs.get("href")
            if self.li_depth == 1 and self.current_item and not self.current_item["href"]:
                self.current_item["href"] = href
            if self.li_depth >= 2 and self.current_subitem and not self.current_subitem["href"]:
                self.current_subitem["href"] = href

    def handle_endtag(self, tag):
        if tag == "h4" and self.in_h4:
            self.in_h4 = False
            self.current_country = clean_text("".join(self.h4_text))
        if tag == "li":
            if self.li_depth == 2 and self.current_subitem:
                self.current_item["subitems"].append(self.current_subitem)
                self.current_subitem = None
            if self.li_depth == 1 and self.current_item:
                self._flush_item(self.current_item)
                self.current_item = None
            self.li_depth = max(0, self.li_depth - 1)

    def handle_data(self, data):
        if self.in_h4:
            self.h4_text.append(data)
            return
        if self.li_depth >= 2 and self.current_subitem is not None:
            self.current_subitem["text"] += data
            return
        if self.li_depth == 1 and self.current_item is not None:
            self.current_item["text"] += data

    def _flush_item(self, item):
        if not self.current_country:
            return
        parent_name, parent_details = split_details(item.get("text", ""))
        parent_href = item.get("href") or ""
        subitems = item.get("subitems") or []
        if subitems:
            for sub in subitems:
                sub_name, sub_details = split_details(sub.get("text", ""))
                if not sub_name:
                    continue
                details = " / ".join([d for d in (parent_details, sub_details) if d])
                name = f"{parent_name} - {sub_name}" if parent_name else sub_name
                href = sub.get("href") or parent_href
                self.rows.append({
                    "country": self.current_country,
                    "institution": name,
                    "details": details,
                    "url": href,
                })
            return
        if parent_name:
            self.rows.append({
                "country": self.current_country,
                "institution": parent_name,
                "details": parent_details,
                "url": parent_href,
            })


def normalize_country(raw):
    if not raw:
        return ""
    if "/" in raw:
        raw = raw.split("/")[-1].strip()
    raw_norm = ga.normalize(raw)
    manual = {
        "united states of america": "United States",
        "the netherlands": "Netherlands",
        "czech republic": "Czech Republic",
        "south korea": "South Korea",
        "north korea": "North Korea",
        "united kingdom": "United Kingdom",
        "islamic republic of iran": "Iran",
    }
    if raw_norm in manual:
        return manual[raw_norm]
    for alias, canonical in COUNTRY_ALIASES.items():
        if alias == raw_norm:
            return canonical
    return raw.strip()


def main():
    log("Fetching partnerships page...")
    html = fetch_url(PARTNERSHIPS_URL, timeout=20)
    start = html.find("Nos partenariats / Our partnerships")
    end = html.find("Contact")
    if start != -1 and end != -1 and end > start:
        html = html[start:end]
    parser = PartnershipParser()
    parser.feed(html)
    rows = parser.rows
    qs_year, _, qs_nid = ga.resolve_qs_source()
    qs_cache_path = ga.QS_CACHE_TEMPLATE.format(year=qs_year)
    qs_records = ga.fetch_qs_rankings(qs_nid, qs_cache_path, qs_year, refresh_cache=False)
    qs_name_to_record, qs_names_sorted, qs_search_index = ga.build_qs_index(qs_records)
    enriched = []
    for row in rows:
        country = normalize_country(row.get("country", ""))
        continent = CONTINENT_BY_COUNTRY.get(country, "")
        institution = row.get("institution", "")
        qs_rec = None
        inst_norm = ga.normalize(institution)
        if "universite catholique de louvain" in inst_norm:
            qs_rec = qs_name_to_record.get(ga.normalize("Université catholique de Louvain (UCLouvain)"))
        elif "ecole polytechnique de montreal" in inst_norm:
            qs_rec = qs_name_to_record.get(ga.normalize("Université de Montréal"))
        elif "ecole polytechnique de tunisie" in inst_norm or "ept" in inst_norm:
            qs_rec = None
        if qs_rec is None:
            qs_rec = ga.match_qs_record(institution, qs_name_to_record, qs_names_sorted)
        if qs_rec is None:
            normalized = ga.normalize(institution)
            if len(normalized) >= 8:
                qs_rec = ga.local_fuzzy_match(institution, qs_search_index)
        qs_name = qs_rec.get("title") if qs_rec else ""
        qs_rank = qs_rec.get("rank_display") if qs_rec else ""
        enriched.append({
            "country": country,
            "continent": continent,
            "institution": institution,
            "qs_university": qs_name,
            "qs_year": str(qs_year),
            "qs_rank": qs_rank,
            "details": row.get("details", ""),
            "url": row.get("url", ""),
        })
    enriched.sort(key=lambda r: (r["country"], r["institution"]))
    with open(OUT_PATH, "w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(
            f,
            fieldnames=[
                "country",
                "continent",
                "institution",
                "qs_university",
                "qs_year",
                "qs_rank",
                "details",
                "url",
            ],
        )
        writer.writeheader()
        writer.writerows(enriched)
    log(f"Wrote {OUT_PATH} with {len(enriched)} rows")


if __name__ == "__main__":
    main()
