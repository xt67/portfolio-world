import {bridges, riverX, RIVER_HALF, insideLand, blockedByObjects} from './navigation.js';

// Check the complete hull, including its bow and stern when turning near a bank.
export function boatFits(x, z, heading, obstacles) {
  for (const lateral of [-.95, 0, .95]) {
    for (const forward of [-1.5, 0, 1.5]) {
      const px = x + lateral * Math.cos(heading) + forward * Math.sin(heading);
      const pz = z - lateral * Math.sin(heading) + forward * Math.cos(heading);
      if (!insideLand(px, pz) || Math.abs(px - riverX(pz)) > RIVER_HALF - .1) return false;
      if (bridges.some(b => Math.abs(px-b.x) < b.length/2 && Math.abs(pz-b.z) < b.width/2)) return false;
      if (blockedByObjects(px, pz, obstacles, .2)) return false;
    }
  }
  return true;
}

export function steerBoat(state, throttle, steering, dt, obstacles) {
  const turn = state.heading + steering * Math.min(dt,.05) * 1.6;
  const heading = boatFits(state.x,state.z,turn,obstacles) ? turn : state.heading;
  const travel = throttle * Math.min(dt,.05) * 6;
  const x = state.x + Math.sin(heading)*travel;
  const z = state.z + Math.cos(heading)*travel;
  return boatFits(x,z,heading,obstacles) ? {x,z,heading} : {...state,heading};
}
