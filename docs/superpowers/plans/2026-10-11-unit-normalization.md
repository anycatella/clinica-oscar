# Unit normalization and reversible review

User supplies the implementation brief and authorizes correction/publication.

1. Reproduce existing table: red/white cell OCR variants, missing VCM, truncated Urea and GPT, Creatinina mgj/dl, GOT un/UN. Preserve originals and all records.
2. Add optional originalUnit, normalizedUnit, unitStatus and revision snapshots to MeasurementInput. Strict format normalization uses an explicit unit dictionary; OCR remains unresolved. Context proposals are drawn from the same document and require confirmation. No quantity conversions, fuzzy indicator merges or cross-document unit borrowing.
3. Group exact indicator identities plus compatible canonical units. Related unresolved rows stay together but retain missing/raw units. Prevent unresolved/incompatible comparisons and graph points. Category filter applies to both history and review.
4. Add per-document preview, format-only apply, explicit human confirmation, source links and undo; server validates eligibility/version and preserves result IDs, files, dates, conclusions. Persist revisions in existing JSON payload (no destructive schema migration).
5. Preserve raw units during extraction; expose read/normalized units in editor and route confirmation through same rules. Keep original indicator names; explicit existing aliases remain user-controlled.
6. Regression tests for normalization, grouping, graph eligibility, edit preservation, concurrency, undo, source/result retention and category isolation. Run suite/typecheck/build, publish, verify existing cases and review UI read-only in production. Do not confirm ambiguous real results on behalf of user.
