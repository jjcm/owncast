export function getDiffInDaysFromNow(timestamp) {
  const time = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  return (new Date() - time) / (24 * 3600 * 1000);
}

// Detects Safari on an iOS/iPadOS device with plain user-agent checks rather
// than a UA-parsing library: this file is on the viewer boot path and the
// library was its only heavy dependency. Every browser on iOS is WebKit, but
// only real Safari lacks the third-party browser tokens checked below.
// Desktop-class iPadOS Safari reports a Mac platform, so it is recognized by
// its touch support instead of the user agent.
export const isMobileSafariIos = () => {
  try {
    const ua = navigator.userAgent;
    const isIPadOS = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
    const isIOSDevice = isIPadOS || /iPhone|iPad|iPod/.test(ua);
    if (!isIOSDevice) {
      return false;
    }

    return /Safari/.test(ua) && !/CriOS|FxiOS|OPiOS|OPT\/|EdgiOS|DuckDuckGo|mercury/.test(ua);
  } catch {
    return false;
  }
};

export const isMobileSafariHomeScreenApp = () => {
  if (!isMobileSafariIos()) {
    return false;
  }

  return 'standalone' in window.navigator && window.navigator.standalone;
};
