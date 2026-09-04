# FindBiz V13 — Real Email Accounts

This version adds real email/password authentication using Supabase Auth.

Flow:
1. User enters an email address and password.
2. FindBiz creates the account.
3. Supabase sends a verification email.
4. The user clicks the verification link.
5. The user can then log in.

Setup required:
- Create a Supabase project.
- Enable email/password signups and email confirmations.
- Set the Site URL to the FindBiz GitHub Pages URL.
- Put the project's public URL and publishable/anon key in config.js.
- Never put a service_role/secret key in config.js.

Payments, saved leads and usage limits are separate stages.
