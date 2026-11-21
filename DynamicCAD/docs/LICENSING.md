# Licensing (Milestone 13)

## Current state (v0.9.0)

This build is a **pre-release for internal evaluation at Dynamic Engineers**. It contains **no licence
enforcement**: no trial timer, no activation, no machine binding. Help → About states this. Nothing in the
application pretends to check a licence.

No secret keys, passwords or API tokens are stored in the application or in this repository.

## Design for the commercial version (not yet implemented)

Licence enforcement must not rely on a secret inside the desktop application, because anything shipped can be
extracted. The design therefore uses **public-key signatures**:

1. **Licence server (later, separate project).** Holds the private signing key (Ed25519) in a secrets store.
   It issues a signed licence file: customer, edition, seats, expiry, machine fingerprint hash, issue date.
2. **Desktop application.** Contains only the *public* key. It verifies the signature locally, so it works
   offline. Changing any field breaks the signature.
3. **Machine binding.** Fingerprint = hash of stable identifiers (Windows MachineGuid + system volume serial),
   with tolerance for minor hardware changes. Never transmits personal data.
4. **Offline grace.** Subscription licences refresh online every 30 days, with a 14-day grace period.
   Perpetual licences need no refresh.
5. **Trial.** A signed 30-day trial licence issued by the server on first start (one per machine fingerprint),
   not a local clock trick.
6. **Failure behaviour.** When unlicensed, drawings can still be opened, viewed, printed and exported to DXF
   (users never lose access to their own data); editing and saving are disabled.

## Required decisions before implementation

* Pricing, editions and seat model (owner).
* Hosting for the licence server and who operates it.
* A signature library with a permissive licence (for example libsodium, ISC licence, or Monocypher,
  CC0/BSD-2) — to be reviewed and recorded in `LICENSES/THIRD_PARTY_NOTICES.md` before use.
* Code-signing certificate for the installer and executable (paid; needs approval).
