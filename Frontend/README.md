# ELMOCPC frontend

React + TypeScript + Zustand frontend for the ELMOCPC registration flow. The
project has two development modes:

- `npm run dev:mock` starts the backend-free demo. Service calls are answered
  by the local mock twins and state is persisted in the browser.
- `npm run dev` starts the API-backed mode. It uses the configured
  `https://api.elmocpc.ir` transport and does not accept mock sessions.

## Setup

From this directory, install the lockfile exactly and start the mode you need:

```
npm ci
npm run dev:mock
```

The Vite server is normally available at
[http://localhost:5173](http://localhost:5173). See
[`src/services/mock/README.md`](src/services/mock/README.md) for the synthetic
accounts, fixture state, account-switching workflow, receipt workflow, and
mock-state reset instructions.

Useful verification commands:

```
npm test
npm run build
npm run lint
```

## Route inventory

Routes are defined in `src/routes/routes.tsx`. Direct-open a route in the
account state shown below when running the mock mode.

| Path | Expected state | What to exercise |
| --- | --- | --- |
| `/` | Anonymous | Public landing page and navigation. |
| `/camp` | Anonymous | Bootcamp details; the registration-deadline CTAs are intentionally disabled. |
| `/signup` | Anonymous | Create a synthetic account, request an OTP, and verify it. |
| `/login` | Anonymous or signed out | Start an OTP login; preserve `?invite=<token>` when entering from an invite link. |
| `/dashboard` | Signed-in participant | Review team status, pending invites, logout, and reload persistence. |
| `/buildteam` | Signed-in participant without a team | Create/edit a draft team and invite members from the wizard. |
| `/invitemember` | Signed-in captain with a draft team | Send a standalone invitation; in mock mode the current team is resolved from the session. |
| `/accept-invite?token=<token>` | Signed-in invite recipient, or anonymous visitor who can sign in/sign up | Accept or reject a recipient-bound invitation. |
| `/admin` | Signed-in `admin@example.test` | Review team status, receipt status, users, search, and status filters. Participants are redirected to `/dashboard`. |

The browser workflow should use one origin for every account. Sign out before
switching accounts; the mock session intentionally supports one active account
per browser profile and origin.

## Test matrix

The automated suite keeps transport routing and mock behavior separate. The
focused files below are the acceptance matrix; `npm test` runs all of them.

| Area | Test file(s) | Coverage |
| --- | --- | --- |
| Transport guards | `src/services/__tests__/mockRouting.test.ts` | All four auth, fifteen team, and six admin public services route to their mock twin in mock mode; arguments and response shapes are preserved; direct `fetch` and transport calls stay at zero; real-mode smoke still reaches `getData`. |
| Auth and sessions | `src/services/__tests__/mockAuth.test.ts`, `src/pages/__tests__/mockAuthPages.test.tsx` | Seeded accounts, signup, email-bound OTPs, expiry/resend, replay rejection, mock/real storage isolation, admin routing, and logout. |
| Team lifecycle | `src/services/__tests__/mockTeam.test.ts`, `src/pages/__tests__/inviteMember.test.tsx` | Draft CRUD, captain permissions, capacity, invite validation, cancellation, rejection/reinvite, acceptance, leave/remove, delete/recreate, and wizard persistence. |
| Invite entry points | `src/pages/__tests__/AcceptTeamInvite.test.tsx` | Encoded token routing, anonymous return-to-invite flow, recipient checks, accept, and reject. |
| Submission and review | `src/services/__tests__/mockReview.test.ts`, `src/pages/__tests__/mockReviewPages.test.tsx` | Submit → admin approval → receipt upload → receipt approval/rejection, seeded branches, receipt preview, filters, and reviewed-state updates. |
| Shared UI regressions | `src/components/Dashboard/Modals/__tests__/ModalDesign.test.tsx`, `src/components/Dashboard/Sidebar/__tests__/Sidebar.test.tsx`, and other `src/**/__tests__` files | Modal guards, disabled actions, navigation, and component-level behavior. |

The request inventory can be reviewed with:

```
rg -n 'api\.elmocpc\.ir|fetch\(|getData\(|postData\(|postImageData\(' src
```

Every routed page service call is guarded before the real transport, and the
transport assertions in `mockRouting.test.ts` are the automated check for that
contract.

## Project structure

```
src/
├── components/           # Shared UI and dashboard sections
├── hooks/                # Page workflows and stateful behavior
├── pages/                # Routed pages
├── routes/               # Browser route configuration
├── services/             # API services and backend-free mock twins
├── store/                # Zustand stores
├── types/                # Shared TypeScript contracts
└── utils/                # Small shared utilities
```

The mock service layer deliberately keeps the same public service signatures
and response shapes as the API-backed layer. This lets pages exercise the
workflow without changing their service imports.
