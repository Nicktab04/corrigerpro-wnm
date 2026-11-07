<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Subscription entitlement is derived from the stored expiry at access time, not a recurring job; this revokes access exactly without idle database polling. Null expiry preserves legacy manually granted paid access only.
- Student profile inserts are approved by a database trigger, never by client privilege; subscription guards and admin revocation remain independent.
- Use studentDestination for completed-profile navigation so legacy pending profiles enter the app while explicit revocation remains enforced.
- Resolve post-auth navigation from roles and the loaded profile through studentDestination; this sends new students to their information form without an intermediate dashboard redirect.
- Snapshot subscription months on payment creation and extend from the later of confirmation or existing expiry; this preserves the purchased duration and remaining time on renewal.
- Protect subscription fields with profile guards, and use admin-only set_student_plan for manual timed grants; students must never extend their own access.
- Limit subscription-based signed storage links to the remaining entitlement lifetime and close the in-app viewer at expiry; document purchases and free files remain unaffected.
- Account deletion is an authenticated server function that revalidates the caller and checks roles before hard-deleting Auth; cascades remove personal records, while shared document uploads are preserved with service ownership.
- Document downloads fetch private files through the authenticated storage client and deliver local blobs without navigation; use a prepared-file click when activation expires and the native file sheet on iOS to preserve mobile saving.
- Wave payments navigate only in the current tab after saving the request; restore its proof dialog from account-scoped session storage on return to avoid mobile blank tabs.
- Push notifications use Firebase via the connector gateway from authenticated server functions; device tokens live in push_tokens so sends target only the student's devices.
- Show the push invitation from the shared app shell for non-admin users, with account-scoped per-login session history; this covers registration and existing logins without repeating on navigation or token refresh. Native permission requests remain click-driven.
