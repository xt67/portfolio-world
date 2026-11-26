import test from 'node:test';
import assert from 'node:assert/strict';
import {LAND} from '../src/navigation.js';
import {journeys} from '../src/journeys.js';
import {finalActivities} from '../src/destination-activities.js';
import {validatedLook} from '../src/wardrobe.js';
import {createAvatar} from '../src/avatar.js';
import {Box3} from 'three';

test('both flight destinations sit offshore with water between each coast and the mainland',()=>{
  assert.deepEqual(Object.keys(journeys),['Qatar','Jamshedpur']);
  for(const {center:[x,z],route,feature} of Object.values(journeys)){
    for(let i=0;i<LAND.length;i++){
      const [a,b]=LAND[i],[c,d]=LAND[(i+1)%LAND.length],dx=c-a,dz=d-b;
      const along=Math.max(0,Math.min(1,((x-a)*dx+(z-b)*dz)/(dx*dx+dz*dz||1)));
      assert.ok(Math.hypot(x-a-along*dx,z-b-along*dz)>44);
    }
    assert.ok(route.every(([a,b])=>Math.hypot(a,b)>5&&Math.hypot(a,b)<16.4));
    assert.ok(finalActivities[feature]);
  }
});

test('travellers can load an older look and animate both styles at human scale',()=>{
  assert.deepEqual(validatedLook({style:'legacy',skin:'bad'}),validatedLook());
  for(const style of ['shadow','ember']){
    const options=validatedLook({style,hair:'#e3d6bb',skin:'#59392f'});
    assert.equal(options.style,style);
    assert.equal(options.skin,'#59392f');
    const avatar=createAvatar(options);
    const {max,min}=new Box3().setFromObject(avatar);
    assert.ok(max.y-min.y>1.75&&max.y-min.y<2.1);
    avatar.userData.animate(1,.8);avatar.userData.animate(2,0,true);avatar.userData.dispose();
  }
});
