# RCAC Maintenance Page — User Guide

This guide is for anyone who needs to update the maintenance page before, during, or after a planned outage. No coding knowledge is required.

---

## What this page does

When RCAC systems are taken offline for maintenance, this page is displayed to visitors in place of the normal site. It shows:

- A live countdown to when maintenance begins (or ends, if already in progress)
- The start and end times of the maintenance window
- A brief message about the outage
- The full text of the news/announcement sent to users
- Contact information and social media links
- A dark mode toggle (top-right corner)

The countdown updates automatically every second and switches between three states on its own — you do not need to do anything to trigger those changes.

---

## The only file you need to edit

**`config.js`** — this is the single file that controls all the text, dates, and links on the page. Everything else (the HTML structure, the styling, the countdown logic) is handled automatically.

You can edit `config.js` directly on GitHub by navigating to the file and clicking the pencil (edit) icon.

> **Important:** When editing, be careful not to accidentally delete quotation marks, commas, or curly braces surrounding the values. Only change the text *between* the quotation marks (or backticks for the news body). The field names (left side of each colon) must never be changed.

---

## Field-by-field reference

### Page title

```js
pageTitle: "RCAC — Scheduled Maintenance",
```

This is the text that appears on the browser tab. Visitors rarely see it, but it is good practice to keep it accurate.

---

### Main heading

```js
heading: "Scheduled Maintenance",
```

The large heading shown inside the dark status banner at the top of the page. Keep it short — one to four words.

---

### Short message

```js
message: "We are currently performing scheduled maintenance on RCAC systems. We apologize for any inconvenience.",
```

A brief sentence or two shown below the countdown in the banner. This is different from the full news announcement — keep it short and plain.

---

### Downtime start and end

```js
downtimeStart: "April 19, 2026 6:00 AM",
downtimeEnd:   "April 19, 2026 2:00 PM",
```

Use this exact format: `Month Day, Year H:MM AM/PM` — written out month name, no leading zero needed on the day or hour.

**Examples of valid dates:**

- `"April 19, 2026 6:00 AM"` ✓
- `"November 3, 2026 11:30 PM"` ✓
- `"March 1, 2026 12:00 PM"` ✓

**Examples that will NOT work:**

- `"04/19/2026 6:00 AM"` ✗ (do not use slashes)
- `"2026-04-19T06:00:00"` ✗ (do not use ISO format)
- `"Apr 19 2026"` ✗ (write out the full month name)

---

### Timezone offset

```js
downtimeTimezoneOffset: "-0400",
```

This ensures the countdown is accurate regardless of where in the world a visitor opens the page.

| Time of year | Timezone | Value to use |
[|-------------|----------|--------------|]
| March – November (DST active) | Eastern Daylight Time (EDT) | `"-0400"` |
| November – March (standard time) | Eastern Standard Time (EST) | `"-0500"` |

Do not add a space or change the quote style. This value must always be exactly four digits with a leading minus sign.

---

### News announcement title

```js
newsTitle: "Maintenance Announcement",
```

The heading shown above the full news announcement card. Change this to match the subject line or title of the announcement that went out.

---

### News announcement body

```js
newsBody: `<p>Paste the full text of your news announcement here.</p>`,
```

