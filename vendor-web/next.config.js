/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/paperprints.apk',
        headers: [
          {
            key: 'Content-Disposition',
            value: 'attachment; filename="PaperPrints.apk"',
          },
          {
            key: 'Content-Type',
            value: 'application/vnd.android.package-archive',
          }
        ],
      },
    ];
  },
};

module.exports = nextConfig;
