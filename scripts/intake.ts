// Private operator tool. No public list/export endpoint is exposed.
import { writeFile } from 'node:fs/promises';
import { isAbsolute, resolve } from 'node:path';
import { db, row, rows } from '../lib/db';
import { decrypt } from '../lib/security';
async function main() {
  const [action, path] = process.argv.slice(2);
  try {
    if (action === 'stats') {
      console.log(
        JSON.stringify(
          {
            profiles: row('SELECT COUNT(*) total FROM intake_profiles'),
            sources: rows('SELECT source, COUNT(*) total FROM intake_profiles GROUP BY source'),
            preferences: rows(
              "SELECT json_extract(dog_data,'$.preference') preference,COUNT(*) total FROM intake_profiles GROUP BY preference",
            ),
            privacyRequests: row(
              "SELECT COUNT(*) pending FROM intake_privacy_requests WHERE status='pending'",
            ),
          },
          null,
          2,
        ),
      );
    } else if ((action === 'export' || action === 'requests') && path && isAbsolute(path)) {
      const records =
        action === 'export'
          ? rows('SELECT * FROM intake_profiles ORDER BY created_at').map((r) => ({
              id: r.id,
              contact: JSON.parse(decrypt(r.contact as string)),
              dog: JSON.parse(r.dog_data as string),
              photo: r.photo,
              source: r.source,
              status: r.status,
              consentVersion: r.consent_version,
              consentText: r.consent_text,
              createdAt: r.created_at,
            }))
          : rows('SELECT * FROM intake_privacy_requests ORDER BY created_at').map((r) => ({
              id: r.id,
              ...JSON.parse(decrypt(r.details as string)),
              status: r.status,
              createdAt: r.created_at,
            }));
      await writeFile(resolve(path), JSON.stringify(records, null, 2), { mode: 0o600, flag: 'wx' });
      console.log(
        `Exported ${records.length} records to a private JSON file. Never commit or publish it.`,
      );
    } else {
      console.error(
        'Usage: intake.ts stats | export /absolute/private/file.json | requests /absolute/private/requests.json',
      );
      process.exitCode = 1;
    }
  } finally {
    db().close();
  }
}
main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : 'Private intake operation failed.');
  process.exitCode = 1;
});
