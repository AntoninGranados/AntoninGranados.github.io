const CSV_PATH = "abroad_formations.csv";
const TRACKS_PATH = "abroad_formations_tracks.csv";
const LINKS_PATH = "abroad_formations_links.csv";
const PRICES_PATH = "abroad_formations_price.csv";
const PARTNERSHIPS_PATH = "partnerships.csv";

const tableBody = document.getElementById("tableBody");
const searchInput = document.getElementById("searchInput");
const continentFilter = document.getElementById("continentFilter");
const countryFilter = document.getElementById("countryFilter");
const typeFilter = document.getElementById("typeFilter");
const trackFilter = document.getElementById("trackFilter");
const bothPagesToggle = document.getElementById("bothPagesToggle");
const statTotal = document.getElementById("statTotal");
const statFiltered = document.getElementById("statFiltered");
const qsYearLabel = document.getElementById("qsYearLabel");
const qsYearFooter = document.getElementById("qsYearFooter");
const partnerTableBody = document.getElementById("partnerTableBody");
const qsYearLabelPartners = document.getElementById("qsYearLabelPartners");

let rows = [];
let filtered = [];
let sortKey = "qs_rank";
let sortAsc = true;
let qsYear = "2025";
let partnerRows = [];
let partnerFiltered = [];
let partnerSortKey = "qs_rank";
let partnerSortAsc = true;

const IPP_QS_RANK = 46;
const tooltip = createTooltip();

function createTooltip() {
  const el = document.createElement("div");
  el.className = "price-tooltip";
  document.body.appendChild(el);
  return el;
}

const COUNTRY_CODES = {
  Argentina: "AR",
  Australia: "AU",
  Austria: "AT",
  Belgium: "BE",
  Brazil: "BR",
  Canada: "CA",
  Cameroon: "CM",
  China: "CN",
  Chile: "CL",
  Colombia: "CO",
  Croatia: "HR",
  "Czech Republic": "CZ",
  Denmark: "DK",
  Estonia: "EE",
  Finland: "FI",
  Germany: "DE",
  Greece: "GR",
  Hungary: "HU",
  India: "IN",
  Indonesia: "ID",
  Iran: "IR",
  Ireland: "IE",
  Lebanon: "LB",
  Italy: "IT",
  Japan: "JP",
  Morocco: "MA",
  Mexico: "MX",
  Netherlands: "NL",
  Norway: "NO",
  Peru: "PE",
  Poland: "PL",
  Portugal: "PT",
  Romania: "RO",
  Russia: "RU",
  Singapore: "SG",
  Slovakia: "SK",
  "South Korea": "KR",
  Spain: "ES",
  Sweden: "SE",
  Switzerland: "CH",
  Taiwan: "TW",
  Tunisia: "TN",
  Turkey: "TR",
  "United Kingdom": "GB",
  "United States": "US",
  Uruguay: "UY",
  Vietnam: "VN",
  "Việt Nam": "VN",
};

function flagFromCountry(country) {
  const key = (country || "").trim();
  const code = COUNTRY_CODES[key];
  if (!code) return "";
  return code
    .toUpperCase()
    .split("")
    .map((char) => String.fromCodePoint(127397 + char.charCodeAt(0)))
    .join("");
}

function parseCSV(text) {
  const lines = text.split(/\r?\n/).filter(Boolean);
  if (!lines.length) return [];
  const headers = splitCSVLine(lines[0]);
  return lines.slice(1).map((line) => {
    const cells = splitCSVLine(line);
    const row = {};
    headers.forEach((h, idx) => {
      row[h] = cells[idx] ?? "";
    });
    return row;
  });
}

function parseTracks(raw) {
  if (!raw) return [];
  return raw
    .split(/[;,]/)
    .map((track) => track.trim())
    .filter((track) => track && track.toLowerCase() !== "any");
}

function parseRank(raw) {
  if (!raw) return null;
  const digits = raw.toString().replace(/[^0-9]/g, "");
  if (!digits) return null;
  const value = parseInt(digits, 10);
  return Number.isFinite(value) ? value : null;
}

function getQsRank(row) {
  return row.qs_rank || row.qs_rank_2025 || "";
}

function normalizeText(value) {
  if (!value) return "";
  return value
    .toString()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function escapeAttribute(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function formatSourceLabel(url) {
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, "");
    return hostname || "source";
  } catch {
    return "source";
  }
}

