import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Increase the body size limit for API routes to handle large image uploads (mobile photos)
  // Default is 4MB which is too small for high-res photos sent to the OCR API.
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
