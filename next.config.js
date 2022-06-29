/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ["imagedelivery.net", "videodelivery.net"],
  },
  env: {
    DATABASE_URL: process.env.DATABASE_URL,
    COOKIE_PASSWORD: process.env.COOKIE_PASSWORD,
    MY_PHONE: process.env.MY_PHONE,

    CF_ID: process.env.CF_ID,
    CF_TOKEN_IMAGE: process.env.CF_TOKEN_IMAGE,
    CF_TOKEN_STREAM: process.env.CF_TOKEN_STREAM,

    NCP_ACCESS_ID: process.env.NCP_ACCESS_ID,
    NCP_SECRET_KEY: process.env.NCP_SECRET_KEY,
    NCP_SMS_SERVICE_ID: process.env.NCP_SMS_SERVICE_ID,

    VWORLD_URL: process.env.VWORLD_URL,
    VWORLD_KEY: process.env.VWORLD_KEY,
  },
};

module.exports = nextConfig;
