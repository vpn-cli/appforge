# Decision Record: Client IP Rate Limiting via x-real-ip and Shared Unknown Bucket

## Context & Problem
The unauthenticated Copilot endpoint (`/api/copilot`) allows guest users to generate applications without logging in. To protect against denial of service, resource exhaustion, and API quota depletion, guest requests are rate-limited.
Extracting the client's true IP address in serverless reverse-proxy environments presents a known vulnerability: `x-forwarded-for` can be forged or prepended by attackers with arbitrary fake IP strings (e.g. `X-Forwarded-For: 1.2.3.4, 5.6.7.8`), allowing attackers to bypass IP-based rate limits indefinitely.

## Decision
- AppForge strictly extracts the client IP using the single trusted reverse-proxy header **`x-real-ip`**.
- Untrusted headers such as `x-forwarded-for` are completely ignored for rate limiting.
- If the hosting platform does not supply `x-real-ip` (e.g. local development or direct edge requests), requests are assigned to a shared fallback **`"unknown"`** bucket.
- Guest limits are set to 10 requests per day per IP/bucket, with an overarching global ceiling of 100 requests per day across all unauthenticated guests combined.

## Rationale
1. **Spoof Immunity**: Modern reverse proxies (e.g. Vercel, Cloudflare, NGINX) overwrite `x-real-ip` with the socket connection IP, preventing client spoofing.
2. **Fail-Closed Unknown Bucket**: Grouping unidentifiable requests into a single `"unknown"` bucket ensures that missing IP headers cannot be abused to achieve infinite quota; the shared bucket exhausts its 10 requests rapidly if flooded.

## Verification
Automated test suite `tests/copilot-guest-limits.test.ts`:
- `"enforces rate limiting per IP using x-real-ip only"` (PASS)
- `"groups requests without valid x-real-ip into unknown bucket"` (PASS)
- `"enforces global daily ceiling across all guests"` (PASS)
