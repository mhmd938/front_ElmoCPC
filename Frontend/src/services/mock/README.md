# Backend-free mock operator guide

The mock layer is a deterministic, browser-local implementation of the auth,
team, invitation, submission, receipt, and admin-review services. It is for
UI development and browser acceptance only: it does not send email, move real
money, or upload bytes to a server.

## Start the demo

From `Frontend/`:

```
npm ci
npm run dev:mock
```

Open the Vite URL printed in the terminal and keep that exact origin for the
whole workflow. Prefer the loopback origin (`http://localhost:<port>` or
`http://127.0.0.1:<port>`): it provides the secure-context browser permissions
needed for clipboard access and supports `crypto.randomUUID()` for generated
invite tokens. `npm run dev:mock` is the only mode that enables the mock
services (`import.meta.env.DEV && import.meta.env.MODE === "mock"`). To run
against the real API instead, use:

```
npm run dev
```

The ordinary build is also non-mock: `npm run build` never enables a mock
session.

## Synthetic accounts and OTP

Request a login code at `/login` or a signup code at `/signup`, then enter
`111111`. A challenge is valid for five minutes; resending replaces the
challenge and starts a new five-minute window. OTPs are local and no message is
sent.

| Account | Email | Use |
| --- | --- | --- |
| Teamless participant | `captain@example.test` | Create a team, invite members, submit, and upload a receipt. |
| Teamless participant | `member-a@example.test` | Accept or reject an invitation. |
| Teamless participant | `member-b@example.test` | Accept a second invitation. |
| Teamless participant | `member-c@example.test` | Exercise a separate pending/cancelled invitation. |
| Admin | `admin@example.test` | Review teams and receipts, inspect users, and exercise filters. |

The seed also contains fixture accounts for the status table below. They are
useful when testing a status directly: `submitted@example.test`,
`receipt@example.test`, `payment@example.test`, `draft@example.test`,
`accepted@example.test`, and `rejected@example.test`. Their `-a` and `-b`
variants are seeded members where the team has three members. `pending` and
`expired` are seeded invitation recipients.

## Reset only mock state

Mock state, mock sessions, mock Zustand data, and mock wizard drafts use the
`elmocpc:mock:` namespace. In DevTools, run this on the demo origin and then
reload:

```js
Object.keys(localStorage)
  .filter((key) => key.startsWith("elmocpc:mock:"))
  .forEach((key) => localStorage.removeItem(key));
```

This resets the versioned fixture store (`elmocpc:mock:v1`) without deleting
ordinary API-mode keys. Reset before repeating a browser acceptance run.

## Seeded fixture statuses

The first mock-state read seeds these teams. The IDs are stable until the mock
state is reset; new teams and receipts receive monotonic IDs.

| ID | Name | Status | Acceptance use |
| ---: | --- | --- | --- |
| 7 | `تیم کوانتوم` | `submitted` | Admin approve or reject a submitted team. |
| 8 | `الگوریتم‌های شادی` | `receipt_pending` | Seeded pending receipt; use it to open the receipt preview and exercise rejection. |
| 9 | `باینری` | `waiting_for_payment` | Captain can upload a local sample receipt. |
| 10 | `پیش‌نویس` | `draft` | Seeded pending and expired invite records (`fixture-pending`, `fixture-expired`). |
| 11 | `مدار` | `accepted` | Seeded approved receipt and completed review state. |
| 12 | `بردار` | `rejected` | Seeded rejection path. |

There are two seeded receipt rows: receipt `101` is pending for team `8`, and
receipt `102` is approved for team `11`. Both use the bundled
`/mock-receipt.png` preview. The pending invite is relative to the time the
state is seeded, so a fresh reset restores it for another run; the expired
invite is intentionally already expired.

## Invite links and account switching

The mock supports one active session per browser profile and origin. A reliable
multi-account sequence is:

1. Sign in as `captain@example.test`, create a team, and open the Team tab.
2. Use **Invite member** (or `/invitemember`) to send an invitation. In mock
   mode the captain's current team is resolved from the session.
3. In the pending-invites list choose **Copy invite link**. The link is built
   from the current origin as `/accept-invite?token=<token>`; it is not a
   backend URL.
4. Sign out, then open the copied link as the intended recipient. Sign in as
   or sign up with that invite email and enter `111111`. Accept or reject the
   invite.
5. Sign out again before returning to the captain account. Reloading after
   acceptance shows the new member on the same team.

Tokens are bound to their recipient email. A different account cannot consume
the link. Pending invites may be cancelled only by the captain; an accepted,
rejected, cancelled, or expired token cannot be reused. To exercise a reject →
replace branch, reject the first invite, switch back to the captain, and send a
new invite to a different teamless account. Keep a separate pending invite for
the cancellation branch. A team cannot be submitted while an unexpired invite
is still pending, and it must have exactly three members.

## Synthetic receipt workflow

The browser UI exposes payment actions only to the captain when the team is in
`waiting_for_payment`. In mock mode the payment panel explains that the upload
is local and uses a demo payment label; it does not represent a real transfer.

To exercise the complete path:

1. Submit a three-member team with no pending invites.
2. Sign out, sign in as `admin@example.test`, open `/admin`, and approve the
   submitted team. Its status becomes `waiting_for_payment`.
3. Switch back to the captain, reload `/dashboard`, and upload any valid JPG,
   JPEG, PNG, or PDF no larger than 5 MiB.
4. Switch to the admin again. The receipt is pending and can be opened from
   the linked team; approve it (optionally add notes) or reject it.
5. Switch back to the captain and reload. The captain's status must match the
   admin's status: `accepted` after approval or `rejected` after rejection.

The mock validates the file type and size, stores receipt metadata only, and
points both the team and receipt row at `/mock-receipt.png`. Uploaded file
bytes are never persisted. The seeded team `8`/receipt `101` is a ready-made
pending-receipt rejection branch; team `11`/receipt `102` is already approved.

## Service-only and local-only behavior

- The mock twins (`mockAuth`, `mockTeam`, and `mockAdmin`) expose the same
  signatures and response shapes as the real services. Team service-only
  coverage includes `getTeamService`, `updateTeamService`,
  `removeMemberService`, `leaveTeamService`, and
  `getAllTeamStatusesService`; direct admin service methods are covered too,
  even though the routed UI presents them through the dashboard and `/admin`
  rather than separate pages.
- In mock mode every routed service returns before `getData`, `postData`,
  `postImageData`, or direct `fetch` can reach `https://api.elmocpc.ir`.
- OTPs, invite links, receipt previews, delays, and all state mutations are
  synthetic. A successful “receipt upload” is a local state transition, not a
  payment or network upload.
- `/camp` is public, but its registration-deadline CTA buttons are intentionally
  disabled. Dashboard schedule/notification/settings entries are not routed in
  the current UI. These are presentation limits, not missing mock endpoints.
- API-backed mode keeps the normal transport and credentials. Do not copy
  `elmocpc:mock:*` values into the ordinary API-mode keys.

## Troubleshooting

- If the dashboard shows an old account, sign out and clear only the mock
  namespace before switching origins or accounts.
- Open the full copied `/accept-invite?token=...` URL. If it redirects to
  `/login?invite=...`, keep that URL and sign in with the invitation's email.
- If submit is blocked, resolve all pending invitations and verify that the
  team has exactly three members.
- To upload a receipt, sign in as the captain of a team in
  `waiting_for_payment` and select a file within the accepted type and size.
- To review an uploaded receipt, sign in as the admin and select the
  `receipt_pending` filter.
