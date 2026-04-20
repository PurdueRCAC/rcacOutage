// ============================================================
// RCAC MAINTENANCE PAGE — CONFIGURATION
// Edit the values below to update the maintenance page.
// Do not change the variable names or remove the surrounding quotes or backticks.
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
  downtimeStart: "April 22, 2026 6:00 AM",
  downtimeEnd: "April 23, 2026 5:00 PM",

  // Timezone offset from UTC — used for live countdown accuracy
  // Eastern Daylight Time (EDT, Apr–Oct): "-0400"
  // Eastern Standard Time (EST, Nov–Mar): "-0500"
  downtimeTimezoneOffset: "-0400",

  // News/announcement section
  newsTitle: "Maintenance Announcement",
  // newsBody supports basic HTML (bold, lists, links, paragraphs)
  newsBody: `<p><strong>What will be unavailable:</strong></p>
<ul>
  <li>All Computing Clusters (Bell, Negishi, Gautschi, Scholar, Rowdy, Gilbreth, Hammer, Anvil)</li>
  <li>All Data Storage Systems (Data Depot, Fortress, Anvil Ceph storage, scratch and home storage, Research Network)</li>
  <li>Gateway services (Hubzero, GenAI Studio, Anvil GPT)</li>
  <li>Access to login nodes, storage systems, and web portals</li>
</ul>`,

  // Contact information
  contactEmail: "rcac-help@purdue.edu",
  contactPhone: "(765) 494-9000",

  // Status page URL — leave empty ("") to hide the link
  statusUrl: "",

  // Post-maintenance message — displayed when maintenance ends
  // Can be plain text or HTML with a link (e.g. 'Visit <a href="...">our website</a>')
  postMaintenanceMessage: 'Services have been restored. <a href="https://www.rcac.purdue.edu">Return to RCAC website</a>',

  // Social media — leave any empty ("") to hide that link
  social: {
    twitter: "https://twitter.com/purduercac",
    instagram: "https://instagram.com/purduercac",
    facebook: "",
    linkedin: "https://www.linkedin.com/company/purdue-rosen-center-for-advanced-computing-rcac",
    youtube: "https://www.youtube.com/user/purduercac",
  },

  // Footer copyright line
  footerText: "Purdue University is an equal access/equal opportunity university.",

  // ── Game ─────────────────────────────────────────────────
  // Set to true to show the RCAC Job Runner game instead of the news/announcement card.
  showGame: true,

  // RCAC cluster history — one entry per Pac-Man level.
  // Completing level 1 reveals RCAC_CLUSTERS[0], level 2 reveals RCAC_CLUSTERS[1], etc.
  // Colleagues: fill in name, year, specs, and fact for each cluster.
  // You can add or remove entries freely — levels beyond the list just continue without a reveal.
  RCAC_CLUSTERS: [
    {
      name: "Cluster Name",
      year: "20XX",
      specs: "N nodes · X cores · Y GB RAM per node",
      fact: "One memorable sentence about this system."
    },
    {
      name: "Cluster Name",
      year: "20XX",
      specs: "N nodes · X cores · Y GB RAM per node",
      fact: "One memorable sentence about this system."
    },
    {
      name: "Cluster Name",
      year: "20XX",
      specs: "N nodes · X cores · Y GB RAM per node",
      fact: "One memorable sentence about this system."
    },
    {
      name: "Halcyon",
      year: "20XX",
      specs: "N nodes · X cores · Y GB RAM per node",
      fact: "RCAC's newest and most powerful cluster to date."
    },
  ],
};
