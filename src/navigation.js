// Rendering, placement and movement share this geometry: there is no second road map.
export const LAND=[[-86,-20],[-79,-36],[-72,-47],[-72,-62],[-58,-74],[-42,-71],[-27,-81],[-11,-77],[3,-85],[24,-81],[32,-69],[48,-64],[60,-70],[77,-59],[81,-43],[72,-32],[84,-19],[89,0],[80,17],[85,32],[73,46],[66,61],[48,68],[39,62],[31,78],[12,82],[-3,73],[-23,80],[-37,68],[-55,69],[-61,54],[-77,42],[-71,25],[-86,15],[-80,-2]];
export const riverX=z=>32+Math.sin(z*.055)*8+Math.sin(z*.11)*2;
export const RIVER_HALF=3.8, BANK_HALF=5.8;
export const bridges=[-26,27].map((z,i)=>({id:`bridge-${i}`,x:riverX(z),z,length:25,width:7.4}));
export const locations=[
 {id:'aurora',name:'AURORA',x:-15,z:-13,color:0x91d8cc},
 {id:'autocar',name:'AutoCar garage',x:14,z:-12,color:0xffb76b},
 {id:'cass',name:'CASS',x:-17,z:11,color:0xb5a4e2},
 {id:'paqs',name:'Air quality garden',x:16,z:12,color:0xaec97d},
 {id:'connect',name:'Say hello',x:0,z:23,color:0xf2a798},
 {id:'personal',name:'My story',x:-52,z:-12,color:0xf1d092},
 {id:'gallery',name:'Project arcade',x:-44,z:27,color:0xb8caa1},
 {id:'airport',name:'Next chapter airport',x:0,z:-60,color:0x9bc5b9},
 {id:'lab',name:'xt67-Lab',x:-46,z:-46,color:0x7ce7df},
 {id:'ccp',name:'CCP hideout',x:72,z:4,color:0xf0948c},
 {id:'chai',name:'Raju Chai Wala',x:-52,z:9,color:0xffc36e},
 {id:'tea2',name:'Tinku Tea Cabin',x:-20,z:50,color:0xefaa72},
 {id:'tea3',name:'Ghat Ki Chai',x:70,z:-32,color:0xf3cb72},
 {id:'river',name:'Riverside steps',x:24,z:42,color:0x9bd0c2}
];
const [b0,b1]=bridges;
const streetSpecs=[
 ['Bazaar road',6.2,[[0,6],[-9,3],[-27,-1],[-33,-15],[-26,-28]]],
 ['North crossing',6.2,[[-26,-28],[-11,-32],[2,-29],[b0.x-14,-26]]],
 ['Old stone bridge',6.2,[[b0.x-14,-26],[b0.x+14,-26]]],
 ['East bank road',6.2,[[b0.x+14,-26],[53,-22],[59,-9],[57,11],[67,24],[59,35],[b1.x+14,27]]],
 ['Market bridge',6.2,[[b1.x+14,27],[b1.x-14,27]]],
 ['South bazaar',6.2,[[b1.x-14,27],[17,31],[5,36],[-12,33],[-25,41],[-42,42],[-55,30],[-62,17],[-64,4]]],
 ['Old town lane',5.4,[[-64,4],[-61,-15],[-58,-31],[-45,-34],[-26,-28]]],
 ['Chai shortcut',4.4,[[-64,4],[-54,19],[-43,14],[-34,6],[-27,-1]]],
 ['Research lane',5.2,[[-58,-31],[-61,-43],[-54,-55],[-40,-57],[-32,-43],[-26,-28]]],
 ['Airport approach',5.2,[[-32,-43],[-23,-49],[-11,-49],[0,-51]]],
 ['Arcade lane',4.4,[[-42,42],[-30,31],[-28,19],[-34,6]]],
 ['Plaza connection',4.4,[[0,6],[6,9],[8,18],[7,29],[5,36]]],
 ['River walk',3.2,[[17,31],[16,40],[23,51],[17,61],[1,65],[-12,57],[-12,33]]],
 ['Hill lane',4.4,[[59,35],[64,47],[54,55],[49,48]]],
 ['Harbour lane',4.4,[[53,-22],[62,-32],[58,-46],[45,-51]]]
];
export function sampleCurve(points,step=1){
 if(points.length===2){const [a,b]=points,n=Math.max(1,Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/step));return Array.from({length:n+1},(_,i)=>[a[0]+(b[0]-a[0])*i/n,a[1]+(b[1]-a[1])*i/n]);}
 const result=[];for(let i=0;i<points.length-1;i++){const a=points[Math.max(0,i-1)],b=points[i],c=points[i+1],d=points[Math.min(points.length-1,i+2)],n=Math.ceil(Math.hypot(c[0]-b[0],c[1]-b[1])/step);for(let j=0;j<n;j++){const t=j/n,t2=t*t,t3=t2*t;result.push([0,1].map(k=>.5*(2*b[k]+(-a[k]+c[k])*t+(2*a[k]-5*b[k]+4*c[k]-d[k])*t2+(-a[k]+3*b[k]-3*c[k]+d[k])*t3)));}}return [...result,points.at(-1)];
}
export const roads=streetSpecs.map(([name,width,points])=>({name,width,points:sampleCurve(points)}));
export function segmentDistance(x,z,a,b){const dx=b[0]-a[0],dz=b[1]-a[1],length=dx*dx+dz*dz,t=length?Math.max(0,Math.min(1,((x-a[0])*dx+(z-a[1])*dz)/length)):0,point=[a[0]+dx*t,a[1]+dz*t];return {distance:Math.hypot(x-point[0],z-point[1]),point,heading:Math.atan2(dx,dz)};}
export function nearestRoad(x,z,network=roads){let best={distance:Infinity,clearance:Infinity,point:[0,0],heading:0};for(const road of network)for(let i=1;i<road.points.length;i++){const hit=segmentDistance(x,z,road.points[i-1],road.points[i]),clearance=hit.distance-road.width/2;if(clearance<best.clearance)best={...hit,clearance,road};}return best;}
const exhibitPaths={aurora:[[-15,-8.4],[-9,-7],[-6,-1],[-9,3]],autocar:[[14,-7.4],[7,-4],[6,4],[0,6]],cass:[[-17,15.6],[-10,18],[0,16],[8,18]],paqs:[[16,16.6],[12,20],[8,18]],connect:[[0,27.6],[3,29],[7,29]]};
export const paths=locations.map(l=>({name:`${l.name} approach`,width:2.8,points:sampleCurve(exhibitPaths[l.id]||[[l.x,l.z+4.6],nearestRoad(l.x,l.z+4.6).point])}));
export function insideLand(x,z){let inside=false;for(let i=0,j=LAND.length-1;i<LAND.length;j=i++){const [xi,zi]=LAND[i],[xj,zj]=LAND[j];if((zi>z)!==(zj>z)&&x<(xj-xi)*(z-zi)/(zj-zi)+xi)inside=!inside;}return inside;}
export function onBridge(x,z,margin=0){return bridges.some(b=>Math.abs(z-b.z)<=b.width/2-margin&&Math.abs(x-b.x)<=b.length/2);}
export function terrainAllows(x,z,margin=.5){if(![-1,1].every(a=>[-1,1].every(b=>insideLand(x+a*margin,z+b*margin))))return false;return Math.abs(x-riverX(z))>RIVER_HALF+margin||onBridge(x,z,margin);}
export function blockedByObjects(x,z,obstacles,margin=.4){return obstacles.some(o=>o.w?Math.abs(x-o.x)<o.w/2+margin&&Math.abs(z-o.z)<o.d/2+margin:Math.hypot(x-o.x,z-o.z)<o.r+margin);}
export const reserved=[...locations.map(l=>({x:l.x,z:l.z,r:l.id==='lab'||l.id==='ccp'?10:8.5})),{x:0,z:0,r:10},{x:18,z:-60,w:12,d:34}];
export const random=n=>{const k=Math.sin(n*127.1+8.9)*43758.5453;return k-Math.floor(k);};
export function canPlace(x,z,r,objects=[]){return terrainAllows(x,z,r+1)&&Math.abs(x-riverX(z))>BANK_HALF+r+1&&nearestRoad(x,z,[...roads,...paths]).clearance>r+.7&&!blockedByObjects(x,z,[...reserved,...objects],r+1);}
export function makeScenery(){
 const houses=[],trees=[],lamps=[],occupied=[];
 for(let i=0;i<3000&&houses.length<34;i++){const x=(random(i)-.5)*151,z=(random(i+3000)-.5)*140,hit=nearestRoad(x,z),w=4+random(i+44)*2.2,d=4+random(i+77)*2,r=Math.hypot(w,d)/2+.5;if(hit.clearance>13||!canPlace(x,z,r,occupied))continue;const h={x,z,w,d,r,rotation:Math.atan2(hit.point[0]-x,hit.point[1]-z),height:2.7+random(i+95)*3.5,tint:i%5};houses.push(h);occupied.push({x,z,r});}
 for(let i=0;i<8500&&trees.length<180;i++){const x=(random(i+6000)-.5)*168,z=(random(i+9600)-.5)*156,scale=.7+random(i+70)*.7,r=1.6*scale;if(!canPlace(x,z,r,occupied))continue;trees.push({x,z,scale,r,tint:i%4});occupied.push({x,z,r});}
 for(const road of roads)for(let i=5;i<road.points.length-2;i+=14){const [x,z]=road.points[i],next=road.points[i+1],angle=Math.atan2(next[1]-z,next[0]-x),side=i%3?1:-1,px=x-Math.sin(angle)*(road.width/2+1.3)*side,pz=z+Math.cos(angle)*(road.width/2+1.3)*side;if(canPlace(px,pz,.35,occupied)){lamps.push({x:px,z:pz});occupied.push({x:px,z:pz,r:.35});}}
 return {houses,trees,lamps};
}
