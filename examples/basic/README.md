# Single-page playground

Run `npm run demo` from the package root and open the printed address.
The ZIP includes a prebuilt `dist`, so serving the demo does not require `npm install`.
After editing TypeScript, rebuild before testing the demo.

This page imports `../../dist/index.js` and `../../dist/styles.css`. It does not contain a second toast implementation, use a framework, or load a CDN.

Use the content form, the queue/loading/retry controls, the async-form announcement-ownership recipe, and the non-live event log. Development diagnostics are opt-in and stay silent until you use the report panel's Refresh button; Clear removes the demo's collected reports without changing notifications.
The compact and high-contrast-safe styling examples use only the package's existing public `--a11y-toast-*` custom properties and do not represent a runtime theme API.
Position is intentionally unavailable while notifications exist; changing it safely recreates an empty manager.
Manual assistive-technology checks are described in `docs/MANUAL_TESTS.md`.
