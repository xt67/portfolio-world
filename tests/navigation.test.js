import test from 'node:test';
import assert from 'node:assert/strict';
import {terrainAllows,riverX,blockedByObjects,bridges,roads,paths,locations,makeScenery,nearestRoad,BANK_HALF} from '../src/navigation.js';
test('river blocks visitors except at the bridges',()=>{
  for(const z of [-40,-10,0,35])assert.equal(terrainAllows(riverX(z),z),false);
  for(const {z} of bridges)assert.equal(terrainAllows(riverX(z),z),true);
  assert.equal(terrainAllows(0,0),true);
  assert.equal(terrainAllows(90,0),false);
});

const scenery=makeScenery();
test('scenery footprints and tree canopies never intrude on any road or approach',()=>{
  assert.ok(scenery.houses.length>=30);
  assert.ok(scenery.trees.length>=140);
  assert.ok(scenery.lamps.length>=15);
  for(const [kind,items] of Object.entries(scenery))for(const o of items){
    const radius=o.r??.35;
    assert.ok(nearestRoad(o.x,o.z,[...roads,...paths]).clearance>radius+.65,`${kind} overlaps lane at ${o.x}, ${o.z}`);
    assert.ok(Math.abs(o.x-riverX(o.z))>BANK_HALF+radius,`${kind} in river bank`);
  }
});
test('both bridge decks span both banks across their entire width and connect to roads',()=>{
  for(const b of bridges){
    for(let z=b.z-b.width/2;z<=b.z+b.width/2;z+=.25){
      assert.ok(b.x-b.length/2<riverX(z)-BANK_HALF-2);
      assert.ok(b.x+b.length/2>riverX(z)+BANK_HALF+2);
    }
    for(let dx=-b.length/2-3;dx<=b.length/2+3;dx+=.3){
      assert.ok(terrainAllows(b.x+dx,b.z,.95),'car cannot traverse bridge approach');
      assert.ok(nearestRoad(b.x+dx,b.z).clearance<0,'bridge deck has no connecting road');
    }
  }
});
test('all driving lanes stay on traversable land, with no house or tree blocking their centre',()=>{
 const fixed=[...locations.slice(0,4).map(l=>({x:l.x,z:l.z-2.85,w:9,d:.3})),{x:0,z:-60,w:11,d:4},{x:18,z:-60,w:8,d:29},{x:72,z:.2,w:13,d:.3},{x:-46,z:-50,w:14,d:.3}];
 const objects=[...scenery.houses,...scenery.trees.map(t=>({...t,r:.65*t.scale})),...scenery.lamps.map(l=>({...l,r:.25})),...fixed].map(o=>o.rotation===undefined?o:{x:o.x,z:o.z,r:o.r});
 for(const r of roads)for(const [x,z] of r.points){
   assert.ok(terrainAllows(x,z,r.width/2),`${r.name} leaves dry land without a bridge`);
   assert.ok(!blockedByObjects(x,z,objects,.95),`${r.name} blocked at ${x},${z}`);
 }
 for(const l of locations)assert.ok(terrainAllows(l.x,l.z+4.6,.95),`${l.id} arrival is blocked by water`);
});
test('scenery generation is stable between visits',()=>{
 assert.deepEqual(makeScenery(),scenery);
});
test('collision bounds account for vehicles and building footprints',()=>{
  const obstacles=[{x:10,z:10,w:6,d:4},{x:-10,z:-10,r:1}];
  assert.equal(blockedByObjects(12.8,10,obstacles),true);
  assert.equal(blockedByObjects(14,10,obstacles),false);
  assert.equal(blockedByObjects(-8.5,-10,obstacles,1),true);
});
