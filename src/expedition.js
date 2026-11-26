import * as T from 'three';
import {journeys} from './journeys.js';
import {addDestinationScenery} from './destination-scenery.js';
import {finalActivities,startActivity} from './destination-activities.js';

const regions=new Map();
export function completedStops(name){return regions.get(name)?.done||0;}

function landmark(region,feature) {
  const layers=Array.from({length:3},()=>new T.Group());
  region.add(...layers);
  const materials=new Map();
  function mesh(parent,geometry,color,x,y,z){
    if(!materials.has(color))materials.set(color,new T.MeshStandardMaterial({color,roughness:.82,side:T.DoubleSide}));
    const item=new T.Mesh(geometry,materials.get(color));
    item.position.set(x,y,z);item.castShadow=item.receiveShadow=true;parent.add(item);return item;
  }
  const box=(g,x,y,z,w,h,d,c)=>mesh(g,new T.BoxGeometry(w,h,d),c,x,y,z);
  function spar(g,from,to,r,c){
    const a=new T.Vector3(...from),b=new T.Vector3(...to),axis=b.clone().sub(a);
    const beam=mesh(g,new T.CylinderGeometry(r,r,axis.length(),8),c,...a.clone().lerp(b,.5).toArray());
    beam.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),axis.normalize());return beam;
  }
  let sailboat=null;
  if(feature==='dhow'){

    for(let i=0;i<22;i++)box(region,-4.5+i*.43,.19,2.5,.405,.17,1.2,i%3===0?0x9b7455:0xab835c);
    sailboat=new T.Group();sailboat.position.y=-1.41;region.add(sailboat);
    const hull=new T.Shape();
    hull.moveTo(-3.25,1.1);hull.quadraticCurveTo(-2.35,-.45,1.65,.05);hull.quadraticCurveTo(2.8,.35,3.35,1.32);hull.quadraticCurveTo(0,.55,-3.25,1.1);
    mesh(sailboat,new T.ExtrudeGeometry(hull,{depth:1.05,bevelEnabled:true,bevelSize:.16,bevelThickness:.16,bevelSegments:3,steps:1}),0x654130,0,.14,-.525);
    box(sailboat,0,.89,0,4.45,.14,1.05,0xad7951);
    spar(sailboat,[-.5,.89,0],[-.33,4.8,0],.072,0x825639);
    const line=mesh(layers[0],new T.TorusGeometry(.28,.06,7,24),0xddb877,-1.35,1.06,.1);line.rotation.x=Math.PI/2;
    const fabric=new T.BufferGeometry();fabric.setAttribute('position',new T.Float32BufferAttribute([ -2.1,4.55,0, 1.83,3.65,0, .25,3,.32, 1.83,3.65,0,1.25,1.42,.02,.25,3,.32,1.25,1.42,.02,-2.1,4.55,0,.25,3,.32 ],3));fabric.computeVertexNormals();
    mesh(layers[1],fabric,0xf1dab0,0,0,0);
    spar(layers[1],[-2.17,4.59,0],[1.92,3.65,0],.045,0x765839);
    spar(layers[1],[-2.05,4.55,0],[-2.45,1,.48],.016,0x7d654f);
    sailboat.add(layers[0],layers[1]);
    for(const x of [-4,-2,0,2,4])spar(region,[x,-2.8,2.55],[x,.23,2.55],.11,0x755842);
  }else{

    for(const x of [-3.1,3.1])box(layers[0],x,.6,0,.95,1.3,2.8,0x8e8170);
    for(const z of [-1.14,1.14]){
      box(layers[1],0,1.47,z,7.7,.33,.18,0x7c4542);
      box(layers[1],0,2.85,z,7.7,.12,.14,0xaf6452);
      for(let i=0;i<6;i++)spar(layers[1],[-3.8+i*1.27,i%2?2.85:1.47,z],[-2.53+i*1.27,i%2?1.47:2.85,z],.067,0xb56d59);
    }
    for(const side of [-1,1]){
      const ramp=box(layers[2],side*4.65,.81,0,2.4,.12,2.2,0xae9679);ramp.rotation.z=-side*.70;
    }
    for(let i=0;i<24;i++) box(layers[2],-3.8+i*.33,1.57,0,.31,.12,2.2,i%3===0?0xbda181:0xaf967b);
  }
  return {layers,sailboat,animate(t,done,ride){
    if(sailboat&&done===3){
      sailboat.position.x=ride===null?.16*Math.sin(t*.38):-19*Math.sin(Math.PI*ride)**2;
      sailboat.rotation.z=.018*Math.sin(t*1.1);
    }
  }};
}

