import test from 'node:test';
import assert from 'node:assert/strict';
import {stepCar, makeSession} from '../src/simulation.js';
const initial = {x:15.95,z:0,heading:0,speed:0};
test('timestep is bounded',()=>{
  assert.deepEqual(stepCar(initial,{throttle:1,brake:0,steer:1},10),stepCar(initial,{throttle:1,brake:0,steer:1},0.05));
});
test('holding down brakes to a stop before reversing',()=>{
  let car={...initial,speed:0.2};
  const input={throttle:0,brake:1,steer:0};
  car=stepCar(car,input,0.05);
  assert.equal(car.speed,0);
  const z=car.z;
  car=stepCar(car,input,0.05);
  assert.ok(car.speed<0); assert.ok(car.z<z);
});
test('forward input stops reverse before moving forward',()=>{
  const input={throttle:1,brake:0,steer:0};
  let car=stepCar({...initial,speed:-0.2},input,0.05);
  assert.equal(car.speed,0);
  car=stepCar(car,input,0.05); assert.ok(car.speed>0);
});
test('coasting and opposing inputs stop without changing direction',()=>{
  for(const speed of [-0.02,0,0.02])for(const throttle of [0,1]) {
    const car=stepCar({...initial,speed},{throttle,brake:throttle,steer:0},0.05);
    assert.equal(Math.abs(car.speed),0);
  }
});
test('reverse steering changes direction and reverse speed is limited',()=>{
  const forward=stepCar({...initial,speed:2},{throttle:0,brake:0,steer:1},0.01);
  const reverse=stepCar({...initial,speed:-2},{throttle:0,brake:0,steer:1},0.01);
  assert.ok(forward.heading>0); assert.ok(reverse.heading<0);
  assert.equal(stepCar({...initial,speed:-4},{throttle:0,brake:1,steer:0},.05).speed,-4);
  assert.equal(stepCar({...initial,x:40,speed:-4},{throttle:0,brake:1,steer:0},.05).speed,-2);
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
