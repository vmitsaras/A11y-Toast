# Single-page playground

Run `npm run demo` from the package root and open the printed address.
The ZIP includes a prebuilt `dist`, so serving the demo does not require `npm install`.
After editing TypeScript, rebuild before testing the demo.

This page imports `../../dist/index.js` and `../../dist/styles.css`. It does not contain a second toast implementation, use a framework, or load a CDN.

Use the content form, the queue/loading/retry controls, the async-form announcement-ownership recipe, and the non-live event log. Development diagnostics are opt-in and stay silent until you use the report panel's Refresh button; Clear removes the demo's collected reports without changing notifications.
The compact, compact dark, and high-contrast-safe styling examples use the package's existing public `--a11y-toast-*` custom properties and component selectors. They are demo-only styles, not a runtime theme API; package defaults remain light.
Position is intentionally unavailable while notifications exist; changing it safely recreates an empty manager.
Manual assistive-technology checks are described in `docs/MANUAL_TESTS.md`.

## Classic animation examples

Choose CSS, GSAP, or View Transition, then select **Animation effect**: Default, Fade,
Fade in from left/right/top/bottom, Slide in from left/right/top/bottom, Zoom in,
or Gentle bounce. Use the existing show and dismiss controls to preview both phases.
Directions describe physical entrance origins, including in RTL; directional exits
return toward that origin. Effect selection is locked until all surfaces finish exiting,
and its value is preserved when switching engines. None disables effect selection and
settles immediately. View Transition requires `Element.startViewTransition()`; unsupported
browsers also settle immediately, without a document-wide transition fallback.

These are playground examples, not package presets. `demo.js` sets `data-demo-effect` on the
host; `demo.css` scopes keyframes to that host and the existing CSS driver lifecycle
classes. To reuse an example, copy its scoped rules and keyframes into your host
stylesheet and set the same host attribute. Keep the normal-motion media query and
load the rules after the package stylesheet. Customize timing through the public
`--a11y-toast-enter-duration` and `--a11y-toast-exit-duration` properties. The default
effect retains package styling; custom entrances use 240ms (bounce: 320ms), exits
160ms, directional fades 16px, slides 32px, and zoom starts at 0.96 scale.
GSAP uses `createDemoGsapDriver()` in `demo.js` to supply effect-specific tween
values to the existing package driver, which continues to own cancellation and style
restoration. Copy that helper and supply your GSAP instance to reuse these examples;
its durations are in seconds. Gentle bounce uses a two-part GSAP timeline.
View Transition uses the existing element-scoped driver with the demo stylesheet's
snapshot pseudo-element rules and keyframes. Copy those rules as well when using
that engine. Default keeps each engine's existing animation.
Reduced motion skips every effect. No additional animation dependency is needed.

The custom effects also expand the list's scrollable area with motion gutters and
matching negative margins. This keeps resting toast dimensions and placement unchanged
while avoiding clipping at the original list boundary. Gutters stop at window edges,
retain the configured content-height limit, and keep long stacks scrollable. Copy these
layout rules along with the keyframes when reusing a directional example.

## Classic icon and action examples

The **Classic toast designs** section provides two interactive, in-page examples:
light success feedback with an inline Undo action, and dark information with a title
and supporting message. Each owns a separate manager and is destroyed on page exit.
Click the example buttons to show or restore the previews; Undo changes demo copy only.
Neither preview auto-expires or auto-announces on page load.

Both use `showToneLabel: false` and application-authored SVG DOM elements passed as
`icon`. The slot also supports trusted icon-font elements; the example page includes
a code snippet. HTML strings are not accepted. The core clones the decorative icon,
while the demo styles its circle through public `--a11y-toast-icon-*` properties.
`actionLayout: 'inline'` places the action beside the text in containers at least
32rem wide; narrower containers retain a stacked action. The content form also
exposes this layout option. Copy the `.toast-demo-classic` skin rules for these
appearances; the static viewport rule is specifically for in-page previews.
