```
/make-plan Redesign the visual layer and shared components of the ST96 admin (src/admin). Current design scored 16/30 on a Dieter Rams audit with weak spots in principles #3 aesthetic, #6 honest, #8 thorough, #9 environmentally friendly.

Verdict: total 16/30 < 20, so REDESIGN of the visual layer and shared components. Screens, data model and routes stay.

Why redesign and not refine: total score is below 20; the issues are systemic (tokens, dialogs, focus, bundle), not a single screen.

Brand constraint (owner): do NOT lose the st96.by brand style. Source of truth: src/index.css:4-18 and index.html:50. Fonts: Unbounded (headings/display) + Inter (text). Colors: ink #09090b/#111114/#232328, paper #f5f4ef, muted #a6a6ac, accent acid #d8ff3f, secondary violet #8b6bff, pink #ff5fa8, cyan #35e6c8, blue #4d7bff, orange #ff8a3d. The admin must read as part of ST96: map the admin token layer onto these values (acid for primary actions/active state, ink/paper for surfaces), keep light and dark themes, check contrast (acid text on paper fails: use ink on acid).

Preserve from current design:
- Routes, pages and Supabase data access in src/admin/pages/*.tsx and src/admin/builder/*.
- Light/dark themes and color roles in src/admin/admin.css:1-18 (re-valued from the site brand, not dropped).
- All site brand assets: fonts, palette, logo, copy of st96.by (untouched).
- Loading/empty/error states on all 7 pages.

Discard:
- 59 inline style={{}} attributes (ClientPage.tsx, builder/Editor.tsx). Caused failure on #3.
- Duplicated modal/segment CSS in builder/builder.css (.fb .ov/.seg) and pages/templates.css (.tpl .ov/.seg). Caused failure on #3, #10.
- Three separate template pickers (builder/Editor.tsx TemplatePicker, ClientPage.tsx SendTemplate, TemplatesPage list). Caused failure on #10.

Top moves (verbatim from audit):
1. #6 Honest: fix stale copy "Визуальный конструктор появится в следующем обновлении" at pages/FunnelsPage.tsx:29.
2. #8 Thorough: one :focus-visible style with >=3:1 contrast (current ring 1.14, admin.css:23); modals get role="dialog", Escape, focus return.
3. #3 Aesthetic: one token layer built from the site brand values above (colors, 6 font sizes instead of 11, spacing, Unbounded for page titles only); remove hardcoded #fff/rgba from CSS; raise --mute (4.47 on --bg) and white-on-blue in dark theme (3.07) to >=4.5:1.
4. #10 Minimal: shared Modal, Seg and TemplatePicker components used by funnels, templates and client card.
5. #9 Environmental: lazy-load @xyflow/react only on /funnels/:id; target admin entry JS <250 KB (now ~740 KB raw).

Redesign principles in priority order:
0. Brand fidelity: the admin looks like st96.by.
1. Honest (#6): every label matches behavior.
2. Thorough (#8): keyboard and focus work everywhere.
3. As little design as possible (#10): fewer components, no inline styles.

Deliverables for the plan:
- Token table (colors, type scale, spacing) mapped to existing CSS variables
- Component list (Modal, Seg, TemplatePicker) with states
- States checklist (empty, loading, error, success, focus, disabled)
- Migration order per page, with visual check at 375 px and dark theme
- Cutover criteria: no inline styles left, contrast checks pass, npm run build size recorded

Anti-patterns to guard against:
- Porting old structure under new styling
- Restyling for trend instead of the principles
- Changing data access or routes
- Generic SaaS look or new off-brand colors/fonts
```
