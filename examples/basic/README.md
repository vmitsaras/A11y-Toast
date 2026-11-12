# Component showcase, advanced lab and design gallery

From a fresh clone, use Node.js 24 or at least 22.12 on the Node 22 line, then run these commands from the package root:

```sh
npm ci
npm run build
npm run demo
```

Open `http://127.0.0.1:4173/examples/basic/` for the showcase or `http://127.0.0.1:4173/examples/advanced/` for the lab, or `http://127.0.0.1:4173/examples/designs/` for the gallery. Their GitHub Pages routes are the site root, `/advanced/` and `/designs/`. Rebuild after editing TypeScript, and serve the pages over HTTP so their ES modules can load.

The showcase imports `../../dist/index.js`, the separate promise helper, and `../../dist/styles.css`. Its four triggers demonstrate success, Undo, loading, and error with retry. No toast appears automatically. Each example keeps non-live result text available after dismissal or expiry; **Reset examples** clears the simulated state and cancels its owned pending work. Undo restores the simulated item; Close only dismisses the notification. A minimal usage snippet shows the core setup.

The advanced lab retains settings, queue/loading/update/retry controls, animations, announcement-ownership recipes, the note-save recipe, history and diagnostics. Native disclosures group its detailed examples; Tab to a summary and press Enter or Space to open or close it. History, diagnostics and the event log are non-live; their explicit Refresh/Clear controls do not replay announcements or actions. Diagnostics are opt-in. All three pages link to one another and use the same neutral page shell; neither uses a framework, CDN, backend or storage.

Try every trigger and toast control with Tab, Shift+Tab, Enter and Space. Showing a toast should keep focus on the trigger. Result text should remain available after Close; Reset should stop a pending loading/retry example. Actual speech, focus experience, browser zoom and native touch remain separate acceptance checks in [the manual test matrix](../../docs/MANUAL_TESTS.md).

## Advanced lab settings

The lab explicitly sets `maxVisible: 5`; the package default is still three. For a queue test, clear existing notifications, choose persistent timing, show five separate toasts, and then show a sixth. Expect five visible and that sixth queued. Close one visible toast; after its exit completes, the same sixth toast should be promoted once. Queued toasts should not announce before promotion.

The compact, compact dark, and high-contrast-safe styling examples use existing public `--a11y-toast-*` custom properties and scoped component selectors. These are demo styles; package defaults remain light. Position is unavailable while notifications exist because changing it safely recreates an empty manager. The note recipe retains ordinary in-page saved state after its toast expires; the note exists only in page memory.

## Advanced lab animation examples

Choose CSS, GSAP, or View Transition, then select **Animation effect**: Default, Fade,
Fade in from left/right/top/bottom, Slide in from left/right/top/bottom, Zoom in,
or Gentle bounce. Use the existing show and dismiss controls to preview both phases.
Directions describe physical entrance origins, including in RTL; directional exits
return toward that origin. Effect selection is locked until all surfaces finish exiting,
and its value is preserved when switching engines. None disables effect selection and
settles immediately. View Transition requires `Element.startViewTransition()`; unsupported
browsers also settle immediately, without a document-wide transition fallback.

These are lab examples, not package presets. `examples/advanced/demo.js` sets `data-demo-effect` on the
host; `examples/advanced/demo.css` scopes keyframes to that host and the existing CSS driver lifecycle
classes. To reuse an example, copy its scoped rules and keyframes into your host
stylesheet and set the same host attribute. Keep the normal-motion media query and
load the rules after the package stylesheet. Customize timing through the public
`--a11y-toast-enter-duration` and `--a11y-toast-exit-duration` properties. The default
effect retains package styling; custom entrances use 240ms (bounce: 320ms), exits
160ms, directional fades 16px, slides 32px, and zoom starts at 0.96 scale.
GSAP uses `createDemoGsapDriver()` in the lab's `demo.js` to supply effect-specific tween
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

## Reusable skins and design gallery

The dedicated classic examples have moved to [the design gallery](../designs/). Its fifteen static, non-live previews are readable without initializing any toast manager or timer. Use Design, Tone and Include action, then Show preview or a card's Try button to show one persistent, polite toast. Selection changes the next preview and instructions only; a new preview replaces the previous one. Try action updates the same ID to “Action completed.” and removes its action. Dismiss and native Close remove the preview; showing preserves trigger focus.

Each skin is reusable through `a11y-toast/styles.css` plus `a11y-toast/skins/{id}.css` and the root class `.a11y-toast-region--skin-{id}`. See [the complete skin list and setup](../../README.md#toast-skins). The gallery provides matching selectable CSS/HTML/JavaScript instructions, Copy buttons, a standard decorative SVG helper and separate skin/base CSS downloads. Titles, icons and actions are optional; no external font or image asset is needed. Wide hosts use 36rem so the base 32rem inline-action threshold can apply; narrow hosts stack the action.

The lab's Compact, Compact dark and High-contrast-safe composer presets remain unchanged. Skins add no JavaScript option or runtime dependency. Gallery automated verification passes locally; VoiceOver, actual browser zoom, native touch and final-revision remote CI remain pending. See [the verification record](../../docs/VERIFICATION.md).
