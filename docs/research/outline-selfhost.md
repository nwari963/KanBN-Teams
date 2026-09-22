# Outline self-host footprint (LAN, no internet, no SMTP)

Ticket: `_wayfinder/tickets/008-outline-footprint.md`. Prior ranking in `doc-layer-alternatives.md` stands; this covers only self-host requirements. Target host: Apple Silicon laptop, OrbStack docker, LAN-first `http://192.168.1.125:*`. Kan=3456, Cal.diy=3457 planned → **Outline on 3458**.

## 1. Compose services

Minimum: **3 services** — `outline`, `postgres`, `redis`.

| Service | Image | Needed? |
|---|---|---|
| outline | `outlinewiki/outline:latest` | yes (use `docker.getoutline.com/outlinewiki/outline` registry mirror if hub is flaky) |
| postgres | `postgres:18` (official sample) | yes |
| redis | `redis` | yes — cache, rate limiting, collaboration/websockets |
| https-portal | `steveltn/https-portal` | **no** — only for public Let's Encrypt TLS; LAN http skips it |
| MinIO/S3 | — | **no** — `FILE_STORAGE=local` stores attachments on disk |
| dex | `dexidp/dex` | required add-on for auth (see §3); sqlite backend, no extra DB |

Source: official compose sample lists outline/redis/postgres/https-portal ([docs docker](https://docs.getoutline.com/s/hosting/doc/docker-7pfeLP5a8t)); "a `URL`, `DATABASE_URL`, `REDIS_URL`, and `SECRET_KEY` are considered the minimum."

## 2. Mandatory env vars

From [`.env.sample`](https://raw.githubusercontent.com/outline/outline/main/.env.sample) and the [docker doc](https://docs.getoutline.com/s/hosting/doc/docker-7pfeLP5a8t):

```bash
NODE_ENV=production
URL=http://192.168.1.125:3458          # fully qualified URL users hit; no proxy on LAN
PORT=3458
SECRET_KEY=<openssl rand -hex 32>       # hex-encoded 32-byte key
UTILS_SECRET=<openssl rand -hex 32>     # any unique random key
DATABASE_URL=postgres://outline:pass@outline-postgres:5432/outline
PGSSLMODE=disable                       # same host, no SSL needed
REDIS_URL=redis://outline-redis:6379
FILE_STORAGE=local                      # "s3" or "local" are the only values
FILE_STORAGE_LOCAL_ROOT_DIR=/var/lib/outline/data
FILE_STORAGE_UPLOAD_MAX_SIZE=262144000  # 250MB default
FORCE_HTTPS=false                       # plain http on LAN
WEB_CONCURRENCY=1                       # divide RAM by 512 rule; 1 is right for a laptop
```

Migrations run automatically at container start (from-source doc: "migrations will be ran automatically when you start the server" — [docs](https://docs.getoutline.com/s/hosting/doc/from-source-BlBxrNzMIP)).

## 3. Auth on a LAN with no internet and no SMTP

**Outline has no native email+password login** — official statement: "Outline does not support email + password authentication natively" ([authentication doc](https://docs.getoutline.com/s/hosting/doc/authentication-7ViKRmRY5o)). `.env.sample`: "at least ONE of these [third-party signin credentials] is required for a working installation or you'll have no sign-in options."

So cloud providers (Slack/Google/Azure) are out — they need internet. The only offline path is **self-hosted OIDC**:

- Generic OIDC env: `OIDC_CLIENT_ID`, `OIDC_CLIENT_SECRET`, `OIDC_AUTH_URI`, `OIDC_TOKEN_URI`, `OIDC_USERINFO_URI` (+ optional `OIDC_USERNAME_CLAIM`, `OIDC_DISPLAY_NAME`, `OIDC_SCOPES`) — [OIDC doc](https://docs.getoutline.com/s/hosting/doc/oidc-8CPBm6uC0I). Self-hosted examples the docs themselves list: Keycloak, Authelia, Authentik.
- **Recommended: Dex** (`dexidp/dex`) — much lighter than Keycloak/Authentik (single static binary + sqlite, ~30–50 MB RAM vs Keycloak's Java stack + own Postgres). Proven working recipe for exactly this "Outline on a private network, mandatory auth provider annoying" case with full compose + `docker.env` + static-password dex config: [mrkaran.dev/posts/setting-outline](https://mrkaran.dev/posts/setting-outline). Static passwords live in dex's config file (`enablePasswordDB: true`, bcrypt hashes) — no internet, no SMTP, ever.

**Is email required for the first admin?** No. The email field is just an attribute delivered by the OIDC profile claim; nothing is sent to it. SMTP env ([smtp doc](https://docs.getoutline.com/s/hosting/doc/smtp-cqCJyZGMIB)) is only for *outgoing* mail (invites, "document updated" notifications) and can be left unset. First user to sign in creates the workspace and becomes admin.

## 4. ARM64

**Yes.** Verified live against Docker Hub registry API (`GET /v2/repositories/outlinewiki/outline/tags`): `latest` and `nightly*` tags are multi-arch `linux/amd64` + `linux/arm64`. `dexidp/dex:v2.45.1` likewise (`amd64, arm, arm64, ppc64le, s390x`). Official `postgres` and `redis` images are multi-arch arm64. Native on Apple Silicon via OrbStack — no Rosetta emulation.

One caveat for the unstable-internet constraint: images must be pulled while online (`docker compose pull`); after that the whole stack (incl. Dex auth) runs fully offline.

## 5. RAM footprint

Measured figures (2026-05, docker, 4 vCPU host; [use-apify.com guide](https://use-apify.com/docs/self-hosted/productivity/outline)):

| Service | Idle | Peak (10 editors) |
|---|---|---|
| outline (Node) | ~300 MB | ~550 MB |
| postgres 16 | ~150 MB | ~200 MB |
| redis | ~50 MB | ~55 MB |
| **total** | **~500 MB** | **~800 MB** |

Add ~30–50 MB for Dex. Call it **~550 MB idle / ~900 MB worst case** — fine alongside Kan + Cal.diy on a laptop. `WEB_CONCURRENCY=1` keeps the Node process count down; the `.env.sample` rule of thumb is "divide available memory by 512" per process.

## 6. API base URL + minting a key (Kan→Outline sync)

- Base URL: `http://192.168.1.125:3458/api` — self-hosted server entry from the official OpenAPI spec ([github.com/outline/openapi spec3.yml](https://github.com/outline/openapi/blob/main/spec3.yml)): servers = `https://app.getoutline.com/api` (cloud) or `https://{domain}/api` (self-hosted). Plain http works self-hosted despite the cloud "HTTPS only" wording.
- Style: RPC — every method is `POST /api/<method>.<action>` with JSON body, e.g. `POST /api/documents.create`, `/api/documents.info`, `/api/collections.list`. Responses are JSON.
- Auth: `Authorization: Bearer <key>` header. Keys start with `ol_api_` + 38 chars.
- Minting a key, two ways:
  1. UI: **Settings → API & Apps** (deep link `/settings/tokens`) → new token. Per the OpenAPI spec: "You can create new API keys under Settings => API & Apps."
  2. API (bootstraps from an existing key): `POST /api/apiKeys.create` with `{"name": "kan-sync"}` — the full key value is returned once, never retrievable again.
- Minimal sync smoke test:
  ```bash
  curl -XPOST http://192.168.1.125:3458/api/documents.create \
    -H "Authorization: Bearer ol_api_..." -H "Content-Type: application/json" \
    -d '{"title":"From Kan","text":"hello","collectionId":"<from /api/collections.list>","publish":true}'
  ```

## Verdict

- **Minimal compose service list:** `outline` + `outline-postgres` + `outline-redis` + `dex` (4 containers; dex is unavoidable because Outline has zero built-in auth). No https-portal, no MinIO, no SMTP. Host port **3458**.
- **Recommended auth for LAN-only:** **Dex OIDC with static password DB (sqlite)** — smallest offline-capable provider; first dex login provisions the Outline admin; email is decorative.
- Storage `local` on a named volume; ~550 MB RAM idle; arm64-native throughout.
