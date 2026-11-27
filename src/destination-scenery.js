import * as T from 'three';
import {addCityLandmarks} from './city-landmarks.js';
import {illustratedWall} from './art-direction.js';

const palettes = {
  qatar:{land:'#d3b189',path:'#ebd7ae',rock:'#b48b68'},
  jamshedpur:{land:'#a49b73',path:'#ccb797',rock:'#887463'}
};

function noise(x, z) {
  return Math.sin(.105*x + .074*z) + .44*Math.sin(.31*z - .17*x) + .17*Math.cos(.69*x + .41*z);
}
function generator(seed) {
  let n = seed;
  return () => ((n = Math.imul(1664525,n) + 1013904223 >>> 0) / 4294967296);
}
function smooth(a,b,x) {
  const t=T.MathUtils.clamp((x-a)/(b-a),0,1);
  return t*t*(3-2*t);
}

// Scenery shares a single vertex-colour material and a single draw call. This
// lets the facades have actual eaves, windows and beams even on mobile GPUs.
function drawingKit() {
  const positions=[], colors=[], normals=[];
  const shade=new T.Color(), matrix=new T.Matrix4(), rotation=new T.Quaternion();
  const pos=new T.Vector3(), scale=new T.Vector3(), vert=new T.Vector3(), normal=new T.Vector3();
  const normalMatrix=new T.Matrix3(), euler=new T.Euler();
  const meshes = {
    box:new T.BoxGeometry(1,1,1), dome:new T.SphereGeometry(1,12,7,0,Math.PI*2,0,Math.PI/2),
    leaf:new T.IcosahedronGeometry(1,1), rock:new T.IcosahedronGeometry(1,0),
    pole:new T.CylinderGeometry(1,1,1,10), taper:new T.CylinderGeometry(.73,1,1,12),
    cone:new T.ConeGeometry(1,1,10)
  };
  function shape(key,x,y,z,sx,sy,sz,color,rx=0,ry=0,rz=0) {
    const geo=meshes[key];
    rotation.setFromEuler(euler.set(rx,ry,rz));
    matrix.compose(pos.set(x,y,z),rotation,scale.set(sx,sy,sz));
    normalMatrix.getNormalMatrix(matrix);
    shade.set(color);
    const p=geo.attributes.position,n=geo.attributes.normal;
    const count=geo.index?.count ?? p.count;
    for(let i=0;i<count;i++){
      const j=geo.index?geo.index.getX(i):i;
      vert.fromBufferAttribute(p,j).applyMatrix4(matrix);
      normal.fromBufferAttribute(n,j).applyMatrix3(normalMatrix).normalize();
      positions.push(vert.x,vert.y,vert.z);normals.push(normal.x,normal.y,normal.z);
      colors.push(shade.r,shade.g,shade.b);
    }
  }
  function triangle(a,b,c,color) {
    const u=new T.Vector3().subVectors(b,a),v=new T.Vector3().subVectors(c,a);
    const n=u.cross(v).normalize();shade.set(color);
    for(const p of [a,b,c]){
      positions.push(p.x,p.y,p.z);normals.push(n.x,n.y,n.z);colors.push(shade.r,shade.g,shade.b);
    }
  }
  const v=(x,y,z)=>new T.Vector3(x,y,z);
  function quad(a,b,c,d,color){triangle(v(...a),v(...b),v(...c),color);triangle(v(...a),v(...c),v(...d),color);}
  function beam(a,b,width,color){
    const delta=v(...b).sub(v(...a)), length=delta.length();
    const q=new T.Quaternion().setFromUnitVectors(v(0,1,0),delta.normalize());
    const r=new T.Euler().setFromQuaternion(q);
    shape('pole',(a[0]+b[0])/2,(a[1]+b[1])/2,(a[2]+b[2])/2,width,length,width,color,r.x,r.y,r.z);
  }
  function finish(scene){
    const geometry=new T.BufferGeometry();
    for(const [key,array] of [['position',positions],['color',colors],['normal',normals]])geometry.setAttribute(key,new T.Float32BufferAttribute(array,3));
    const material=new T.MeshStandardMaterial({vertexColors:true,roughness:.91,side:T.DoubleSide});
    const scenery=new T.Mesh(geometry,material);scenery.castShadow=scenery.receiveShadow=true;scene.add(scenery);Object.values(meshes).forEach(g=>g.dispose());
    return material;
  }
  return {shape,triangle,quad,beam,finish};
}

