export const CONFIG = {
  VENDOR_LOGIN_URL: '/login',
  VENDOR_REGISTER_URL: '/login',
  APK_FILENAME: 'paperprints.apk',
  CONTACT_EMAIL: 'paperprintsofficial@gmail.com',
};

export function triggerApkDownload() {
  const link = document.createElement('a');
  link.href = '/' + CONFIG.APK_FILENAME;
  link.download = 'PaperPrints.apk';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function scrollToSection(id) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth' });
}
