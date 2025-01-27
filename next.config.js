/** @type {import('next').NextConfig} */
const nextConfig = {
    env: {
      OPENAI_API_KEY: process.env.OPENAI_API_KEY,
      GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    },
    images: {
      domains: ['lh3.googleusercontent.com'],
    },
    typescript: {
      ignoreBuildErrors: true,
    }
  }
  
  module.exports = nextConfig