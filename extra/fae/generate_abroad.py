# -*- coding: utf-8 -*-
"""Generate abroad formations CSV with country/continent and QS ranking.

Fetches formations from the SynapseS page and QS WUR data from
TopUniversities rankings endpoint, then matches universities by name.
"""

import argparse
import csv
import json
import re
import time
import unicodedata
import urllib.request
from difflib import SequenceMatcher
from html.parser import HTMLParser
from urllib.parse import urljoin

from mappings import CODE_COUNTRY, CONTINENT_BY_COUNTRY, COUNTRY_ALIASES, QS_ALIAS

SYNAPSES_URL_BASE = (
    "https://synapses.telecom-paris.fr/catalogue/2026-2027/parcours/1460/"
    "3A-FAE-formation-a-l-etranger-en-3e-annee"
)
SYNAPSES_URL_FULL = (
    "https://synapses.telecom-paris.fr/catalogue/2026-2027/parcours/1460/"
    "3A-FAE-formation-a-l-etranger-en-3e-annee?from=D4"
)

QS_YEAR_PRIMARY = 2026
QS_YEAR_FALLBACK = 2025
QS_WUR_URL_TEMPLATE = "https://www.topuniversities.com/world-university-rankings/{year}"
QS_WUR_FALLBACK_NIDS = {
    2025: "3990755",
}
QS_ENDPOINT = "https://www.topuniversities.com/rankings/endpoint"

OUT_PATH = "abroad_formations.csv"
QS_CACHE_TEMPLATE = "qs_wur_{year}.json"


class FormationParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.in_tr = False
        self.in_td = False
        self.in_td_libelle = False
        self.current: dict[str, None | str] | None = None
        self.formations = []
        self.capture_text = False
        self.next_href = None
        self.in_pagination = False
        self.last_a_text = None
        self.last_a_href = None
        self.rel_next = None

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == "link" and attrs.get("rel") == "next":
            self.rel_next = attrs.get("href")
        if tag == "tr":
            self.in_tr = True
            self.current = {
                "code": None,
                "title": None,
                "href": None,
            }
        if self.in_tr and tag == "td":
            self.in_td = True
            if attrs.get("class") == "libelle":
                self.in_td_libelle = True
        if self.in_td_libelle and tag == "span" and attrs.get("class") == "label label-ue":
            self.capture_text = True
        if self.in_td_libelle and tag == "a":
            self.capture_text = True
            if self.current is not None:
                self.current["title"] = attrs.get("title")
                self.current["href"] = attrs.get("href")
        if tag == "ul" and attrs.get("class") == "pagination":
            self.in_pagination = True
        if self.in_pagination and tag == "a":
            self.last_a_text = ""
            self.last_a_href = attrs.get("href")

    def handle_endtag(self, tag):
        if tag in ("span", "a") and self.capture_text:
            self.capture_text = False
        if tag == "td":
            self.in_td = False
            self.in_td_libelle = False
        if tag == "tr" and self.in_tr:
            self.in_tr = False
            if self.current and self.current.get("code"):
                self.formations.append(self.current)
        if tag == "ul" and self.in_pagination:
            self.in_pagination = False

    def handle_data(self, data):
        if self.in_pagination and self.last_a_text is not None:
            self.last_a_text += data
            if "Suivant" in self.last_a_text or "Next" in self.last_a_text:
                self.next_href = self.last_a_href
        if not self.in_tr or self.current is None:
            return
        if self.in_td_libelle and self.capture_text:
            text = data.strip()
            if not text:
                return
            if self.current["code"] is None:
                self.current["code"] = text
        if self.in_td and not self.in_td_libelle:
            # Intentionally ignored: category/metadata columns can change.
            return


def normalize(value):
    if value is None:
        return ""
    value = unicodedata.normalize("NFKD", value)
    value = "".join(c for c in value if not unicodedata.combining(c))
    value = value.lower()
    value = re.sub(r"[^a-z0-9\s\-\(\)\,\.]", " ", value)
    value = re.sub(r"\s+", " ", value).strip()
    return value