This field uses backtick characters (`` ` ``) instead of regular quotes — that is intentional and must not be changed. Paste the full announcement text between the backticks.

This field supports basic formatting:

| To add... | Use this HTML tag |
[|----------|-------------------|]
| A new paragraph | `<p>Your text here.</p>` |
| **Bold text** | `<strong>bold text</strong>` |
| A bullet list | `<ul><li>Item one</li><li>Item two</li></ul>` |
| A numbered list | `<ol><li>First</li><li>Second</li></ol>` |
| A clickable link | `<a href="https://example.com">link text</a>` |

**Example:**

```js
newsBody: `<p>RCAC systems will be offline on Saturday, April 19 from 6 AM to 2 PM EDT for scheduled maintenance.</p>
<p>The following systems will be affected:</p>
<ul>
  <li>Gilbreth cluster</li>
  <li>Negishi cluster</li>
  <li>Research Data Depot</li>
</ul>
<p>For questions, contact <a href="mailto:rcac-help@purdue.edu">rcac-help@purdue.edu</a>.</p>`,
```

If you are pasting plain text and do not want to add any HTML, simply wrap the whole text in `<p>` tags:

```js
newsBody: `<p>Your plain text announcement goes here.</p>`,
```

---

### Contact email

```js
contactEmail: "rcac-help@purdue.edu",
```

Shown in the Contact Us card as a clickable email link. Leave empty (`""`) to hide this line entirely.

---

### Contact phone

```js
contactPhone: "(765) 494-9000",
```

Shown in the Contact Us card as a clickable phone link. Leave empty (`""`) to hide this line.

---

### Status page link

```js
statusUrl: "",
```

If RCAC has a live status page during the outage, paste the full URL here and it will appear as a clickable link. Leave empty (`""`) — as it is by default — to hide it.

```js
statusUrl: "https://status.rcac.purdue.edu",
```

---

### Social media links

```js
social: {
  twitter:   "https://twitter.com/purduercac",
  instagram: "https://instagram.com/purduercac",
  facebook:  "",
  linkedin:  "https://www.linkedin.com/company/purdue-rosen-center-for-advanced-computing-rcac",
  youtube:   "https://www.youtube.com/user/purduercac",
},
```

Each social media platform appears as an icon button in the Contact Us card. Provide the full URL to show a link, or leave the value as `""` to hide that platform's icon. The comma after each line must remain.

---

### Footer text

```js
footerText: "Purdue University is an equal access/equal opportunity university.",
```

The line shown in the footer above the copyright notice. The copyright year updates automatically — you never need to change it.

---

## How the countdown works

The countdown is fully automatic. Once the page is open, it reads the `downtimeStart` and `downtimeEnd` values and displays one of three messages:

| When the page is opened | What visitors see |
[|------------------------|-------------------|]
| Before the start time | "Maintenance begins in X hours Y minutes Z seconds" |
| Between start and end time | "Maintenance in progress — expected to end in X hours Y minutes Z seconds" |
| After the end time | "Maintenance has completed — services should be restored" |

When the "completed" state is reached, the countdown stops updating on its own. **You do not need to update any field to trigger this change.**

---

## Deployment (technical staff only)

The maintenance page is served from `/data/nginx/html/` on the production server. A deploy script and cron job handle syncing changes from the repository automatically.

### Connecting to the server

SSH into the server using your Purdue username:

```bash
ssh <username>@web-outage.rcac.purdue.edu
```

### One-time setup

Run this once on the server to install the deploy script at `/usr/local/bin/rcacoutage-deploy` and register the cron job:

```bash
sudo /data/nginx/html/setup_rcacoutage_deploy.sh
```

### Manual deploy

To push changes immediately without waiting for the cron job:

```bash
sudo /usr/local/bin/rcacoutage-deploy
```

### Verify the cron job

The cron job runs every minute. To confirm it is installed:

```bash
sudo cat /etc/cron.d/rcacoutage-deploy
```

### Watch deploy logs

```bash
sudo tail -f /var/log/rcacoutage-deploy.log
```

---

## Taking the page down after maintenance

When maintenance is complete, the RCAC team's normal process for switching traffic back to the main site should be followed. Simply updating `config.js` does not take the page offline — that requires a separate hosting step handled by technical staff.

---

## Quick checklist before going live

Before activating the maintenance page, verify these fields in `config.js`:

- [ ] `downtimeStart` is set to the correct date and time
- [ ] `downtimeEnd` is set to the correct date and time
- [ ] `downtimeTimezoneOffset` matches the current season (`-0400` for EDT, `-0500` for EST)
- [ ] `heading` and `message` are updated
- [ ] `newsBody` contains the full announcement text
- [ ] `newsTitle` matches the announcement subject
- [ ] `statusUrl` is either filled in or left as `""`

---

## Common mistakes

**The countdown shows the wrong time**
Check that `downtimeTimezoneOffset` is correct for the current season. Using `-0500` during daylight saving time (or vice versa) will shift the countdown by one hour.

**I see HTML tags like `<p>` visible on the page**
This means the backticks around `newsBody` were accidentally changed to regular quotes, or the surrounding template literal structure was broken. Restore the backtick delimiters on both ends of the value.

**A link or section is not showing**
Check that the value is not an empty string `""`. If the field has a URL or text, it will appear. If it is `""`, it is intentionally hidden.

**The page looks broken after saving**
The most common cause is a missing comma at the end of a line or a deleted quote mark. Compare the structure of your edit to the original — every value line (except the last inside `social: {}`) must end with a comma.
