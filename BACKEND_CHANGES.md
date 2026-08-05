# Backend updates for the new UI

The new "Verification Result" screen shows a **Trust Score**, a 3-way status
(**Verified / Needs Review / Fake**), and an **AI Packaging Analysis** panel
(Logo/Text/Color match). Previously the code only ever produced 2 outcomes
("Verified Original" / "Possible Fake Medicine"), and the numbers on the
mockup screens were hardcoded. This pass makes all of that real.

## What changed

### 1. `src/utils/verification.js` (new file)
A deterministic, rule-based verification engine — `computeVerification(medicine, barcode)`.
No ML/computer-vision model is involved (none was ever trained for this
project); instead the Trust Score and "packaging analysis" chips are computed
from fields already stored on the medicine record:

| Check | Points | Fails when |
|---|---|---|
| Barcode matches registry exactly | 40 | scanned code ≠ stored barcode |
| Batch number present & valid length | 20 | missing/too short |
| Not expired | 20 | expiry date has passed |
| License number present | 10 | missing/too short |
| Manufacture date is sane (before expiry, not in future) | 10 | inconsistent dates |

Score ≥ 80 and not expired → **Verified**
Score 50–79, or found-but-expired → **Needs Review**
Score < 50 or barcode not found at all → **Fake**

This is intentionally explainable — every point is traceable to a concrete
check, which is useful for your paper presentation / viva.

### 2. `src/pages/ScanPage.jsx`
`completeScan()` now calls `computeVerification()` instead of a plain
found/not-found check, and stores `trustScore` + `packaging` on the history
document (`addHistoryEntry`). The Verification Result screen renders the
**real** trust score, status, and per-item packaging match/mismatch instead
of the hardcoded "95% / All Matched" from the visual mockup.

### 3. `src/pages/DashboardPage.jsx`
The "Needs Review" stat was previously a fake placeholder
(`scanCount - verifiedCount`). It now counts actual `Needs Review` entries
from the user's history.

### 4. `firestore.rules` (new file, project root)
No security rules file existed in your upload, so I wrote one matching the
collections your code actually uses (`users`, `medicines`, `history`,
`reports`):
- `history` / `reports`: a user can only create docs with their own `uid`,
  and can only read their own entries (admins can read all).
- `medicines`: readable by any signed-in user, writable only by users whose
  profile has `role == "admin"`.
- `users`: a user can read/update only their own profile, and can never
  change their own `role` field (prevents self-promotion to admin).

Deploy it with:
```
firebase deploy --only firestore:rules
```

## Nothing else changed
Auth flow, Firebase config, Storage uploads, routing, and every other page
are untouched.
