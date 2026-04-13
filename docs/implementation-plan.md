# RCAC Maintenance Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a fully self-contained static maintenance page in a new GitHub repository (`rcac-maintenance`) that matches the RCAC site's look and feel, displays a live three-state countdown to/from the maintenance window, and lets non-technical staff update all content by editing `config.js`.

**Architecture:** Plain HTML/CSS/JS — no build step, no framework, no CDN. `config.js` defines all user-editable content as a `window.MAINTENANCE_CONFIG` object; `main.js` reads it on DOMContentLoaded to populate the page, run the live countdown timer, and wire up the dark mode toggle. CSS uses the same `[data-mode="dark"]` CSS variable pattern as the main RCAC site. An inline `<script>` in `<head>` applies the saved dark mode preference synchronously to prevent a flash of light mode on load.

**Tech Stack:** HTML5, CSS3 (custom properties), vanilla JS (ES6), no external dependencies.

> **Note:** This plan creates a **new standalone repository** — not a change to the existing Halcyon repo. All paths below are relative to the root of the new `rcac-maintenance/` repository. When copying image assets, you will need the path to your local Halcyon repo.

---

## File Map

| File | Action | Responsibility |
| ---- | ------ | -------------- |
| `config.js` | Create | All user-editable content (non-technical editor target) |
| `index.html` | Create | Page skeleton and all DOM element IDs |
| `css/style.css` | Create | Layout, RCAC branding, light + dark mode variables |
| `js/main.js` | Create | Config injection, countdown timer, dark mode toggle |
| `images/purdue-logo.svg` | Create | Purdue wordmark — copy from Halcyon repo |
| `images/rcac-logo.png` | Create | RCAC logo — copy from Halcyon repo |

---

## Task 1: Initialize repository and create config.js

**Files:**

- Create: `config.js`

- [ ] **Step 1: Initialize the repository**

```bash
mkdir rcac-maintenance
cd rcac-maintenance
git init
mkdir css js images
```

- [ ] **Step 2: Create config.js**

Create `config.js` with this exact content:

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
  social: {
    twitter:   "https://twitter.com/purduercac",
    instagram: "https://instagram.com/purduercac",
    facebook:  "",
    linkedin:  "https://www.linkedin.com/company/purdue-rosen-center-for-advanced-computing-rcac",
    youtube:   "https://www.youtube.com/user/purduercac",
  },

  // Footer copyright line
  footerText: "Purdue University is an equal access/equal opportunity university.",
};
```

- [ ] **Step 3: Commit**

```bash
git add config.js
git commit -m "feat: add config.js with maintenance page content schema"
```

---

## Task 2: Create index.html

**Files:**

- Create: `index.html`

- [ ] **Step 1: Create index.html**

Create `index.html` with this exact content:

```html
<!DOCTYPE html>
<html lang="en" dir="ltr" data-mode="light">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="robots" content="noindex, nofollow" />
  <title>RCAC — Scheduled Maintenance</title>
  <link rel="stylesheet" href="css/style.css" />
  <!-- Apply saved dark mode preference before paint to prevent flash -->
  <script>
    (function () {
      var saved = localStorage.getItem('site-mode');
      if (saved === 'dark') {
        document.documentElement.setAttribute('data-mode', 'dark');
      } else if (!saved && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.setAttribute('data-mode', 'dark');
      }
    }());
  </script>
