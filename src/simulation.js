export const SCHEMA = 'xt67-browser-driving/v1';
export function stepCar(state, input, dt) {
  const d = Math.max(0, Math.min(dt, 0.05));
  const speed = Math.max(0, Math.min(9, state.speed + (input.throttle * 5 - input.brake * 11 - 0.9 - state.speed * 0.12) * d));
  const heading = state.heading + input.steer * speed * 0.19 * d;
  const x = state.x + Math.sin(heading) * speed * d;
  const z = state.z + Math.cos(heading) * speed * d;
  const radius = Math.hypot(x / 1.45, z);
  const offRoad = Math.abs(radius - 11) > 2.1;
  return { x, z, heading, speed: offRoad ? Math.min(speed, 3) : speed, offRoad };
}
export function makeSession(samples, elapsed) {
  return { schema: SCHEMA, id: crypto.randomUUID(), createdAt: new Date().toISOString(), environment: 'browser-oval-v1', source: 'synthetic-browser-simulation', elapsedSeconds: Number(elapsed.toFixed(2)), sampleRateHz: 10, units: {position:'simulation-metres',speed:'simulation-metres-per-second',heading:'radians'}, consent: 'local-export-only', modelTrainingPerformed: false, carlaCompatible: false, samples };
}