def log(message):
    timestamp = time.strftime("%H:%M:%S")
    print(f"[{timestamp}] {message}")


def fetch_url(url, timeout=20, retries=2):
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    last_err = None
    for attempt in range(retries):
        try:
            with urllib.request.urlopen(req, timeout=timeout) as resp:
                return resp.read().decode("utf-8", errors="ignore")
        except Exception as err:  # pragma: no cover - network errors
            last_err = err
            time.sleep(1 + attempt)
    raise last_err


def fetch_json(url, timeout=20, retries=2):
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    last_err = None
    for attempt in range(retries):
        try:
            with urllib.request.urlopen(req, timeout=timeout) as resp:
                data = resp.read().decode("utf-8", errors="ignore")
            import json

            return json.loads(data)
        except Exception as err:  # pragma: no cover - network errors
            last_err = err
            time.sleep(1 + attempt)
    raise last_err


def fetch_formations(start_url):
    seen = set()
    formations = []
    url = start_url
    log("Fetching SynapseS formations...")
    while url and url not in seen:
        seen.add(url)
        html = fetch_url(url, timeout=20, retries=2)
        parser = FormationParser()
        parser.feed(html)
        for item in parser.formations:
            item["source_url"] = url
            formations.append(item)
        if parser.next_href:
            url = urljoin(url, parser.next_href)
        elif parser.rel_next:
            url = urljoin(url, parser.rel_next)
        else:
            url = None
    return formations


def fetch_qs_rankings(nid, cache_path, year, refresh_cache=False):
    if not refresh_cache:
        try:
            with open(cache_path, "r", encoding="utf-8") as f:
                cached = json.load(f)
            if isinstance(cached, list) and cached:
                log(f"Loaded QS cache from {cache_path} ({len(cached)} records).")
                return cached
        except FileNotFoundError:
            pass
        except json.JSONDecodeError:
            pass

    # Fetch first page to get pagination
    log(f"Fetching QS WUR {year} dataset...")
    params = (
        f"nid={nid}&page=0&items_per_page=200&tab=indicators&region=&countries="
        f"&cities=&search=&star=&sort_by=&order_by=&program_type=&scholarship="
        f"&fee=&english_score=&academic_score=&mix_student=&loggedincache="
    )
    first_url = f"{QS_ENDPOINT}?{params}"
    payload = fetch_json(first_url, timeout=20, retries=2)
    total_pages = int(payload.get("total_pages", 1))
    records = list(payload.get("score_nodes", []))
    log(f"QS pages: {total_pages}")

    for page in range(1, total_pages):
        page_url = first_url.replace("page=0", f"page={page}")
        log(f"QS page {page + 1}/{total_pages}")
        page_data = fetch_json(page_url, timeout=20, retries=2)
        records.extend(page_data.get("score_nodes", []))

    with open(cache_path, "w", encoding="utf-8") as f:
        json.dump(records, f, ensure_ascii=True)
    log(f"Saved QS cache to {cache_path} ({len(records)} records).")

    return records




SPECIAL_COUNTRY_BY_CODE = {
    "MOB_5Mx38_DE": "Ireland",
}

SPECIAL_QS_BY_CODE = {
    "MOB_5Ex14_CA": {
        "qs_university": "Ecole Polytechnique de Montreal",
        "qs_rank": "",
    },
}


def extract_country(title, code):
    if code in SPECIAL_COUNTRY_BY_CODE:
        return SPECIAL_COUNTRY_BY_CODE[code]
    if title:
        groups = re.findall(r"\(([^()]*)\)", title)
        for group in groups:
            group_norm = normalize(group)
            if "," in group:
                last = group.split(",")[-1].strip()
                last_norm = normalize(last)
                for alias, canonical in COUNTRY_ALIASES.items():
                    if alias in last_norm:
                        return canonical
            for alias, canonical in COUNTRY_ALIASES.items():
                if alias in group_norm:
                    return canonical
    if code and "_" in code:
        suffix = code.split("_")[-1]
        if suffix in CODE_COUNTRY:
            return CODE_COUNTRY[suffix]
    return None


