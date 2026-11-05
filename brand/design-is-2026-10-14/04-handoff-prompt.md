````
/make-plan Refine ST96 business cards (print/business-cards: cards.src.html, build.mjs → two 94×54 mm PDFs, 90×50 + 2 mm bleed) based on a Dieter Rams audit (total 20/30).

Verdict paragraph (quoted from 03-verdict.md):
> Визитки решают свою задачу честно и понятно (20/30, без нулей), но не готовы к типографии: декоративные градиенты ушли в PDF низкоразрешающим растром, а цвет не подготовлен под CMYK.

Keep (already strong, do NOT touch in this pass):
- Principle #2 (useful) scored 3 — Evidence: phone, hi@st96.by, Telegram @studia96, st96.by at 7.4pt, contrast ≥8.2:1 (build.mjs:28-31). Regression check: all four contacts present on both cards, smallest text ≥7pt, paper-dim/ink contrast ≥7:1.
- Principle #4 (understandable) scored 3 — Evidence: no caps labels, only "Telegram" label kept (build.mjs:30). Regression check: no new labels/abbreviations added.
- Principle #6 (honest) scored 3 — Evidence: no claims beyond contacts and role. Regression check: no taglines or superlatives added.

Fix in priority order:
1. #8 thorough: replace CSS radial-gradient glows and the gradient divider with inline SVG gradients (or flat color for the divider) so Chrome prints them as vector; verify the PDFs contain 0 `/Subtype /Image` objects. Evidence: 6 raster images at 113×103 / 80×103 / 236×3 px (≈40–72 dpi); cards.src.html:56-57,72; the comment at cards.src.html:56 claiming vector output must become true.
2. #8/#9 color: add a CMYK conversion step to build.mjs (Ghostscript with FOGRA39/ISO Coated v2, or document handoff for printer prepress), set background rich black e.g. C60 M40 Y40 K100, TAC ≤300%. Evidence: PDFs contain only /DeviceRGB.
3. #3 aesthetic: unify 7pt role and 7.4pt contacts into one size; align role to the logo baseline instead of vertical centering. Evidence: cards.src.html:62-63,69.
4. #7/#10: keep one glow per card (per-person accent stays on the divider). Evidence: build.mjs:11-15.
5. #4: decide role language — "Сооснователь" vs "Co-founder" — ask the user, then apply to both cards. Evidence: build.mjs:24.

Out of scope for this refine pass: brand palette and fonts, layout structure (logo top / name / contacts bottom), adding a back side or QR code, the A6 flyer (print/flyer-a6 has the same raster-gradient issue — separate task).

Deliverables for the plan:
- Per-fix: target files, exact change, verification step (PDF image count, colorspace check, preview.png review)
- Token/spec changes consolidated in cards.src.html :root
- Regression checklist for every "Keep" item above

Anti-patterns to guard against:
- Adding new abstractions where a direct change suffices
- Restyling areas that already scored 3
- Scope creep into structural redesign
- Letting fixes mutate principles outside the priority list
````
