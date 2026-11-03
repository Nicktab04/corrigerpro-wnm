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
- Snapshot subscription months on payment creation and extend from the later of confirmation or existing expiry; this preserves the purchased duration and remaining time on renewal.
- Protect subscription fields with profile guards, and use admin-only set_student_plan for manual timed grants; students must never extend their own access.
- Limit subscription-based signed storage links to the remaining entitlement lifetime and close the in-app viewer at expiry; document purchases and free files remain unaffected.
