{
  "tool": "hash-generator",
  "slug": "md5-sha256-hash-generator-checksum",
  "title": "MD5 and SHA-256 Hash Generator: Verify Files and Text",
  "description": "Generate MD5, SHA-1, SHA-256 and SHA-512 hashes of text or files, verify download checksums and HMACs, and learn why MD5 is not safe for passwords.",
  "keywords": ["sha256 hash generator", "md5 hash online", "file checksum", "verify sha256 checksum", "hmac generator"],
  "summary": "A hash generator turns text or a file into a fixed-length fingerprint, such as a 64-character SHA-256 value, that changes completely if even one byte changes. Use it to verify downloads or compare files. BISCS India's Hash Generator computes MD5, SHA-1, SHA-256, SHA-384 and SHA-512, plus HMACs, on your device without uploading anything.",
  "faq": [
    { "q": "Can a hash be reversed to get the original text?", "a": "No. Cryptographic hash functions are one-way by design. However, short or common inputs such as simple passwords can be found by looking them up in huge precomputed tables or by guessing quickly, especially with fast hashes like MD5 and SHA-1. That is why fast hashes must never be used to store passwords." },
    { "q": "Is MD5 still safe to use?", "a": "MD5 is broken for security purposes: researchers can deliberately create two different files with the same MD5 hash. It is still acceptable for spotting accidental corruption, such as checking a file copied correctly. For anything security-related, including verifying software downloads from untrusted mirrors, use SHA-256 or stronger." },
    { "q": "How should passwords be stored if not with SHA-256?", "a": "Use a slow, salted password hashing algorithm designed for the job, such as Argon2id, bcrypt or scrypt. These are intentionally expensive to compute, which makes large-scale guessing impractical. A plain SHA-256 of a password, even with a salt, can be tested billions of times per second on modern hardware." },
    { "q": "Why do I get a different hash for the same text in another tool?", "a": "Usually the inputs differ invisibly: a trailing newline, a space, Windows CRLF line endings instead of LF, or a different character encoding. This tool hashes the exact UTF-8 bytes of what is in the box. Also check whether the other tool shows uppercase hex, which is the same value written differently." },
    { "q": "What is an HMAC and when do I need one?", "a": "An HMAC is a hash combined with a secret key. Only someone who knows the key can produce the same value, so it proves a message was not tampered with and came from a key holder. Payment gateways and webhooks commonly sign requests with HMAC-SHA256, which you can test here." }
  ]
}
---
A hash function turns any input, whether a word, a document or a 4 GB video, into a short fixed-length string called a hash, digest or checksum. The same input always gives the same hash. Change a single character and the hash changes completely.

That makes hashes ideal for one job above all: checking that two things are identical without comparing them byte by byte. The [Hash Generator](/tools/hash-generator/) on BISCS India calculates MD5, SHA-1, SHA-256, SHA-384 and SHA-512 for text or files, all at once, on your own device.

## What does a hash look like?

Here is the SHA-256 hash of the word `hello`, and of `Hello` with a capital H:

```text
hello  -> 2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824
Hello  -> 185f8db32271fe25f561a6fc938b2e264306ec304eda518007d1764826381969
```

One letter changed, and there is no visible relationship between the two outputs. This "avalanche effect" is exactly what you want from a fingerprint.

Different algorithms produce different lengths:

| Algorithm | Output (hex characters) | Status for security |
| --- | --- | --- |
| MD5 | 32 | Broken; fine only for accidental-corruption checks |
| SHA-1 | 40 | Broken for collisions; avoid for new work |
| SHA-256 | 64 | Secure; the common default |
| SHA-384 | 96 | Secure |
| SHA-512 | 128 | Secure; can be faster on 64-bit machines |

## What are hashes used for?

- **Verifying downloads.** Software publishers list a SHA-256 checksum next to the download. If your file’s hash matches, it arrived intact and unmodified.
- **Detecting duplicate files.** Two photos or PDFs with the same SHA-256 are, for practical purposes, the same file, even if their names differ.
- **Checking a backup or copy.** Hash a large file before and after copying it to a pen drive or cloud folder to be sure nothing was corrupted.
- **Webhook and API signatures.** Payment gateways and many SaaS platforms sign webhook payloads with HMAC-SHA256 so your server can prove the request is genuine.
- **Cache keys and content addressing.** Build tools often name files after the hash of their contents, so a changed file gets a new name automatically.