</head>
<body data-mode="light">

  <header id="site-header">
    <div class="header-inner">
      <a href="https://www.purdue.edu" class="logo-link" aria-label="Purdue University">
        <img src="images/purdue-logo.svg" alt="Purdue University" class="logo-purdue" />
      </a>
      <div class="header-right">
        <a href="https://www.rcac.purdue.edu" class="logo-link" aria-label="RCAC">
          <img src="images/rcac-logo.png" alt="Rosen Center for Advanced Computing" class="logo-rcac" />
        </a>
        <button id="site-mode-toggle" type="button" aria-label="Toggle dark mode">
          <span class="icon-sun" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.65 0-3 1.35-3 3s1.35 3 3 3 3-1.35 3-3-1.35-3-3-3zm0-3a1 1 0 01-1-1V4a1 1 0 012 0v1a1 1 0 01-1 1zm0 14a1 1 0 01-1-1v-1a1 1 0 012 0v1a1 1 0 01-1 1zm7-8h-1a1 1 0 010-2h1a1 1 0 010 2zm-14 0H4a1 1 0 010-2h1a1 1 0 010 2zm11.07-5.07a1 1 0 010 1.41l-.71.71a1 1 0 01-1.41-1.41l.71-.71a1 1 0 011.41 0zm-9.9 9.9a1 1 0 010 1.41l-.71.71a1 1 0 01-1.41-1.41l.71-.71a1 1 0 011.41 0zm9.9 0l.71.71a1 1 0 01-1.41 1.41l-.71-.71a1 1 0 011.41-1.41zM5.63 6.34l-.71-.71a1 1 0 011.41-1.41l.71.71A1 1 0 015.63 6.34z"/></svg>
          </span>
          <span class="icon-moon" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-.99 0-.83.67-1.5 1.5-1.5H16c2.76 0 5-2.24 5-5 0-4.42-4.03-8-9-8zm-5.5 9c-.83 0-1.5-.67-1.5-1.5S5.67 9 6.5 9 8 9.67 8 10.5 7.33 12 6.5 12zm3-4C8.67 8 8 7.33 8 6.5S8.67 5 9.5 5s1.5.67 1.5 1.5S10.33 8 9.5 8zm5 0c-.83 0-1.5-.67-1.5-1.5S13.67 5 14.5 5s1.5.67 1.5 1.5S15.33 8 14.5 8zm3 4c-.83 0-1.5-.67-1.5-1.5S16.67 9 17.5 9s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/></svg>
          </span>
        </button>
      </div>
    </div>
  </header>

  <main id="main-content">

    <section id="status-banner" aria-labelledby="banner-heading">
      <div class="banner-inner">
        <div class="banner-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="48" height="48" fill="currentColor"><path d="M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z"/></svg>
        </div>
        <h1 id="banner-heading"></h1>
        <div id="countdown-display" class="countdown" aria-live="polite" aria-atomic="true"></div>
        <p class="downtime-window">
          <span id="downtime-start-label"></span>
          <span class="downtime-sep"> &mdash; </span>
          <span id="downtime-end-label"></span>
        </p>
        <p id="banner-message" class="banner-message"></p>
      </div>
    </section>

    <div class="content-wrapper">

      <section id="news-section" class="card" aria-labelledby="news-title">
        <h2 id="news-title"></h2>
        <div id="news-body"></div>
      </section>

      <section id="contact-section" class="card">
        <h2>Contact &amp; Resources</h2>
        <ul class="contact-list">
          <li id="contact-email-item">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>
            <a id="contact-email-link" href=""></a>
          </li>
          <li id="contact-phone-item">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>
            <a id="contact-phone-link" href=""></a>
          </li>
          <li id="status-url-item">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>
            <a id="status-url-link" href="" target="_blank" rel="noopener noreferrer">System Status</a>
          </li>
        </ul>

        <div id="social-links" class="social-links">
          <a id="social-twitter" href="" target="_blank" rel="noopener noreferrer" aria-label="Twitter / X">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.74l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
          </a>
          <a id="social-instagram" href="" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
          </a>
          <a id="social-facebook" href="" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
          </a>
          <a id="social-linkedin" href="" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
          </a>
          <a id="social-youtube" href="" target="_blank" rel="noopener noreferrer" aria-label="YouTube">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
          </a>
        </div>
      </section>

    </div>
  </main>

  <footer id="site-footer">
    <div class="footer-inner">
      <p id="footer-text"></p>
      <p id="footer-copyright">Copyright &copy; <span id="footer-year"></span> Purdue University. All rights reserved.</p>
    </div>
  </footer>

  <script src="config.js"></script>
  <script src="js/main.js"></script>
