import test from 'node:test';
import assert from 'node:assert/strict';
import {terrainAllows,riverX,blockedByObjects} from '../src/navigation.js';
test('river blocks visitors except at the bridges',()=>{
  for(const z of [-40,-10,0,35])assert.equal(terrainAllows(riverX(z),z),false);
  for(const z of [-26,20])assert.equal(terrainAllows(riverX(z),z),true);
  assert.equal(terrainAllows(0,0),true);
  assert.equal(terrainAllows(90,0),false);
});
test('collision bounds account for vehicles and building footprints',()=>{
  const obstacles=[{x:10,z:10,w:6,d:4},{x:-10,z:-10,r:1}];
  assert.equal(blockedByObjects(12.8,10,obstacles),true);
  assert.equal(blockedByObjects(14,10,obstacles),false);
  assert.equal(blockedByObjects(-8.5,-10,obstacles,1),true);
});
