#!/usr/bin/env python3
import re
import urllib.request
from datetime import date

USERNAME = "AntoninGranados"
OUT_PATH = "_includes/github-chart.svg"

CELL = 10
GAP = 3
STEP = CELL + GAP
MONTH_LABEL_H = 16
MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

url = f"https://github.com/users/{USERNAME}/contributions"
req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
with urllib.request.urlopen(req) as resp:
    html = resp.read().decode("utf-8")

tds = re.findall(r'<td[^>]*class="ContributionCalendar-day"[^>]*>', html)

cells = []
for td in tds:
    pos = re.search(r'id="contribution-day-component-(\d+)-(\d+)"', td)
    level = re.search(r'data-level="(\d)"', td)
    day = re.search(r'data-date="([\d-]+)"', td)
    if not (pos and level and day):
        continue
    row, col = int(pos.group(1)), int(pos.group(2))
    cells.append((row, col, int(level.group(1)), day.group(1)))

cols = max(c for _, c, _, _ in cells) + 1
rows = 7

col_dates = {}
for row, col, _, day in cells:
    d = date.fromisoformat(day)
    if col not in col_dates or d < col_dates[col]:
        col_dates[col] = d

width = cols * STEP - GAP
height = MONTH_LABEL_H + rows * STEP - GAP

svg = [
    f'<svg role="img" aria-label="{USERNAME}\'s GitHub contribution graph" '
    f'xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width} {height}" width="{width}" height="{height}">'
]

month_changes = []
last_month = None
for col in range(cols):
    d = col_dates.get(col)
    if d is None:
        continue
    if d.month != last_month:
        month_changes.append((col, MONTH_NAMES[d.month - 1]))
        last_month = d.month

MIN_LABEL_GAP = 3
labels = []
for i, (col, name) in enumerate(month_changes):
    if i + 1 < len(month_changes) and month_changes[i + 1][0] - col < MIN_LABEL_GAP:
        continue
    labels.append((col, name))

for col, name in labels:
    svg.append(f'<text x="{col * STEP}" y="{MONTH_LABEL_H - 5}" class="gh-month-label">{name}</text>')

for row, col, level, day in cells:
    x = col * STEP
    y = MONTH_LABEL_H + row * STEP
    svg.append(
        f'<rect x="{x}" y="{y}" width="{CELL}" height="{CELL}" rx="2" ry="2" '
        f'data-level="{level}" data-date="{day}"><title>{day}</title></rect>'
    )

svg.append('</svg>')

with open(OUT_PATH, "w") as f:
    f.write("".join(svg))
