// config/scraperClient.js
import axios from "axios";

export const scraperClient = axios.create({
  timeout: 10000,
  maxRedirects: 5,
  headers: {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    Accept:
      "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
  },
  validateStatus: (status) => status >= 200 && status < 300, // only true successes pass; 403/404/5xx now throw and get caught
});
