# Single-page playground

Run `npm run demo` from the package root and open the printed address.
The ZIP includes a prebuilt `dist`, so serving the demo does not require `npm install`.
After editing TypeScript, rebuild before testing the demo.

This page imports `../../dist/index.js` and `../../dist/styles.css`. It does not contain a second toast implementation, use a framework, or load a CDN.

Use the content form, the queue/loading/retry controls, the async-form announcement-ownership recipe, and the non-live event log. Development diagnostics are opt-in and stay silent until you use the report panel's Refresh button; Clear removes the demo's collected reports without changing notifications.
The compact and high-contrast-safe styling examples use only the package's existing public `--a11y-toast-*` custom properties and do not represent a runtime theme API.
Position is intentionally unavailable while notifications exist; changing it safely recreates an empty manager.
Manual assistive-technology checks are described in `docs/MANUAL_TESTS.md`.

## Classic CSS animation examples

Choose the CSS animation engine, then select **CSS effect**: Default, Fade,
Fade in from left/right/top/bottom, Slide in from left/right/top/bottom, Zoom in,
or Gentle bounce. Use the existing show and dismiss controls to preview both phases.
Directions describe physical entrance origins, including in RTL; directional exits
return toward that origin. Effect selection is locked until all surfaces finish exiting,
and its value is preserved while using another engine.

These are demo styles, not package presets. `demo.js` sets `data-demo-effect` on the
host; `demo.css` scopes keyframes to that host and the existing CSS driver lifecycle
classes. To reuse an example, copy its scoped rules and keyframes into your host
stylesheet and set the same host attribute. Keep the normal-motion media query and
load the rules after the package stylesheet. Customize timing through the public
`--a11y-toast-enter-duration` and `--a11y-toast-exit-duration` properties. The default
effect retains package styling; custom entrances use 240ms (bounce: 320ms), exits
160ms, directional fades 16px, slides 32px, and zoom starts at 0.96 scale.
Reduced motion skips every effect. No additional animation dependency is needed.

The custom effects also expand the list's scrollable area with motion gutters and
matching negative margins. This keeps resting toast dimensions and placement unchanged
while avoiding clipping at the original list boundary. Gutters stop at window edges,
retain the configured content-height limit, and keep long stacks scrollable. Copy these
layout rules along with the keyframes when reusing a directional example.
