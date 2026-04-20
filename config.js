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
      name: "Hammer",
      year: "2015",
      specs: "198 nodes · 20 cores · 64 GB RAM per node",
      fact: "Hammer will be expanded annually, with each year's purchase of nodes to remain in production for 5 years from their initial purchase."
    },
    {
      name: "Anvil",
      year: "2021",
      specs: "1000 nodes · 128 cores · 256GB to 1TB RAM per node · 100 Gbps Infiniband interconnects",
      fact: "Anvil is funded under NSF award number 2005632. Carol Song is the principal investigator and project director."
    },
    {
      name: "Gilbreth",
      year: "2021",
      specs: "52 nodes · 64 cores · 192GB to 2TB RAM per node · 2 A100(80GB) GPU per node",
      fact: "Gilbreth is named in honor of Lillian Moller Gilbreth, Purdue's first female engineering professor."
    },
    {
      name: "Geddes",
      year: "2022",
      specs: "4 nodes · 128 cores · 24TB RAM per node · 2 A100(512GB) GPU per node",
      fact: "Geddes is named in honor of Lanelle Geddes, Professor of Nursing."
    },
    {
      name: "Negishi",
      year: "2022",
      specs: "8 nodes · 128 cores · 512 GB RAM per node",
      fact: "Negishi is named in honor of Dr. Ei-ichi Negishi, the Herbert C. Brown Distinguished Professor in the Department of Chemistry at Purdue."
    },
    {
      name: "Gautschi",
      year: "2024",
      specs: "8 nodes · 192 cores · 768 GB RAM per node",
      fact: "Gautschi is named in honor of Dr. Walter Gautschi, the Professor in the Department of Computer Science and Mathematics at Purdue."
    },
    {
      name: "Rossmann",
      year: "2025",
      specs: "2 nodes · 128 cores · 768 GB RAM per node",
      fact: "Rossmann is a Community Cluster optimized for communities running applications subject to heightened security requirements such as data subject to the NIH Genomic Data Sharing (GDS) policy, licensed data, or healthcare data."
    },
  ],
};
