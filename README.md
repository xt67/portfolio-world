# Rayan Rahman / XT67 Research Lab

An explorable Three.js island portfolio featuring AURORA, AutoCar-Sim, CASS and Pune Air Quality Sentinel. Visitors walk with WASD/arrows, click the ground to move, use touch controls or jump to exhibits from the map and menu. The AutoCar garage contains a clickable PC leading to a separate driving circuit. Day/night lighting is available. The portfolio uses the 3D world only; the former simple view and its route have been removed. Social destinations belong to Rayan Rahman and were supplied by the owner. Chai stalls offer optional support links and a downloadable project résumé is available in My Story.

The interaction direction was inspired by the owner’s references, [Bruno Simon](https://bruno-simon.com/) and [Saurabh Mhatre](https://saurabhmhatreportfolio.netlify.app/). The island geometry, character, interface and code are original to this portfolio; no reference-site code or assets were copied.

## Run locally

Use Node.js 24 and npm:

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

AURORA content reflects its documented feasibility status, with publication experiments pending. The 3D portfolio requires WebGL; unsupported browsers receive a clear message and a GitHub link. The interface provides labelled keyboard-accessible actions, a reduced-motion camera mode and touch controls. GitHub QR generation runs locally. Google Fonts may receive ordinary browser font requests; browser fonts fall back to sans-serif if blocked.

## Hosting

Vercel builds this static project using `vercel.json`: Node 24, `npm ci`, `npm run build`, output `dist/`. No server secrets or API keys are required. The repository is https://github.com/xt67/portfolio-world. Keep deployment protection enabled for the private review stage. The historical Sites identity remains in `.openai/hosting.json`; it is not required by Vercel.

## Expanded world

The current world includes a larger irregular coastline, roads, a river with bridges, houses, seating, boats, scattered trees, streetlights and decorative pedestrians. Press C to switch between walking and a touring car, O for the map, M for the destination menu and E to interact nearby. The touring car is separate from the consent-gated timed driving experience.

The personal pavilion presents About, Experience, Resume, Achievements and Future aim as cards. Missing personal details remain explicitly pending. The airport flies to nine playable miniature destinations. Walk with the arrows or select a work stop to walk there, then use the action button or E. Each three-stop activity changes the local landmark and earns an island stamp. Return flights reopen the board, which remembers progress during the current visit. The arcade indexes public GitHub projects. Refresh the snapshot with node scripts/refresh-catalog.mjs. Press Escape for controls, camera settings and movement layouts. The riverside dock offers a sail between the southern bridge and the estuary.

## Driving controls

W / Up accelerates forward; S / Down brakes to zero, then reverses while held. Forward input similarly brakes reverse motion before accelerating. Both pedals together brake. Release both to coast to a stop. Left/Right or A/D steer in both directions. Touch buttons use the same inputs. Reverse is slower than forward and displays an R prefix. Export schema v2 records signed speed and the combined brake/reverse control.
