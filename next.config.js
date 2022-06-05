/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  env: {
    DATABASE_URL: process.env.DATABASE_URL,
    TWILIO_SID: process.env.TWILIO_SID,
    TWILIO_TOKEN: process.env.TWILIO_TOKEN,
    TWILIO_MSID: process.env.TWILIO_MSID,
    MY_PHONE: process.env.MY_PHONE,
    SESSION_PASSWORD: process.env.SESSION_PASSWORD,
  },
};

module.exports = nextConfig;
