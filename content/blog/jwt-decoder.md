{
  "tool": "jwt-decoder",
  "slug": "decode-jwt-token-header-payload",
  "title": "How to Decode a JWT Token (and Why Decoding Isn’t Verifying)",
  "description": "Decode a JSON Web Token’s header and payload, read exp and iat dates in IST, spot alg none and expired tokens, and learn why signatures must be verified.",
  "keywords": ["jwt decoder", "decode jwt token", "jwt payload viewer", "jwt expiry check", "json web token explained"],
  "summary": "To decode a JWT, split it at the two dots and Base64url-decode the first two parts: the header and the payload, both JSON. Decoding needs no key, which is why it never proves a token is genuine. BISCS India's JWT Decoder shows the claims, expiry in IST and algorithm, on your device without sending the token anywhere.",
  "faq": [
    { "q": "Is the data inside a JWT encrypted?", "a": "No, not in a standard signed JWT. The header and payload are only Base64url-encoded, so anyone holding the token can read them. Do not put passwords, Aadhaar numbers or other sensitive personal data in JWT claims. Encrypted tokens exist, called JWE, and have five parts instead of three." },
    { "q": "Does decoding a JWT verify it?", "a": "No. Decoding only reads the contents. Verification means recalculating or checking the signature with the correct secret or public key, and confirming claims such as exp, iss and aud. Only your server, using a maintained JWT library, should decide whether a token is trusted." },
    { "q": "Why does my token show as expired when I just logged in?", "a": "Check the clock on the machine that issued the token and the one checking it, because exp is compared against the current time. Also confirm the exp value is in seconds, as the standard requires. A value in milliseconds would look like a date thousands of years away, not expired." },
    { "q": "Is it safe to paste a production JWT into an online decoder?", "a": "A valid token is like a temporary key to an account, so treat it carefully. The BISCS India decoder works entirely in your browser and does not upload the token. Even so, prefer test tokens, and if a live token may have been exposed, revoke it or let it expire." },
    { "q": "What does alg none mean in a JWT header?", "a": "It means the token claims to have no signature at all. Some old libraries once accepted such tokens as valid, letting attackers forge any claims. A secure server must reject alg none and should only accept the specific algorithms it expects. The decoder flags this case with a warning." }
  ]
}
---
A JSON Web Token (JWT) is three chunks of Base64url text joined by dots: `header.payload.signature`. Decoding it means turning the first two chunks back into the JSON they came from, so you can read who the token is for, who issued it and when it expires.

The [JWT Decoder](/tools/jwt-decoder/) on BISCS India does this instantly in your browser, converts timestamps like `exp` and `iat` into readable IST dates, and warns about expired tokens and unsafe algorithms. One thing it deliberately does not do is verify the signature, and understanding why is the most important part of working with JWTs.

## What is inside a JWT?

Here is a token split onto three lines for readability:

```text
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9
.eyJzdWIiOiJ1c2VyXzEwMjQiLCJuYW1lIjoiUHJpeWEgU2hhcm1hIiwiZXhwIjoxNzk4NzM1NDAwfQ
.k3X1oQ...signature...
```

The first part decodes to the **header**, which says how the token was signed:

```json
{ "alg": "HS256", "typ": "JWT" }
```

The second part decodes to the **payload**, a set of claims:

```json
{ "sub": "user_1024", "name": "Priya Sharma", "exp": 1798735400 }
```

The third part is the **signature**, binary data created from the first two parts and a key. It is what makes the token trustworthy, but only to someone who checks it with the right key.

## Decoding is not verifying

Anyone can decode a JWT. There is no secret involved; it is just Base64url. That has two consequences every developer should remember:

1. **The payload is public.** Never put secrets, passwords or sensitive personal data in it. Anyone who intercepts or is given the token can read it.
2. **The payload proves nothing on its own.** An attacker can write any JSON they like, encode it, and attach a fake signature. A decoder will happily show `"role": "admin"`. Only signature verification on the server reveals the forgery.

