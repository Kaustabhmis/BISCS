{
  "tool": "time-zone-converter",
  "slug": "convert-ist-to-world-time-zones",
  "title": "How to Convert IST to US, UK and Other Time Zones Correctly",
  "description": "Convert India Standard Time to New York, London, Dubai, Sydney and more. Understand UTC offsets, daylight saving changes and how to schedule calls across zones.",
  "keywords": ["ist to est", "time zone converter", "ist to uk time", "india time to usa time", "convert ist to pst"],
  "summary": "India Standard Time is UTC+5:30 all year, with no daylight saving. To convert, find the other city’s current UTC offset and take the difference: 9:00 pm IST is 3:30 pm in London and 10:30 am in New York in November. BISCS India’s free Time Zone Converter shows many world cities at once, adjusting for daylight saving automatically.",
  "faq": [
    { "q": "What is the time difference between India and the USA?", "a": "It depends on the US time zone and the season, because most of the US uses daylight saving and India does not. New York is 10 hours 30 minutes behind IST in winter and 9 hours 30 minutes behind in summer. Los Angeles is 13 hours 30 minutes behind in winter and 12 hours 30 minutes in summer." },
    { "q": "Does India have daylight saving time?", "a": "No. India uses India Standard Time, UTC+5:30, throughout the year and across the whole country. When other countries move their clocks forward or back, the gap between India and those places changes by an hour, even though Indian clocks stay the same." },
    { "q": "Why is IST offset by 30 minutes?", "a": "India Standard Time is based on the 82.5° E meridian, which runs close to the middle of the country. That longitude corresponds to 5 hours 30 minutes ahead of UTC. Nepal goes further with a 45-minute offset, UTC+5:45, so it is 15 minutes ahead of India." },
    { "q": "What happens if I enter a time that does not exist because of daylight saving?", "a": "When clocks jump forward, an hour is skipped in that zone, for example 2:30 am on the changeover day in New York. The converter detects this, warns you that the local time does not exist, and shows the nearest valid time instead." },
    { "q": "Can I add cities that are not in the default list?", "a": "Yes. Type a city or time zone name such as Europe/Madrid or Auckland in the add box. The converter recognises standard time zone names supported by your browser. Added cities are remembered on your device for your next visit and can be removed at any time." }
  ]
}
---
India Standard Time (IST) is **UTC+5:30** throughout the year. India does not use daylight saving, so to convert IST to another place you only need that place's current offset from UTC. On a November weekday, **9:00 pm IST is 3:30 pm in London, 7:30 pm in Dubai and 10:30 am in New York**.

The catch is that many countries change their clocks twice a year, so the gap with India shifts. The free [Time Zone Converter](/tools/time-zone-converter/) handles this automatically and shows the time in many cities side by side.

## Why time zone conversion trips people up

- **Daylight saving time (DST).** The US, Canada, UK, most of Europe and parts of Australia move their clocks forward in their summer and back in winter. India does not, so the difference changes by an hour.
- **Different change dates.** The US and Europe switch on different weekends, so for a few weeks a year the usual gaps are off by an hour.
- **Half-hour and quarter-hour offsets.** IST is +5:30 and Nepal is +5:45, which makes mental arithmetic harder.
- **Crossing midnight.** A Monday evening call from India may be Monday morning in the US but already Tuesday in Sydney.

## UTC, GMT and IST: what the labels mean

**UTC** (Coordinated Universal Time) is the world's reference clock. Every time zone is described as an offset from it, such as UTC+5:30 for India or UTC−5 for New York in winter. It never changes for daylight saving.

**GMT** (Greenwich Mean Time) is often used interchangeably with UTC in everyday speech. The UK uses GMT in winter and British Summer Time (BST, UTC+1) in summer, so "London time" and "GMT" are only the same for part of the year.

**IST** is India Standard Time, UTC+5:30, based on a meridian near the centre of the country. All of India, from Gujarat to Arunachal Pradesh, uses this single zone, even though the sun rises much earlier in the north-east than in the west.

