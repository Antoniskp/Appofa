# Poll attachments

Every standard poll type supports up to 10 photos and PDFs. Creators can upload
several files, edit titles/captions, reorder, and remove them. Organization poll
creation uses the same editor. The poll detail page shows a photo gallery and PDF
open/download links before voting. Photos are limited to 8 MiB and PDFs to 20 MiB.

Run `npm run migrate` before starting the updated application. Install the updated
nginx configuration and reload nginx after validating it (`nginx -t`); both
checked-in configurations allow 21 MiB requests including multipart overhead.
The Next.js API proxy preserves binary multipart bodies during local development;
its proxy body-buffer limit is also configured to 21 MiB.

Files live under `uploads/.poll-attachments/` (or under `MEDIA_UPLOAD_ROOT` when
configured). Keep this directory on the same persistent/shared volume as other
uploads. Static serving denies dotfiles. Downloads and thumbnails use
`/api/polls/attachments/:id/file`, with the same live visibility check as the poll,
including local and organization membership restrictions. Unsaved uploads are
accessible only to their uploader. Responses use `private, no-store`; images are
already resized and use `unoptimized`, and the Next image optimizer rejects these
URLs to prevent cached images bypassing later visibility changes.

Upload bodies are validated: photos are decoded and converted to WebP with the
existing image processor; PDFs require a PDF header and end marker. Attachment
metadata accepts only an existing attachment ID plus title/caption. Files are
claimed, reordered, and detached in the poll's database transaction. A failed save
preserves staged uploads for retry. Existing attachments are only deleted after
a successful save. The uploader's storage quota also counts their media-library
files. PDF responses carry a sandbox CSP and the correct content type.

Run `npm run polls:cleanup-attachments` daily to remove abandoned uploads older
than 24 hours and unreferenced files left by interrupted uploads or cascading
deletions. Uploading also clears that user's expired staged uploads. Removing an
unsaved attachment deletes it immediately; deleting a poll deletes its files after
the poll transaction commits. Back up the database and uploads together.
