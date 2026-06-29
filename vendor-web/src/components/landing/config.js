export const CONFIG = {
  VENDOR_LOGIN_URL: '/login',
  VENDOR_REGISTER_URL: '/login',
  APK_FILENAME: 'paperprints.apk',
  PLAY_STORE_URL: 'https://play.google.com/store/apps/details?id=store.paperprints.app',
  CONTACT_EMAIL: 'paperprintsofficial@gmail.com',
};

export function triggerApkDownload() {
  window.open(CONFIG.PLAY_STORE_URL, '_blank', 'noopener,noreferrer');
}

export function scrollToSection(id) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth' });
}
