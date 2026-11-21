const HOSTNAME_PATTERN = /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i;

export function getPlausibleConfig({ configuredDomain, requestHost, nodeEnv }) {
  const domain = typeof configuredDomain === 'string' ? configuredDomain.trim().toLowerCase().replace(/\.$/, '') : '';
  const host = typeof requestHost === 'string' ? requestHost.trim().toLowerCase().split(':')[0] : '';
  const validDomain = HOSTNAME_PATTERN.test(domain);
  const enabled = nodeEnv === 'production' && validDomain && host === domain;

  return {
    enabled,
    domain: enabled ? domain : null,
    scriptUrl: enabled ? 'https://plausible.io/js/script.js' : null
  };
}