export function installDestinations(W){
  for(const [name,spec] of Object.entries(journeys)){
    const group=new T.Group();group.position.set(spec.center[0],0,spec.center[1]);W.world.add(group);
    const scenery=addDestinationScenery(group,spec), work=landmark(group,spec.feature);
    const markers=spec.route.map(([x,z],i)=>{
      const marker=new T.Mesh(new T.OctahedronGeometry(.32),new T.MeshStandardMaterial({color:0xffc779,emissive:0xe49652,emissiveIntensity:.4}));
      marker.position.set(x,1.45,z);group.add(marker);return marker;
    });
    work.layers.forEach(layer=>layer.visible=false);
    regions.set(name,{group,scenery,...work,markers,done:0});
  }
}

// A short detour around the central exhibit keeps click-to-walk routes out of its footprint.
function walkRoute(x,z,to){
  const clear=(a,b)=>{
    const dx=b[0]-a[0],dz=b[1]-a[1],len=dx*dx+dz*dz;
    const t=len?Math.max(0,Math.min(1,-(a[0]*dx+a[1]*dz)/len)):0;
    return Math.hypot(a[0]+t*dx,a[1]+t*dz)>5;
  };
  const from=[x,z];
  if(clear(from,to))return [to];
  const ring=Array.from({length:12},(_,i)=>[6.7*Math.cos(i*Math.PI/6),6.7*Math.sin(i*Math.PI/6)]);
  const nearest=point=>ring.reduce((best,p,i)=>Math.hypot(p[0]-point[0],p[1]-point[1])<Math.hypot(ring[best][0]-point[0],ring[best][1]-point[1])?i:best,0);
  let index=nearest(from);const end=nearest(to),step=(end-index+12)%12<=6?1:-1,path=[ring[index]];
  while(index!==end){index=(index+step+12)%12;path.push(ring[index]);}
  return [...path,to];
}

function waterRoutes(feature,from,route){
  const result=[];
  for(const to of route){
    const harbour=feature==='dhow',axis=harbour?1:0,along=1-axis;
    const a=from[axis],b=to[axis];
    if(a*b<0){
      const at=from[along]+(to[along]-from[along])*a/(a-b);
      if(!harbour||at<4.6){
        const crossings=harbour?[-14,-7,5.8]:[-14,-7,7,13];
        const via=crossings.reduce((best,k)=>Math.abs(at-k)<Math.abs(at-best)?k:best);
        const bank=harbour?3.55:2.85;
        for(const sign of [Math.sign(a),Math.sign(b)])result.push(harbour?[via,sign*bank]:[sign*bank,via]);
      }
    }
    result.push(to);from=to;
  }
  return result;
}