function terrain(scene,kind,palette,rng) {
  const harbour=kind==='qatar', rings=78, segments=168;
  const bank=z=>-20.8+1.8*Math.sin(z*.12);
  const radius=a=>31+2.3*Math.sin(3*a+(harbour?.7:2))+1.4*Math.cos(5*a-.4)+.8*Math.sin(8*a);
  function height(x,z){
    const r=Math.hypot(x,z),limit=radius(Math.atan2(z,x)),coast=smooth(limit-5,limit,r);
    const interior=smooth(16,24,r)*(.68+.32*noise(x,z));
    const marina=Math.hypot((x-15)/5.3,(z+6)/4.25);
    const inlet=harbour?Math.max(4.3*smooth(-.2,3.2,bank(z)-x),3.7*(1-smooth(.72,1.04,marina))):0;
    const drift=(xx,zz,w,d,h)=>h*Math.exp(-(((x-xx)/w)**2+((z-zz+.19*(x-xx))/d)**2));
    const dunes=harbour?drift(8,4,8.7,3.8,2.1)+drift(2,17,10,3.3,2.4)+drift(-12,11,7.5,3.3,1.4):0;
    const airstrip=(1-smooth(1.7,3.2,Math.abs(x+8)))*(1-smooth(5.4,7.0,Math.abs(z-18)));
    return -.075+(interior+dunes-inlet-5.7*coast)*(1-airstrip);
  }
  const coords=[],colors=[],indices=[],color=new T.Color(),sand=new T.Color('#dec59d');
  for(let row=0;row<=rings;row++){
    for(let k=0;k<segments;k++){
      const angle=2*Math.PI*k/segments,r=radius(angle)*row/rings,x=r*Math.cos(angle),z=r*Math.sin(angle);
      const y=height(x,z);coords.push(x,y,z);
      color.set(palette.land).lerp(sand,smooth(.78,.96,row/rings)*.8);
      const ripple=harbour?.045*Math.sin(5.6*z+Math.sin(x*.7)+x*.5):0;
      color.multiplyScalar(.97+.026*noise(x,z)+ripple+rng()*.045);colors.push(color.r,color.g,color.b);
      if(row>0){const j=row*segments+k,next=row*segments+(k+1)%segments;
        indices.push(j-segments,next,j,j-segments,next-segments,next);}
    }
  }
  const geometry=new T.BufferGeometry();
  geometry.setIndex(indices);geometry.setAttribute('position',new T.Float32BufferAttribute(coords,3));geometry.setAttribute('color',new T.Float32BufferAttribute(colors,3));geometry.computeVertexNormals();
  const material=new T.MeshStandardMaterial({vertexColors:true,roughness:1});
  const mesh=new T.Mesh(geometry,material);mesh.name="island-ground";mesh.receiveShadow=true;scene.add(mesh);
  return {height,bank,materials:[material]};

}

