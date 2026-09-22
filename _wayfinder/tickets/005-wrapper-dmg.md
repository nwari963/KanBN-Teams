---
type: wayfinder-ticket
status: closed
labels: [wayfinder:task]
blocked_by: ['003-verify-kan-onboard']
---

# Bundle OTSICAL desktop wrapper DMG

## Question
Once Kan URL confirmed: cargo build --release + tauri bundle from desktop-wrapper/ (compiles in dev already; tauri.conf targets dmg+app; KAN_URL compile-time, teammate builds use http://192.168.1.125:3456). Record DMG path, size, target URL.

## Context
Repo root: /Users/nwariri/OTH=RCOD=.DEV/EXPERIMENTS/KANBN TEAMS. See map Notes.

## Required outcome
Resolution comment (in-ticket '## Resolution' section) + status: closed when done; map's Decisions so far gains one line.

## Resolution
Built and verified `desktop-wrapper/target/release/bundle/dmg/Kan Desktop_0.1.0_aarch64.dmg` (3,972,675 bytes; SHA-256 `507059c0dc760ced88211f9b188d41443a9d78b276660d38d27690bb2c0fe22c`). The wrapper targets `http://192.168.1.125:3456`.

### Final branded rebuild
Rebuilt as `OTSICAL Desktop`; final artifact `artifacts/OTSICAL-Desktop-0.1.0-arm64.dmg` (3,954,380 bytes), targeting stable mDNS URL `http://MacBook-Pro-de-Angelo.local:3456`; SHA-256 `a29fc3f15c0d31503522cbd23e31f84551fc963c4aaa632dcecc76f2937c08a6`. Tauri's generated DMG script failed after building the `.app`; fallback `hdiutil create` successfully packaged the verified app.

### Signature verification
Regenerated the app bundle, applied an ad-hoc deep signature, verified with `codesign --verify --deep --strict`, repackaged, mounted the DMG, and verified the installed app again. Final artifact: 3,911,406 bytes; SHA-256 `f780620d61ed500f22d026bde420f05bc93becfc7f5e3b1cf7c9745187993865`. It is ad-hoc signed, not Apple-notarized; Gatekeeper may require right-click → Open on first launch.
