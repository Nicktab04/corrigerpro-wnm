# Rebranding CorrigéPro and document watermark

## What changes

- Replace the visible brand name “LicenceHub” with “CorrigéPro” throughout the public home, sign-in, authenticated header, page titles, descriptions, and social metadata.
- Keep internal file and code names unchanged where they are not shown to users, avoiding an unnecessary technical rename.
- Pass the signed-in student’s `Nom Prénom • Gmail` identity from the dashboard into the document viewer.
- Add a subtle repeated diagonal watermark layer over PDF pages and images while they are being viewed.
- Keep the watermark non-interactive (`pointer-events: none`, non-selectable), responsive, and light enough to preserve document readability.
- Leave downloaded and newly opened original files unchanged; the watermark applies only inside “Consulter”.

## Validation

- Check that no user-visible “LicenceHub” text remains.
- Verify the PDF and image viewer display the correct student identity without blocking scrolling, zoom, page navigation, closing, or downloading.
- Test the viewer at desktop and mobile widths, then confirm the current preview build is healthy.

## Technical details

- Extend `DocumentViewerDialog` with an optional watermark string.
- Render a reusable overlay above the PDF/image viewport using semantic theme colors and repeated rotated labels.
- Build the label from the loaded profile in the dashboard, using the requested `nom`, `prenom`, and `gmail` fields.