</body>
</html>
```

- [ ] **Step 2: Commit**

```bash
git add index.html
git commit -m "feat: add index.html page skeleton with all section IDs"
```

---

## Task 3: Create css/style.css

**Files:**

- Create: `css/style.css`

- [ ] **Step 1: Create css/style.css**

Create `css/style.css` with this exact content:

```css
/* =====================================================
   RCAC Maintenance Page — Stylesheet
   Follows RCAC2024 theme design tokens
   ===================================================== */

/* --- Custom Properties (Light Mode) --- */
:root {
  --pu-gold: #cfb991;
  --pu-black: #1c1c1c;
  --pu-gray: #9d9795;

  --bg: #f5f5f5;
  --surface: #ffffff;
  --surface-2: #f0f0f0;
  --border: rgba(0, 0, 0, 0.12);
  --text-primary: #1c1c1c;
  --text-secondary: #555555;
  --link: #426b9e;
  --link-hover: #2d4f7a;

  --header-bg: #1c1c1c;
  --header-text: #ffffff;
  --banner-bg: #12111a;
  --banner-text: #ffffff;
  --banner-subtext: rgba(255, 255, 255, 0.75);

  --font: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  --radius: 6px;
  --shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  --max-width: 860px;
}

/* --- Dark Mode Variable Overrides --- */
html[data-mode="dark"] {
  --bg: #1c1b21;
  --surface: #26262d;
  --surface-2: #2d2d32;
  --border: rgba(225, 231, 255, 0.12);
  --text-primary: #c8c8d0;
  --text-secondary: #888892;
  --link: #7aacdf;
  --link-hover: #9ec3ea;
  --banner-bg: #0f0e16;
  --banner-subtext: rgba(200, 200, 208, 0.7);
  --shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

/* --- Reset & Base --- */
*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html { font-size: 16px; }

body {
  font-family: var(--font);
  background-color: var(--bg);
  color: var(--text-primary);
  line-height: 1.6;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  transition: background-color 0.2s, color 0.2s;
}

a {
  color: var(--link);
  text-decoration: underline;
}

a:hover { color: var(--link-hover); }

/* --- Header --- */
#site-header {
  background-color: var(--header-bg);
  border-bottom: 3px solid var(--pu-gold);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-inner {
  max-width: var(--max-width);
  margin: 0 auto;
  padding: 0.75rem 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.logo-link {
  display: flex;
  align-items: center;
  text-decoration: none;
}

.logo-purdue {
  height: 32px;
  width: auto;
}

/* RCAC PNG is black/white — invert to white for dark header */
.logo-rcac {
  height: 32px;
  width: auto;
  filter: brightness(0) invert(1);
}

.header-right {
  display: flex;
  align-items: center;
  gap: 1rem;
}

/* --- Dark Mode Toggle Button --- */
#site-mode-toggle {
  background: none;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: var(--radius);
  color: var(--header-text);
  cursor: pointer;
  padding: 0.35rem 0.5rem;
  display: flex;
  align-items: center;
  transition: border-color 0.2s, background-color 0.2s;
}

#site-mode-toggle:hover {
  background-color: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.6);
}

.icon-sun, .icon-moon {
  display: flex;
  align-items: center;
}

/* Light mode: show moon (to offer dark), hide sun */
html:not([data-mode="dark"]) #site-mode-toggle .icon-sun {
  display: none;
}

/* Dark mode: show sun (to offer light), hide moon */
html[data-mode="dark"] #site-mode-toggle .icon-moon {
  display: none;
}

/* --- Status Banner --- */
#status-banner {
  background-color: var(--banner-bg);
  color: var(--banner-text);
  text-align: center;
  padding: 3rem 1.5rem;
  border-bottom: 1px solid rgba(207, 185, 145, 0.3);
}

.banner-inner {
  max-width: var(--max-width);
  margin: 0 auto;
}

.banner-icon {
  color: var(--pu-gold);
  margin-bottom: 1rem;
}

#banner-heading {
  font-size: 2rem;
  font-weight: 700;
  color: var(--banner-text);
  margin-bottom: 1.25rem;
}

