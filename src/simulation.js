export const SCHEMA = 'xt67-browser-driving/v2';
export function stepVehicle(state, input, dt, limits = { forward: 9, reverse: 4 }) {
  const d = Math.max(0, Math.min(dt, 0.05));
  let speed = state.speed;
  if (input.throttle && !input.brake) {
    speed = speed < 0 ? Math.min(0, speed + 11 * d) : speed + 5 * d;
  } else if (input.brake && !input.throttle) {
    speed = speed > 0 ? Math.max(0, speed - 11 * d) : speed - 3.5 * d;
  } else {
    const deceleration = input.throttle && input.brake ? 11 : 0.9 + Math.abs(speed) * 0.12;
    speed = Math.sign(speed) * Math.max(0, Math.abs(speed) - deceleration * d);
  }
  speed = Math.max(-limits.reverse, Math.min(limits.forward, speed));
  const heading = state.heading + input.steer * speed * 0.19 * d;
  const x = state.x + Math.sin(heading) * speed * d;
  const z = state.z + Math.cos(heading) * speed * d;
  return { x, z, heading, speed };
}
export function stepCar(state, input, dt) {
  const next = stepVehicle(state, input, dt);
  const { x, z, speed } = next;
  const radius = Math.hypot(x / 1.45, z);
  const offRoad = Math.abs(radius - 11) > 2.1;
  return { ...next, speed: offRoad ? Math.max(-2, Math.min(speed, 3)) : speed, offRoad };
}
export function makeSession(samples, elapsed) {
  return { schema: SCHEMA, id: crypto.randomUUID(), createdAt: new Date().toISOString(), environment: 'browser-oval-v2', source: 'synthetic-browser-simulation', elapsedSeconds: Number(elapsed.toFixed(2)), sampleRateHz: 10, units: {position:'simulation-metres',speed:'signed-simulation-metres-per-second',heading:'radians'}, controls: {throttle:'forward; brakes while reversing',brake:'brake to a stop, then reverse',steer:'signed steering input'}, consent: 'local-export-only', modelTrainingPerformed: false, carlaCompatible: false, samples };
}
