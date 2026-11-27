import * as T from 'three';

// Open wooden launch, with the bow along local +Z and the waterline at Y=0.
export function makeRiverBoat(paint) {
  const boat=new T.Group(), material=new Map();
  function mesh(shape,color){
    if(!material.has(color))material.set(color,new T.MeshStandardMaterial({color,roughness:.72,side:T.DoubleSide}));
    const m=new T.Mesh(shape,material.get(color));m.castShadow=m.receiveShadow=true;boat.add(m);return m;
  }
  const stations=[[-1.64,.38,.37],[-1.23,.62,.30],[-.55,.72,.27],[.3,.73,.28],[1.02,.55,.32],[1.46,.29,.42],[1.75,.018,.53]];
  const rim=(s,z,w,h,inside=false)=>[s*(inside?Math.max(.009,w-.06):w),inside?h-.035:h,z];
  function panel(a,b,c,d,color){
    const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute([a,b,c,a,c,d].flat(),3));geo.computeVertexNormals();mesh(geo,color);
  }
  for(let i=1;i<stations.length;i++){
    const [za,wa,ha]=stations[i-1],[zb,wb,hb]=stations[i];
    for(const side of [-1,1]){
      const a=rim(side,za,wa,ha),b=rim(side,zb,wb,hb);
      const c=[side*wb*.72,-.08,zb],d=[side*wa*.72,-.08,za];
      panel(a,b,c,d,paint);panel(d,c,[0,-.25,zb],[0,-.25,za],0x403b33);
      const innerA=rim(side,za,wa,ha,true),innerB=rim(side,zb,wb,hb,true);
      panel(a,innerA,innerB,b,0xb78a57);
      panel(innerA,innerB,[side*wb*.72,.045,zb],[side*wa*.72,.045,za],0x865b3e);
      panel(a,b,[b[0]*.995,b[1]-.045,zb],[a[0]*.995,a[1]-.045,za],0xe4c79a);
    }
    panel([-wa*.72,.045,za],[wa*.72,.045,za],[wb*.72,.045,zb],[-wb*.72,.045,zb],i%2?0x996f4a:0x9f7551);
  }
  panel([-.38,.37,-1.64],[.38,.37,-1.64],[.27,-.08,-1.64],[-.27,-.08,-1.64],paint);
  for(const [z,width] of [[-.56,1.30],[.7,1.18]]){
    const seat=mesh(new T.BoxGeometry(width,.09,.38),0xc29a66);seat.position.set(0,.26,z);
  }
  for(const x of [-.58,.58]){
    const pin=mesh(new T.CylinderGeometry(.038,.052,.16,10),0xaf9668);pin.position.set(x,.34,.58);
  }
  return boat;
}