.countdown {
  font-size: 1.35rem;
  font-weight: 600;
  color: var(--pu-gold);
  margin-bottom: 0.5rem;
  min-height: 2rem;
}

.countdown.state-complete {
  color: #5cb85c;
}

.downtime-window {
  font-size: 0.9rem;
  color: var(--banner-subtext);
  margin-bottom: 1.25rem;
}

.banner-message {
  font-size: 1.05rem;
  color: var(--banner-subtext);
  max-width: 600px;
  margin: 0 auto;
}

/* --- Content Wrapper --- */
.content-wrapper {
  max-width: var(--max-width);
  margin: 0 auto;
  padding: 2rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  flex: 1;
}

/* --- Card --- */
.card {
  background-color: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  padding: 1.75rem 2rem;
}

.card h2 {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid var(--pu-gold);
}

/* --- News Body --- */
#news-body p { margin-bottom: 1em; }

#news-body ul,
#news-body ol {
  margin: 0.5em 0 1em 1.5em;
}

#news-body a { color: var(--link); }

/* --- Contact List --- */
.contact-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  margin-bottom: 1.5rem;
}

.contact-list li {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  color: var(--text-secondary);
}

.contact-list a { color: var(--link); }

/* --- Social Links --- */
.social-links {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.social-links a {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: var(--surface-2);
  color: var(--text-secondary);
  text-decoration: none;
  transition: background-color 0.2s, color 0.2s;
}

.social-links a:hover {
  background-color: var(--pu-gold);
  color: var(--pu-black);
}

/* --- Footer --- */
#site-footer {
  background-color: var(--header-bg);
  border-top: 3px solid var(--pu-gold);
  color: rgba(255, 255, 255, 0.7);
  margin-top: auto;
}

