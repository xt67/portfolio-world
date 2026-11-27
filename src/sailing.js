import {bridges,bridgeDeckHeight,riverX,RIVER_HALF,insideLand,blockedByObjects} from './navigation.js';

export const WATER_Y=.335;
const occupiedHeight=1.95;
export function upstreamHeading(z){
  return Math.atan2(riverX(z-.05)-riverX(z+.05),-.1);
}

export function riverLocation(z){
  for(const [i,b] of bridges.entries()){
    if(Math.abs(z-b.z)<=b.width/2)return i===0?'Under Old Stone Bridge':'Under Market Bridge';
  }
  if(z<bridges[0].z)return 'Upper river';
  if(z>bridges[1].z)return 'Lower river';
  return 'Between the bridges';
}

export function boatFits(x,z,heading,obstacles=[]){
  const sin=Math.sin(heading),cos=Math.cos(heading);
  for(const [forward,beam] of [[-1.64,.38],[-.7,.72],[0,.73],[.85,.65],[1.45,.32],[1.75,.04]]){
    for(const lateral of [-beam,0,beam]){
      const px=x+lateral*cos+forward*sin,pz=z-lateral*sin+forward*cos;
      if(!insideLand(px,pz)||Math.abs(px-riverX(pz))>RIVER_HALF-.14)return false;
      if(blockedByObjects(px,pz,obstacles,.13))return false;
      for(const b of bridges){
        if(Math.abs(pz-b.z)<=b.width/2&&Math.abs(px-b.x)<=b.length/2&&bridgeDeckHeight(b,px)-.24<WATER_Y+occupiedHeight)return false;
      }
    }
  }
  return true;
}

export function steerBoat(state,throttle,steering,dt,obstacles=[]){
  const step=Math.max(0,Math.min(dt,.05)),travel=throttle*step*6;
  let heading=state.heading+steering*step*1.75;
  let x,z;
  if(!steering&&travel){
    // A centred helm follows the bend. Keep the lateral offset chosen by the visitor.
    const upstream=upstreamHeading(state.z);
    const tangent=Math.cos(heading-upstream)>=0?upstream:upstream+Math.PI;
    const error=Math.atan2(Math.sin(tangent-heading),Math.cos(tangent-heading));
    heading+=error*(1-Math.exp(-step*4));
    z=state.z+Math.cos(heading)*travel;
    x=state.x+riverX(z)-riverX(state.z);
  }else{
    z=state.z+Math.cos(heading)*travel;x=state.x+Math.sin(heading)*travel;
  }
  if(!boatFits(state.x,state.z,heading,obstacles))return state;
  return boatFits(x,z,heading,obstacles)?{x,z,heading}:{...state,heading};
}
