import test from 'node:test';
import assert from 'node:assert/strict';
import {boatFits,steerBoat} from '../src/sailing.js';
import {riverX,bridges} from '../src/navigation.js';
test('the hull can sail and turn but cannot enter a bank, bridge or occupied water',()=>{
 const z=49,x=riverX(z),start={x,z,heading:Math.PI};
 assert.ok(boatFits(x,z,start.heading,[]));
 assert.ok(steerBoat(start,1,0,.05,[]).z<z);
 assert.notEqual(steerBoat(start,0,1,.05,[]).heading,start.heading);
 assert.ok(!boatFits(x+3.6,z,0,[]));
 for(const b of bridges)assert.ok(!boatFits(b.x,b.z,0,[]));
 assert.deepEqual(steerBoat(start,1,0,.05,[{x,z:z-1.8,r:.4}]),start);
});
