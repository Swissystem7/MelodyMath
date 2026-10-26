// Sentry Browser SDK Loader
// Reads the <meta name="sentry-dsn"> tag. If the content is a real DSN (not the placeholder "__SENTRY_DSN__"),
// it dynamically loads the Sentry CDN bundle and initializes the SDK with sendDefaultPii disabled.

export function initSentry() {
  const meta = document.querySelector('meta[name="sentry-dsn"]');
  if (!meta) return; // no meta, nothing to do
  const dsn = meta.getAttribute('content');
  // Placeholder indicates DSN not provided – do not load Sentry.
  if (!dsn || dsn === '__SENTRY_DSN__') return;
  const script = document.createElement('script');
  script.src = 'https://browser.sentry-cdn.com/7.76.0/bundle.min.js';
  script.onload = () => {
    // @ts-ignore – Sentry is provided by the loaded bundle.
    if (typeof Sentry !== 'undefined') {
      // eslint-disable-next-line no-undef
      Sentry.init({ dsn, sendDefaultPii: false });
    }
  };
  document.head.appendChild(script);
}
