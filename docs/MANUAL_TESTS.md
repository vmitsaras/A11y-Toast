# Manual acceptance

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
| M-14 | Browser zoom at 200%, then 400%; long message/action labels. | Content reflows, list scrolls by keyboard, close/action remain reachable, focused page controls are not completely obscured. | Chrome 153 pass on macOS 27.0 (2026-09-21); Safari pending. |
| M-15 | Enable reduced motion and OS contrast/appearance settings. | No required movement; visible text, borders and focus remain intelligible. | Pending |
| M-16 | Put a host in the application's real modal/route scope; dispose/recreate its view. | No inaccessible out-of-scope action, stale speech or leaked callback; surrounding app explicitly owns navigation focus. | Pending / integration-specific |
| M-17 | Turn off “Show tone label visually”, then create success/warning/error examples and navigate back through them with assistive technology. | No visible tone line is shown, but the tone text remains discoverable to assistive technology and live-announcement wording remains appropriate. | Pending |
| M-18 | With CSS animation enabled, focus a toast control and dismiss it while another notification is queued. | Focus recovers immediately; the exiting surface is not interactive/announced; the queued toast appears only after exit completes. | Pending |
| M-19 | Enable reduced motion, then show/dismiss timed and persistent notifications. | No decorative entrance/exit delay is required; announcement, focus, timing, queue and dismissal semantics remain intact. | Pending |
| M-20 | Enable “Show visual timeout progress”. Test timed, paused, persistent, loading and loading→success notifications. | Indicator appears only for visible timed notifications, freezes on pause, disappears for persistent/loading states, is never announced, and is hidden with reduced motion. | Pending |
| M-21 | Use the Promise success/failure demo controls, then repeat while dismissing the loading toast before settlement. | One notification ID updates from loading to success/friendly error; raw failure detail is never exposed or announced; dismissing loading prevents a late result from recreating/updating it. | Pending |
| M-22 | Use the keyed dedupe demo with the same key under Update existing, Drop new, and Replace existing policies, including while the keyed toast is queued. Then submit an empty key. | Update keeps one ID/position, Drop leaves the existing notification untouched without duplicate speech, Replace waits for visual exit before the new toast appears, and different-case keys remain distinct. The empty-key error is announced once while focus remains usable. | Pending |
| M-23 | Use the DOM-event adapter demo with Toast ownership, then Source ownership; run start → update → dismiss and repeat start. | Toast ownership announces mapped toast content. Source ownership announces through the source status only while toast priority remains Off. Correlated updates reuse one toast and dismissal leaves no stale listener/tracking. | Pending |
| M-24 | In a consuming page using `a11y-menu-button` async state, attach the ecosystem adapter and exercise loading → error → retry/loading → empty → ready. Then destroy the Menu Button and toast in separate runs. | Menu Button's own status is the only speech owner; the toast remains priority Off, mirrors the current source copy on one ID, disappears on ready, and leaves no mirrored toast/listener after either owning lifecycle is destroyed. | Pending / integration-specific |
| M-25 | In each supported browser/screen-reader combination, compare Live regions and experimental ariaNotify transport for one polite and one assertive toast. Record the lifecycle log transport/fallback field. | Exactly one appropriate message is heard for each toast; no duplicate speech occurs. If the API is unavailable, fallback is reported and live-region behavior matches the default. If native ariaNotify is reported, verify real speech manually; a successful call is not a pass by itself. Also verify the deployment's Permissions Policy does not silently block `aria-notify`. | Pending / experimental |
| M-26 | Select GSAP animation in the playground. Show/dismiss top and bottom notifications, dismiss during entrance, test queued promotion, then enable reduced motion and repeat. | Motion direction follows placement; no inline opacity/transform style remains after completion/abort; queue promotion waits for exit; reduced motion skips GSAP entirely; focus and announcement behavior remain unchanged. | Pending |
| M-27 | Enable “Animate stack reflow with GSAP Flip”. Show several toasts, update one to a much longer message, dismiss a middle/first toast with a queued item waiting, then repeat with reduced motion. | Only surviving siblings glide to their new positions; the updated/entering/leaving toast keeps its normal animation ownership; queue promotion reflow happens after exit; no temporary `data-flip-id` or Flip-owned inline style remains; reduced motion causes no Flip layout motion. | Pending |
| M-28 | Select experimental View Transition animation in each supported browser. Show/dismiss multiple toasts, dismiss during entrance, test a queued promotion, then repeat with reduced motion and in a browser without element-scoped support. | Supporting browsers use per-toast scoped motion with no page-wide interaction lock; entrance→exit overlap resolves in order; queued promotion waits for exit; reduced motion skips the API; unsupported browsers use no motion without error; no temporary View Transition data attributes remain. | Pending / experimental |
| M-29 | Enable development diagnostics, create a timed action or timed assertive toast, then inspect the report before and after using Refresh diagnostics; use Clear diagnostics. | No diagnostic is announced or focused automatically. Refresh shows the collected advisory report on demand; Clear empties only that report. Toast rendering, speech, focus and timing are unchanged. | Pending |
| M-30 | Run the async-form recipe once with Form status ownership and once with Toast ownership. Press Save again while saving. | Exactly one owner announces saving and completion in each run. Form ownership keeps the correlated toast priority Off; toast ownership keeps the visible form status non-live. One toast ID is reused for the operation. The Save button remains focused and unavailable for a duplicate submit until completion. | Pending |
| M-31 | Select Compact, Compact dark, and High-contrast-safe styling examples, including with forced colors active. | The examples use existing public custom properties and scoped component selectors. Content reflows, controls remain reachable, and borders, text and visible focus remain distinguishable without relying on shadows or tone color alone. | Pending |