Abbreviations can be ambiguous. "IST" is also used for Irish Standard Time and Israel Standard Time, and "CST" can mean China or US Central time. The converter uses full zone names such as *Asia/Kolkata* and *America/Chicago* to avoid this confusion, and you should too in formal communication.

## How to use the BISCS Time Zone Converter

1. Open the [Time Zone Converter](/tools/time-zone-converter/).
2. Pick the **date** and **time** you want to convert. Press **Now** to use the current time.
3. Choose the **From time zone**. India (IST) is selected by default; popular cities are listed first, and every standard zone is available below them.
4. Read the main result, which shows the time in the source zone and in UTC.
5. Scan the city cards. Each one shows the local time in 24-hour and 12-hour formats, the date, the UTC offset and the difference from your source time.
6. To add a city, type its name or zone (for example *Europe/Madrid*) and press **Add**. It is remembered on your device.

Cards show a sun or moon icon for day or night, a **Work hours** badge if it is between 9 am and 6 pm on a weekday there, and a **+1 day** or **−1 day** badge when the date is different. Conversions use your browser's built-in time zone data, so nothing is sent to a server.

## IST to popular cities: example conversions

The table below is for **Wednesday, 4 November 2026, 9:00 pm IST**, after the US and Europe have moved to winter time.

| City | Local time | Difference from IST |
|---|---|---|
| London | 3:30 pm, Wed | −5h 30m |
| Dubai | 7:30 pm, Wed | −1h 30m |
| Singapore | 11:30 pm, Wed | +2h 30m |
| Sydney | 2:30 am, Thu | +5h 30m |
| New York | 10:30 am, Wed | −10h 30m |
| Los Angeles | 7:30 am, Wed | −13h 30m |

In July, during northern summer, the same 9:00 pm IST is **4:30 pm in London and 11:30 am in New York**, an hour closer to India. Sydney, which has daylight saving in its own summer from October to April, moves the other way.

## Worked examples

### A call with a US client

Your client in Los Angeles proposes **10:00 am Monday, 2 November 2026**. Los Angeles is on winter time (UTC−8), so that is 6:00 pm UTC, or **11:30 pm Monday IST**. If that is too late, suggest 8:00 am their time, which is 9:30 pm IST.

### A morning meeting in Sydney

A Sydney team wants to meet at **9:00 am Tuesday, 10 November 2026**. Sydney is on summer time (UTC+11), so it is **3:30 am Tuesday IST**. An afternoon slot in Sydney works much better for India.

### Family in Dubai

Dubai is UTC+4 all year, so it is always **1 hour 30 minutes behind IST**. A 7:00 pm call in Dubai is 8:30 pm in India.

## Common mistakes when converting time zones

- **Assuming the gap never changes.** It changes for most countries that use daylight saving.
- **Using EST in summer.** New York is on EDT (UTC−4) for most of the year and EST (UTC−5) in winter. Saying "EST" in July is technically wrong and may confuse people.
- **Forgetting the date.** A US Friday evening can already be Saturday morning in India.
- **Ignoring the 30 minutes.** Many quick conversions round IST to +5 or +6 and end up half an hour out.
- **Copying a calendar invite without a time zone.** Always include the zone in invites and emails.

## Tips for scheduling across time zones

- Write meeting times with both zones, such as "6:00 pm IST / 12:30 pm GMT".
- Check the converter in the weeks around March, April, October and November, when clocks change.
- Look for the **Work hours** badge on every participant's card before proposing a slot.
- For recurring meetings, recheck after each daylight saving change.
- Use UTC as a shared reference for global teams.

If you need to know how many days remain until an international deadline, the [Date Difference calculator](/tools/date-difference-calculator/) counts them for you. To set a reminder relative to a date, use [Add or Subtract Days](/tools/date-add-calculator/). And developers converting Unix timestamps can use the [Timestamp Converter](/tools/timestamp-converter/).

A missed call because of a wrong time zone is easily avoided. Check the [Time Zone Converter](/tools/time-zone-converter/) before you send that invite.