.footer-inner {
  max-width: var(--max-width);
  margin: 0 auto;
  padding: 1.25rem 1.5rem;
  text-align: center;
  font-size: 0.85rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

/* --- Responsive --- */
@media (max-width: 600px) {
  #banner-heading { font-size: 1.5rem; }
  .countdown { font-size: 1.1rem; }
  .card { padding: 1.25rem 1rem; }
  .header-inner { padding: 0.6rem 1rem; }
}
```

- [ ] **Step 2: Open index.html in a browser and verify structural styles**

Expected:

- Dark sticky header with gold bottom border visible
- Dark banner section below it (empty but background visible)
- Dark footer with gold top border at the bottom

- [ ] **Step 3: Commit**

```bash
git add css/style.css
git commit -m "feat: add style.css with RCAC branding, layout, and dark mode variables"
```

---

## Task 4: Create js/main.js

**Files:**

- Create: `js/main.js`

- [ ] **Step 1: Create js/main.js**

Create `js/main.js` with this exact content:

```js
(function () {
  'use strict';

  // ── DOM helpers ───────────────────────────────────────────

  function el(id) { return document.getElementById(id); }

  function setText(id, text) {
    var node = el(id);
    if (node) node.textContent = text;
  }

  function setHTML(id, html) {
    var node = el(id);
    if (node) node.innerHTML = html;
  }

  function setAttr(id, attr, value) {
    var node = el(id);
    if (node) node.setAttribute(attr, value);
  }

  function hide(id) {
    var node = el(id);
    if (node) node.style.display = 'none';
  }

  // ── Config injection ──────────────────────────────────────

  function applyConfig(cfg) {
    if (cfg.pageTitle) document.title = cfg.pageTitle;

    setText('banner-heading', cfg.heading || '');
    setText('banner-message', cfg.message || '');
    setText('news-title', cfg.newsTitle || '');
    setHTML('news-body', cfg.newsBody || '');

    if (cfg.contactEmail) {
      setAttr('contact-email-link', 'href', 'mailto:' + cfg.contactEmail);
      setText('contact-email-link', cfg.contactEmail);
    } else {
      hide('contact-email-item');
    }

    if (cfg.contactPhone) {
      setAttr('contact-phone-link', 'href', 'tel:' + cfg.contactPhone.replace(/[^0-9+]/g, ''));
      setText('contact-phone-link', cfg.contactPhone);
    } else {
      hide('contact-phone-item');
    }

    if (cfg.statusUrl) {
      setAttr('status-url-link', 'href', cfg.statusUrl);
    } else {
      hide('status-url-item');
    }

    var social = cfg.social || {};
    ['twitter', 'instagram', 'facebook', 'linkedin', 'youtube'].forEach(function (key) {
      if (social[key]) {
        setAttr('social-' + key, 'href', social[key]);
      } else {
        hide('social-' + key);
      }
    });

    setText('footer-text', cfg.footerText || '');
    setText('footer-year', new Date().getFullYear());
  }

  // ── Countdown timer ───────────────────────────────────────

  function parseDowntimeDate(dateStr, offsetStr) {
    // "April 19, 2026 6:00 AM" + "-0400" → new Date("April 19, 2026 6:00 AM GMT-0400")
    return new Date(dateStr + ' GMT' + offsetStr);
  }

  function formatDuration(ms) {
    var totalSeconds = Math.floor(ms / 1000);
    var hours   = Math.floor(totalSeconds / 3600);
    var minutes = Math.floor((totalSeconds % 3600) / 60);
    var seconds = totalSeconds % 60;
    var parts = [];
    if (hours > 0)   parts.push(hours   + ' hour'   + (hours   !== 1 ? 's' : ''));
    if (minutes > 0) parts.push(minutes + ' minute' + (minutes !== 1 ? 's' : ''));
    parts.push(seconds + ' second' + (seconds !== 1 ? 's' : ''));
    return parts.join(' ');
  }

  function formatDisplayDate(dateObj) {
    return dateObj.toLocaleString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      hour: 'numeric', minute: '2-digit', timeZoneName: 'short',
    });
  }

  function startCountdown(cfg) {
    var offset    = cfg.downtimeTimezoneOffset || '-0400';
    var startDate = parseDowntimeDate(cfg.downtimeStart, offset);
    var endDate   = parseDowntimeDate(cfg.downtimeEnd,   offset);
    var countdownEl = el('countdown-display');

    if (!countdownEl || isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return;

    setText('downtime-start-label', formatDisplayDate(startDate));
    setText('downtime-end-label',   formatDisplayDate(endDate));

    var timer;

    function updateCountdown() {
      var now     = Date.now();
      var startMs = startDate.getTime();
      var endMs   = endDate.getTime();

      if (now < startMs) {
        countdownEl.textContent = 'Maintenance begins in ' + formatDuration(startMs - now);
        countdownEl.className = 'countdown state-before';
      } else if (now < endMs) {
        countdownEl.textContent = 'Maintenance in progress \u2014 expected to end in ' + formatDuration(endMs - now);
        countdownEl.className = 'countdown state-during';
      } else {
        countdownEl.textContent = 'Maintenance has completed \u2014 services should be restored';
        countdownEl.className = 'countdown state-complete';
        clearInterval(timer);
      }
    }

    updateCountdown();
    timer = setInterval(updateCountdown, 1000);
  }

  // ── Dark mode toggle ──────────────────────────────────────

  function initDarkMode() {
    var btn  = el('site-mode-toggle');
    var root = document.documentElement;
    if (!btn) return;

    function applyMode(mode) {
      root.setAttribute('data-mode', mode);
      document.body.setAttribute('data-mode', mode);
    }

    // The inline <head> script already handled the initial state on first paint.
    // Re-sync body to match html in case they differ.
    var current = root.getAttribute('data-mode') || 'light';
    document.body.setAttribute('data-mode', current);

    btn.addEventListener('click', function () {
      var next = root.getAttribute('data-mode') === 'dark' ? 'light' : 'dark';
      applyMode(next);
      localStorage.setItem('site-mode', next);
    });
  }

  // ── Bootstrap ─────────────────────────────────────────────

  document.addEventListener('DOMContentLoaded', function () {
    var cfg = window.MAINTENANCE_CONFIG || {};
    applyConfig(cfg);
    startCountdown(cfg);
    initDarkMode();
  });

}());
```

- [ ] **Step 2: Open index.html in a browser and verify the full page**

Expected:

- Page title = "RCAC — Scheduled Maintenance" (check browser tab)
- Banner: heading, live countdown ticking every second, start/end date labels, message
- News card: title and placeholder body text
- Contact card: email and phone as links, Twitter/Instagram/LinkedIn/YouTube icons visible, Facebook hidden, status URL item hidden
- Footer: copyright text and current year
- Dark mode toggle button visible in header

Open DevTools Console — no errors expected.

- [ ] **Step 3: Commit**

```bash
git add js/main.js
git commit -m "feat: add main.js — config injection, live countdown, dark mode toggle"
```

---

## Task 5: Add logo images

**Files:**

- Create: `images/purdue-logo.svg`
- Create: `images/rcac-logo.png`

- [ ] **Step 1: Copy Purdue SVG**

Replace `/path/to/halcyon` with the actual path to your local Halcyon repository:

```bash
cp /path/to/halcyon/app/Themes/Rcac2024/assets/images/PU-H.svg images/purdue-logo.svg
```

- [ ] **Step 2: Copy RCAC PNG**

```bash
cp /path/to/halcyon/app/Themes/Rcac2024/assets/images/RCAC_SIG_Logo_RGB__PU-H-Full-RGB_Black_white.png images/rcac-logo.png
```

- [ ] **Step 3: Open index.html and verify both logos appear in the header**

Expected:

- Purdue "P" and wordmark visible in white on the left
- RCAC logo visible in white on the right (CSS `filter: brightness(0) invert(1)` converts the black PNG to white)

- [ ] **Step 4: Commit**

```bash
git add images/
git commit -m "feat: add Purdue and RCAC logo images"
```

---

## Task 6: Full browser verification

**Files:** None — verification only.

- [ ] **Step 1: Verify light mode layout**

Open `index.html` in a browser. Check each of the following:

- Dark sticky header with both logos and toggle button
- Gold border under header and above footer
- Status banner: dark background, gold wrench icon, heading, countdown, date labels, message
- News card: white/light background, gold underline on title, body text
- Contact card: email + phone links with icons, 4 social icons (Facebook hidden), status URL hidden
- Footer: dark background, copyright year correct

- [ ] **Step 2: Verify dark mode toggle**

Click the toggle button.

Expected:

- Page background: `#1c1b21`
- Cards: `#26262d`
- Body text: `#c8c8d0`
- Toggle now shows sun icon
- No flash when toggling

