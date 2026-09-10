# LicenceHub

A study-resource platform where university students find past exam papers and their corrections, sorted by major and year level.

## What gets built

**Landing page**
- Explains LicenceHub, shows the three majors (SEG, PC, AGRO) with their own colour identity, and how access works: request, wait for approval, then browse.
- Buttons to register and to sign in.

**Registration + access request**
- Form: Nom, Prénom, Gmail, WhatsApp, plus chosen major and level (Licence 1/2/3).
- After submitting, the student sees a clear "waiting for approval" screen.
- Sign-in with Google, plus email/password as a fallback.
- If someone signs in before approval, they see the pending screen instead of documents.

**Student dashboard**
- Filter documents by major, level, subject name, year, and type (exam paper or correction).
- Each item can be viewed or downloaded.
- The page takes on the colour of the student's major (blue/cyan, purple/indigo, green/emerald).

**Admin dashboard**
- Access requests list: approve or reject, with the student's name, Gmail and WhatsApp visible.
- Grant or revoke permission to upload for trusted students.
- Upload form: file, title, major, level, subject, year, exam or correction. Admins can also delete documents.

## Technical notes

- Lovable Cloud for accounts, database and file storage.
- Tables: `profiles` (nom, prénom, gmail, whatsapp, major, level, approval status), `user_roles` (admin / uploader, separate table for security), `documents` (title, major, level, subject, year, type, storage path).
- Row-level security: only approved students read documents; only admins read access requests and change statuses; upload permitted to admins and users holding the uploader role.
- Storage bucket is private; downloads use short-lived signed links.
- Routes: `/` landing, `/register`, `/auth`, `/pending`, `/dashboard` (approved students), `/admin` (admins only).
- First admin: I will note how to mark your account as admin once you have signed up.

## Open item

The first account needs to be promoted to admin manually after you register — tell me the Gmail you will use and I will set it.
