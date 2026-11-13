# Laboratory progress

Official sources: `HTML_LW9.pdf`, `HTML_LW10.docx`, `HTML_LW11.pdf` (found on the Desktop), and `HTML_LW12.docx`. The files were read before implementation. Checkpoints are local; GitHub Pages is not updated by these commits.

## LW9_CSS_COMPLETE

Mandatory requirements:

- [x] `assets/css/custom.css` exists and loads after `main.css`.
- [x] The site uses a new global font stack; h1 through h6 and paragraphs have distinct typography.
- [x] Buttons have new normal, hover and active styles; links have new color and focus/hover treatment.
- [x] About, Resume and Portfolio spacing was changed with margins and padding.
- [x] Content blocks in those sections have borders, rounded corners and shadows.
- [x] Navigation and back-to-top each have at least three distinct surface, border, shape or shadow changes.
- [x] Text and surface colors were chosen for readable contrast; responsive spacing rules were added.

Complementary requirements:

- [x] The LW8 ordered and unordered lists use custom counters or pseudo-element markers.
- [x] The nested list has a separate marker, border and indentation.
- [x] The Services table has a dark header, alternating body rows, centered content and consistent cell padding.

Verification: CSS braces balanced; the expected selectors, HTML classes and stylesheet load order were checked. HTML IDs are unique, navigation targets resolve, all local asset references exist, and `git diff --check` passed. Visual appearance and responsive behavior still require browser review.

Changed files: `assets/css/custom.css`, `index.html`, `LAB_PROGRESS.md`.

## LW10_DASHBOARD_COMPLETE

Mandatory requirements:

- [x] A new `#skill-progress` section and working navigation target were added.
- [x] The three Kanban columns are Planned, In Progress and Completed.
- [x] Eight profession-related static cards show name, status and assigned XP (20–80 each; 420 assigned XP in total).
- [x] Earned XP counts completed cards only: 145 XP initially, Level 2, Trainee. Assigned XP is displayed separately.
- [x] A styled 95% progress bar shows progress from 50 to 150 XP; statistics show 8 total, 3 completed and 37.5% complete.
- [x] CSS Grid, minimum-width safeguards and responsive breakpoints organize the dashboard.

Complementary requirements:

- [x] Services has an animated pale gradient background.
- [x] About has two CSS-generated shapes with floating and rotation animations.
- [x] Reduced-motion preferences suppress the animations while preserving normal behavior.

Verification: eight unique skill IDs, correct categories, XP limits, assigned/earned totals and displayed values were checked. Section navigation, existing local media/image paths, unique HTML IDs, CSS brace balance and `git diff --check` passed. Visual/mobile checks and actual animation playback remain for browser review.

Changed files: `index.html`, `assets/css/custom.css`, `LAB_PROGRESS.md`.

## LW11_FORM_COMPLETE

Mandatory requirements:

- [x] `assets/js/custom.js` is loaded after `main.js`; the vendor scripts remain untouched.
- [x] The Contact form has first name, last name, email, phone, address, three 1–10 rating questions and Submit.
- [x] Submission prevents page reload, reads all fields into an object, logs it, and displays every value below the form.
- [x] The arithmetic rating average is displayed as `First name Last name: average`.
- [x] Submit starts disabled and becomes enabled only when every required field is valid.
- [x] The form has no server action, and submission data are not stored in localStorage.

Complementary requirements:

- [x] Required, email, Unicode-letter name, rating range and Lithuanian mobile number validation run during input and blur.
- [x] Visible field errors and `aria-invalid` states identify invalid values; invalid forms keep Submit disabled.
- [x] Phone input formats digits as `+370 6xx xxxxx`, limits the count, and handles paste and backspace at separators.
- [x] Clear resets fields, displayed values, average, errors and Submit without reloading.

Verification: `node --check` passed. Four Node tests passed for phone formatting, validation, arithmetic average and a simulated form submit/Clear cycle. HTML IDs are unique, navigation targets and local assets resolve, and `git diff --check` passed. Real browser interaction remains for manual review.

Changed files: `index.html`, `assets/css/custom.css`, `assets/js/custom.js`, `tests/custom.test.cjs`, `LAB_PROGRESS.md`.

## LW12_INTERACTIVE_COMPLETE

Mandatory requirements:

- [x] The eight LW10 skills are stored once in a JavaScript array of objects with the same names, initial statuses and assigned XP values (420 assigned XP total).
- [x] JavaScript creates the skill cards in the Planned, In Progress and Completed columns; each card shows its name, assigned XP, current status and a status selector.
- [x] Changing a status moves the card immediately and counts earned XP only for Completed skills; moving it back subtracts that XP.
- [x] Earned XP, level, rank, progress bar, total skills, completed skills and completion percentage recalculate on every change.
- [x] Level thresholds are 0, 50, 150 and 300 XP. Progress is measured within the current level's range, with Level 4 shown as full.
- [x] Separate functions handle rendering, status changes, level/XP calculations, statistics, progress display and persistence.

Complementary requirements:

- [x] Versioned localStorage saves only skill statuses and restores them on reload.
- [x] Missing, malformed, outdated and partially invalid saved data use the LW10 defaults where needed; storage errors do not stop the dashboard.

Verification: `node --check` passed and eight Node tests passed, including LW11 form regression, skill movement in both directions, level thresholds, progress calculations, localStorage reload/default behavior and malformed data. The static audit found 55 unique HTML IDs, 31 existing local references, no broken anchor targets, no missing local files and no static skill cards. The custom stylesheet and script load after the template files. `git diff --check` passed. Actual browser interaction, responsive layout and media playback still require browser review.

Changed files: `index.html`, `assets/css/custom.css`, `assets/js/custom.js`, `tests/custom.test.cjs`, `LAB_PROGRESS.md`.

## Final local QA

- [x] LW7/LW8 content, MATLAB graphs, Services table/lists and media references remain in place; local file paths resolve.
- [x] No duplicate HTML IDs or broken internal navigation targets were found.
- [x] All four laboratories have automated syntax/structure or behavior checks as recorded above.
- [ ] Real browser visual, responsive, animation, form, dashboard and media checks remain for manual review; automated DOM tests are not a substitute for them.
- [x] Four separate local checkpoint commits were created; no GitHub push or deployment was performed.