Reload the page — dark mode must persist (check `localStorage['site-mode'] === "dark"` in DevTools > Application > Local Storage).

- [ ] **Step 3: Verify countdown states by editing config.js temporarily**

**Before state** (default):

```js
downtimeStart: "April 19, 2026 6:00 AM",
downtimeEnd:   "April 19, 2026 2:00 PM",
```

Expected: "Maintenance begins in X hours Y minutes Z seconds" — gold text, ticking

**During state:**

```js
downtimeStart: "January 1, 2020 6:00 AM",
downtimeEnd:   "December 31, 2099 2:00 PM",
```

Expected: "Maintenance in progress — expected to end in X hours..." — gold text, ticking

**After state:**

```js
downtimeStart: "January 1, 2020 6:00 AM",
downtimeEnd:   "January 2, 2020 2:00 PM",
```

Expected: "Maintenance has completed — services should be restored" — green text, stops ticking

- [ ] **Step 4: Verify mobile layout**

Open DevTools > Toggle Device Toolbar (Ctrl+Shift+M). Set width to 375px.

Expected:

- Header logos and button don't overflow or overlap
- Countdown text wraps cleanly
- Cards fill full width with reduced padding
- Social icons wrap without overflow

- [ ] **Step 5: Restore config.js to production placeholder values and commit**

```js
downtimeStart: "April 19, 2026 6:00 AM",
downtimeEnd:   "April 19, 2026 2:00 PM",
downtimeTimezoneOffset: "-0400",
```

```bash
git add config.js
git commit -m "chore: restore config.js to production placeholder values after testing"
```