def extract_university_candidate(title):
    if not title:
        return ""
    # common patterns
    patterns = [
        r"avec\s+(.+?)(?:\s+-\s+|$)",
        r"a\s+l\s*'?universite\s+de\s+(.+?)(?:\s*\(|$)",
        r"a\s+l\s*'?universite\s+(.+?)(?:\s*\(|$)",
        r"at\s+(.+?)(?:\s*\(|$)",
        r"with\s+(.+?)(?:\s*\(|$)",
        r"a\s+l\s*'?ecole\s+(.+?)(?:\s*\(|$)",
        r"ecole\s+(.+?)(?:\s*\(|$)",
        r"institut\s+(.+?)(?:\s*\(|$)",
    ]
    title_norm = normalize(title)
    for pat in patterns:
        m = re.search(pat, title_norm)
        if m:
            return m.group(1).strip()
    return ""


def build_qs_index(records):
    name_to_record = {}
    search_index = []
    for rec in records:
        title = rec.get("title") or ""
        base = normalize(title)
        if base and base not in name_to_record:
            name_to_record[base] = rec
            search_index.append((base, set(base.split()), rec))
        # variant without parentheses
        base_no_paren = re.sub(r"\([^)]*\)", "", base).strip()
        if base_no_paren and base_no_paren not in name_to_record:
            name_to_record[base_no_paren] = rec
            search_index.append((base_no_paren, set(base_no_paren.split()), rec))
    names_sorted = sorted(name_to_record.keys(), key=len, reverse=True)
    return name_to_record, names_sorted, search_index


def match_qs_record(title, qs_name_to_record, qs_names_sorted):
    title_norm = normalize(title)
    # alias by abbreviation
    for alias, qs_title in QS_ALIAS.items():
        if alias in title_norm:
            rec = qs_name_to_record.get(normalize(qs_title))
            if rec:
                return rec

    # direct substring match against full titles
    for name in qs_names_sorted:
        if name and name in title_norm:
            return qs_name_to_record[name]

    # try candidate name extraction
    candidate = extract_university_candidate(title)
    if candidate:
        cand_norm = normalize(candidate)
        rec = qs_name_to_record.get(cand_norm)
        if rec:
            return rec
        for name in qs_names_sorted:
            if name and name in cand_norm:
                return qs_name_to_record[name]
    return None


def local_fuzzy_match(query, search_index):
    if not query:
        return None
    query_norm = normalize(query)
    if not query_norm:
        return None
    query_tokens = set(query_norm.split())
    require_tech = "technologie" in query_tokens or "technology" in query_tokens
    best = None
    best_score = 0.0
    for name_norm, name_tokens, rec in search_index:
        if require_tech and not (("technologie" in name_tokens) or ("technology" in name_tokens)):
            continue
        if query_norm and query_norm in name_norm:
            score = 1.0
        elif name_norm and name_norm in query_norm:
            score = 1.0
        else:
            score = SequenceMatcher(None, query_norm, name_norm).ratio()
            if query_tokens:
                overlap = len(query_tokens & name_tokens) / len(query_tokens)
                score = max(score, overlap)
        if score > best_score:
            best_score = score
            best = rec
    threshold = 0.5 if len(query_norm) < 10 else 0.6
    if best_score < threshold:
        return None
    return best


def search_qs_record(query, nid):
    if not query:
        return None
    params = (
        f"nid={nid}&page=0&items_per_page=20&tab=indicators&region=&countries="
        f"&cities=&search={urllib.request.quote(query)}&star=&sort_by=&order_by="
        f"&program_type=&scholarship=&fee=&english_score=&academic_score=&mix_student="
        f"&loggedincache="
    )
    url = f"{QS_ENDPOINT}?{params}"
    data = fetch_json(url, timeout=20, retries=2)
    candidates = data.get("score_nodes", [])
    if not candidates:
        return None
    return candidates[0]


def extract_qs_nid(html):
    patterns = [
        r'"nid"\s*:\s*"?(\d+)"?',
        r"nid=(\d+)",
    ]
    for pattern in patterns:
        match = re.search(pattern, html)
        if match:
            return match.group(1)
    return None