export function exploreDestination(W,name,returnHome){
  const region=regions.get(name),spec=journeys[name],{group,markers}=region;
  const avatar=W.avatar;group.add(avatar);avatar.visible=true;avatar.position.set(name==='Jamshedpur'?3.5:0,.02,9);
  W.marker.visible=false;
  const ui=document.createElement('section');ui.className='destination-ui';ui.setAttribute('aria-label',name);
  ui.innerHTML=`<div class="island-card"><small>RAYAN’S FIELD NOTES</small><h1>${name}</h1><h2>${spec.chapter}</h2><p>${spec.story}</p><details open><summary>${spec.title}</summary><p>${spec.goal}</p><div class="island-route"></div><p role="status"></p><button class="primary island-act"></button><div class="field-activity" hidden></div><button class="primary island-ride" hidden>Sail the dhow</button></details></div><button class="glass island-back">Fly home ↗</button><div class="island-guide">Drag to look around · Walk with the arrows or select a stop</div>`;
  document.body.append(ui);
  const route=ui.querySelector('.island-route'),status=ui.querySelector('[role=status]'),act=ui.querySelector('.island-act'),activity=ui.querySelector('.field-activity');
  let path=[],elapsed=0,near=false,working=false,ride=null;
  const rideButton=ui.querySelector('.island-ride');
  function go(to){path=waterRoutes(spec.feature,[avatar.position.x,avatar.position.z],walkRoute(avatar.position.x,avatar.position.z,to));}
  const buttons=spec.stops.map(([label],i)=>{
    const b=document.createElement('button');b.textContent=label;
    b.onclick=()=>{if(!working)go(spec.route[i]);};
    route.append(b);return b;
  });
  function paint(){
    const done=region.done;
    region.layers.forEach((g,i)=>g.visible=i<done);
    markers.forEach((m,i)=>m.visible=i===done);
    buttons.forEach((b,i)=>{b.textContent=(i<done?'✓ ':'')+spec.stops[i][0];b.setAttribute('aria-current',i===done?'step':'false');b.disabled=working;});
    rideButton.hidden=done!==3||!region.sailboat;
    if(!rideButton.hidden)rideButton.textContent=ride===null?'Sail the dhow':'Return to the pier';
    act.hidden=working||done===3;act.disabled=!near;
    if(done<3)act.textContent=near?spec.stops[done][1]:'Walk to '+spec.stops[done][0];
  }
  function complete(){region.done++;status.textContent=region.done===3?spec.reward+' · Stamp earned':spec.stops[region.done-1][2];activity.hidden=true;working=false;near=false;paint();}
  function perform(){
    if(!near||working||region.done===3)return;
    if(region.done<2){complete();return;}
    working=true;paint();startActivity(activity,finalActivities[spec.feature],complete);
  }
  function disembark(){ride=null;avatar.position.set(0,.015,5.7);avatar.rotation.y=Math.PI;paint();}
  rideButton.onclick=()=>{
    if(ride!==null){disembark();return;}
    path=[];ride=0;avatar.rotation.y=-Math.PI/2;paint();
  };
  act.onclick=perform;ui.querySelector('.island-back').onclick=returnHome;
  status.textContent=region.done===3?spec.reward:'Select a stop to walk there.';paint();
  const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  function tick(dt,keys,yaw,pitch,distance){
    elapsed+=dt;
    const axis=(a,b)=>Number(keys.has(a)||keys.has(b));
    let dx=axis('d','arrowright')-axis('a','arrowleft'),dz=axis('s','arrowdown')-axis('w','arrowup');
    const pos=avatar.position;
    if(working||ride!==null){dx=dz=0;if(ride!==null){ride+=dt/11;if(ride>=1)disembark();}}
    else if(dx||dz){path=[];[dx,dz]=[dx*Math.cos(yaw)+dz*Math.sin(yaw),-dx*Math.sin(yaw)+dz*Math.cos(yaw)];}
    else if(path.length){dx=path[0][0]-pos.x;dz=path[0][1]-pos.z;if(Math.hypot(dx,dz)<.33){dx=dz=0;path.shift();}}
    const len=Math.hypot(dx,dz);
    if(len){const x=pos.x+dx/len*dt*6,z=pos.z+dz/len*dt*6,r=Math.hypot(x,z);const harbour=spec.feature==='dhow';
      const channel=harbour?Math.abs(z)<2.9&&x<4.6:Math.abs(x)<2;
      const lane=harbour?x:z,bridges=harbour?[-14,-7]:[-14,-7,7,13];
      const crossing=bridges.some(at=>Math.abs(at-lane)<.98);
      const deck=!harbour&&region.done===3&&Math.abs(z)<1&&Math.abs(x)<5.7;
      if(deck)pos.set(x,1.64*Math.max(0,Math.min(1,(5.68-Math.abs(x))/1.92)),z);
      else if(r<16.4&&r>4.6&&(!channel||crossing))pos.set(x,crossing&&channel?.13:.015,z);avatar.rotation.y=Math.atan2(dx,dz);}
    const here=region.done<3&&Math.hypot(pos.x-spec.route[region.done][0],pos.z-spec.route[region.done][1])<2.6;
    if(near!==here){near=here;paint();}
    const t=reduce?0:elapsed;
    W.animateAvatar(t,len&&!reduce?1:0,false);
    region.scenery(t,ride);region.animate(t,region.done,ride);
    if(ride!==null)pos.set(region.sailboat.position.x-.8,-.45,.25);
    markers.forEach(m=>{m.rotation.y=t*.8;m.position.y=1.5+.12*Math.sin(t*2);});
    const focus=new T.Vector3(group.position.x+pos.x,pos.y+1.2,group.position.z+pos.z);
    const d=Math.max(4,Math.min(distance,320));
    W.camera.position.copy(focus).addScaledVector(new T.Vector3(Math.sin(yaw)*Math.cos(pitch),Math.sin(pitch),Math.cos(yaw)*Math.cos(pitch)),d);
    W.camera.lookAt(focus);W.renderer.render(W.scene,W.camera);
  }
  function point(event){
    if(working||ride!==null)return;
    const ray=new T.Raycaster();
    ray.setFromCamera(new T.Vector2(event.clientX/innerWidth*2-1,1-event.clientY/innerHeight*2),W.camera);
    const p=new T.Vector3();
    if(ray.ray.intersectPlane(new T.Plane(new T.Vector3(0,1,0),0),p)){
      const x=p.x-group.position.x,z=p.z-group.position.z,r=Math.hypot(x,z);
      if(r>5&&r<16.4)go([x,z]);
    }
  }
  function dispose(){ui.remove();region.scenery(0,null);region.animate(0,region.done,null);W.world.add(avatar);W.marker.visible=true;}
  return {tick,point,perform,dispose,get working(){return working;}};
}
