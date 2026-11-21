(() => {
  const allowedEvents = new Set([
    'Chat Message Sent',
    'Agent Mode Enabled',
    'Council Mode Enabled',
    'Chat Exported'
  ]);

  window.karicimTrack = (eventName) => {
    if (!allowedEvents.has(eventName) || typeof window.plausible !== 'function') return;
    window.plausible(eventName);
  };

  async function initializeAnalytics() {
    const response = await fetch('/api/analytics-config', {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
      credentials: 'same-origin'
    });
    if (!response.ok) return;

    const config = await response.json();
    if (config.enabled !== true || !config.domain || location.hostname.toLowerCase() !== config.domain) return;
    if (config.scriptUrl !== 'https://plausible.io/js/script.js') return;

    window.plausible = window.plausible || function () {
      (window.plausible.q = window.plausible.q || []).push(arguments);
    };

    const script = document.createElement('script');
    script.defer = true;
    script.dataset.domain = config.domain;
    script.src = config.scriptUrl;
    script.onerror = () => {
      window.karicimTrack = () => {};
    };
    document.head.appendChild(script);
  }

  initializeAnalytics().catch(() => {
    window.karicimTrack = () => {};
  });
})();
