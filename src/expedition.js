import * as T from 'three';
import {journeys} from './journeys.js';
import {addDestinationScenery} from './destination-scenery.js';

const regions=new Map();
export function installDestinations(W){
  for(const [name,spec] of Object.entries(journeys)){
    const group=new T.Group();group.position.set(spec.center[0],0,spec.center[1]);W.world.add(group);
    regions.set(name,{group,...addDestinationScenery(group,spec)});
  }
}

export function exploreDestination(W,name,returnHome,setView){
  const spec=journeys[name],{group,height,walkable}=regions.get(name),avatar=W.avatar;
  group.add(avatar);avatar.visible=true;W.marker.visible=false;
  const ui=document.createElement('section');ui.className='destination-ui';ui.setAttribute('aria-label',name);
  const tea=spec.tea.name.toLowerCase();
  ui.innerHTML=`<article class="island-card postcard"><h1>${name}</h1><h2>${spec.chapter}</h2><p>${spec.story}</p><details><summary>Photo journal · ${spec.views.length} views</summary><figure><img><figcaption></figcaption></figure><div class="photo-controls"><button class="secondary previous" aria-label="Previous photo">←</button><span class="page-count"></span><button class="secondary next" aria-label="Next photo">→</button><button class="secondary viewpoint">Visit this view</button></div></details><div class="tea-stop"><button class="secondary tea-button">Visit the ${tea} stall</button><span role="status"></span></div></article><button class="glass island-back">Fly home ↗</button><div class="island-guide">Walk with the arrows or tap the ground · Drag to look around</div>`;
  document.body.append(ui);
  const find=selector=>ui.querySelector(selector),status=find('[role=status]'),teaButton=find('.tea-button');
  const cup=new T.Mesh(new T.CylinderGeometry(.052,.033,.095,16),new T.MeshStandardMaterial({color:0xd5ae72}));
  cup.position.set(.235,1.08,.13);cup.visible=false;avatar.add(cup);
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  let vista=null,target=null,elapsed=0,cupTime=0,nearTea=false,photo=0;
  function place([x,z],yaw,view=null){vista=view?.aim||null;avatar.position.set(x,height(x,z)+.025,z);avatar.rotation.y=yaw+Math.PI;target=null;setView(yaw,view?.pitch,view?.zoom);}
  place(spec.views[0].spot,spec.views[0].yaw,spec.views[0]);
  function displayPhoto(){
    const view=spec.views[photo],img=find('img');
    img.src='/places/'+view.image+'.webp';img.alt=view.alt;
    find('figcaption').textContent=view.title;find('.page-count').textContent=(photo+1)+' / '+spec.views.length;
  }
  function turn(step){photo=(photo+step+spec.views.length)%spec.views.length;displayPhoto();}
  find('.previous').onclick=()=>turn(-1);find('.next').onclick=()=>turn(1);
  find('.viewpoint').onclick=()=>{const view=spec.views[photo];place(view.spot,view.yaw,view);find('details').open=false;status.textContent='';};
  displayPhoto();find('details').open=innerWidth>=850;
  function sip(){cup.visible=true;cupTime=3;status.textContent='Sipping '+tea+' at the stall.';}
  teaButton.onclick=()=>{if(nearTea){sip();return;}place(spec.tea.spot,0);nearTea=true;teaButton.textContent='Drink '+tea;status.textContent='';};
  find('.island-back').onclick=returnHome;
  function tick(dt,keys,yaw,pitch,distance){
    elapsed+=dt;
    const axis=(a,b)=>Number(keys.has(a)||keys.has(b)),pos=avatar.position;
    let dx=axis('d','arrowright')-axis('a','arrowleft'),dz=axis('s','arrowdown')-axis('w','arrowup');
    if(dx||dz){target=null;[dx,dz]=[dx*Math.cos(yaw)+dz*Math.sin(yaw),-dx*Math.sin(yaw)+dz*Math.cos(yaw)];}
    else if(target){dx=target.x-pos.x;dz=target.z-pos.z;if(Math.hypot(dx,dz)<.17){target=null;dx=dz=0;}}
    const len=Math.hypot(dx,dz);let moving=false;
    if(len){
      if(vista){vista=null;setView(yaw);}
      const x=pos.x+dx/len*dt*5.6,z=pos.z+dz/len*dt*5.6;
      if(walkable(x,pos.z)&&x!==pos.x){pos.x=x;moving=true;}
      if(walkable(pos.x,z)&&z!==pos.z){pos.z=z;moving=true;}
      if(!moving)target=null;
      pos.y=height(pos.x,pos.z)+.025;avatar.rotation.y=Math.atan2(dx,dz);
    }
    const near=Math.hypot(pos.x-spec.tea.counter[0],pos.z-spec.tea.counter[1])<3.3;
    if(near!==nearTea){nearTea=near;teaButton.textContent=near?'Drink '+tea:'Visit the '+tea+' stall';status.textContent='';}
    if(cupTime>0){cupTime-=dt;cup.position.y=1.09+(reduced?0:.27*Math.sin((3-cupTime)*Math.PI/3));if(cupTime<=0)cup.visible=false;}
    W.animateAvatar(reduced?0:elapsed,moving&&!reduced?1:0,false);
    const focus=vista?new T.Vector3(group.position.x+vista[0],vista[1],group.position.z+vista[2]):new T.Vector3(group.position.x+pos.x,pos.y+1.36,group.position.z+pos.z);
    const d=Math.max(4,Math.min(distance,360));
    W.camera.position.copy(focus).addScaledVector(new T.Vector3(Math.sin(yaw)*Math.cos(pitch),Math.sin(pitch),Math.cos(yaw)*Math.cos(pitch)),d);
    W.camera.lookAt(focus);W.renderer.render(W.scene,W.camera);
  }
  function point(event){
    const ray=new T.Raycaster();ray.setFromCamera(new T.Vector2(event.clientX/innerWidth*2-1,1-event.clientY/innerHeight*2),W.camera);
    const floor=group.children.find(o=>o.name==='island-ground');
    if(!floor)return;
    const hit=ray.intersectObject(floor,false)[0];if(!hit)return;
    const p=group.worldToLocal(hit.point);
    if(walkable(p.x,p.z))target=p;
  }
  function dispose(){ui.remove();avatar.remove(cup);cup.geometry.dispose();cup.material.dispose();W.world.add(avatar);W.marker.visible=true;}
  return {tick,point,perform(){if(nearTea)sip();},dispose};
}
