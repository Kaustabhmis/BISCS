{
  "tool": "password-generator",
  "slug": "generate-strong-random-password",
  "title": "How to Generate a Strong Random Password (and Remember It)",
  "description": "Create strong, random passwords and passphrases on your own device. Learn what makes a password strong, how long it should be, and how to store it safely.",
  "keywords": ["password generator", "strong password generator", "random password generator", "passphrase generator", "secure password ideas"],
  "summary": "A strong password is long, random and unique to each account. Aim for at least 12 to 16 characters mixing letters, numbers and symbols, or a passphrase of several random words. BISCS India’s free Password Generator creates them on your device using the browser’s cryptographic random generator, so the passwords are never sent anywhere.",
  "faq": [
    { "q": "How long should my password be?", "a": "For most accounts, 12 characters is a sensible minimum and 16 or more is better, especially for email, banking and password manager accounts. Length adds more strength than extra symbols. If a site limits length, use the maximum it allows and turn on two-factor authentication." },
    { "q": "Is it safe to generate passwords online?", "a": "It is safe when the password is created on your own device and never transmitted. The BISCS Password Generator uses your browser’s crypto.getRandomValues function and does not send or store generated passwords. Only your option choices, such as length, are remembered in your browser for convenience." },
    { "q": "Are passphrases better than random passwords?", "a": "Passphrases made of several truly random words are easier to remember and type, especially on phones, and can be very strong if they have enough words. Because each word comes from a limited list, you need more words for the same strength: seven or more words is a good target for important accounts." },
    { "q": "Should I use the generator for my UPI PIN or ATM PIN?", "a": "No. UPI and ATM PINs are short numeric codes that you set inside your bank’s app or at the ATM, and they must never be shared or typed into other websites. Choose a PIN that avoids birthdays and simple sequences like 1234 or 0000, and keep it to yourself." },
    { "q": "How should I store all these random passwords?", "a": "Use a reputable password manager, which stores passwords in an encrypted vault protected by one strong master password. Avoid saving them in plain notes, screenshots or WhatsApp chats. For the master password itself, a long random passphrase you can remember works well." }
  ]
}
---
A strong password is **long, random and unique**. For most accounts, that means at least 12 to 16 characters mixing upper and lower case letters, numbers and symbols, or a passphrase of several random words. Most important of all, every account should have its own password.

People are poor at being random, so the best passwords are made by a computer. The free [Password Generator](/tools/password-generator/) creates them on your own device using your browser's cryptographic random number generator. Nothing is sent to a server, and the generated passwords are not saved.

## What makes a password strong?

Attackers rarely guess passwords one by one at a login screen. More often, they take password lists leaked from breached websites and try them elsewhere, or run fast guessing programs against stolen password databases. A strong password resists both.

- **Length.** Each extra character multiplies the number of possible passwords.
- **Randomness.** Names, dates of birth, cricket teams and keyboard patterns like `qwerty` are tried first.
- **Character variety.** Mixing cases, digits and symbols enlarges the pool for each character.
- **Uniqueness.** If one site is breached, a reused password unlocks your other accounts too.

Strength is often measured in **bits of entropy**. Each extra bit doubles the number of guesses needed. The generator shows this number and an estimated crack time for every password it makes.

## How strong is each option?

These figures come from the generator's own estimates, which assume an attacker can try 10 billion guesses a second. Real attack speeds vary widely, so treat them as a comparison rather than a promise.

| Password type | Approx. entropy | Rough time to crack |
|---|---|---|
| 8 characters, letters and digits | 48 bits | A few hours |
| 12 characters, letters and digits | 71 bits | Thousands of years |
| 16 characters, all four types | 104 bits | Far longer than the age of the universe |
| 5-word passphrase plus a number | 55 bits | Weeks |
| 7-word passphrase plus a number | 74 bits | Tens of thousands of years |

Two lessons stand out: eight characters is no longer enough, and passphrases need plenty of words.

## How to use the BISCS Password Generator

1. Open the [Password Generator](/tools/password-generator/). A 16-character password appears straight away by default.
2. Choose **Password** or **Passphrase** mode.
3. For a password, set the **length** (4 to 128) and tick the character types: uppercase, lowercase, numbers and symbols.
4. Tick **Exclude look-alikes** if you will read or type the password manually. It removes characters like I, l, 1, O and 0.
5. For a passphrase, choose the **number of words** (3 to 12), a separator, and whether to capitalise words and add a number.
6. Pick **how many** to generate: 1, 5, 10 or 25.
7. Press **Copy**, or use the refresh button for a new one. With several results, you can copy them all or download a .txt file.

The generator always includes at least one character from each type you select, then shuffles the result so their positions are random. Digits and symbols are colour-coded in the preview to make reading easier.

## Passwords or passphrases: which should you use?

**Random passwords** are best stored in a password manager and pasted, never typed. Use them for most website logins.

**Passphrases**, such as `Bold-River-Cake-Mint-Sail47`, are easier to remember and type on a phone keyboard. They are ideal for the few passwords you must type from memory: your computer login, your password manager's master password, or your Wi-Fi.

Because the words come from a fixed list of a few hundred common words, each word adds less strength than you might think. For anything important, use **seven or more words**.

## Common password mistakes

- **Reusing one password** across email, shopping and social media.
- **Adding a year or "@123"** to a familiar word. Attackers try these patterns first.
- **Swapping letters for symbols,** like `P@ssw0rd`. Guessing tools already account for these swaps.
- **Using personal details** such as your name, PAN, phone number, vehicle number or date of birth.
- **Saving passwords in screenshots or chat messages,** where anyone with your phone can see them.
- **Sharing OTPs or passwords** with callers claiming to be from a bank or courier. Genuine banks do not ask for them.

## A simple checklist for better account security

- Use a unique, generated password for every account.
- Store them in a reputable password manager.
- Turn on two-factor authentication for email, banking and social media.
- Change a password immediately if a service reports a breach.
- Protect your email account most of all, since it can reset everything else.
- Keep your phone's screen lock strong, because OTPs arrive there.

## When should you change a password?

Changing strong, unique passwords on a fixed schedule is no longer considered necessary by many security experts, and it often leads people to make small, predictable changes like adding 1 to the end. Instead, change a password straight away when:

- a service tells you it has suffered a data breach;
- you notice logins or activity you do not recognise;
- you shared the password with someone who no longer needs access, such as a former employee or flatmate;
- you typed it on a public or shared computer;
- you discover you have reused it on another site.

Your employer or bank may still require periodic changes. When they do, generate a completely fresh password rather than tweaking the old one.

## Practical tips for awkward websites

Some sites limit length or reject certain symbols. If a password is refused, lower the length to the site's maximum or untick symbols and add a few characters instead. When you need several passwords at once, for example while setting up accounts for a new team, generate 10 or 25 and download them, then delete the file once they are stored safely.

To test a password you already use, try the [Password Strength Checker](/tools/password-strength-checker/), which also runs entirely in your browser. To share your Wi-Fi password without reading it aloud, create a Wi-Fi QR code with the [QR Code Generator](/tools/qr-code-generator/). Developers who need random identifiers rather than passwords can use the [UUID Generator](/tools/uuid-generator/).

Good security starts with one habit: never inventing passwords yourself. Let the [Password Generator](/tools/password-generator/) do it, and keep each one unique.
