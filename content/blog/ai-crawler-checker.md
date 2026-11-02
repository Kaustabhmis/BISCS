{
  "tool": "ai-crawler-checker",
  "slug": "check-block-ai-crawlers-robots-txt",
  "title": "AI Crawler Checker: Is GPTBot or ClaudeBot Blocked on Your Site?",
  "description": "Paste your robots.txt to see which AI bots can crawl your site, including GPTBot, ClaudeBot, PerplexityBot and Google-Extended, and generate correct rules.",
  "keywords": ["ai crawler checker", "block gptbot robots.txt", "claudebot robots.txt", "google-extended", "perplexitybot block"],
  "summary": "To check whether AI crawlers can access your site, test your robots.txt rules against each AI bot’s user-agent token. BISCS India’s free AI Crawler Access Checker parses a pasted robots.txt using the official rules, shows which of about twenty AI and search bots are allowed or blocked for any path, explains why, and generates new rules.",
  "faq": [
    { "q": "Does blocking Google-Extended remove my site from Google Search or AI Overviews?", "a": "No. Google-Extended is a control token, not a separate crawler. It tells Google whether content it crawls may be used for Gemini model training and grounding. Google says it does not affect Search ranking or inclusion. Blocking Googlebot, on the other hand, removes you from Google Search entirely." },
    { "q": "If I block GPTBot, will my site disappear from ChatGPT?", "a": "Not necessarily. OpenAI documents GPTBot as its training crawler and OAI-SearchBot as the crawler used for ChatGPT search results. They are controlled separately, so you can block training while still allowing search. Check OpenAI’s current documentation, as details can change." },
    { "q": "Do AI crawlers have to obey robots.txt?", "a": "robots.txt is a voluntary standard. Reputable operators say their automatic crawlers follow it, but some user-initiated fetchers are treated differently, and some bots have been reported to ignore it. To enforce a block, use your server, hosting firewall or CDN rules." },
    { "q": "Why does a bot with its own group ignore my main Disallow rules?", "a": "Under the robots.txt standard, a crawler follows only the most specific group that names it. If you create a group for PerplexityBot, it ignores the general group for all user agents completely, so repeat important Disallow lines, such as admin or cart paths, in that group too." },
    { "q": "Does the checker fetch my live robots.txt?", "a": "No. You paste the file’s contents and everything is analysed in your browser. Open https://yourdomain.com/robots.txt, select all, copy and paste it in. This also lets you test a draft before you upload it." }
  ]
}
---
An AI crawler checker tells you which AI bots your robots.txt allows and which it blocks. Many sites added AI blocking rules in a hurry, often copied from a blog post, and are not sure what those rules actually do today. Some have accidentally blocked AI search features they wanted; others think they have opted out of training when they have not.

The [AI Crawler Access Checker](/tools/ai-crawler-checker/) from BISCS India answers the question precisely. Paste your robots.txt, choose a path to test, and it shows the result for around twenty AI and search bots, along with the exact rule and line that decided each one.

## Not all AI bots do the same job

The most useful thing to understand is that AI companies run several different bots, and blocking one does not block the others. The checker labels each bot by purpose:

| Purpose | What it means | Examples |
|---|---|---|
| AI training | Collects content that may be used to train models | GPTBot, ClaudeBot, CCBot, Meta-ExternalAgent |
| AI search / answers | Indexes pages so they can be shown or cited in AI answers | OAI-SearchBot, PerplexityBot, Claude-SearchBot |
| User-initiated fetch | Visits a page because a user asked the assistant to | ChatGPT-User, Claude-User, Perplexity-User |
| Control token | Not a crawler, but a robots.txt token that controls AI use of content crawled by another bot | Google-Extended, Applebot-Extended |
| Search engine | Main search crawlers that also feed AI features | Googlebot, Bingbot, Applebot |

These descriptions summarise each company's public documentation at the time of writing. Operators add, rename and redefine bots, so check their official pages before making a decision that matters.

