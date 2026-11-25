import {LAND,riverX,insideLand,terrainAllows,blockedByObjects} from './navigation.js';
export function buildTown({T,world,scene,box,cyl,sphere,text,tree,pole,obstacles,car,mat,interactables}){
 const coastline=new T.Shape();LAND.forEach(([x,z],i)=>i?coastline.lineTo(x,-z):coastline.moveTo(x,-z));coastline.closePath();
 const land=new T.Mesh(new T.ExtrudeGeometry(coastline,{depth:2.8,bevelEnabled:false}),[mat(0x8eae87),mat(0xaf9570)]);land.rotation.x=-Math.PI/2;land.position.y=-2.5;land.receiveShadow=true;world.add(land);
 // Meandering river, sandy banks, and two usable bridges.
 function ribbon(width,color,y){const vertices=[];for(let z=-65;z<62;z+=1){if(!insideLand(riverX(z),z))continue;const a=riverX(z),b=riverX(z+1);vertices.push(a-width,y,z,a+width,y,z,b-width,y,z+1,a+width,y,z,b+width,y,z+1,b-width,y,z+1);}const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(vertices,3));geo.computeVertexNormals();const m=new T.Mesh(geo,new T.MeshStandardMaterial({color,side:T.DoubleSide,roughness:.4}));m.receiveShadow=true;world.add(m);return m;}
 ribbon(5.3,0xd6c5a2,.32);const river=ribbon(3.7,0x4fabb0,.34);
 function road(x,z,w,d){box(world,w,.12,d,x,.36,z,0x687875);if(w>d){for(let a=x-w/2+2;a<x+w/2;a+=4)box(world,1.5,.025,.15,a,.44,z,0xf0dfb6);}else for(let a=z-d/2+2;a<z+d/2;a+=4)box(world,.15,.025,1.5,x,.44,a,0xf0dfb6);}
 road(-5,-26,100,5.5);road(-12,35,74,5.5);road(-29,3,5.5,68);road(25,5,5.5,63);road(47,-3,5.5,53);road(36,20,27,5.5);road(-2,-44,5.5,31);road(11,-53,28,5.5);
 for(const z of [-26,20]){const x=riverX(z);box(world,12,.45,7,x,.55,z,0xc2ad88);for(const d of [-3.4,3.4]){box(world,12,.14,.13,x,1.8,z+d,0x655c4b);for(let a=-5;a<=5;a+=2)box(world,.15,1.3,.15,x+a,1.1,z+d,0x655c4b);}for(let a=-5;a<6;a+=1)box(world,.1,.03,6.5,x+a,.8,z,0x998966);}
 const lightMaterials=[];
 function streetLight(x,z){pole(x,z);const globe=new T.Mesh(new T.SphereGeometry(.25,8,6),new T.MeshStandardMaterial({color:0xffdfa1,emissive:0xffbd61,emissiveIntensity:.12}));globe.position.set(x,2.8,z);world.add(globe);lightMaterials.push(globe.material);}
 for(let x=-48;x<54;x+=12){if(Math.abs(x-riverX(-26))>6)streetLight(x,-30);if(Math.abs(x-riverX(35))>6)streetLight(x,39);}for(let z=-14;z<33;z+=12){streetLight(-33,z);streetLight(29,z);streetLight(51,z);}
 function house(x,z,tint){const g=new T.Group();g.position.set(x,.4,z);world.add(g);box(g,6,3.5,5,0,1.75,0,tint);const roof=cyl(g,4.5,2.3,0,4.6,0,0x9e6e5a,0,4);roof.rotation.y=Math.PI/4;roof.scale.z=.85;box(g,1.1,2,.08,0,1,2.55,0x56665b);for(const a of [-1.9,1.9])box(g,1.1,1,.08,a,2,2.56,0xa8d6cd);box(g,1,.25,1,-1.7,5.3,-.8,0x7c6654);obstacles.push({x,z,w:6,d:5});}
 for(const [i,p]of [[-46,-36],[-46,-8],[-48,8],[-46,43],[48,-40],[49,-10],[48,5],[47,33],[-15,45],[9,46]].entries())house(...p,[0xd8c3a3,0xc6d2b6,0xe2b5a1][i%3]);
 function bench(x,z,rot=0){const g=new T.Group();g.position.set(x,.4,z);g.rotation.y=rot;world.add(g);box(g,3,.25,.9,0,.7,0,0xb88960);box(g,3,.8,.12,0,1.2,.4,0xb88960);for(const a of [-1,1])box(g,.13,.65,.6,a,.33,0,0x4f6357);}
 for(const z of [-14,0,10,32])bench(riverX(z)-7,z,Math.PI/2);for(const [x,z]of [[-12,30],[9,28],[-39,31],[-6,-36]])bench(x,z);
 // Waterfront pier and moving toy boats; they are scenery, not transport.
 const dockX=riverX(5);box(world,7,.25,2.5,dockX-3,.65,5,0xb18d68);for(let i=0;i<8;i++)box(world,.08,.03,2.4,dockX-6.2+i*.9,.8,5,0x826d53);
 function boat(z,color){const g=new T.Group();world.add(g);const hull=cyl(g,1,2.8,0,0,0,color,.8,6);hull.rotation.x=Math.PI/2;hull.scale.y=1;box(g,1.2,.5,1.3,0,.45,0,0xeee0be);cyl(g,.035,2.8,0,1.5,0,0x6f6858,.035,6);const sail=new T.Mesh(new T.ConeGeometry(.9,2,3),mat(0xf3e7cd));sail.position.set(.2,1.9,0);sail.scale.z=.08;g.add(sail);return {g,z};}
 const boats=[boat(-9,0xce9579),boat(29,0x7395ac)];
 // Interior trees: deterministic scatter keeps paths, buildings and the runway clear.
 const random=n=>{const k=Math.sin(n*127.1+8.9)*43758.5453;return k-Math.floor(k);};
 let planted=0;for(let i=0;i<900&&planted<125;i++){const x=(random(i)-.5)*116,z=(random(i+900)-.5)*115;const roads=Math.abs(z+26)<5||Math.abs(z-35)<5||Math.abs(x+29)<5||Math.abs(x-25)<5||Math.abs(x-47)<5||Math.abs(z-20)<5&&x>24;const reserved=Math.abs(x)<26&&Math.abs(z)<25||Math.abs(x+40)<10&&Math.abs(z+18)<11||Math.abs(x+40)<10&&Math.abs(z-22)<9||z<-36&&x>-9&&x<30;if(!terrainAllows(x,z,3)||roads||reserved||blockedByObjects(x,z,obstacles,2.3))continue;tree(x,z,.7+random(i+66)*.7,[0x4f7d62,0x67936e,0x8ba77a,0xc0a28c][i%4]);planted++;}
 // Personal pavilion with tangible cards on display.
 const personal=new T.Group();personal.position.set(-40,.5,-18);world.add(personal);box(personal,12,.2,7,0,0,0,0xe4d7bb);box(personal,12,4,.3,0,2,-3.3,0xc9cfb7);text(personal,'THE HUMAN BEHIND THE CODE',0,3.1,-3.1,10);
 for(const [i,label]of ['RESUME','EXPERIENCE','ACHIEVEMENTS','NEXT CHAPTER'].entries()){const card=box(personal,2.25,1.5,.15,-4.2+i*2.8,1.8,-1, [0xf3cc8c,0xa9ccbf,0xc2b5dc,0xe5b29d][i]);card.rotation.z=.08*(i%2?1:-1);text(personal,label,-4.2+i*2.8,1.8,-.9,2,'#294d43');}
 const gallery=new T.Group();gallery.position.set(-40,.5,22);world.add(gallery);box(gallery,12,.2,7,0,0,0,0xe4d7bb);for(let i=0;i<3;i++){box(gallery,3,2.2,.3,-4+i*4,1.6,-1,0xc6d0bb);text(gallery,i?'COMING SOON':'PROJECTS',-4+i*4,1.7,-.8,2.7);}text(gallery,'THE PROJECT GALLERY',0,3.7,-1,10);
 // Airport and a small original plane model.
 box(world,7,.12,27,19,.4,-46,0x596a68);for(let z=-57;z<-33;z+=4)box(world,.25,.03,1.8,19,.48,z,0xf1dfb4);for(let z=-58;z<-35;z+=3)for(const x of [15.3,22.7])sphere(world,.12,x,.6,z,0xffd787);
 box(world,11,3,4,3,1.9,-48,0xd7d8bd);box(world,11.5,.25,4.6,3,3.5,-48,0x92b6a8);box(world,9,1.5,.06,3,2,-45.95,0x658d86);text(world,'NEXT CHAPTER AIRPORT',3,4.2,-46,12);text(world,'FICTIONAL DESTINATIONS',3,1,-45.8,8,'#e9e4ca');
 const plane=new T.Group();world.add(plane);const fuselage=cyl(plane,.5,5,0,.6,0,0xede9d5,.28,16);fuselage.rotation.x=Math.PI/2;box(plane,6.2,.12,1,0,.65,.3,0xece7d2);box(plane,2.3,.12,.6,0,.8,-2,0x93b5aa);box(plane,.12,1,.8,0,1.2,-2,0xebba7b);box(plane,.65,.35,.9,0,.97,1.4,0x517c78);for(const x of [-.5,.5])sphere(plane,.2,x,.15,.5,0x31463e);plane.position.set(19,.6,-44);plane.rotation.y=Math.PI;
 const planeHit=box(plane,1,1,2,0,.5,0,0xede9d5);planeHit.visible=false;planeHit.userData.action='airport';interactables.push(planeHit);
 const travelCar=car.clone();travelCar.scale.setScalar(1.35);travelCar.visible=false;world.add(travelCar);const displayCar=car.clone();displayCar.position.set(19,.5,-7);displayCar.rotation.y=-.6;world.add(displayCar);obstacles.push({x:19,z:-7,r:1.4});
 function person(x,z,i){const g=new T.Group();world.add(g);box(g,.55,.75,.35,0,1,0,[0xd79773,0x819cbe,0xc3ad68,0x9ca780][i%4]);sphere(g,.27,0,1.63,0,0xbf8d6d);const legs=[];for(const a of [-.17,.17])legs.push(box(g,.19,.65,.24,a,.35,0,0x40534b));return {g,x,z,legs,phase:i*1.4};}
 const people=[[-10,6],[7,26],[-31,-4],[42,23],[-35,-30],[5,-39],[24,26],[-24,30]].map(([x,z],i)=>person(x,z,i));
 let flight=null,elapsed=0;
 function fly(destination){flight={destination,time:0};return destination;}
 function tick(dt,reduced){elapsed+=dt;for(const b of boats){const z=b.z+(reduced?0:Math.sin(elapsed*.08)*5);b.g.position.set(riverX(z),.8+(reduced?0:Math.sin(elapsed*1.5)*.05),z);b.g.rotation.y=.1;}
  for(const p of people){const a=reduced?p.phase:elapsed*.13+p.phase;p.g.position.set(p.x+Math.sin(a)*2,.5,p.z+Math.cos(a)*2);p.g.rotation.y=a+Math.PI/2;p.legs.forEach((l,i)=>l.rotation.x=reduced?0:Math.sin(elapsed*5+i*Math.PI)*.3);}
  if(flight){flight.time+=dt;const t=flight.time;plane.position.set(19+Math.max(0,t-5)*1.2,.6+Math.max(0,t-2)*1.4,-44-t*3);plane.rotation.z=-Math.min(.2,t*.01);if(t>18){flight=null;plane.position.set(19,.6,-44);plane.rotation.z=0;}}return flight;
 }
 function blocked(x,z,margin=.4){return !terrainAllows(x,z,margin)||blockedByObjects(x,z,obstacles,margin);}
 function night(on){lightMaterials.forEach(m=>m.emissiveIntensity=on?2.7:.12);}
 const heightAt=(x,z)=>Math.abs(x-riverX(z))<6&&(Math.abs(z-20)<3.5||Math.abs(z+26)<3.5)?.82:.5;
 return {travelCar,blocked,tick,fly,night,river,plane,treeCount:planted,heightAt};
}
