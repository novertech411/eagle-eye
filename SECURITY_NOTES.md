# Security Notes

Status of access control in Eagle Lense, and what must change before more than one clinic uses it. No Row Level Security (RLS) policies were changed when this was written.

## Current state

RLS is on for all four tables. The policies in `supabase/migrations/002_temp_rls_policies.sql` are temporary and give each user access only to their own records:

| Table | A user can read and write rows where |
|---|---|
| `patients` | `created_by = auth.uid()` |
| `examinations` | `created_by = auth.uid()` |
| `retinal_images` | the parent examination has `created_by = auth.uid()` |
| `screening_results` | the parent examination has `created_by = auth.uid()` |

Each policy is `for all`, so it covers select, insert, update and delete.

The report route (`app/api/report/[id]/route.ts`) also checks `created_by` itself, and only serves finalized examinations.

## Storage

`supabase/migrations/003_storage_bucket.sql` makes the `retinal-images` bucket private and scopes access by folder. A signed-in user can upload to and read from a folder only if it is named after an examination they created. No update or delete policies exist, so stored images can't be changed or removed through the client.

## What needs tightening

1. **Role-based access.** Access follows whoever created the record. Two clinicians in one clinic can't see each other's patients, a reviewer can't finalize a colleague's examination, and there are no admin or read-only roles.
2. **Finalized reports are locked in the app only.** The server action and API routes refuse to change a finalized report, but RLS doesn't. A signed-in user could still edit or delete their own finalized `screening_results` row by calling Supabase directly with their session. Clinical sign-off should be enforced in the database, for example with a policy or trigger that rejects changes once `finalized` is true.
3. **No audit trail.** `finalized_by` and `finalized_at` record the sign-off, but earlier edits, report downloads and record views aren't logged.
4. **Unused secret.** `.env.example` lists `SUPABASE_SERVICE_ROLE_KEY`, but no code uses it. This key bypasses RLS, so leave it unset in deployments until something needs it, and only ever use it on the server.

## Recommendation

Before any multi-tenant deployment:

1. Add a `clinics` table and a `clinic_memberships` table holding each user's role.
2. Add a `clinic_id` column to `patients` and `examinations`, and backfill existing rows.
3. Replace the policies in migration 002 with ones scoped to clinic membership and role.
4. Change the storage policies to match, so a folder is readable by members of the examination's clinic.
5. Replace the `created_by` check in the report route with the same clinic rule.
6. Test with two accounts in different clinics that neither can reach the other's records, images or reports.

## Patient data leaving the system

These aren't access-control issues, but they should be reviewed before real patient use:

- **AI analysis:** retinal images are sent to the Anthropic API (`lib/claude.ts`). Confirm this is covered by patient consent and your data-processing agreements.
- **PDF file names:** downloaded reports include the patient's name and examination date, which stay visible in downloads folders and email attachments.
