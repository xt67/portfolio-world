import * as T from 'three';

export function buildAircraft(){
  const plane=new T.Group(),materials=new Map();
  function part(geo,color,parent=plane){
    if(!materials.has(color))materials.set(color,new T.MeshStandardMaterial({color,roughness:.48,metalness:.12,side:T.DoubleSide}));
    const m=new T.Mesh(geo,materials.get(color));m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;
  }
  function oval(x,y,z,sx,sy,sz,color,parent=plane){
    const m=part(new T.SphereGeometry(1,24,14),color,parent);
    m.position.set(x,y,z);m.scale.set(sx,sy,sz);return m;
  }
  function beam(a,b,r,color){
    const p=new T.Vector3(...a),q=new T.Vector3(...b),v=q.clone().sub(p);
    const m=part(new T.CylinderGeometry(r,r,v.length(),10),color);
    m.position.copy(p.addScaledVector(v,.5));m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),v.normalize());return m;
  }
  function surface(points,color){
    const geo=new T.BufferGeometry();
    const ix=[];for(let i=1;i<points.length-1;i++)ix.push(0,i,i+1);
    geo.setAttribute('position',new T.Float32BufferAttribute(points.flat(),3));geo.setIndex(ix);geo.computeVertexNormals();return part(geo,color);
  }
  const ivory=0xf3efdf,blue=0x263b57,red=0x9f463e,glass=0x344f61;
  // Rounded elliptical fuselage stations, from the fine tail to the engine cowling.
  const rings=[[-3.55,1.04,.065,.10],[-3.05,1.06,.17,.18],[-1.6,1.12,.34,.31],[-.86,1.16,.50,.43],[.1,1.14,.58,.47],[.88,1.12,.54,.41],[1.57,1.15,.46,.32],[1.95,1.16,.35,.26],[2.09,1.16,.16,.16]];
  const vertices=[],ix=[],n=32;
  for(let j=0;j<rings.length;j++){
    const [z,y,w,h]=rings[j];
    for(let i=0;i<n;i++){
      const a=2*Math.PI*i/n;vertices.push(w*Math.cos(a),y+h*Math.sin(a),z);
      if(j){const k=j*n+i,s=j*n+(i+1)%n;ix.push(k-n,s-n,k,s-n,s,k);}
    }
  }
  const shell=new T.BufferGeometry();shell.setAttribute('position',new T.Float32BufferAttribute(vertices,3));shell.setIndex(ix);shell.computeVertexNormals();part(shell,ivory);
  for(const side of [-1,1]){
    for(let i=1;i<rings.length;i++){
      const stripe=(r,dy)=>[side*(r[2]+.009),r[1]+dy,r[0]];
      const a=rings[i-1],b=rings[i];surface([stripe(a,.015),stripe(b,.015),stripe(b,.075),stripe(a,.075)],blue);
      surface([stripe(a,-.044),stripe(b,-.044),stripe(b,-.025),stripe(a,-.025)],red);
    }
    const edge=(x,y,z)=>[side*x,y,z];
    const aft=edge(.46,1.51,-1.06), corner=edge(.44,1.95,-.52),top=edge(.47,1.95,.54),low=edge(.55,1.44,.92);
    surface([aft,corner,top,low],glass);
    for(const [a,b] of [[aft,corner],[corner,top],[top,low],[low,aft],[edge(.51,1.48,-.04),edge(.46,1.95,-.14)]])beam(a,b,.035,ivory);
    beam(edge(.55,1.35,.04),edge(.55,1.35,.21),.022,blue);
    oval(side*.28,1.17,1.88,.105,.056,.06,blue);
  }
  surface([[-.55,1.44,.92],[.55,1.44,.92],[.47,1.95,.54],[-.47,1.95,.54]],0x476477);
  surface([[-.46,1.51,-1.06],[.46,1.51,-1.06],[.44,1.95,-.52],[-.44,1.95,-.52]],glass);
  // Cambered aerofoil sections give the wing a rounded leading edge and a thin trailing edge.
  function wing(side,sections,tint){
    const verts=[],faces=[],profile=[[1,0],[.92,.63],[.73,1],[.39,.78],[0,.04],[.42,-.26],[.83,-.24]];
    for(const [span,chord,z,y,thick] of sections)for(const [u,v] of profile)verts.push(side*span,y+thick*v,z+chord*u);
    for(let j=1;j<sections.length;j++)for(let i=0;i<profile.length;i++){
      const k=j*7+i,l=j*7+(i+1)%7;faces.push(k-7,k,l,l,l-7,k-7);
    }
    const end=(sections.length-1)*7;for(let i=1;i<6;i++)faces.push(end,end+i,end+i+1);
    const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(verts,3));geo.setIndex(faces);geo.computeVertexNormals();part(geo,tint);
  }
  for(const side of [-1,1]){
    wing(side,[[0,1.19,-.62,1.99,.14],[2.9,1.15,-.62,2.04,.13],[4.23,.87,-.48,2.12,.08],[4.39,.63,-.38,2.15,.035]],ivory);
    wing(side,[[.04,.84,-3.49,1.11,.073],[1.43,.52,-3.47,1.16,.042],[1.56,.27,-3.40,1.18,.022]],ivory);
    beam([side*.48,.87,.28],[side*2.85,2.035,.05],.044,ivory);
    beam([side*.47,.84,-.53],[side*.89,.32,-.11],.059,ivory);
    const tyre=part(new T.TorusGeometry(.143,.062,9,20),0x292c31);
    tyre.rotation.y=Math.PI/2;tyre.position.set(side*.88,.205,-.11);
    oval(side*.88,.305,-.13,.12,.151,.312,ivory);
    oval(side*4.36,2.14,.01,.042,.035,.068,side<0?0xc64a4a:0x5aaf80);
  }
  const fin=[[0,1.1,-3.52],[0,2.43,-3.54],[0,2.44,-3.31],[0,1.43,-2.57],[0,1.15,-2.16]];
  surface(fin,ivory);
  for(const y of [1.58,1.7])surface([[.006,y,-3.53],[.006,y,-3.01],[.006,y+.05,-3.06],[.006,y+.05,-3.53]],blue);
  beam([0,.87,1.42],[0,.25,1.48],.045,0xb5b6af);
  const noseWheel=part(new T.TorusGeometry(.118,.052,9,20),0x292c31);noseWheel.rotation.y=Math.PI/2;noseWheel.position.set(0,.17,1.49);
  oval(0,.25,1.49,.083,.117,.23,ivory);
  const prop=new T.Group();prop.position.set(0,1.16,2.09);plane.add(prop);
  for(const sign of [-1,1]){const blade=oval(0,.39*sign,0,.08,.41,.031,0x323535,prop);blade.rotation.z=-.11;oval(.04*sign,.735*sign,0,.046,.066,.032,0xd7d7c5,prop);}
  oval(0,1.16,2.12,.135,.135,.2,ivory);prop.rotation.z=.75;
  plane.userData.propeller=prop;
  return plane;
}
