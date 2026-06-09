# ECS Deploy Runbook

## Scope

This runbook deploys the lightweight internal-use stack for the current repo:

- operator console at `/magazine-admin/`
- runtime dist at `/magazine-runtime/`
- basic auth on the console only
- file-backed CRUD and release artifacts kept inside the repo checkout

## Target layout

- `/srv/magazine-digest/current`
- `/srv/magazine-digest/backups`
- `/etc/systemd/system/magazine-digest-operator.service`
- `/etc/nginx/sites-available/magazine-digest.conf`
- `/etc/nginx/sites-enabled/magazine-digest.conf`
- `/etc/nginx/.htpasswd-magazine-digest`

## Services

- `magazine-digest-operator.service`
- `nginx`

## Initial package baseline

- `nodejs` 20.x
- `nginx`
- `apache2-utils`
- `rsync`
- `unzip`

## Publish shape

1. Sync repo contents to `/srv/magazine-digest/current`.
2. Run `node scripts/ops/export-runtime-dist.mjs`.
3. Start `magazine-digest-operator.service` with `--base-path /magazine-admin --runtime-base-path /magazine-runtime --default-remote-base-url same-origin`.
4. Serve operator console through nginx reverse proxy.
5. Serve runtime bundles directly from `/srv/magazine-digest/current/runtime/dist/`.

## Default URLs

- operator console: `http://SERVER_IP/magazine-admin/`
- runtime base url for app: `http://SERVER_IP/magazine-runtime`

## Validation

- `systemctl status magazine-digest-operator --no-pager`
- `systemctl status nginx --no-pager`
- `curl http://127.0.0.1:4174/magazine-admin/api/overview`
- `curl http://127.0.0.1/magazine-runtime/` is not applicable; use file presence or nginx path checks
- `curl http://SERVER_IP/magazine-runtime/channels/dev/manifest.json`

## Packaging cost guardrail

- Current Android internal packaging has a real cash cost of about CNY 20 per build.
- Before paying for a new device build, prefer static checks first:
  - verify server reachability from desktop
  - verify runtime dist URLs and bundle size
  - verify mobile bridge code paths locally
  - prefer server-side fixes such as compression or timeout-friendly delivery when they can unblock the current package
- Only trigger another package build after the likely root cause is narrowed down.

## Current non-goals

- HTTPS
- database-backed CRUD
- external object storage
- multi-user admin auth