So use a decoder for **debugging and inspection**, and let your backend library, such as `jsonwebtoken` in Node.js, PyJWT in Python or your framework’s built-in middleware, **verify** every token before trusting it. Verification should check the signature, the algorithm you expect, and the `exp`, `nbf`, `iss` and `aud` claims.

## How to decode a JWT with BISCS India

1. Open the [JWT Decoder](/tools/jwt-decoder/).
2. Paste the token into the **JSON Web Token** box. A leading `Bearer ` copied from an `Authorization` header is stripped automatically.
3. The token is shown colour-coded by part, and the **Status** card shows whether it has expired, when it expires relative to now, and the signing algorithm.
4. Read the **Header** and **Payload** cards. Standard claims are labelled in plain English, and time claims (`exp`, `nbf`, `iat`) are shown as IST dates with a relative time, alongside the raw number.
5. Use **Copy JSON** on either card to grab the decoded content for a bug report or test.

Click **Sample** to load an example token if you just want to explore.

## The standard claims, explained

| Claim | Name | Meaning |
| --- | --- | --- |
| `iss` | Issuer | Who created the token, often your auth server’s URL |
| `sub` | Subject | Who the token is about, usually a user ID |
| `aud` | Audience | Which application the token is meant for |
| `exp` | Expires | Time after which the token must be rejected |
| `nbf` | Not before | Time before which the token is not valid |
| `iat` | Issued at | When the token was created |
| `jti` | Token ID | Unique ID, useful for revocation lists |

The time claims are **Unix timestamps in seconds**, not milliseconds. JavaScript’s `Date.now()` returns milliseconds, so a common bug is writing `exp: Date.now() + 3600` instead of `Math.floor(Date.now() / 1000) + 3600`. If you need to convert a timestamp by hand, the [Unix Timestamp Converter](/tools/timestamp-converter/) shows it in IST and UTC.

## Warnings the decoder shows

- **Expired.** The `exp` time is in the past. Your server should reject this token; the client should refresh it.
- **No expiry (exp) claim.** A token that never expires is a long-lived key. If it leaks, it works forever unless you rotate the signing secret.
- **alg: none.** The token claims to be unsigned. A correct server must never accept it.
- **Five parts instead of three.** That is an encrypted JWE token. Its payload cannot be read without the decryption key, and the tool tells you so.
- **Wrong number of parts or invalid Base64.** Often a token truncated when copied from logs or a terminal.

## Common mistakes when working with JWTs

- **Storing sensitive data in claims.** Keep payloads to IDs, roles and expiry. Look everything else up on the server.
- **Trusting decoded claims in the front end for security decisions.** Hiding an admin button based on a decoded `role` is fine for convenience, but the API must enforce permissions itself.
- **Long expiry with no revocation.** Use short-lived access tokens, for example 15 minutes to an hour, plus refresh tokens.
- **Accepting any algorithm.** Configure your verifier with an explicit list such as `["RS256"]`, so an attacker cannot switch to `none` or swap an asymmetric algorithm for a symmetric one.
- **Sharing live tokens in tickets and chats.** A pasted bearer token is a working credential until it expires.

## How the decoding actually works

If you want to decode a payload in code, it is a few lines, which shows how little protection encoding provides:

```js
const payload = JSON.parse(
  new TextDecoder().decode(
    Uint8Array.from(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0))
  )
);
```

`atob` needs standard Base64, so the URL-safe `-` and `_` characters are converted back first. Using `TextDecoder` keeps names in Hindi or other scripts intact. For decoding arbitrary Base64 strings rather than tokens, use the [Base64 Encode / Decode](/tools/base64-encoder/) tool.

## Privacy

A JWT can be a live credential, so where you paste it matters. This decoder runs entirely in your browser; the token is never sent to a server or stored. If you are building tokens for a test environment, generating random user IDs with the [UUID Generator](/tools/uuid-generator/) keeps test data realistic without touching real accounts.
