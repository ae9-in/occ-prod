#!/usr/bin/env node

require("dotenv").config();
const http = require("http");
const https = require("https");

const baseUrl = process.env.LOADTEST_BASE_URL;
const concurrency = Math.min(Math.max(Number(process.env.LOADTEST_CONCURRENCY || 25), 1), 200);
const rounds = Math.min(Math.max(Number(process.env.LOADTEST_ROUNDS || 4), 1), 20);

if (!baseUrl) {
  console.error("LOADTEST_BASE_URL is required");
  process.exit(1);
}

const client = baseUrl.startsWith("https") ? https : http;
const paths = ["/health", "/api/v1/clubs", "/api/v1/feed", "/api/v1/search?q=club"];

function request(path) {
  const startedAt = Date.now();
  return new Promise((resolve) => {
    const req = client.get(`${baseUrl}${path}`, (res) => {
      res.resume();
      res.on("end", () => {
        resolve({
          path,
          statusCode: res.statusCode || 0,
          durationMs: Date.now() - startedAt,
        });
      });
    });
    req.on("error", () => {
      resolve({
        path,
        statusCode: 0,
        durationMs: Date.now() - startedAt,
      });
    });
  });
}

async function main() {
  const allResults = [];

  for (let round = 0; round < rounds; round += 1) {
    const requests = Array.from({ length: concurrency }, (_, index) => request(paths[index % paths.length]));
    const results = await Promise.all(requests);
    allResults.push(...results);
  }

  const grouped = paths.map((path) => {
    const results = allResults.filter((result) => result.path === path);
    const durations = results.map((result) => result.durationMs).sort((a, b) => a - b);
    const successCount = results.filter((result) => result.statusCode >= 200 && result.statusCode < 400).length;
    const p95 = durations[Math.min(durations.length - 1, Math.floor(durations.length * 0.95))] || 0;
    const average = durations.reduce((sum, value) => sum + value, 0) / Math.max(durations.length, 1);

    return {
      path,
      requests: results.length,
      successCount,
      averageMs: Math.round(average),
      p95Ms: p95,
    };
  });

  console.table(grouped);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