/** Adds an illustrated district around the walkable route and returns its animation hook. */
export function addDestinationScenery(scene,trip){
  const kind=trip.feature, pal=palettes[kind], kit=drawingKit();
  const rng=generator([...kind].reduce((sum,c)=>sum*3+c.charCodeAt(0),7));
  const ground=terrain(scene,kind,pal,rng);

  const {shape,quad,beam}=kit;
  const b=(x,y,z,w,h,d,c,ry=0)=>shape('box',x,y,z,w,h,d,c,0,ry);

  const pole=(x,y,z,r,h,c)=>shape('pole',x,y,z,r,h,r,c);
  const leaf=(x,y,z,w,h,d,c,angle=0)=>shape('leaf',x,y,z,w,h,d,c,0,angle);
  const height=ground.height;

  function tree(x,z,size,conifer=false) {
    const y=height(x,z),s=size;
    beam([x,y,z],[x+.12*s,y+2.2*s,z],.19*s,'#715e48');
    if(conifer){
      for(let i=0;i<3;i++)shape('cone',x,y+(1.65+i*.83)*s,z,(1.26-i*.21)*s,(2.5-i*.38)*s,(1.13-i*.19)*s,['#45675d','#557769','#6b8b74'][i]);
    } else {
      for(let i=0;i<5;i++){
        const a=i*2.4,d=i?.67:0;
        leaf(x+Math.cos(a)*d*s,y+(2.7-(i?.38:0))*s,z+Math.sin(a)*d*s,1.1*s,.88*s,1.07*s,['#708a61','#527259','#778d5d','#638662','#8d9d68'][i],a);
      }
    }
  }
  function palm(x,z,s){
    const y=height(x,z),top=[x+.35*s,y+3.8*s,z+.12*s];
    beam([x,y,z],top,.16*s,'#977651');
    for(let i=0;i<10;i++){
      const a=i*.628+rng()*.3,dx=Math.cos(a)*s,dz=Math.sin(a)*s,c=i%2?'#638765':'#477661';
      const mid=[top[0]+dx*1.12,top[1]+.45*s,top[2]+dz*1.12];
      const tip=[top[0]+dx*2.2,top[1]-.42*s,top[2]+dz*2.2];
      const flank=[mid[0]-.23*dz,mid[1]-.1*s,mid[2]+.23*dx];
      const side=[mid[0]+.23*dz,mid[1]-.1*s,mid[2]-.23*dx];
      quad(top,flank,tip,mid,c);quad(top,mid,tip,side,c);
    }
  }
  function roof(x,y,z,w,d,h,c){
    const l=x-w/2,r=x+w/2,f=z+d/2,k=z-d/2;
    quad([l,y,f],[x,y+h,f],[x,y+h,k],[l,y,k],c);
    quad([x,y+h,f],[r,y,f],[r,y,k],[x,y+h,k],c);
    kit.triangle(new T.Vector3(l,y,f),new T.Vector3(r,y,f),new T.Vector3(x,y+h,f),c);
    kit.triangle(new T.Vector3(r,y,k),new T.Vector3(l,y,k),new T.Vector3(x,y+h,k),c);
  }
  function plaster(x,z,w,d,h,colour){
    const y=height(x,z);
    b(x,y+h/2,z,w,h,d,colour);b(x,y+h,z,w+.25,.24,d+.25,colour);
    const tile=kind==='qatar'?(x>13?'courtyard':'souq'):'townhouse';
    illustratedWall(scene,tile,x,y+h/2,z+d/2+.035,w,h);
    illustratedWall(scene,tile,x-w/2-.035,y+h/2,z,d,h,-Math.PI/2);
    illustratedWall(scene,tile,x+w/2+.035,y+h/2,z,d,h,Math.PI/2);
    return y+h;
  }
  function dhow(x,z,s,heading){
    const y=-1.42,groupPoint=(a,b,c)=>[x+(a*Math.cos(heading)+c*Math.sin(heading))*s,y+b*s,z+(-a*Math.sin(heading)+c*Math.cos(heading))*s];
    const ends=[groupPoint(-2.9,.68,0),groupPoint(2.9,.99,0)];
    for(const sign of [-1,1]){
      const aft=groupPoint(-1.6,.58,sign*.59),bow=groupPoint(1.8,.7,sign*.55);
      quad(ends[0],aft,bow,ends[1],'#895f42');
      quad(aft,groupPoint(-1,.04,0),groupPoint(1.15,.04,0),bow,'#5c493b');
    }
    beam(groupPoint(.2,.52,0),groupPoint(.1,3.7,0),s*.055,'#735237');
    const sail=[groupPoint(-1.55,1.05,0),groupPoint(.08,3.64,0),groupPoint(1.24,1.3,.15),groupPoint(-.2,1.07,.22)];
    quad(...sail,'#efddba');
  }
  function quay(){
    for(let i=0;i<6;i++){
      const z=-14+i*4.8,x=ground.bank(z)+.9;
      b(x,.02,z,2.4,.18,5.1,'#b69776');
      for(const dz of [-1.6,1.6])pole(x-.8,.36,z+dz,.16,.85,'#6c685c');
    }
    for(let i=0;i<3;i++){const z=-10+i*8;dhow(ground.bank(z)-4.3,z,.85+i*.12,-.8);}
  }
  if(kind==='qatar'){
    quay();
    for(let i=0;i<4;i++){
      const x=-18+i*1.05,z=-11+i*4.9,h=2.5+rng()*2.5;
      const top=plaster(x,z,3.9,4.7,h,['#d3ad83','#e2c49e','#c79b76'][i%3]);
      if(i%3===1){
        b(x,top+1.3,z,1.8,2.6,1.8,'#ddbe95');
        for(const shift of [-.4,.4])b(x+shift,top+1.8,z+.93,.36,.95,.1,'#716b58');
        b(x,top+2.72,z,2.1,.2,2.1,'#bf9976');
      }
      quad([x-1.8,2.1,z+2.4],[x+1.8,2.1,z+2.4],[x+1.85,1.73,z+4.1],[x-1.85,1.73,z+4.1],i%2?'#a76659':'#698e89');
    }
    [[-15,-10],[14,-11],[18,3],[-14,11],[19,12]].forEach(([x,z])=>palm(x,z,1.05));
  } else if(kind==='jamshedpur'){
    for(const [x,z,len] of [[-10,-21,11],[3,-23,9],[18,-15,6]]){
      const y=height(x,z);
      b(x,y+2.1,z,len,4.2,5.5,'#a06954');
      for(let j=0;j<2;j++)illustratedWall(scene,'factory',x+(j-.5)*len/2,y+2.1,z+2.78,len/2,4.2);
      illustratedWall(scene,'factory',x-len/2-.025,y+2.1,z,5.5,4.2,-Math.PI/2);
      illustratedWall(scene,'factory',x+len/2+.025,y+2.1,z,5.5,4.2,Math.PI/2);
      for(let i=0;i<3;i++)roof(x-len/3+i*len/3,y+4.2,z,len/3+.1,6,1.05,'#668084');
    }
    for(let i=0;i<4;i++){
      const x=-12+i*4.4,z=-22.5-i%2,y=height(x,z),h=9+i*1.7;
      shape('taper',x,y+h/2,z,1.06,h,1.06,'#995d49');
      for(let j=0;j<3;j++)pole(x,y+h*(.71+j*.11),z,.85,.48,j%2?'#c5b599':'#744e41');
    }
    for(const x of [-14,-8,0,9]){beam([x,0,-15],[x,4,-15],.13,'#5d6b68');}
    for(const z of [-15.5,-14.5])beam([-15,3.8,z],[12,3.8,z],.27,'#627a79');
    for(let i=0;i<5;i++){
      beam([-13+i*4,0,-17],[-11+i*4,3.8,-17],.1,'#7b7764');
      beam([-11+i*4,3.8,-17],[-9+i*4,0,-17],.1,'#7b7764');
    }
    for(let i=0;i<7;i++){const a=.45+i*.065;tree(24*Math.cos(a),24*Math.sin(a),.75);}
    for(let i=0;i<4;i++){
      const x=15+i*.7,z=-8+i*4.5,y=height(x,z);
      plaster(x,z,3.9,3.7,2.9,i%2?'#d9b689':'#c6a188');
      roof(x,y+2.92,z,4.3,4,.95,'#a95f4b');
      b(x-2.28,y+2.1,z,.95,.14,3.85,'#92745b');
      for(const dz of [-1.35,1.35])pole(x-2.55,y+1.04,z+dz,.08,2.08,'#967c62');
    }
    for(const [x,z] of [[-14,9],[-16,3],[-13,-11],[9,15]])tree(x,z,1.28);
  }
  b(-8,-.06,18,2.9,.07,11,kind==='qatar'?'#ccb08a':'#9a946f');
  for(const end of [13.1,22.9])for(const x of [-8.7,-8,-7.3])b(x,-.013,end,.16,.018,.67,'#e8dec6');
  kit.finish(scene);
  const blocks=addCityLandmarks(scene,trip,height);
  if(kind==='qatar'){
    blocks.push([-8,-14,4,2.3],[0,-22,18,3]);
    for(let i=0;i<4;i++)blocks.push([-18+i*1.05,-11+i*4.9,2.2,2.5]);
    blocks.push([15,-6,6.9,5.6]);
  }else{
    blocks.push([-10,-21,5.7,3.0],[3,-23,4.8,3.0],[18,-15,3.4,3.0],[0,-15,14,1.1]);
    for(let i=0;i<4;i++)blocks.push([15+i*.7,-8+i*4.5,2.3,2.1]);
  }
  function walkable(x,z){
    return Math.hypot(x,z)<25&&height(x,z)>-.85&&!blocks.some(([cx,cz,rx,rz])=>
      rz ? Math.abs(x-cx)<rx+.23&&Math.abs(z-cz)<rz+.23 : Math.hypot(x-cx,z-cz)<rx+.23);
  }
  return {height,walkable};
}
