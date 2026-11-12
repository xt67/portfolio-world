import test from 'node:test';
import assert from 'node:assert/strict';
import {stepCar, makeSession} from '../src/simulation.js';
const initial = {x:15.95,z:0,heading:0,speed:0};
test('car cannot move backwards and timestep is bounded',()=>{
  assert.equal(stepCar(initial,{throttle:0,brake:1,steer:0},1).speed,0);
  assert.deepEqual(stepCar(initial,{throttle:1,brake:0,steer:1},10),stepCar(initial,{throttle:1,brake:0,steer:1},0.05));
});
test('leaving track caps speed and marks the sample',()=>{
  const car=stepCar({...initial,x:40,speed:8},{throttle:1,brake:0,steer:0},0.01);
  assert.equal(car.offRoad,true); assert.ok(car.speed<=3);
});
test('session preserves provenance and never claims training',()=>{
  const session=makeSession([{time:0}],2.345);
  assert.equal(session.modelTrainingPerformed,false); assert.equal(session.carlaCompatible,false);
  assert.equal(session.elapsedSeconds,2.35); assert.equal(session.samples.length,1);
  assert.match(session.id,/^[\da-f-]{36}$/);
});
