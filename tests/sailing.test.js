import test from 'node:test';
import assert from 'node:assert/strict';
import {boatFits,steerBoat,upstreamHeading,WATER_Y} from '../src/sailing.js';
import {riverX,bridges,bridgeDeckHeight,bridgePiers} from '../src/navigation.js';
import {MovementKeys,actionForKey,defaultBindings} from '../src/movement.js';

test('holding forward from the dock clears both raised decks and piers, then reverses back',()=>{
  const obstacles=[...bridges.flatMap(bridgePiers),{x:riverX(-18)+2.45,z:-18,w:1.55,d:3.45}];
  for(const b of bridges){
    assert.equal(bridgeDeckHeight(b,b.x-b.length/2),.5);
    for(const dx of [-3.5,0,3.5])assert.ok(bridgeDeckHeight(b,b.x+dx)-.24>WATER_Y+1.95);
  }
  let state={x:riverX(49),z:49,heading:upstreamHeading(49)};
  for(const direction of [1,-1]){
    const end=direction===1?-39:49;
    let steps=0;
    while(direction*(state.z-end)>0&&steps++<1300){
      const next=steerBoat(state,direction,0,1/30,obstacles);
      assert.ok(direction*(state.z-next.z)>0,'Boat stopped at z='+state.z);
      state=next;
    }
    assert.ok(Math.abs(state.z-end)<.25);
  }
});

test('A and D turn in opposite directions and the whole hull stays clear of banks and obstacles',()=>{
  const z=49,x=riverX(z),start={x,z,heading:Math.PI};
  const left=steerBoat(start,1,1,.05),right=steerBoat(start,1,-1,.05);
  assert.ok(left.x<x&&right.x>x);
  assert.ok(!boatFits(x+3.7,z,0));
  assert.deepEqual(steerBoat(start,1,0,.05,[{x,z:z-1.8,r:.6}]),start);
});

test('WASD, arrows, remaps and overlapping touch presses retain their own releases',()=>{
  const keys=new MovementKeys();
  for(const letter of ['w','a','s','d']){
    assert.equal(actionForKey({key:'Unidentified',code:'Key'+letter.toUpperCase()},defaultBindings,true),letter);
    assert.equal(actionForKey({key:letter.toUpperCase()},defaultBindings,true),letter);
  }
  assert.equal(actionForKey({key:'ArrowUp'},defaultBindings,true),'arrowup');
  assert.equal(actionForKey({key:'z',code:'KeyW'},{z:'w'},false),'w');
  assert.equal(actionForKey({key:'w',code:'KeyW'},{z:'w'},false),'');
  keys.press('KeyW','w');keys.press('KeyA','a');keys.press('touch3','arrowup');keys.press('ArrowUp','arrowup');
  keys.release('touch3');keys.release('KeyA');
  assert.ok(keys.has('arrowup')&&keys.has('w')&&!keys.has('a'));
  keys.clear();assert.ok(!keys.has('w')&&!keys.has('arrowup'));
});