function extractUniversityCandidate(title) {
  if (!title) return "";
  const normalized = normalizeText(title);
  const patterns = [
    /avec\s+(.+?)(?:\s+-\s+|$)/,
    /a\s+l\s*'?universite\s+de\s+(.+?)(?:\s*\(|$)/,
    /a\s+l\s*'?universite\s+(.+?)(?:\s*\(|$)/,
    /at\s+(.+?)(?:\s*\(|$)/,
    /with\s+(.+?)(?:\s*\(|$)/,
    /a\s+l\s*'?ecole\s+(.+?)(?:\s*\(|$)/,
    /ecole\s+(.+?)(?:\s*\(|$)/,
    /institut\s+(.+?)(?:\s*\(|$)/,
  ];
  for (const pattern of patterns) {
    const match = normalized.match(pattern);
    if (match && match[1]) return match[1].trim();
  }
  return normalized;
}

function getFormationType(code) {
  const match = (code || "").match(/5(DD|Ex|Mx)/);
  return match ? match[1] : "";
}

function isFormationInPartnership(row) {
  const title = normalizeText(row.formation_title || "");
  if (!title) return false;
  return !title.includes("hors partenariat ecole");
}

function getPartnerTypes(details) {
  if (!details) return [];
  const normalized = details.toLowerCase();
  const types = new Set();
  if (normalized.includes("double dipl")) types.add("DD");
  if (normalized.includes("echange") || normalized.includes("exchange") || normalized.includes("erasmus")) {
    types.add("Ex");
  }
  if (normalized.includes("master")) types.add("Mx");
  return Array.from(types);
}

function resolveQsYear(data) {
  const withYear = data.find((row) => row.qs_year || row.qs_year_2025);
  return (withYear && (withYear.qs_year || withYear.qs_year_2025)) || "2025";
}

function buildPriceTooltip(row) {
  const parts = [];
  const basis = row.price_basis || "";
  if (basis) {
    parts.push(`Basis: ${basis}`);
  }
  const notes = row.price_notes || "";
  if (notes) {
    parts.push(`Notes: ${notes}`);
  }
  return parts.join("\n");
}

function formatPrice(raw) {
  if (!raw) return "N/A";
  const trimmed = raw.trim();
  if (!trimmed) return "N/A";
  const normalized = trimmed.replace(/,/g, "");
  const numbers = normalized.match(/\d+/g) || [];
  if (!numbers.length) return trimmed;
  const main = numbers.reduce((a, b) => (b.length > a.length ? b : a), numbers[0]);
  const value = parseInt(main, 10);
  if (!Number.isFinite(value)) return trimmed;
  const withSpaces = value.toLocaleString("fr-FR");
  return `${withSpaces} €`;
}

function attachWarningTooltips() {
  const warnings = document.querySelectorAll(".price-warning, .info-icon, .price-info");
  if (!warnings.length) return;

  const show = (event) => {
    const text = event.currentTarget.getAttribute("data-tooltip") || "";
    tooltip.textContent = text;
    tooltip.classList.add("visible");
  };

  const hide = () => {
    tooltip.classList.remove("visible");
  };

  const move = (event) => {
    const offset = 14;
    let x = event.clientX + offset;
    let y = event.clientY + offset;
    const rect = tooltip.getBoundingClientRect();
    if (x + rect.width > window.innerWidth - 12) {
      x = window.innerWidth - rect.width - 12;
    }
    if (y + rect.height > window.innerHeight - 12) {
      y = window.innerHeight - rect.height - 12;
    }
    tooltip.style.left = `${x}px`;
    tooltip.style.top = `${y}px`;
  };

  warnings.forEach((warning) => {
    warning.addEventListener("mouseenter", show);
    warning.addEventListener("mouseleave", hide);
    warning.addEventListener("mousemove", move);
  });
}


function splitCSVLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

function loadCSV() {
  Promise.all([
    fetch(`${CSV_PATH}?cache=${Date.now()}`).then((res) => res.text()),
    fetch(`${TRACKS_PATH}?cache=${Date.now()}`).then((res) => res.text()),
    fetch(`${LINKS_PATH}?cache=${Date.now()}`).then((res) => res.text()),
    fetch(`${PRICES_PATH}?cache=${Date.now()}`).then((res) => res.text()),
  ])
    .then(([formationsText, tracksText, linksText, pricesText]) => {
      const formationRows = parseCSV(formationsText);
      const trackRows = parseCSV(tracksText);
      const trackMap = new Map(
        trackRows.map((row) => [row.code, row.related_tracks || row.tracks || row.related_filieres || ""]),
      );
      const linksRows = parseCSV(linksText);
      const linksMap = new Map(linksRows.map((row) => [row.code, row.links || row.link || ""]));
      const pricesRows = parseCSV(pricesText);
      const pricesMap = new Map(
        pricesRows.map((row) => [
          row.code,
          {
            price: row.price || row.estimated_price || "",
            basis: row.basis || row.estimation_basis || "",
            sources: row.source_urls || row.sources || "",
            notes: row.notes || "",
          },
        ]),
      );
      rows = formationRows.map((row) => ({
        ...row,
        related_tracks: trackMap.get(row.code) || "",
        formation_link: linksMap.get(row.code) || "",
        price: (pricesMap.get(row.code) || {}).price || "",
        price_basis: (pricesMap.get(row.code) || {}).basis || "",
        price_sources: (pricesMap.get(row.code) || {}).sources || "",
        price_notes: (pricesMap.get(row.code) || {}).notes || "",
        in_partnerships: false,
      }));
      rows.forEach((row) => {
        row.in_partnerships = isFormationInPartnership(row);
      });
      qsYear = resolveQsYear(rows);
      if (qsYearLabel) qsYearLabel.textContent = qsYear;
      if (qsYearFooter) qsYearFooter.textContent = qsYear;
      populateFilters(rows);
      applyFilters();
      updateSortIndicators();
    })
    .catch(() => {
      tableBody.innerHTML = '<tr><td colspan="9" class="empty">Failed to load CSV.</td></tr>';
    });
}

function loadPartnerships() {
  if (!partnerTableBody) return;
  fetch(`${PARTNERSHIPS_PATH}?cache=${Date.now()}`)
    .then((res) => res.text())
    .then((text) => {
      partnerRows = parseCSV(text);
      if (qsYearLabelPartners) {
        qsYearLabelPartners.textContent = resolveQsYear(partnerRows);
      }
      applyFilters();
    })
    .catch(() => {
      partnerTableBody.innerHTML = '<tr><td colspan="6" class="empty">Failed to load CSV.</td></tr>';
    });
}

function renderPartnerTable() {
  if (!partnerTableBody) return;
  const data = [...partnerFiltered].sort((a, b) => {
    const valA = (a[partnerSortKey] || "").toString();
    const valB = (b[partnerSortKey] || "").toString();
    if (!valA && !valB) return 0;
    if (!valA) return 1;
    if (!valB) return -1;
    if (partnerSortKey === "qs_rank") {
      const numA = parseRank(getQsRank(a)) ?? 9999;
      const numB = parseRank(getQsRank(b)) ?? 9999;
      return partnerSortAsc ? numA - numB : numB - numA;
    }
    return partnerSortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
  });
  if (!data.length) {
    partnerTableBody.innerHTML = '<tr><td colspan="6" class="empty">No partnerships match your filters.</td></tr>';
    return;
  }
  updatePartnerSortIndicators();
  partnerTableBody.innerHTML = data
    .map((row) => {
      const link = row.url || "";
      const name = row.institution || "";
      const nameCell = link ? `<a href="${link}" target="_blank" rel="noopener">${name}</a>` : name;
      const country = row.country || "";
      const countryFlag = flagFromCountry(country);
      const countryCell = countryFlag ? `${countryFlag} ${country}` : country;
      return `
        <tr>
          <td>${nameCell}</td>
          <td>${countryCell}</td>
          <td>${row.continent || ""}</td>
          <td>${row.qs_university || ""}</td>
          <td>${getQsRank(row)}</td>
          <td>${row.details || ""}</td>
        </tr>
      `;
    })
    .join("");
}

function populateFilters(data) {
  const continents = new Set();
  const countries = new Set();
  const tracks = new Set();
  data.forEach((row) => {
    if (row.continent) continents.add(row.continent);
    if (row.country) countries.add(row.country);
    if (row.related_tracks) {
      parseTracks(row.related_tracks).forEach((track) => tracks.add(track));
    }
  });
  renderCheckboxOptions(continentFilter, Array.from(continents).sort());
  renderCountryOptions(Array.from(countries).sort());
  renderTrackOptions(Array.from(tracks).sort());
  statTotal.textContent = data.length;
}

function fillSelect(select, values, allLabel = "All") {
  const current = select.value;
  select.innerHTML = `<option value="">${allLabel}</option>`;
  values.forEach((value) => {
    const opt = document.createElement("option");
    opt.value = value;
    opt.textContent = value;
    select.appendChild(opt);
  });
  select.value = current;
}

function renderCheckboxOptions(container, values) {
  container.innerHTML = "";
  values.forEach((item) => {
    const value = typeof item === "string" ? item : item.value;
    const labelText = typeof item === "string" ? item : item.label;
    const flag = typeof item === "string" ? "" : item.flag;
    const label = document.createElement("label");
    label.className = "track-option";
    const input = document.createElement("input");
    input.type = "checkbox";
    input.value = value;
    const flagSpan = document.createElement("span");
    flagSpan.className = "flag";
    flagSpan.textContent = flag || "";
    const span = document.createElement("span");
    span.textContent = labelText;
    label.appendChild(input);
    label.appendChild(flagSpan);
    label.appendChild(span);
    container.appendChild(label);
  });
}

function renderCountryOptions(values) {
  const items = values.map((country) => ({
    value: country,
    label: country,
    flag: flagFromCountry(country),
  }));
  renderCheckboxOptions(countryFilter, items);
}

function renderTrackOptions(values) {
  renderCheckboxOptions(trackFilter, values);
}

function renderTypeOptions() {
  renderCheckboxOptions(typeFilter, [
    { value: "Ex", label: "Exchange (Ex)" },
    { value: "DD", label: "Double Degree (DD)" },
    { value: "Mx", label: "Master (Mx)" },
  ]);
}

function getSelectedValues(container) {
  return Array.from(container.querySelectorAll("input[type=\"checkbox\"]:checked")).map(
    (input) => input.value,
  );
}

function updateCountryOptions() {
  const selectedContinents = getSelectedValues(continentFilter);
  const countries = new Set();
  rows.forEach((row) => {
    if (!row.country) return;
    if (!selectedContinents.length || selectedContinents.includes(row.continent)) {
      countries.add(row.country);
    }
  });
  const selectedCountries = new Set(getSelectedValues(countryFilter));
  renderCountryOptions(Array.from(countries).sort());
  // Restore selections that still apply.
  countryFilter.querySelectorAll("input[type=\"checkbox\"]").forEach((input) => {
    if (selectedCountries.has(input.value)) {
      input.checked = true;
    }
  });
}

function applyFilters() {
  const query = searchInput.value.trim().toLowerCase();
  const selectedContinents = getSelectedValues(continentFilter);
  const selectedCountries = getSelectedValues(countryFilter);
  const selectedTypes = getSelectedValues(typeFilter);
  const selectedTracks = getSelectedValues(trackFilter);
  const onlyBothPages = bothPagesToggle && bothPagesToggle.checked;

  filtered = rows.filter((row) => {
    const matchesQuery = !query || Object.values(row).some((val) => String(val || "").toLowerCase().includes(query));
    const matchesContinent = !selectedContinents.length || selectedContinents.includes(row.continent);
    const matchesCountry = !selectedCountries.length || selectedCountries.includes(row.country);
    const code = row.code || "";
    const codeTypeMatch = code.match(/5(DD|Ex|Mx)/);
    const codeType = codeTypeMatch ? codeTypeMatch[1] : "";
    const matchesType = !selectedTypes.length || selectedTypes.includes(codeType);
    const relatedTracks = parseTracks(row.related_tracks);
    const matchesTrack =
      !selectedTracks.length || selectedTracks.some((track) => relatedTracks.includes(track));
    const matchesBoth = !onlyBothPages || row.in_partnerships;
    return matchesQuery && matchesContinent && matchesCountry && matchesType && matchesTrack && matchesBoth;
  });

  partnerFiltered = partnerRows.filter((row) => {
    const matchesQuery =
      !query || Object.values(row).some((val) => String(val || "").toLowerCase().includes(query));
    const matchesContinent =
      !selectedContinents.length || selectedContinents.includes(row.continent);
    const matchesCountry =
      !selectedCountries.length || selectedCountries.includes(row.country);
    const partnerTypes = getPartnerTypes(row.details || "");
    const matchesType =
      !selectedTypes.length || selectedTypes.some((type) => partnerTypes.includes(type));
    return matchesQuery && matchesContinent && matchesCountry && matchesType;
  });

  statFiltered.textContent = filtered.length;
  renderTable();
  renderPartnerTable();
}

function renderTable() {
  const data = [...filtered].sort((a, b) => {
    const valA = (a[sortKey] || "").toString();
    const valB = (b[sortKey] || "").toString();
    if (!valA && !valB) return 0;
    if (!valA) return 1;
    if (!valB) return -1;
    if (sortKey === "qs_rank") {
      const numA = parseRank(getQsRank(a)) ?? 9999;
      const numB = parseRank(getQsRank(b)) ?? 9999;
      return sortAsc ? numA - numB : numB - numA;
    }
    if (sortKey === "price") {
      const rawA = (a.price || a.price_basis || "").toString();
      const rawB = (b.price || b.price_basis || "").toString();
      const numA = parseInt(rawA.replace(/[^0-9]/g, ""), 10);
      const numB = parseInt(rawB.replace(/[^0-9]/g, ""), 10);
      const safeA = Number.isFinite(numA) ? numA : 9_999_999;
      const safeB = Number.isFinite(numB) ? numB : 9_999_999;
      return sortAsc ? safeA - safeB : safeB - safeA;
    }
    return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
  });

  if (!data.length) {
    tableBody.innerHTML = '<tr><td colspan="9" class="empty">No formations match your filters.</td></tr>';
    return;
  }

  let ippMarkerInserted = false;
  const ippMarkerRow = `
        <tr class="ipp-marker">
          <td colspan="9">
            <span>IPP QS ${qsYear} rank: ${IPP_QS_RANK}</span>
          </td>
        </tr>
      `;

  const rowsHtml = data.map((row) => {
      const formationTitle = stripCountryParen(row.formation_title || "");
      const codeValue = row.code || "";
      const synapsesUrl = row.synapses_url || "";
      const codeCell = synapsesUrl
        ? `<a href="${synapsesUrl}" target="_blank" rel="noopener">${codeValue}</a>`
        : codeValue;
      const formationLink = row.formation_link || "";
      const formationCell = formationLink
        ? `<a href="${formationLink}" target="_blank" rel="noopener">${formationTitle}</a>`
        : formationTitle;
      const countryFlag = flagFromCountry(row.country || "");
      const countryCell = countryFlag ? `${countryFlag} ${row.country || ""}` : row.country || "";
      const relatedTracks = parseTracks(row.related_tracks).join(", ");
      const rawPrice = row.price || row.price_basis || "";
      const formattedPrice = formatPrice(rawPrice);
      const priceBasis = (row.price_basis || "").toLowerCase();
      const isHeuristic = priceBasis.includes("heuristic") || priceBasis.includes("supposition");
      const priceClass = isHeuristic ? "price-heuristic" : "";
      const priceTooltip = buildPriceTooltip(row);
      const priceInfo = priceTooltip
        ? `<span class="price-info" data-tooltip="${escapeAttribute(priceTooltip)}">i</span>`
        : "";
      const priceSources = (row.price_sources || "").split("|").map((s) => s.trim()).filter(Boolean);
      const sourceBadge = priceSources.length
        ? `<span class="price-source-wrap">
            <span class="price-source-badge">sources</span>
            <span class="price-source-popover">
              ${priceSources
                .map((url) => `<a href="${escapeAttribute(url)}" target="_blank" rel="noopener">${formatSourceLabel(url)}</a>`)
                .join("")}
            </span>
          </span>`
        : "";
      const inPartnerships = !!row.in_partnerships;
      const inBothCell = inPartnerships ? '<span class="in-both-check">✓</span>' : "";
      const rowRank = parseRank(getQsRank(row));
      if (sortKey === "qs_rank" && !ippMarkerInserted && rowRank !== null) {
        const shouldInsert = sortAsc ? rowRank >= IPP_QS_RANK : rowRank <= IPP_QS_RANK;
        if (shouldInsert) {
          ippMarkerInserted = true;
          return `${ippMarkerRow}
        <tr>
          <td>${codeCell}</td>
          <td>${formationCell}</td>
          <td>${countryCell}</td>
          <td>${row.continent || ""}</td>
          <td>${relatedTracks}</td>
          <td>${row.qs_university || ""}</td>
          <td>${getQsRank(row)}</td>
          <td class="in-both-cell">${inBothCell}</td>
          <td class="${priceClass} price-cell">
            <span class="price-layout">
              <span class="price-main">${formattedPrice}</span>
              <span class="price-meta">${sourceBadge}${priceInfo}</span>
            </span>
          </td>
        </tr>
      `;
        }
      }
      return `
        <tr>
          <td>${codeCell}</td>
          <td>${formationCell}</td>
          <td>${countryCell}</td>
          <td>${row.continent || ""}</td>
          <td>${relatedTracks}</td>
          <td>${row.qs_university || ""}</td>
          <td>${getQsRank(row)}</td>
          <td class="in-both-cell">${inBothCell}</td>
          <td class="${priceClass} price-cell">
            <span class="price-layout">
              <span class="price-main">${formattedPrice}</span>
              <span class="price-meta">${sourceBadge}${priceInfo}</span>
            </span>
          </td>
        </tr>
      `;
    })
    .join("");

  if (sortKey === "qs_rank" && !ippMarkerInserted) {
    tableBody.innerHTML = rowsHtml + ippMarkerRow;
    attachWarningTooltips();
    return;
  }

  tableBody.innerHTML = rowsHtml;
  attachWarningTooltips();
}

function stripCountryParen(title) {
  return title.replace(/\s*\([^)]*\)\s*$/, "").trim();
}

function handleSort(e) {
  const th = e.target.closest("th[data-key]");
  if (!th) return;
  const key = th.getAttribute("data-key");
  if (!key) return;
  if (sortKey === key) {
    sortAsc = !sortAsc;
  } else {
    sortKey = key;
    sortAsc = true;
  }
  document.querySelectorAll("th").forEach((th) => th.classList.remove("active"));
  th.classList.add("active");
  updateSortIndicators();
  renderTable();
}

function updateSortIndicators() {
  document.querySelectorAll("table:not(.partner-table) th[data-key]").forEach((th) => {
    const arrow = th.querySelector(".sort-arrow");
    if (!arrow) return;
    if (th.getAttribute("data-key") === sortKey) {
      arrow.textContent = sortAsc ? "▲" : "▼";
      if (sortKey === "qs_rank" && sortAsc) {
        th.classList.remove("active");
      } else {
        th.classList.add("active");
      }
    } else {
      arrow.textContent = "";
      th.classList.remove("active");
    }
  });
}

function updatePartnerSortIndicators() {
  document.querySelectorAll(".partner-table th[data-key]").forEach((th) => {
    const arrow = th.querySelector(".sort-arrow");
    if (!arrow) return;
    if (th.getAttribute("data-key") === partnerSortKey) {
      arrow.textContent = partnerSortAsc ? "▲" : "▼";
      if (partnerSortKey === "qs_rank" && partnerSortAsc) {
        th.classList.remove("active");
      } else {
        th.classList.add("active");
      }
    } else {
      arrow.textContent = "";
      th.classList.remove("active");
    }
  });
}

searchInput.addEventListener("input", applyFilters);
continentFilter.addEventListener("change", () => {
  updateCountryOptions();
  applyFilters();
});
countryFilter.addEventListener("change", applyFilters);
typeFilter.addEventListener("change", applyFilters);
trackFilter.addEventListener("change", applyFilters);
if (bothPagesToggle) {
  bothPagesToggle.addEventListener("change", applyFilters);
}
document.querySelector("thead").addEventListener("click", handleSort);
const partnerHeader = document.querySelector(".partner-table thead");
if (partnerHeader) {
  partnerHeader.addEventListener("click", (event) => {
    const th = event.target.closest("th[data-key]");
    if (!th) return;
    const key = th.getAttribute("data-key");
    if (!key) return;
    if (partnerSortKey === key) {
      partnerSortAsc = !partnerSortAsc;
    } else {
      partnerSortKey = key;
      partnerSortAsc = true;
    }
    updatePartnerSortIndicators();
    renderPartnerTable();
  });
}

renderTypeOptions();
loadCSV();
loadPartnerships();

document.querySelectorAll(".section-toggle").forEach((btn) => {
  btn.addEventListener("click", () => {
    const targetId = btn.getAttribute("data-target");
    const target = targetId ? document.getElementById(targetId) : null;
    if (!target) return;
    const collapsed = target.classList.toggle("is-collapsed");
    btn.setAttribute("aria-expanded", collapsed ? "false" : "true");
    const arrow = btn.querySelector(".section-arrow");
    if (arrow) {
      arrow.textContent = collapsed ? "▶" : "▼";
    }
  });
});
