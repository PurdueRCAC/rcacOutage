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

    // Wire game launch / back buttons when showGame is enabled
    if (cfg.showGame) {
      var launchBar = el('game-launch-bar');
      var launchBtn = el('game-launch-btn');
      var tronBtn   = el('tron-launch-btn');
      var backBtn   = el('game-back-btn');
      var tronBackBtn = el('tron-back-btn');
      var gameSection = el('game-section');
      var tronSection = el('tron-section');
      var newsSection = el('news-section');

      if (launchBar) launchBar.style.display = '';

      if (launchBtn) {
        launchBtn.addEventListener('click', function () {
          if (newsSection) newsSection.style.display = 'none';
          if (gameSection) gameSection.style.display = '';
          if (window.rcacGameStart) { window.rcacGameStart(); }
        });
      }

      if (tronBtn) {
        tronBtn.addEventListener('click', function () {
          if (newsSection) newsSection.style.display = 'none';
          if (tronSection) tronSection.style.display = '';
          if (window.tronGameStart) { window.tronGameStart(); }
        });
      }

      if (backBtn) {
        backBtn.addEventListener('click', function () {
          if (window.rcacGameStop) { window.rcacGameStop(); }
          if (gameSection) gameSection.style.display = 'none';
          if (newsSection) newsSection.style.display = '';
        });
      }

      if (tronBackBtn) {
        tronBackBtn.addEventListener('click', function () {
          if (tronSection) tronSection.style.display = 'none';
          if (newsSection) newsSection.style.display = '';
          if (window.tronGameStop) { window.tronGameStop(); }
        });
      }
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
    var hours = Math.floor(totalSeconds / 3600);
    var minutes = Math.floor((totalSeconds % 3600) / 60);
    var seconds = totalSeconds % 60;
    var parts = [];
    if (hours > 0) parts.push(hours + ' hour' + (hours !== 1 ? 's' : ''));
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
    var offset = cfg.downtimeTimezoneOffset || '-0400';
    var startDate = parseDowntimeDate(cfg.downtimeStart, offset);
    var endDate = parseDowntimeDate(cfg.downtimeEnd, offset);
    var countdownEl = el('countdown-display');
    var messageEl = el('banner-message');

    if (!countdownEl || isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return;

    setText('downtime-start-label', formatDisplayDate(startDate));
    setText('downtime-end-label', formatDisplayDate(endDate));

    var timer;
    var maintenanceComplete = false;

    function updateCountdown() {
      var now = Date.now();
      var startMs = startDate.getTime();
      var endMs = endDate.getTime();

      if (now < startMs) {
        countdownEl.textContent = 'Maintenance begins in ' + formatDuration(startMs - now);
        countdownEl.className = 'countdown state-before';
      } else if (now < endMs) {
        countdownEl.textContent = 'Maintenance in progress \u2014 expected to end in ' + formatDuration(endMs - now);
        countdownEl.className = 'countdown state-during';
      } else {
        countdownEl.textContent = 'Maintenance has completed \u2014 services should be restored';
        countdownEl.className = 'countdown state-complete';

        // Update the banner message and hide the announcement when maintenance completes
        if (!maintenanceComplete && messageEl && cfg.postMaintenanceMessage) {
          setHTML('banner-message', cfg.postMaintenanceMessage);
          hide('news-section');
          maintenanceComplete = true;
        }

        clearInterval(timer);
      }
    }

    updateCountdown();
    timer = setInterval(updateCountdown, 1000);
  }

  // ── Dark mode toggle ──────────────────────────────────────

  function initDarkMode() {
    var btn = el('site-mode-toggle');
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