### Stop conditions

Missing or duplicate speech, a disappearing action, lost focus, inaccessible overflow, or a lingering callback after teardown is a finding, not a pass. Record exact reproduction and relevant lifecycle-log rows; the log never substitutes for actual assistive-technology behavior.

### Important distinction

The automated 200% **root text size** / 320px smoke test exercises CSS reflow. It does not verify browser zoom, OS magnification, the VoiceOver reading cursor, speech completion, or this widget's placement in every host application.

### Browser zoom evidence — 2026-09-21

Chrome 153.0.8010.50 on macOS 27.0 (26A428) was reset to 100% and then exercised at Chrome's 200% and 400% browser zoom levels. A persistent toast used a long message and the action label “Undo this unusually long demonstration action safely.” At both levels the message reflowed without horizontal clipping. Keyboard focus brought the action and close controls into view within the scrollable notification region, and focusing the page's Show toast control left that control at least partially visible rather than completely covered by the fixed toast region. This is M-14 Chrome evidence only: Safari zoom, VoiceOver speech/reading order, and H-M06's long-history inspection remain pending.

### Outstanding VoiceOver and zoom evidence

- VoiceOver + Safari: pending for M-01–M-13, M-17–M-25, and M-29–M-31.
- VoiceOver + Chrome: pending for M-01–M-13, M-17–M-25, and M-29–M-31.
- Safari at 200% and 400% browser zoom: pending for M-14 and the history inspector's H-M06 case.
- Chrome zoom has only the M-14 evidence recorded above; the history inspector's H-M06 zoom case remains pending.


## TOAST-270 history acceptance — pending

Run H-M01 through H-M06 in [TOAST-270 verification](./TOAST-270-VERIFICATION.md): on-demand history reading without announcement/action replay, explicit refresh, clear independence and retained focus, queue/promotion semantics, bounded eviction/reload cleanup, and actual browser zoom. Record VoiceOver + Safari and VoiceOver + Chrome separately. Automated DOM checks do not mark these manual rows passed.

## TOAST-290 icon and inline-action acceptance — pending


- With VoiceOver + Safari and VoiceOver + Chrome, show both classic examples. Confirm the icon adds no extra announcement or reading stop, while the message, tone, action and close label remain understandable.
- Reach Undo and Close with the keyboard. Update/remove the icon and change action layout while a control is focused; confirm focus stays usable. Activate Undo and confirm the demo state changes.
- At actual 200% and 400% browser zoom, test long message/action text in both skins. Confirm wrapping, reachable controls, visible focus and no horizontal clipping. Repeat with RTL direction and system high-contrast styling where available.

Record browser/OS/assistive-technology versions and observed behavior before marking any item passed. Automated geometry, reduced-motion and forced-colors checks are separate evidence.

## TOAST-300 swipe dismissal acceptance — pending

- On a touch device, show all five notifications in the in-page stack. Drag one horizontally past the threshold and confirm only that notification is dismissed. Try a short drag and a vertical scroll; neither should dismiss. Confirm pinch zoom still works.
- During a timed notification gesture, cancel the drag and confirm the timer resumes; repeat while the caller has paused the toast and confirm that pause remains. Interrupt with a second touch or a browser pointer cancellation.
- With keyboard and VoiceOver/NVDA as available, use the labeled close button and confirm the same dismissal and sensible focus recovery. Check reduced motion and 200%/400% browser zoom separately.
