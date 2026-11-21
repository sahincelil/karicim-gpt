(() => {
  const allowedEvents = new Set([
    'Chat Message Sent',
    'Agent Mode Enabled',
    'Council Mode Enabled',
    'Chat Exported'
  ]);
  const pendingEvents = [];
  let trackingEnabled = false;

  window.karicimTrack = (eventName) => {
    if (!allowedEvents.has(eventName)) return;
    if (trackingEnabled && typeof window.plausible === 'function') {
      window.plausible(eventName);
    } else {
      pendingEvents.push(eventName);
    }
  };

  async function initializeAnalytics() {
    const response = await fetch('/api/analytics-config', {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
      credentials: 'same-origin'
    });
    if (!response.ok) return;

    const config = await response.json();
    if (config.enabled !== true || !config.domain || location.hostname.toLowerCase() !== config.domain) {
      pendingEvents.length = 0;
      return;
    }
    if (config.scriptUrl !== 'https://plausible.io/js/script.js') {
      pendingEvents.length = 0;
      return;
    }

    window.plausible = window.plausible || function () {
      (window.plausible.q = window.plausible.q || []).push(arguments);
    };
    trackingEnabled = true;
    for (const eventName of pendingEvents.splice(0)) window.plausible(eventName);

    const script = document.createElement('script');
    script.defer = true;
    script.dataset.domain = config.domain;
    script.src = config.scriptUrl;
    script.onerror = () => {
      trackingEnabled = false;
      window.karicimTrack = () => {};
    };
    document.head.appendChild(script);
  }

  initializeAnalytics().catch(() => {
    pendingEvents.length = 0;
    window.karicimTrack = () => {};
  });
})();
