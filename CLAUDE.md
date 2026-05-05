# jmri-client — Project Context

## What this is

`jmri-client` is an npm package — a WebSocket client for JMRI (Java Model Railroad Interface). It handles the JMRI JSON WebSocket protocol: power control, roster management, throttle control, lights, turnouts, and connection lifecycle (reconnection, heartbeat).

Targets both Node.js (≥18) and browsers. Ships CJS, ESM, and a browser bundle (esbuild). Published to npm as `jmri-client`.

## Current branch structure

- `main` — stable releases
- `feature/connection-prefix` — adds optional connection prefix support (JMRI PR #15102), at `4.2.0-beta.2`
- `feature/mock-yaml-config` — branched off `feature/connection-prefix`; adds YAML-configurable mock environment (see below)

## What's on `feature/mock-yaml-config`

Mock mode is now fully configurable at runtime. Users can pass a YAML file path or an inline config object to define their own layout (roster, lights, turnouts, server info, timing) without touching library internals.

Key additions:
- `src/mocks/mock-config.ts` — `MockConfig` type hierarchy + `DEFAULT_MOCK_CONFIG`
- `src/mocks/mock-config-loader.ts` — `loadMockConfig()`, async, supports YAML (Node.js) and inline object (all envs)
- `MockResponseManager` rewritten to derive all state from `MockConfig`; `reset()` restores to config values
- `MockResponseManager` creation moved to `connectMock()` (lazy async, was in constructor)
- `MockOptions` extended with `configPath` and `config` fields
- `examples/mock-config.example.yaml` — annotated copy-and-customize starter
- `build-browser.mjs` — `js-yaml` and `node:fs` marked external
- `docs/MOCK_MODE.md` — fully rewritten
- 3 new test suites: `mock-config-loader`, `mock-response-manager`, `mock-integration` (95 tests)
- Total: 348 tests, 19 suites, 0 failures

## Next steps (not yet done)

- Decide whether to merge `feature/connection-prefix` into `main` first, then rebase `feature/mock-yaml-config` on top
- Bump version to `4.3.0-beta.1` in `package.json` (currently still shows `4.2.0-beta.2`)
- Publish to npm with `beta` dist-tag when ready
- Open PR for `feature/mock-yaml-config`

## Architecture notes

- `src/client.ts` — `JmriClient`, the public API; delegates to managers
- `src/core/websocket-client.ts` — WebSocket lifecycle, reconnection, mock routing
- `src/managers/` — one manager per domain (power, roster, throttle, light, turnout)
- `src/mocks/` — `MockResponseManager`, config loading, default data
- All managers receive a `request()` function and an `EventEmitter`; no direct WebSocket access
- Mock mode: `connect()` → `connectMock()` → `loadMockConfig()` → `new MockResponseManager(config)` → synthetic hello → every subsequent `request()` routes to `MockResponseManager.getMockResponse()`

## Running things

```bash
npm test                    # full suite (Jest, ts-jest)
npm run build               # CJS + ESM + types + browser bundle
npm run demo:mock           # mock mode demo, no JMRI server needed
npm run test:reconnect      # integration: forced reconnect against live server
```

## Publishing

- Uses `beta` dist-tag for pre-release versions
- `prepublishOnly` runs build
- GitHub Actions workflow handles publish on tag push
