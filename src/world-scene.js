import {atmosphere,dressPavilion,plazaTiles} from './art-direction.js';
import * as T from 'three';
import {createAvatar} from './avatar.js';
import {buildTown} from './town.js';
import {locations} from './navigation.js';
export {locations};
export function createWorld(canvas,look){
 const renderer=new T.WebGLRenderer({canvas,antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));renderer.setClearColor(0x214f57);renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.03;
 const scene=new T.Scene();scene.fog=new T.Fog(0xc9ccc0,210,550);const camera=new T.PerspectiveCamera(42,1,.1,1750);camera.position.set(46,53,59);camera.lookAt(0,0,0);
 const hemi=new T.HemisphereLight(0xf3eee2,0x67617d,1.55);scene.add(hemi);const sun=new T.DirectionalLight(0xffdbad,2.35);sun.position.set(-90,118,-48);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-155,right:155,top:140,bottom:-140,near:.5,far:340});sun.shadow.bias=-.00012;sun.shadow.normalBias=.018;scene.add(sun);
 const world=new T.Group();scene.add(world);const interactables=[],obstacles=[],animated=[];const materialCache=new Map();
 function mat(color){if(!materialCache.has(color))materialCache.set(color,new T.MeshStandardMaterial({color,roughness:.85}));return materialCache.get(color);}
 function mesh(parent,geo,color,x=0,y=0,z=0){const m=new T.Mesh(geo,mat(color));m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
 function box(p,w,h,d,x,y,z,c){return mesh(p,new T.BoxGeometry(w,h,d),c,x,y,z);}
 function cyl(p,r,h,x,y,z,c,r2=r,n=32){return mesh(p,new T.CylinderGeometry(r2,r,h,n),c,x,y,z);}
 function sphere(p,r,x,y,z,c){return mesh(p,new T.IcosahedronGeometry(r,1),c,x,y,z);}
 function text(p,label,x,y,z,width=6,color='#1c423e'){const c=document.createElement('canvas');c.width=1024;c.height=180;const ctx=c.getContext('2d');ctx.fillStyle=color;ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='bold 70px sans-serif';ctx.fillText(label,512,92,990);const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;const m=new T.Mesh(new T.PlaneGeometry(width,width*180/1024),new T.MeshBasicMaterial({map:tex,transparent:true,side:T.DoubleSide,depthWrite:false}));m.position.set(x,y,z);p.add(m);return m;}
 const water=mesh(scene,new T.PlaneGeometry(2000,2000),0x285f67,0,-1.42,0);water.rotation.x=-Math.PI/2;water.receiveShadow=false;const weather=atmosphere(scene,water);
 // The town module supplies a larger, irregular coastline.
 cyl(world,7.5,.16,0,.37,0,0xe3d3ad,7.5,48);cyl(world,5.8,.03,0,.47,0,0xf2dfb4,5.8,48);
 const plaza=new T.Mesh(new T.CircleGeometry(5.78,64),plazaTiles());plaza.rotation.x=-Math.PI/2;plaza.position.y=.492;world.add(plaza);
 text(world,'RAYAN RAHMAN',0,.52,1,11).rotation.x=-Math.PI/2;text(world,'XT67 · A WORLD OF EXPERIMENTS',0,.53,3,7,'#54756b').rotation.x=-Math.PI/2;
 function tree(x,z,scale=1,tint=0x5b8b70){const g=new T.Group();g.position.set(x,.3,z);g.scale.setScalar(scale);world.add(g);cyl(g,.16,1.8,0,.9,0,0x80634b,.22,7);sphere(g,1.3,0,2.4,0,tint);sphere(g,.85,.7,2,.3,tint);sphere(g,.8,-.6,2.2,-.3,tint);obstacles.push({x,z,r:.65*scale});}
 function pavilion(l){const g=new T.Group();g.position.set(l.x,.5,l.z);world.add(g);box(g,9,.2,6,0,.15,0,0xf1e5c9);box(g,9,3.5,.3,0,2,-2.85,0xe2ddc9);for(const x of [-4.3,4.3])box(g,.28,4,.28,x,2,2.5,0xc5c6ad);box(g,9.6,.22,1.2,0,4.1,-2.8,l.color);box(g,9.6,.22,1.2,0,4.1,2.7,l.color);for(const x of [-4.5,4.5])box(g,.3,.25,6,x,4.1,0,l.color);text(g,l.name.toUpperCase(),0,3.1,-2.65,7);dressPavilion(g,l.color,box);for(const dx of [-4.3,-1.46,1.46,4.3])obstacles.push({x:l.x+dx,z:l.z+2.63,r:.14});obstacles.push({x:l.x,z:l.z-2.85,w:9,d:.3});return g;}
 function monitor(g,x,z,w=2.3){box(g,w,1.4,.15,x,2.05,z,0x23453f);const screen=box(g,w-.14,1.23,.02,x,2.05,z+.09,0x90d8b4);box(g,.13,.55,.13,x,1.1,z,0x38584d);box(g,.8,.1,.5,x,.83,z,0x38584d);for(let i=0;i<4;i++)box(g,w*.64,.04,.025,x-.1,2.45-i*.24,z+.11,0x2d7771);return screen;}
 const research=pavilion(locations[0]);box(research,5,.15,2.5,0,1.05,0,0x749f96);for(const x of [-2,2])box(research,.2,1,.2,x,.55,0,0x52756b);monitor(research,0,-.5,3);const orb=sphere(research,.75,0,3.1,.4,0x93e1d2);const orbit=new T.Mesh(new T.TorusGeometry(1.1,.035,8,48),mat(0x468e86));orbit.position.copy(orb.position);orbit.rotation.x=.8;research.add(orbit);animated.push(orbit);text(research,'REAL → SYNTHETIC → EVALUATE',0,.65,1.32,4.5);
 const garage=pavilion(locations[1]);box(garage,5,.16,2.3,0,1.15,0,0xb78b60);for(const x of [-2,2])box(garage,.16,1.1,.16,x,.55,0,0x5e725c);const pc=monitor(garage,0,-.4,3);pc.userData.action='drive';interactables.push(pc);box(garage,1.5,.1,.5,0,1.3,.65,0x314b43);box(garage,.9,1.4,1.3,3.1,.9,0,0x314b43);box(garage,.03,.8,.7,3.57,1,0,0xffb76b);box(garage,1.3,.2,1.1,0,.7,2,0x5a7763);box(garage,1.3,.85,.2,0,1.2,2.5,0x5a7763);text(garage,'PLAY AT THE TERMINAL',0,.5,3.3,6,'#4e6456').rotation.x=-Math.PI/2;
 const data=pavilion(locations[2]);for(let j=0;j<3;j++){box(data,1.6,2.4,1.4,-2.5+j*2.5,1.35,0,0x3c5550);for(let i=0;i<5;i++){box(data,1.25,.25,.05,-2.5+j*2.5,.5+i*.4,.73,0x233c38);box(data,.12,.12,.03,-2+j*2.5,.5+i*.4,.77,0xbca8ef);}}text(data,'ASK → QUERY → UNDERSTAND',0,.65,2,6);
 const air=pavilion(locations[3]);for(let i=0;i<7;i++){const h=.7+(i%3)*.6;box(air,.65,h,.7,-2.6+i*.85,h/2+.25,0,0x84a995);for(let j=.5;j<h;j+=.5)box(air,.35,.15,.02,-2.6+i*.85,j+.2,.36,0xf4dfa3);}cyl(air,.08,2.2,0,1.35,1.7,0x4f6e5b,.08,8);const fan=new T.Group();fan.position.set(0,2.55,1.7);air.add(fan);for(let i=0;i<3;i++){const blade=box(fan,.12,1.4,.05,0,.5,0,0xf5e9c3);blade.rotation.z=i*Math.PI*2/3;}animated.push(fan);
 const social=new T.Group();social.position.set(0,.5,23);world.add(social);for(const x of [-3,3]){box(social,3,.3,1.1,x,.65,0,0xb88c63);box(social,3,1,.15,x,1.2,.55,0xb88c63);for(const k of [-1,1])box(social,.15,.6,.15,x+k,.3,0,0x526b58);}cyl(social,1,.2,0,.8,0,0xf0d4aa);cyl(social,.12,.7,0,.4,0,0x526b58);text(social,'LET’S CONNECT',0,3,-2,7,'#234b43');
 for(const x of [-3,3])obstacles.push({x,z:23,r:1.6});social.children.filter(o=>o.position.x!==0).forEach(o=>{o.userData.action='bench';interactables.push(o);});
 const avatar=new T.Group();
 world.add(avatar);
 let traveller=null;
 function setAvatar(appearance){
   const next=createAvatar(appearance);
   if(traveller){avatar.remove(traveller);traveller.userData.dispose();}
   traveller=next;
   avatar.add(next);
 }
 setAvatar(look);
 function animateAvatar(time,moving,seated,sip){traveller.userData.animate(time,moving,seated,sip);}
 const marker=new T.Mesh(new T.RingGeometry(.6,.72,40),new T.MeshBasicMaterial({color:0xffdb8f,side:T.DoubleSide}));marker.rotation.x=-Math.PI/2;marker.position.y=.5;world.add(marker);const destination=new T.Mesh(new T.RingGeometry(.25,.4,32),new T.MeshBasicMaterial({color:0xffffff,side:T.DoubleSide}));destination.rotation.x=-Math.PI/2;destination.position.y=.51;destination.visible=false;world.add(destination);
 const track=new T.Group();track.visible=false;scene.add(track);cyl(track,27,2,0,-1.3,0,0x987c5a,26,64);cyl(track,26,.1,0,-.22,0,0x84a78b,26,64);const road=mesh(track,new T.RingGeometry(8.9,13.1,160),0x455957,0,.02,0);road.rotation.x=-Math.PI/2;road.scale.x=1.45;for(let i=0;i<90;i++){const a=i/90*Math.PI*2;const stripe=box(track,.1,.04,.4,Math.cos(a)*15.95,.08,Math.sin(a)*11,0xeee0be);stripe.rotation.y=-a;}for(let i=0;i<100;i++){const a=i/100*Math.PI*2;for(const r of [8.8,13.2]){const curb=box(track,.4,.1,.55,Math.cos(a)*r*1.45,.07,Math.sin(a)*r,i%2?0xe9d4ab:0xd78f72);curb.rotation.y=-a;}}
 text(track,'AUTOCAR',0,.08,0,12,'#e9dfb9').rotation.x=-Math.PI/2;text(track,'THE HUMAN IN THE LOOP',0,.09,2,7,'#e9dfb9').rotation.x=-Math.PI/2;
 const car=new T.Group();track.add(car);box(car,1.1,.45,2.1,0,.45,0,0xf3b562);box(car,.85,.4,.9,0,.85,-.15,0x2c5550);for(const x of [-.6,.6])for(const z of [-.65,.65])box(car,.2,.45,.4,x,.3,z,0x253d37);box(car,.8,.13,.04,0,.5,1.07,0xffefbb);
 const visitorHit=new T.Mesh(new T.CapsuleGeometry(.3,1.25,4,8),new T.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false}));visitorHit.position.y=.95;visitorHit.userData.action='visitor';avatar.add(visitorHit);interactables.push(visitorHit);
 const town=buildTown({T,world,scene,box,cyl,sphere,text,tree,obstacles,car,mat,interactables});
 function resize(){renderer.setSize(innerWidth,innerHeight);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();}addEventListener('resize',resize);resize();
 function night(enabled){town.night(enabled);weather.night(enabled);renderer.setClearColor(enabled?0x142d40:0x214f57);scene.fog.color.set(enabled?0x22394d:0xc9ccc0);sun.intensity=enabled?.55:2.35;hemi.intensity=enabled?1.05:1.55;}
 return {T,weather,renderer,scene,camera,world,track,car,avatar,setAvatar,animateAvatar,marker,destination,interactables,obstacles,animated,night,town};
}
