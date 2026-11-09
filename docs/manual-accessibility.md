# Windows manual accessibility walkthrough

These checks are pending until a person performs them. Automated axe and Playwright results do not count as completion.

## Preparation

1. Use Windows Chrome or Edge at 100% zoom, then repeat the narrow-layout checks at approximately 320 CSS pixels.
2. Start the local production UI and disposable local Supabase stack using `docs/setup.md`.
3. Use a confirmed local test user. Do not use a personal production account.
4. Run the keyboard pass with the mouse put aside.
5. Run the screen-reader pass with an already installed NVDA version, or Windows Narrator if NVDA is unavailable. Record browser and screen-reader versions.

## Keyboard-only pass

### Public sample quiz

1. Open `/sample-quiz`, press `Tab`, and confirm the skip link appears first.
2. Activate the skip link with `Enter`; focus must move to main content.
3. Traverse navigation and page controls with `Tab` and `Shift+Tab`; visible focus must follow the visual order.
4. Enter each radio group. Use arrow keys to move and `Space` to select; focus must remain within the expected group.
5. Confirm “Check sample answers” is disabled until every question has an answer.
6. Submit with `Enter`; focus must move once to the score heading.
7. Press `Tab` again; focus must continue forward without a loop or hidden target.
8. Repeat at the narrow viewport and confirm focused controls stay visible with no horizontal keyboard trap.

### Signed-in quiz, result, and recommendations

1. Open `/account`, sign in, and confirm focus remains usable through loading and any validation message.
2. Navigate to `/quizzes`, open a quiz, and answer every radio group using arrow keys and `Space`.
3. Submit with `Enter`; focus must move to the authoritative score heading exactly once.
4. Use “Start a new attempt” and confirm the fresh form is operable.
5. Cause a recoverable local grading error by stopping the local grading adapter after the page loads, then submit. Confirm the error is visible and retry/new-attempt controls remain reachable. Restart the adapter before continuing.
6. Open `/dashboard`; traverse attempt history, recommendation quiz links, and challenge links.
7. Confirm recommendation status is understandable without color and no sample result appears in signed-in progress.
8. Sign out and confirm private attempts and recommendations leave the page and tab order.

## Screen-reader pass

Repeat both flows while listening for:

- A useful page title, main heading, landmarks, and navigation name.
- Each radio group's question, option, selected state, and position.
- The disabled state of incomplete submission controls.
- One score announcement after submission—the focused heading must not be repeated by a live region.
- Error alerts announced once, without stealing focus into a trap.
- Loading messages that do not repeatedly interrupt.
- Recommendation status, topic, exact displayed score, early-signal or incomplete-evidence explanation, and descriptive link purpose.
- Removal of the prior user's private content after sign-out or account change.

## Evidence to record

For every step record pass, fail, or blocked; browser and version; screen reader and version; viewport; duplicate or missing speech; focus loss; traps; and any corrective checkpoint. Do not mark either walkthrough passed until the person performing it confirms the observed result.
