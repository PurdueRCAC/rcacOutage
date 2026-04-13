# RCAC Maintenance Page — Design Spec

**Date:** 2026-04-13
**Status:** Approved

---

## Overview

A static maintenance/downtime page for the RCAC Halcyon site, hosted on a separate server during planned outages. Because it lives outside the main application, it cannot use any Laravel/Halcyon features, including the built-in maintenance mode. The page must be fully self-contained and deployable from its own GitHub repository.

---

## Goals

- Display a clear maintenance message to RCAC site visitors during planned downtime
- Show the news/announcement copy that was sent to users about the outage
- Provide downtime window, contact information, status page link, and social media links
- Match the RCAC site's look and feel (Purdue branding, fonts, dark mode)
- Allow non-technical staff to update content by editing a single `config.js` file on GitHub
- Allow technical staff to modify any part of the page freely

---

## Repository Structure

```text
rcac-maintenance/
├── index.html        ← Page structure (no hardcoded content)
├── config.js         ← All editable content — the ONLY file non-tech users touch
├── css/
│   └── style.css     ← RCAC-branded styles + dark mode CSS variables
├── js/
│   └── main.js       ← Dark mode toggle + reads config.js to populate page
└── images/
    ├── purdue-logo.svg
    └── rcac-logo.svg
```

### File responsibilities

| File | Who edits it | Purpose |
| ----------- | ----------- | ----------- |
| `config.js` | Anyone | All user-facing content: message, dates, news copy, contact info, links |
| `index.html` | Technical | Page skeleton and DOM structure |
| `css/style.css` | Technical | Visual design, RCAC branding, dark mode variables |
| `js/main.js` | Technical | Dark mode toggle logic, config injection into DOM |
| `images/` | Technical | Logo SVG files |

---

## config.js — Editable Content Schema

`config.js` exposes a single `window.MAINTENANCE_CONFIG` object. Each field is commented so non-technical editors understand what it controls. Fields that accept empty strings are hidden automatically from the rendered page.

```js
// ============================================================
// RCAC MAINTENANCE PAGE — CONFIGURATION
// Edit the values below to update the maintenance page.
// Do not change the variable names or remove the quotes.
// ============================================================

window.MAINTENANCE_CONFIG = {

  // Browser tab title
  pageTitle: "RCAC — Scheduled Maintenance",

  // Main heading displayed on the page
  heading: "Scheduled Maintenance",

  // Short message below the heading (plain text)
  message: "We are currently performing scheduled maintenance on RCAC systems. We apologize for any inconvenience.",

  // Downtime window — use plain English dates and times
  // Format: "Month Day, Year H:MM AM/PM"  (12-hour clock, no seconds needed)
  downtimeStart: "April 19, 2026 6:00 AM",
  downtimeEnd:   "April 19, 2026 2:00 PM",

  // Timezone offset from UTC — used for live countdown accuracy
  // Eastern Daylight Time (EDT, Apr–Oct): "-0400"
  // Eastern Standard Time (EST, Nov–Mar): "-0500"
  downtimeTimezoneOffset: "-0400",

  // News/announcement section
  newsTitle: "Maintenance Announcement",
  // newsBody supports basic HTML (bold, lists, links, paragraphs)
  newsBody: `<p>Paste the full text of your news announcement here.</p>`,

  // Contact information
  contactEmail: "rcac-help@purdue.edu",
  contactPhone: "(765) 494-9000",

  // Status page URL — leave empty ("") to hide the link
  statusUrl: "",

  // Social media — leave any empty ("") to hide that link
  // Replace placeholder URLs with real RCAC social media URLs
  social: {
    twitter:  "https://twitter.com/purduercac",
    instagram: "https://instagram.com/purduercac",
    facebook: "",
    linkedin: "https://www.linkedin.com/company/purdue-rosen-center-for-advanced-computing-rcac",
    youtube:  "https://www.youtube.com/user/purduercac",
  },

  // Footer copyright line
  footerText: "Purdue University is an equal access/equal opportunity university.",
};
```

---

## Page Layout

Single-column, centered layout. Responsive (mobile-friendly). All sections below are rendered from `config.js` values by `main.js` on page load.

### 1. Header

- RCAC logo (right) and Purdue logo (left)
- Dark mode toggle button (top-right corner), same `#site-mode-toggle` pattern as the main site

### 2. Status Banner

- Wrench/tools icon
- `heading` value as `<h1>`
- Live downtime display — JS recalculates every second and shows one of three states:
  - **Before window:** "Maintenance begins in X hours Y minutes Z seconds"
  - **During window:** "Maintenance in progress — expected to end in X hours Y minutes Z seconds"
  - **After window:** "Maintenance has completed — services should be restored"
- Human-readable start/end times shown as a sub-label (formatted from the ISO dates in config)
- `message` value as a paragraph below

### 3. News / Announcement Card

- Card with title (`newsTitle`) and body (`newsBody`)
- `newsBody` is injected as innerHTML so basic HTML formatting is preserved

### 4. Contact & Resources

- Email link (`contactEmail`)
- Phone link (`contactPhone`)
- Status page link (hidden when `statusUrl` is empty)
- Social media icon links (each hidden individually when empty)

### 5. Footer

- `footerText` value
- Purdue copyright year — auto-generated via JS `new Date().getFullYear()` so it never goes stale

---

## Visual Design

### Branding

- Follows RCAC2024 theme conventions
- Purdue Gold: `#cfb991`
- Purdue Black: `#1c1c1c`
- Body font: system font stack matching site (no CDN)

### Dark Mode

- Same CSS variable + `data-mode="dark"` attribute pattern used in the main site
- Variables mirror the established dark palette:
  - `--dark-bg: #1c1b21`
  - `--dark-surface: #26262d`
  - `--dark-surface-2: #2d2d32`
  - `--dark-border: rgba(225,231,255,0.12)`
  - `--dark-text-primary: #c8c8d0`
  - `--dark-text-secondary: #888892`
  - `--dark-input-bg: rgba(225,231,255,0.07)`
  - `--dark-input-border: rgba(225,231,255,0.18)`
- Toggle sets `data-mode="dark"` on both `<html>` and `<body>`
- Preference persisted in `localStorage` under key `site-mode` (matches main site)

### No External Dependencies

- No CDN references (Bootstrap, Google Fonts, etc.)
- Logos served from `images/` as SVG files
- CSS written from scratch using RCAC design tokens — no Bootstrap dependency

---

## Data Flow

```text
config.js (loaded before main.js)
    ↓
main.js reads window.MAINTENANCE_CONFIG
    ↓
main.js populates static DOM elements by ID
    ↓
main.js hides elements whose config values are empty
    ↓
main.js combines downtimeStart + downtimeTimezoneOffset into a Date object
    (e.g. new Date("April 19, 2026 6:00 AM GMT-0400"))
    ↓
setInterval (1 second) compares now() to window → updates live countdown text
    ↓
Dark mode toggle reads/writes localStorage "site-mode"
    ↓
Toggle sets data-mode="dark" on <html> and <body>
```

---

## Out of Scope

- No server-side rendering or templating
- No build step — plain HTML/CSS/JS, deployable as static files
- No automated content sync with the main Halcyon site
- No contact form