## How to generate a hash with BISCS India

1. Open the [Hash Generator](/tools/hash-generator/).
2. Choose **Text** or **File** as the input source.
3. For text, type or paste into the box. For a file, choose it or drag it in. Files up to 1 GB can be hashed, and they are read on your device, not uploaded.
4. All five hashes, MD5, SHA-1, SHA-256, SHA-384 and SHA-512, appear together. Tick **Uppercase** if the value you are comparing against uses capital letters.
5. To verify a download, paste the publisher’s checksum into **Compare with a hash**. The matching row is highlighted, so you do not need to compare 64 characters by eye.
6. To create an HMAC instead of a plain hash, enter a value in **HMAC secret key**.
7. Copy whichever value you need.

The SHA family uses your browser’s built-in Web Crypto API, which is only available on secure (HTTPS) pages. MD5 is not part of Web Crypto, so the tool includes its own implementation.

## Why MD5 and SHA-1 are not for security

This is the point most often misunderstood. MD5 and SHA-1 still work as checksums: random corruption on a disk or network will not accidentally produce a matching hash. But both are **cryptographically broken**. Researchers can deliberately construct two different files that share an MD5 hash, and practical SHA-1 collisions have been demonstrated publicly.

That means:

- Do not rely on MD5 or SHA-1 to prove that a file has not been tampered with by someone malicious.
- Do not use them for digital signatures or certificates.
- **Never** use them, or even plain SHA-256, to store passwords.

## Hashing is not how you store passwords

A fast hash is the wrong tool for passwords precisely because it is fast. A modern graphics card can test billions of MD5 or SHA-256 guesses per second, and lists of leaked passwords make common choices trivial to find. An unsalted MD5 of a weak password can often be looked up in seconds.

Password storage needs algorithms built to be slow and salted: **Argon2id**, **bcrypt** or **scrypt**. Use the implementation your framework provides. If you are generating passwords for users, the [Password Generator](/tools/password-generator/) creates strong random ones, and the [Password Strength Checker](/tools/password-strength-checker/) estimates how hard a password is to guess.

## Verifying a checksum: a worked example

Say you downloaded an installer, and the publisher’s site lists:

```text
SHA256: 9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08
```

Choose the file in the tool, paste that value into **Compare with a hash**, and look for the highlighted match. If no row matches, do not run the file. Download it again from the official source, and if it still does not match, report it.

On the command line, the equivalent checks are:

```text
certutil -hashfile installer.exe SHA256      (Windows)
shasum -a 256 installer.dmg                  (macOS)
sha256sum installer.deb                      (Linux)
```

## Testing a webhook HMAC

Many payment and messaging providers sign each webhook with HMAC-SHA256 using a secret from your dashboard. When your signature check fails, it helps to calculate the expected value by hand. Paste the exact raw request body into the text box, enter the secret in **HMAC secret key**, and compare the HMAC-SHA256 output with the signature header.

Mismatches are almost always caused by hashing a re-formatted body instead of the raw bytes, extra whitespace or newlines, or comparing hex against Base64. Check your provider’s documentation for which encoding they use.

## Common mistakes

- **Invisible whitespace.** A trailing newline changes the hash entirely. Text copied from a terminal or editor often has one.
- **Line endings.** Windows files use CRLF, Linux and macOS use LF. The same-looking text gives different hashes.
- **Case confusion.** `ABC123…` and `abc123…` are the same hex value. Use the **Uppercase** toggle to match.
- **Comparing different algorithms.** A 64-character value is SHA-256; a 32-character one is MD5. They will never match each other.

## Privacy

Text and files are hashed locally in your browser. Even a 1 GB file never leaves your computer, which is important when you are checking confidential documents, database exports or private keys. If you also need to encode data for transport rather than fingerprint it, see [Base64 Encode / Decode](/tools/base64-encoder/).
