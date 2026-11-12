# Rayan Rahman / XT67 Research Lab

An explorable Three.js island portfolio featuring AURORA, AutoCar-Sim, CASS and Pune Air Quality Sentinel. Visitors walk with WASD/arrows, click the ground to move, use touch controls or jump to exhibits from the map and menu. The AutoCar garage contains a clickable PC leading to a separate driving circuit. Day/night lighting and a simpler page at `?view=classic` are available. Social destinations belong to Rayan Rahman and were supplied by the owner. Donations are intentionally omitted. Resume and achievements are pending owner-provided material.

The interaction direction was inspired by the owner’s references, [Bruno Simon](https://bruno-simon.com/) and [Saurabh Mhatre](https://saurabhmhatreportfolio.netlify.app/). The island geometry, character, interface and code are original to this portfolio; no reference-site code or assets were copied.

## Run locally

Use Node.js 22.12+ (tested on Node 24) and npm:

```sh
npm ci
npm test
npm run dev
npm run build
```

## Driving experience

The visitor explicitly consents before a session begins. Up to 45 seconds of synthetic state/action samples remain in browser memory. No driving samples, personal identifiers or certificates are sent to a server. The visitor can download a JSON session or an SVG participation certificate. Closing the tab discards data. Gameplay pauses while the page is hidden. Keyboard and pointer controls are supported.

The browser oval uses simplified kinematics; it is not CARLA, cannot evaluate the Python models and does not perform real model training. Its sample schema explicitly records this. Participation certificates are decorative, not credentials or evidence of scientific contribution. Resetting the car is available with R or the Reset car button; resets are counted in the export.

## Content and accessibility

AURORA content reflects its documented feasibility status, with publication experiments pending. The project cards remain accessible when WebGL is unavailable; driving requires WebGL. The interface provides labelled keyboard-accessible actions, a reduced-motion camera mode and touch controls. GitHub QR generation runs locally. Google Fonts may receive ordinary browser font requests; browser fonts fall back to sans-serif if blocked.

## Hosting

The Sites identity is stored in `.openai/hosting.json`. Vite generates static assets in `dist/`. No server secrets or API keys are required. A private deployment is the initial review version; public audience must be verified before advertising the site to visitors.
