import {LAND,riverX,RIVER_HALF,BANK_HALF,bridges,roads,paths,locations,insideLand,terrainAllows,onBridge,blockedByObjects,makeScenery,nearestRoad,canPlace} from './navigation.js';

export function buildTown({T,world,box,cyl,sphere,text,tree,pole,obstacles,car,mat,interactables}) {
  const groundY=.3,roadY=.43,deckY=.51;
  function group(x,z,y=.3){const g=new T.Group();g.position.set(x,y,z);world.add(g);return g;}
  function action(object,id){object.userData.action=id;interactables.push(object);return object;}
  function ribbon(points,width,color,y){
    const vertices=[],edges=points.map((p,i)=>{
      const a=points[Math.max(0,i-1)],b=points[Math.min(points.length-1,i+1)],dx=b[0]-a[0],dz=b[1]-a[1],len=Math.hypot(dx,dz)||1;
      return [[p[0]-dz/len*width/2,y,p[1]+dx/len*width/2],[p[0]+dz/len*width/2,y,p[1]-dx/len*width/2]];
    });
    for(let i=1;i<edges.length;i++){const [al,ar]=edges[i-1],[bl,br]=edges[i];vertices.push(...al,...ar,...bl,...bl,...ar,...br);}
    const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(vertices,3));geo.computeVertexNormals();
    const m=new T.Mesh(geo,new T.MeshStandardMaterial({color,side:T.DoubleSide,roughness:.9}));m.receiveShadow=true;world.add(m);return m;
  }
  const coast=new T.Shape();LAND.forEach(([x,z],i)=>i?coast.lineTo(x,-z):coast.moveTo(x,-z));coast.closePath();
  const land=new T.Mesh(new T.ExtrudeGeometry(coast,{depth:3.2,bevelEnabled:false}),[mat(0x8fa57a),mat(0xa78e6a)]);land.rotation.x=-Math.PI/2;land.position.y=-2.9;land.receiveShadow=true;world.add(land);
  // Sand follows the actual jagged coast instead of a square bounding platform.
  ribbon([...LAND,LAND[0]],2.4,0xc5b58a,.315);
  const riverPoints=[];for(let z=-90;z<=85;z+=.5)if(insideLand(riverX(z),z))riverPoints.push([riverX(z),z]);
  ribbon(riverPoints,BANK_HALF*2,0xc9b98d,.32);
  const river=action(ribbon(riverPoints,RIVER_HALF*2,0x4c999e,.335),'river');
  for(const r of paths)ribbon(r.points,r.width,0xc9b893,.36);
  for(const r of roads){
    ribbon(r.points,r.width+1.3,0xb8ad8a,.37);ribbon(r.points,r.width,0x586260,roadY);
    // A continuous strip joins every bend; markings share the same centreline.
    if(r.width>=5)for(let i=3;i<r.points.length-2;i+=5){const [x,z]=r.points[i],b=r.points[i+1];const dash=box(world,.13,.018,1.6,x,.455,z,0xe8d6a7);dash.rotation.y=Math.atan2(b[0]-x,b[1]-z);}
  }
  for(const b of bridges){
    // A flush deck extends beyond both full-width banks, with rails outside traffic.
    box(world,b.length,.18,b.width,b.x,deckY-.09,b.z,0xa59579);
    action(box(world,b.length,.018,b.width-1,b.x,deckY+.01,b.z,0x66716a),'look:Bridge');
    for(const side of [-1,1]){
      action(box(world,b.length,.15,.18,b.x,1.7,b.z+side*(b.width/2-.15),0xe7d5af),'look:Bridge');
      for(let x=-b.length/2+.4;x<b.length/2;x+=2)box(world,.2,1.2,.25,b.x+x,1.1,b.z+side*(b.width/2-.15),0xb6a17f);
      obstacles.push({x:b.x,z:b.z+side*(b.width/2-.15),w:b.length,d:.18});
    }
    for(const dx of [-8,8])for(const dz of [-2.7,2.7])box(world,.7,2,.7,b.x+dx,-.5,b.z+dz,0x8e8c77);
    for(let dx=-10;dx<=10;dx+=4)box(world,1.7,.025,.13,b.x+dx,deckY+.03,b.z,0xf0dcaa);
  }

  const scenery=makeScenery(),lightMaterials=[];
  for(const h of scenery.houses){
    const g=group(h.x,h.z);g.rotation.y=h.rotation;
    const colors=[0xd7b08c,0xb9c6b0,0xd3a39d,0xb6c8c9,0xd0c1a0],color=colors[h.tint];
    box(g,h.w,h.height,h.d,0,h.height/2,0,color);
    // Mixed flat terraces, water tanks and awnings evoke a lived-in neighbourhood.
    box(g,h.w+.35,.2,h.d+.35,0,h.height,0,0xddd2b2);
    for(const x of [-h.w/2,h.w/2])box(g,.15,.55,h.d,x,h.height+.25,0,color);
    box(g,h.w,.55,.15,0,h.height+.25,-h.d/2,color);
    cyl(g,.55,.8,-h.w*.25,h.height+.6,-h.d*.2,0x415555,.55,10);
    box(g,1.1,1.9,.08,0,.95,h.d/2+.02,0x41625d);
    const awning=box(g,h.w*.8,.12,1.4,0,2.3,h.d/2+.5,[0xb8674b,0x5e8a80,0xb49c58][h.tint%3]);awning.rotation.x=-.1;
    for(const x of [-h.w*.3,h.w*.3]){box(g,.8,.95,.06,x,1.8,h.d/2+.05,0x6e9b9c);if(h.height>4.4)box(g,.8,.95,.06,x,4,h.d/2+.05,0x6e9b9c);}
    g.children.forEach(m=>action(m,'look:House'));obstacles.push({x:h.x,z:h.z,r:h.r});
  }
  // Repeated trees share four instanced meshes instead of hundreds of draw calls.
  const dummy=new T.Object3D(),leafColors=[0x467454,0x63825c,0x7d955e,0x4b806d];
  for(const [geo,offset,size,trunk] of [
    [new T.CylinderGeometry(.16,.22,1.8,7),[0,.9,0],1,true],
    [new T.IcosahedronGeometry(1.3,1),[0,2.4,0],1,false],
    [new T.IcosahedronGeometry(.85,1),[.7,2,.3],1,false],
    [new T.IcosahedronGeometry(.8,1),[-.6,2.2,-.3],1,false]
  ]){
    const mesh=new T.InstancedMesh(geo,new T.MeshStandardMaterial({color:0xffffff,roughness:.9}),scenery.trees.length);
    scenery.trees.forEach((t,i)=>{dummy.position.set(t.x+offset[0]*t.scale,.3+offset[1]*t.scale,t.z+offset[2]*t.scale);dummy.scale.setScalar(t.scale*size);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);mesh.setColorAt(i,new T.Color(trunk?0x80634b:leafColors[t.tint]));});
    mesh.castShadow=true;mesh.receiveShadow=true;world.add(mesh);action(mesh,'look:Tree');
  }
  for(const t of scenery.trees)obstacles.push({x:t.x,z:t.z,r:.65*t.scale});
  for(const l of scenery.lamps){pole(l.x,l.z);const globe=new T.Mesh(new T.SphereGeometry(.2,8,6),new T.MeshStandardMaterial({color:0xffdfa1,emissive:0xffbd61,emissiveIntensity:.1}));globe.position.set(l.x,2.8,l.z);world.add(globe);action(globe,'look:Streetlight');lightMaterials.push(globe.material);obstacles.push({x:l.x,z:l.z,r:.25});}

  function bench(x,z,rot=0){const g=group(x,z);g.rotation.y=rot;box(g,3,.22,.9,0,.7,0,0xa77b53);box(g,3,.75,.12,0,1.15,.4,0xa77b53);for(const a of [-1,1])box(g,.14,.65,.65,a,.33,0,0x44564a);g.children.forEach(m=>{m.userData.seat={x,z};action(m,'bench');});obstacles.push({x,z,r:1.5});return g;}
  // Named destinations have one source of coordinates and deliberately open frontages.
  const place=id=>locations.find(l=>l.id===id);
  const personal=group(place('personal').x,place('personal').z);
  box(personal,12,.16,7,0,.12,0,0xd7c8a5);box(personal,12,3.5,.25,0,1.85,-3,0xbfc8ad);text(personal,'THE HUMAN BEHIND THE CODE',0,2.9,-2.8,10);
  for(const [i,label]of ['RESUME','EXPERIENCE','ACHIEVEMENTS','NEXT CHAPTER'].entries()){const card=action(box(personal,2.25,1.5,.15,-4.2+i*2.8,1.6,-1,[0xf3cc8c,0xa9ccbf,0xc2b5dc,0xe5b29d][i]),'personal');card.rotation.z=.06*(i%2?1:-1);text(personal,label,-4.2+i*2.8,1.6,-.9,2);}
  const gallery=group(place('gallery').x,place('gallery').z);
  box(gallery,13,.15,7,0,.12,0,0xd7c8a5);text(gallery,'THE PROJECT ARCADE',0,3.8,-1,11);
  for(let i=0;i<4;i++){box(gallery,2.5,2.8,1.2,-4.5+i*3,1.4,-1,0x3d5c59);action(box(gallery,2.15,1.3,.05,-4.5+i*3,2,-.36,[0x83c9ba,0xedb66b,0xa99ad4,0xa5c77a][i]),'gallery');text(gallery,['VISION','ROBOTICS','DATA','AI'][i],-4.5+i*3,2,-.3,1.8);}

  const lab=group(place('lab').x,place('lab').z);
  box(lab,15,.18,11,0,.1,0,0xc8d6c6);box(lab,14,5,.3,0,2.5,-4,0xbed0ca);box(lab,14.5,.25,2,0,5,-3.5,0x568b86);
  for(const x of [-6.5,6.5])box(lab,.3,4.8,.3,x,2.4,3,0x568b86);
  text(lab,'xt67-LAB',0,4,-3.75,10);text(lab,'SCIENTIFIC RESEARCH GUILD',0,3,-3.75,10);
  const experiment=new T.Group();experiment.position.set(-3,1.8,0);lab.add(experiment);sphere(experiment,.5,0,0,0,0x85e5dd);
  for(let i=0;i<3;i++){const ring=new T.Mesh(new T.TorusGeometry(1.4,.045,6,40),mat(0x58b4b4));ring.rotation.set(i*.8,i*1.2,.4);experiment.add(ring);}
  cyl(lab,1.8,.7,-3,.4,0,0x648e89,1.8,20);action(box(lab,3,1.6,.16,2.8,2,0,0x234f59),'lab');text(lab,'ACTIVATE LAB',2.8,2,.11,2.6,'#bdf5e7');
  const dish=group(-51,-49,5.6);const bowl=new T.Mesh(new T.SphereGeometry(1.8,16,8,0,Math.PI*2,0,Math.PI/2),mat(0xe0e9dc));bowl.rotation.z=.5;dish.add(bowl);cyl(dish,.12,1.5,0,-1.1,0,0x5a7f7b,.12,8);
  obstacles.push({x:place('lab').x,z:place('lab').z-4,w:14,d:.3},{x:-49,z:-46,r:1.8});

  const crew=group(place('ccp').x,place('ccp').z);
  box(crew,13,.2,9,0,.1,0,0x776b63);box(crew,13,5,.3,0,2.5,-3.8,0x514a50);box(crew,13.5,.3,4,0,5,-2.2,0x393e47);
  for(const x of [-6.2,6.2])box(crew,.4,4.8,.4,x,2.4,2.2,0x514a50);
  const neon=new T.MeshStandardMaterial({color:0xeb9e87,emissive:0xff4f4f,emissiveIntensity:.5});const sign=new T.Mesh(new T.BoxGeometry(9,.12,.12),neon);sign.position.set(0,3.5,-3.5);crew.add(sign);
  text(crew,'C C P',0,4.2,-3.5,7,'#ffc3a6');text(crew,'THE CAT COLLECTIVE',0,2.9,-3.5,10,'#e8c5ac');
  bench(68,4);const cat=new T.Group();cat.position.set(3,.5,0);crew.add(cat);sphere(cat,.55,0,.55,0,0x34373c);sphere(cat,.4,0,1.15,0,0x34373c);
  for(const x of [-.27,.27]){const ear=cyl(cat,.2,.45,x,1.5,0,0x34373c,0,3);ear.rotation.z=x; sphere(cat,.06,x*.65,1.2,.37,0xf9d889);}
  action(box(crew,2.8,1.6,.15,-2.8,1.8,0,0x292f38),'ccp');text(crew,'MEET THE CREW',-2.8,1.8,.12,2.5,'#e8c5ac');obstacles.push({x:72,z:.2,w:13,d:.3});

  for(const id of ['chai','tea2','tea3']){const l=place(id),tea=group(l.x,l.z);
  box(tea,4,1.4,2,0,.7,0,0x9f7450);box(tea,5,.18,3.5,0,3,0,0xd49e53);for(const x of [-2,2])box(tea,.12,3,.12,x,1.5,0,0x5d6854);text(tea,l.name.toUpperCase(),0,2.4,1,5);
  for(let i=0;i<3;i++)cyl(tea,.13,.24,-.7+i*.6,1.55,.4,0xf2dbb8,.16,8);
  action(box(tea,1.1,.8,.1,0,1.7,1.05,0xad7848),id);obstacles.push({x:l.x,z:l.z,w:4,d:2});}bench(-56,6,-.7);
  const riverPlace=place('river');for(let i=0;i<4;i++)box(world,5,.15,1.2,riverPlace.x+.4*i,.42-i*.03,riverPlace.z+i*.8,0xc6b38c);
  bench(riverPlace.x-2,riverPlace.z,Math.PI/2);

  const airport=place('airport');box(world,7,.12,28,18,.38,-60,0x566561);
  for(let z=-72;z<-46;z+=4)box(world,.25,.03,1.8,18,.46,z,0xf1dfb4);
  box(world,11,3,4,airport.x,1.8,airport.z,0xd7d8bd);box(world,11.5,.25,4.6,airport.x,3.4,airport.z,0x92b6a8);text(world,'NEXT CHAPTER AIRPORT',airport.x,4.3,airport.z+2.2,12);text(world,'SCENIC FLIGHTS',airport.x,2.2,airport.z+2.1,8);
  obstacles.push({x:airport.x,z:airport.z,w:11,d:4},{x:18,z:-60,w:8,d:29});
  const plane=new T.Group();world.add(plane);const fuselage=cyl(plane,.5,5,0,.6,0,0xede9d5,.28,16);fuselage.rotation.x=Math.PI/2;box(plane,6.2,.12,1,0,.65,.3,0xece7d2);box(plane,2.3,.12,.6,0,.8,-2,0x93b5aa);box(plane,.12,1,.8,0,1.2,-2,0xebba7b);box(plane,.65,.35,.9,0,.97,1.4,0x517c78);for(const x of [-.5,.5])sphere(plane,.2,x,.15,.5,0x31463e);plane.position.set(18,.6,-58);plane.rotation.y=Math.PI;action(fuselage,'airport');

  function boat(base,color){const g=group(0,base,.65);const hull=cyl(g,1,2.8,0,0,0,color,.8,6);hull.rotation.x=Math.PI/2;box(g,1.2,.4,1.3,0,.35,0,0xeadabd);cyl(g,.035,2.5,0,1.2,0,0x6f6858,.035,6);const sail=new T.Mesh(new T.ConeGeometry(.9,1.8,3),mat(0xf3e7cd));sail.position.set(.2,1.7,0);sail.scale.z=.08;g.add(sail);action(hull,'river');return {g,base};}
  const boats=[boat(-7,0xc98261),boat(49,0x7296aa)];
  const travelCar=car.clone();travelCar.scale.setScalar(1.25);travelCar.visible=false;world.add(travelCar);
  // Parked cars sit in reserved exhibit space, away from through roads.
  const displayCar=car.clone();displayCar.position.set(18.5,.5,-8);displayCar.rotation.y=-.4;world.add(displayCar);obstacles.push({x:18.5,z:-8,r:1.5});
  const people=[];
  for(const [i,l]of locations.entries()){
    const g=group(l.x-3,l.z+4.7);box(g,.5,.7,.32,0,1,0,[0xd79773,0x819cbe,0xc3ad68,0x9ca780][i%4]);sphere(g,.25,0,1.6,0,0xb88969);for(const x of [-.17,.17])box(g,.17,.65,.23,x,.35,0,0x40534b);
    if(l.id==='ccp'){cyl(g,.4,.1,0,1.85,0,0x283039,.4,12);cyl(g,.25,.25,0,1.98,0,0x283039,.25,12);}
    if(l.id==='lab')box(g,.58,.8,.37,0,1,0,0xe3ede0);
    obstacles.push({x:l.x-3,z:l.z+4.7,r:.46});action(g.children[0],l.id);people.push({g,l,i});
  }
  // Direction signs make the winding road network legible without tidying its shape.
  for(const [x,z,label]of [[-30,-25,'LAB / AIRPORT'],[49,-24,'CCP QUARTER'],[-24,36,'ARCADE / OLD TOWN'],[18,34,'RIVERSIDE']]){if(!canPlace(x,z,.5,obstacles))continue;cyl(world,.08,2.4,x,1.5,z,0x5c6856,.08,7);box(world,4,.8,.15,x,2.7,z,0x315b54);text(world,label,x,2.7,z+.1,3.7,'#e6dfbd');}
  for(const vehicle of [travelCar,displayCar])vehicle.traverse(m=>{if(m.isMesh)action(m,'vehicle');});
  for(const b of boats)b.g.traverse(m=>{if(m.isMesh&&!m.userData.action)action(m,'river');});
  plane.traverse(m=>{if(m.isMesh&&!m.userData.action)action(m,'airport');});
  world.updateMatrixWorld(true);
  const registered=new Set(interactables);
  world.traverse(o=>{
    if(!o.isMesh||registered.has(o)||o.geometry.type==='BufferGeometry'||o.geometry.type==='ExtrudeGeometry')return;
    const pos=o.getWorldPosition(new T.Vector3());
    if(pos.y<.65)return;
    const closest=locations.reduce((a,b)=>Math.hypot(pos.x-a.x,pos.z-a.z)<Math.hypot(pos.x-b.x,pos.z-b.z)?a:b);
    const crossing=bridges.some(b=>Math.abs(pos.x-b.x)<=b.length/2&&Math.abs(pos.z-b.z)<=b.width/2);
    action(o,crossing?'look:Bridge':Math.hypot(pos.x-closest.x,pos.z-closest.z)<8?closest.id:'look:Streetlight');
  });
  let sailing=false;
  let flight=null,elapsed=0,labActive=false,crewActive=false;
  function fly(destination){flight={destination,time:0};return destination;}
  function activate(id){if(id==='lab')labActive=true;if(id==='ccp')crewActive=true;return id==='lab'?labActive:crewActive;}
  function tick(dt,reduced){
    elapsed+=dt;
    for(const b of boats){if(sailing&&b===boats[1])continue;const z=b.base+(reduced?0:Math.sin(elapsed*.08)*4);b.g.position.set(riverX(z),.65+(reduced?0:Math.sin(elapsed*1.5)*.04),z);b.g.rotation.y=Math.atan2(riverX(z+.2)-riverX(z-.2),.4);}
    if(!reduced){experiment.rotation.y+=dt*(labActive?2:.15);dish.rotation.y+=dt*(labActive?.7:.03);cat.rotation.y=Math.sin(elapsed*.4)*.25;for(const p of people)p.g.rotation.y=Math.sin(elapsed*.2+p.i)*.3;}
    neon.emissiveIntensity=crewActive?2:.4;
    if(flight){flight.time+=dt;const t=flight.time;plane.position.set(18+Math.max(0,t-5)*1.2,.6+Math.max(0,t-2)*1.4,-58-t*3);plane.rotation.z=-Math.min(.2,t*.01);if(t>18){flight=null;plane.position.set(18,.6,-58);plane.rotation.z=0;}}
    return flight;
  }
  function blocked(x,z,margin=.4){return !terrainAllows(x,z,margin)||blockedByObjects(x,z,obstacles,margin);}
  function night(on){lightMaterials.forEach(m=>m.emissiveIntensity=on?2.7:.1);}
  let lastStreetX=Infinity,lastStreetZ=Infinity,street='';
  function roadName(x,z){if(Math.hypot(x-lastStreetX,z-lastStreetZ)>1){street=nearestRoad(x,z).road.name;lastStreetX=x;lastStreetZ=z;}return street;}
  const heightAt=(x,z)=>onBridge(x,z)?deckY+.03:.5;
  return {boat:boats[1].g,setSailing:on=>sailing=on,travelCar,blocked,tick,fly,activate,night,river,plane,heightAt,scenery,roadName};
}
