# Home PDF Import Feature Spec

## Scope

Add a lightweight PDF import entry on the mobile app home feed.

## User Behavior

- The home feed shows a PDF import card.
- Tapping the import action opens the local file picker when the runtime supports it.
- Only PDF files are accepted.
- After a PDF is selected, the card shows the selected file name and size.
- If the runtime does not support file picking, selection fails, or the file is not a PDF, the app shows a toast and does not change backend data.

## Data And State

- The first slice keeps the selected file in local page state only.
- No upload, parsing, persistence, registry mutation, publication mutation, database write, or release action is performed.
- The selected file record keeps only `fileName`, `fileSizeLabel`, `filePath`, and the original file object for future handoff.

## Non Goals

- PDF parsing, OCR, article extraction, issue creation, publication creation, and backend intake.
- Auth, payment, quota, entitlement, notification, database, or release-channel changes.

## Done Contract

- Home feed has a visible PDF import entry.
- PDF selection accepts `.pdf` files and rejects other formats.
- Selected PDF name and file size are visible on the card.
- Unsupported runtime and selection errors show user-facing feedback.
- Verification is run or the blocking reason is recorded.