## Google-Extended: the most misunderstood token

Many site owners block Google-Extended believing it keeps them out of AI Overviews. It does not. Google describes Google-Extended as a control that decides whether content crawled by Google may be used for Gemini model training and grounding. It does not affect ranking or inclusion in Google Search, and AI Overviews are part of Search.

The opposite mistake is worse: blocking Googlebot to avoid AI Overviews removes the site from Google Search entirely. The checker shows a clear error if Googlebot is blocked for the path you test.

## How to check your robots.txt for AI bots

1. Open `https://yourdomain.com/robots.txt` in a browser, select all and copy.
2. Open the [AI Crawler Access Checker](/tools/ai-crawler-checker/) and paste the contents into the box. Press **Sample** if you want to try an example first.
3. Enter a **Path or URL to test**, such as `/` for the home page or `/blog/my-post/`.
4. Optionally add **another user-agent** to test a bot that is not on the list.
5. Read the summary: blocked bots, training bots blocked, and search and answer bots allowed.
6. Check the table. For each bot you see Allowed or Blocked, plus **why**: whether it matched its own group or fell back to the `*` group, and which rule on which line decided it.
7. Review any warnings, such as typos like "Dissallow", rules placed before any User-agent line, or the unsupported Noindex directive.

The file is parsed in your browser using the robots.txt standard (RFC 9309): user-agent matching is case-insensitive, the longest matching rule wins, Allow wins a tie, and `*` and `$` wildcards are supported. Nothing is fetched from your site.

## Generating new AI bot rules

Below the results, the **Generate AI bot rules** panel lets you set Allow, Block or No rule for each bot, or apply a preset:

- **Block training, allow search** blocks training crawlers and control tokens while allowing AI search and user-initiated bots.
- **Block all AI** blocks every AI bot but leaves the main search engines alone.
- **Allow all AI** explicitly allows them.

You can block a single folder instead of the whole site (for example `/premium/`), copy your existing `User-agent: *` Disallow lines into the new groups, and then press **Add to robots.txt above & re-test** to check the combined file before uploading it. Once you are happy, the [Robots.txt Generator](/tools/robots-txt-generator/) can help you assemble a tidy final file.

## Which policy is right for you?

There is no single correct answer. It depends on what you publish and what you want from AI tools.

- **You want to be cited in AI answers** (most businesses, service providers, publishers of guides): allow AI search and answer bots. Blocking them makes it harder for assistants like ChatGPT search or Perplexity to find and link to you.
- **You do not want your content used for training** (original research, paid content, creative work): block the training crawlers and control tokens, and keep search bots allowed.
- **You run a members-only or paywalled section**: block that path for AI bots, but remember robots.txt is not access control. Real protection needs a login.

If you decide to welcome AI tools, you might also offer them a curated map of your content with the [llms.txt Generator](/tools/llms-txt-generator/), keeping in mind that llms.txt is only an emerging proposal.

## Common mistakes in AI blocking rules

- **Blocking Googlebot or Bingbot by accident.** This removes you from search, and Bing's index also feeds Microsoft Copilot and other services.
- **Relying on outdated tokens.** `anthropic-ai` appears in many copied block lists, but Anthropic's current documentation lists ClaudeBot, Claude-User and Claude-SearchBot.
- **Forgetting that groups do not combine with `*`.** A bot with its own group ignores your general rules, so admin and cart paths may suddenly become crawlable.
- **Duplicate groups for the same bot.** Crawlers merge them, which can produce surprising results. The checker warns you.
- **Assuming robots.txt is enforced.** Some bots have been reported to ignore it. For a hard block, use your hosting firewall or CDN.

## Keep reviewing

AI crawling is changing quickly. Revisit your rules every few months, and whenever an AI company announces a new crawler. Paste your file into the [AI Crawler Access Checker](/tools/ai-crawler-checker/) after every change, and use the [On-Page SEO Checker](/tools/on-page-seo-checker/) to make sure key pages are not also carrying an accidental noindex tag.
