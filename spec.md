# HKLOblogg

## Current State
Blog platform with Motoko backend, authorization component, and a React frontend mockup. The `registerOrClaimAdmin` function assigns admin to the first registering user via `adminAssigned` flag. No hardcoded admin principal exists yet.

## Requested Changes (Diff)

### Add
- Hardcoded superadmin principal constant (`ci3hz-xset5-ahrcc-nhtdc-kfnzc-34wqe-e2yzj-qk2gl-ygiwy-oc5j5-2ae`) in backend.
- Logic in `registerOrClaimAdmin` to always assign `#admin` role to that principal regardless of registration order.

### Modify
- `registerOrClaimAdmin`: check if caller matches hardcoded principal first; if so, set/upgrade to admin. Otherwise fall through to existing `claimAdminIfFirst` logic.

### Remove
- Nothing removed.

## Implementation Plan
1. Add a `let superadminPrincipal` constant parsed from the hardcoded text.
2. In `registerOrClaimAdmin`, before the existing logic, check if `caller == superadminPrincipal`; if so, set role to `#admin` and mark `adminAssigned = true`, then return `#admin`.
3. Existing `claimAdminIfFirst` path remains intact for future first-user scenarios.
