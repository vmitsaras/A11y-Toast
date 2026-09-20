# Manual acceptance — not executed in this environment

Record macOS version, browser/version, VoiceOver version/settings and date. Use the included build via `npm run demo`. Test VoiceOver + Safari and VoiceOver + Chrome separately. Windows NVDA/JAWS/mobile coverage is not assumed from either result.

| ID | Action | Expected | Status |
| --- | --- | --- | --- |
| M-01 | Open the page with VoiceOver already running. | No unsolicited notification speech. Form controls have useful labels. | Pending |
| M-02 | Show an ordinary success toast while focus is on Show. | Message is announced politely; focus stays on Show. | Pending |
| M-03 | Show visual Error with Polite selected. | It remains polite; tone alone does not cause interruption. | Pending |
| M-04 | Select Assertive and show one important example. | Appropriate urgent announcement; persistent automatic default; no focus jump. | Pending |
| M-05 | Select Off and show a toast. | Visible/browsable message, but no new plugin live announcement. | Pending |
| M-06 | Show five toasts. | Three visible, two queued. Initial visible messages are not silently overwritten by a last-only update; actual spoken output recorded. | Pending |
| M-07 | Close a visible item so a queued item appears. | Exactly that new item becomes active/announced; queued items did not announce early. | Pending |
| M-08 | Use Start loading then Finish loading. | Same toast updates; loading persists; completion is meaningfully announced without duplicate full-widget/control chatter. | Pending |
| M-09 | Tab into notification list and controls. Hover, add/remove focus, and switch browser tabs. | No timeout while relevant focus/hover/hidden pause remains; keyboard exit is available. | Pending |
| M-10 | Add an action, activate it, then use Test action retry twice. | Action/retry labels are discoverable; first failure is understandable and remains available; success updates, not duplicates. | Pending |
| M-11 | Focus Close and dismiss. | Focus returns to a meaningful surviving origin. No keyboard trap or unexplained move to document body. | Pending |
| M-12 | Programmatically update a focused action's message, then remove its action. | The stable control keeps focus for content-only change; a removed control receives a deliberate fallback. | Pending |
| M-13 | Dismiss all, including queued items, with CSS animation enabled and several visible items. | No flash/announcement of queued items during clear; multiple exits may finish visually, but no cleared item is promoted/revived. Demo focus remains on an enabled useful control. | Pending |
| M-14 | Browser zoom at 200%, then 400%; long message/action labels. | Content reflows, list scrolls by keyboard, close/action remain reachable, focused page controls are not completely obscured. | Pending |
| M-15 | Enable reduced motion and OS contrast/appearance settings. | No required movement; visible text, borders and focus remain intelligible. | Pending |
| M-16 | Put a host in the application's real modal/route scope; dispose/recreate its view. | No inaccessible out-of-scope action, stale speech or leaked callback; surrounding app explicitly owns navigation focus. | Pending / integration-specific |
| M-17 | Turn off “Show tone label visually”, then create success/warning/error examples and navigate back through them with assistive technology. | No visible tone line is shown, but the tone text remains discoverable to assistive technology and live-announcement wording remains appropriate. | Pending |
| M-18 | With CSS animation enabled, focus a toast control and dismiss it while another notification is queued. | Focus recovers immediately; the exiting surface is not interactive/announced; the queued toast appears only after exit completes. | Pending |
| M-19 | Enable reduced motion, then show/dismiss timed and persistent notifications. | No decorative entrance/exit delay is required; announcement, focus, timing, queue and dismissal semantics remain intact. | Pending |
| M-20 | Enable “Show visual timeout progress”. Test timed, paused, persistent, loading and loading→success notifications. | Indicator appears only for visible timed notifications, freezes on pause, disappears for persistent/loading states, is never announced, and is hidden with reduced motion. | Pending |
| M-21 | Use the Promise success/failure demo controls, then repeat while dismissing the loading toast before settlement. | One notification ID updates from loading to success/friendly error; raw failure detail is never exposed or announced; dismissing loading prevents a late result from recreating/updating it. | Pending |
| M-22 | Use the keyed dedupe demo with the same key under Update existing, Drop new, and Replace existing policies, including while the keyed toast is queued. | Update keeps one ID/position, Drop leaves the existing notification untouched without duplicate speech, Replace waits for visual exit before the new toast appears, and different-case keys remain distinct. | Pending |
| M-23 | Use the DOM-event adapter demo with Toast ownership, then Source ownership; run start → update → dismiss and repeat start. | Toast ownership announces mapped toast content. Source ownership announces through the source status only while toast priority remains Off. Correlated updates reuse one toast and dismissal leaves no stale listener/tracking. | Pending |

### Stop conditions

Missing or duplicate speech, a disappearing action, lost focus, inaccessible overflow, or a lingering callback after teardown is a finding, not a pass. Record exact reproduction and relevant lifecycle-log rows; the log never substitutes for actual assistive-technology behavior.

### Important distinction

The automated 200% **root text size** / 320px smoke test exercises CSS reflow. It does not verify browser zoom, OS magnification, the VoiceOver reading cursor, speech completion, or this widget's placement in every host application.