def resolve_qs_source():
    for year in (QS_YEAR_PRIMARY, QS_YEAR_FALLBACK):
        url = QS_WUR_URL_TEMPLATE.format(year=year)
        try:
            html = fetch_url(url, timeout=20, retries=2)
        except Exception:
            nid = QS_WUR_FALLBACK_NIDS.get(year)
            if nid:
                return year, url, nid
            continue
        nid = extract_qs_nid(html)
        if nid:
            return year, url, nid
        nid = QS_WUR_FALLBACK_NIDS.get(year)
        if nid:
            return year, url, nid
    return None, None, None


def main():
    parser = argparse.ArgumentParser(description="Generate abroad formations CSV with QS rankings.")
    parser.add_argument(
        "--refresh",
        action="store_true",
        help="Refresh QS WUR cache before generating the CSV.",
    )
    parser.add_argument(
        "--online-search",
        action="store_true",
        help="Use QS online search for unmatched universities (slower).",
    )
    args = parser.parse_args()

    formations = fetch_formations(SYNAPSES_URL_FULL)
    base_formations = fetch_formations(SYNAPSES_URL_BASE)
    base_codes = {f.get("code") for f in base_formations if f.get("code")}
    qs_year, qs_url, qs_nid = resolve_qs_source()
    if not qs_nid:
        raise RuntimeError("Unable to resolve QS WUR dataset nid.")
    qs_cache_path = QS_CACHE_TEMPLATE.format(year=qs_year)
    qs_records = fetch_qs_rankings(qs_nid, qs_cache_path, qs_year, refresh_cache=args.refresh)
    qs_name_to_record, qs_names_sorted, qs_search_index = build_qs_index(qs_records)
    log(f"Matching {len(formations)} formations to QS rankings...")

    rows = []
    unmatched = []

    for idx, f in enumerate(formations, start=1):
        if idx % 25 == 0 or idx == len(formations):
            log(f"Processed {idx}/{len(formations)} formations")
        code = f.get("code") or ""
        title = f.get("title") or ""
        country = extract_country(title, code)
        continent = CONTINENT_BY_COUNTRY.get(country, "") if country else ""

        qs_override = SPECIAL_QS_BY_CODE.get(code)
        if qs_override:
            qs_name = qs_override.get("qs_university", "")
            qs_rank = qs_override.get("qs_rank", "")
        else:
            qs_rec = match_qs_record(title, qs_name_to_record, qs_names_sorted)
            if qs_rec is None:
                candidate = extract_university_candidate(title)
                if candidate:
                    qs_rec = local_fuzzy_match(candidate, qs_search_index)
            if qs_rec is None:
                qs_rec = local_fuzzy_match(title, qs_search_index)
            if qs_rec is None and args.online_search:
                qs_rec = search_qs_record(title, qs_nid)
            qs_name = qs_rec.get("title") if qs_rec else ""
            qs_rank = qs_rec.get("rank_display") if qs_rec else ""

            if not qs_rec:
                unmatched.append(title)

        synapses_url = ""
        if f.get("href"):
            synapses_url = urljoin(SYNAPSES_URL_FULL, f["href"])

        rows.append({
            "code": code,
            "formation_title": title,
            "country": country or "",
            "continent": continent,
            "qs_university": qs_name or "",
            "qs_year": str(qs_year),
            "qs_rank": qs_rank or "",
            "in_both_pages": "yes" if code in base_codes else "no",
            "synapses_url": synapses_url,
        })

    with open(OUT_PATH, "w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(
            f,
            fieldnames=[
                "code",
                "formation_title",
                "country",
                "continent",
                "qs_university",
                "qs_year",
                "qs_rank",
                "in_both_pages",
                "synapses_url",
            ],
        )
        writer.writeheader()
        writer.writerows(rows)

    log(f"Wrote {OUT_PATH} with {len(rows)} rows")
    if unmatched:
        log(f"Unmatched QS universities: {len(unmatched)}")
        for title in unmatched[:20]:
            print("-", title)


if __name__ == "__main__":
    main()
