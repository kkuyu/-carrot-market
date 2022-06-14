/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  env: {
    DATABASE_URL: process.env.DATABASE_URL,
    MY_PHONE: process.env.MY_PHONE,
    NCP_ACCESS_ID: process.env.NCP_ACCESS_ID,
    NCP_SECRET_KEY: process.env.NCP_SECRET_KEY,
    NCP_SMS_SERVICE_ID: process.env.NCP_SMS_SERVICE_ID,
    COOKIE_PASSWORD: process.env.COOKIE_PASSWORD,
  },
};

module.exports = nextConfig;
