# Portfolio validation

## Current expanded world — 24 November 2026

- All nine simulation and navigation tests passed, including reverse controls and land/river boundaries.
- Production build passed with Vite 8.3.8 on Node 24. The shared JavaScript bundle is about 203 kB gzip and triggers a bundle-size advisory.
- Browser checks confirmed the expanded world renders, the touring car moves, reverse displays an R speed, and the resume card shows its pending-content state.
- The new airport, gallery, bridges and expanded mobile layout have not received exhaustive end-to-end checks. Earlier checks below apply to the earlier world and are not evidence that every expanded feature was rechecked.

## Earlier island — 12 November 2026

- Production build completed with Vite 8.3.8 on Node 24. There is a bundle-size advisory for the shared Three.js module (about 186 kB gzip); no build failure.
- Three simulation tests passed: bounded time steps, no reverse under braking, off-road speed cap and exported provenance.
- Browser checks: full-screen WebGL world rendered; keyboard and touch walking moved the avatar; project markers and menu opened the correct content; AURORA status and limitations were displayed.
- AutoCar: unchecked consent disabled start; consenting enabled start; acceleration changed speed and position; leaving the track displayed feedback; reset returned to the track; finishing displayed session results.
- Participation SVG downloaded successfully from the revised world. The certificate explicitly states that it does not certify research contribution or real training.
- Phone layout inspected at 390 × 844. Touch movement and social panel worked; social destinations matched the owner-provided URLs; GitHub QR rendered. Edge labels are constrained within the viewport.
- All original geometry is procedural. The world uses simple kinematics and approximate collision boundaries, not a full physics engine. Small props are decorative. Real-device GPU performance, every browser, and assistive-technology navigation have not been exhaustively tested.
- No resume, achievements or donations were fabricated. No driving telemetry is uploaded.
