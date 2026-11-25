import {journeys} from './journeys.js';

const stops=[[-9,5],[9,3],[0,-9]];
const progress=new Map();
export function completedStops(name){return progress.get(name)||0;}
export function exploreDestination(W,name,returnHome){
  const T=W.T, spec=journeys[name], scene=new T.Scene();
  scene.background=new T.Color(spec.sky);
  scene.add(new T.HemisphereLight(0xfff7db,0x6f7764,2.4));
  const sun=new T.DirectionalLight(0xffebc8,2.7);sun.position.set(-12,24,15);scene.add(sun);
  const camera=new T.PerspectiveCamera(46,1,.1,160);
  const materials=new Map();
  function mesh(geometry,color,x,y,z,parent=scene){
    if(!materials.has(color))materials.set(color,new T.MeshStandardMaterial({color,flatShading:true}));
    const m=new T.Mesh(geometry,materials.get(color));m.position.set(x,y,z);parent.add(m);return m;
  }
  const box=(w,h,d,c,x,y,z,p)=>mesh(new T.BoxGeometry(w,h,d),c,x,y,z,p);
  const cone=(base,top,h,c,x,y,z,n=8,p)=>mesh(new T.CylinderGeometry(top,base,h,n),c,x,y,z,p);
  const ball=(r,c,x,y,z,p)=>mesh(new T.IcosahedronGeometry(r,1),c,x,y,z,p);
  box(180,.2,180,0x58979c,0,-1.4,0);
  cone(17.8,17.5,1.5,0xa79574,0,-.8,0,48);
  cone(17.5,17.5,.15,spec.ground,0,-.05,0,48);
  function palm(x,z){cone(.32,.19,3.6,0x947350,x,1.8,z);for(let i=0;i<6;i++){const a=i*Math.PI/3;const leaf=ball(1,0x5a9667,x+Math.sin(a)*.85,3.6,z+Math.cos(a)*.85);leaf.scale.set(.45,.36,1.35);leaf.rotation.y=a;}}
  for(let i=0;i<14;i++){
    const a=i*.449, x=Math.sin(a)*15,z=Math.cos(a)*15,h=2+(i*7%5);
    if(spec.terrain==='mountain'||spec.terrain==='forest'){
      cone(1.9,0,h, spec.terrain==='mountain'?0x767e76:0x548062,x,h/2,z,5);
      if(spec.terrain==='mountain')cone(.7,0,h*.36,0xe4e4d5,x,h*.82,z,5);
    } else if(spec.terrain==='sand'){if(i%3===0)palm(x,z);else {const dune=ball(1,0xdab77b,x,.15,z);dune.scale.set(2,.7,1.4);}}
    else if(i%2===0){box(2,h,2,spec.accent,x,h/2,z);box(1.5,.25,1.5,0xf2dca8,x,h+.1,z);}
  }
  // The landmark changes at each work stop. Its finished state survives a return flight.
  const landmark=new T.Group();scene.add(landmark);
  const layers=[new T.Group(),new T.Group(),new T.Group()];layers.forEach(g=>landmark.add(g));
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const c=spec.accent, cream=0xf4deb5;let rotor=null,mover=null;
  switch(spec.feature){
    case 'dhow':
      mover=landmark;box(7,.18,4,0x529f9e,0,.1,0);cone(1.3,1.6,1,0x77523c,0,.7,0,6,landmark).scale.x=2;
      cone(.13,.1,4.8,0x7b6047,0,3,0,8,layers[0]);cone(1.6,0,2.8,cream,.75,3,0,3,layers[1]).scale.z=.12;break;
    case 'falls':
      for(let i=0;i<3;i++){box(2.4,1.6+i,2.5,0x7f877e,i*1.6-1.6,(1.6+i)/2,-i*.8);box(1.6,1.6+i,.16,0x74cbd2,i*1.6-1.6,(1.6+i)/2,1.3-i*.8,layers[2-i]);}break;
    case 'steel':
      box(7,.18,3,0x519ba6,0,.12,0);for(const x of [-3,3])box(.8,2,2,0x717a76,x,1,0,layers[0]);for(const z of [-.9,.9])box(7,.33,.28,c,0,2,z,layers[1]);box(7,.22,2.2,cream,0,2.25,0,layers[2]);break;
    case 'flags':
      for(let i=0;i<3;i++){cone(.12,.08,4,0x69594a,i*2-2,2,0);const flag=cone(.8,0,1.6,[0xe66a50,0xf1be53,0x659fbb][i],i*2-1.4,3.4,0,3,layers[i]);flag.rotation.z=-Math.PI/2;flag.scale.z=.15;}break;
    case 'fort':
      box(6,2,2,0xa67957,0,1,0);for(let i=0;i<3;i++){cone(1,1,3.5,c,i*2.7-2.7,1.75,0);ball(.58,0xffb144,i*2.7-2.7,3.9,0,layers[i]);}break;
    case 'oasis':
      cone(1.8,1.8,.6,0x9d865f,-2,.3,0);cone(1.5,1.5,.1,0x69bcc0,-2,.65,0,24,layers[0]);box(4,.14,.7,0x69bcc0,1,.15,0,layers[1]);palm(3,-1);ball(1.4,0x539867,3,4,-1,layers[2]).scale.y=.5;break;
    case 'mill':
      cone(2,1.25,4,cream,0,2,0);cone(1.65,0,1.6,c,0,4.8,0);rotor=new T.Group();rotor.position.set(0,3.3,1.5);layers[1].add(rotor);for(let i=0;i<4;i++){const a=i*Math.PI/2;box(.48,2,.13,0xa78158,-Math.sin(a),Math.cos(a),0,rotor).rotation.z=a;}ball(.36,c,0,3.3,1.6,layers[0]);break;
    case 'skyline':
      for(let i=0;i<3;i++){const h=3+i*2;box(1.8,h,1.6,c,i*2-2,h/2,0);for(let j=1;j<h;j+=1)box(1.4,.27,.1,0xffda83,i*2-2,j,.84,layers[i]);}break;
    case 'tram':
      mover=landmark;for(const z of [-.7,.7])box(10,.12,.12,0x555c56,0,.1,z);box(4,1.8,1.8,0x53766c,0,1.2,0,landmark);box(4.1,.65,1.85,c,0,.75,0,layers[0]);for(const x of [-1.3,0,1.3])box(.8,.55,.1,cream,x,1.6,.92,landmark);box(.12,1,.12,0x575653,0,2.5,0,layers[1]).rotation.z=-.35;break;
  }
  const markers=stops.map(([x,z],i)=>{
    cone(1.3,1.3,.18,cream,x,.12,z,20);
    const ring=mesh(new T.TorusGeometry(.65,.11,8,24),[0xf1ac55,0x8dc7b7,0xda8b71][i],x,1.4,z);
    return ring;
  });
  const avatar=W.avatar.clone();avatar.visible=true;avatar.position.set(0,.1,9);scene.add(avatar);
  const ui=document.createElement('section');ui.className='destination-ui';ui.setAttribute('aria-label',name+' island');
  ui.innerHTML=`<div class="island-card"><small>BOARDING PASS · ${name}</small><h1>${spec.title}</h1><p>${spec.goal}</p><div class="island-route"></div><p role="status"></p><button class="primary island-act"></button></div><button class="glass island-back">Return flight · Home airport</button><div class="island-guide">Walk with your movement keys or arrows. Select a stop to walk there automatically.</div>`;
  document.body.append(ui);
  const route=ui.querySelector('.island-route'),status=ui.querySelector('[role=status]'),act=ui.querySelector('.island-act');
  let done=completedStops(name),target=null,elapsed=0,near=false;
  const buttons=spec.stops.map(([label],i)=>{const b=document.createElement('button');b.textContent=label;b.onclick=()=>target=stops[i];route.append(b);return b;});
  function paint(){
    layers.forEach((g,i)=>g.visible=i<done);
    buttons.forEach((b,i)=>{b.textContent=(i<done?'✓ ':'')+spec.stops[i][0];b.setAttribute('aria-current',i===done?'step':'false');});
    act.hidden=done===3;act.disabled=!near;
    if(done<3)act.textContent=near?spec.stops[done][1]:'Walk to '+spec.stops[done][0];
  }
  function perform(){if(done>=3||!near)return;status.textContent=spec.stops[done][2];done++;progress.set(name,done);near=false;if(done===3)status.textContent=spec.reward+' · Island stamp earned';paint();}
  act.onclick=perform;ui.querySelector('.island-back').onclick=returnHome;
  status.textContent=done===3?spec.reward+' · Island stamp earned':'First stop: '+spec.stops[done][0];paint();
  function tick(dt,keys,yaw,pitch,distance){
    if(!reduced)elapsed+=dt;
    const axis=(a,b)=>Number(keys.has(a)||keys.has(b));
    let dx=axis('d','arrowright')-axis('a','arrowleft'),dz=axis('s','arrowdown')-axis('w','arrowup');
    if(dx||dz){target=null;[dx,dz]=[dx*Math.cos(yaw)+dz*Math.sin(yaw),-dx*Math.sin(yaw)+dz*Math.cos(yaw)];}
    else if(target){dx=target[0]-avatar.position.x;dz=target[1]-avatar.position.z;if(Math.hypot(dx,dz)<.2){dx=dz=0;target=null;}}
    const len=Math.hypot(dx,dz);if(len){const x=avatar.position.x+dx/len*dt*6,z=avatar.position.z+dz/len*dt*6;if(Math.hypot(x,z)<16.4)avatar.position.set(x,.1,z);avatar.rotation.y=Math.atan2(dx,dz);}
    const pos=avatar.position, here=done<3&&Math.hypot(pos.x-stops[done][0],pos.z-stops[done][1])<2.5;
    if(near!==here){near=here;paint();}
    markers.forEach((m,i)=>{m.visible=i>=done;m.rotation.y=elapsed;m.position.y=1.4+.18*Math.sin(elapsed*2+i);});
    if(done===3){if(rotor)rotor.rotation.z=elapsed;if(mover)mover.position.x=2.3*Math.sin(elapsed*.7);}
    camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();const d=Math.min(50,Math.max(23,distance*.72));
    camera.position.set(pos.x*.68+d*Math.cos(pitch)*Math.sin(yaw),d*Math.sin(pitch)+4,pos.z*.68+d*Math.cos(pitch)*Math.cos(yaw));camera.lookAt(pos.x*.68,1,pos.z*.68);
    W.renderer.render(scene,camera);
  }
  function point(event){const ray=new T.Raycaster();ray.setFromCamera(new T.Vector2(event.clientX/innerWidth*2-1,1-event.clientY/innerHeight*2),camera);const p=new T.Vector3();if(ray.ray.intersectPlane(new T.Plane(new T.Vector3(0,1,0),0),p)&&Math.hypot(p.x,p.z)<16.4)target=[p.x,p.z];}
  function dispose(){ui.remove();scene.remove(avatar);scene.traverse(o=>o.geometry?.dispose());materials.forEach(m=>m.dispose());}
  return {tick,point,perform,dispose};
}
