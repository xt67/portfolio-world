import * as T from 'three';

export function addCityLandmarks(group,trip,height){
  const materials=new Map(),blocks=[];
  let glassMap;
  const mat=color=>{
    if(!materials.has(color))materials.set(color,new T.MeshStandardMaterial({color,roughness:.57,metalness:.17,side:T.DoubleSide}));
    return materials.get(color);
  };
  function mesh(parent,geo,color,x=0,y=0,z=0){
    const m=new T.Mesh(geo,mat(color));m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;parent.add(m);return m;
  }
  const box=(p,x,y,z,w,h,d,c)=>mesh(p,new T.BoxGeometry(w,h,d),c,x,y,z);
  function ball(p,x,y,z,w,h,d,c){
    const m=mesh(p,new T.SphereGeometry(1,18,12),c,x,y,z);m.scale.set(w,h,d);return m;
  }
  function rod(p,a,b,r,c){
    const start=new T.Vector3(...a),delta=new T.Vector3(...b).sub(start);
    const m=mesh(p,new T.CylinderGeometry(r,r,delta.length(),8),c,...start.addScaledVector(delta,.5).toArray());
    m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),delta.normalize());return m;
  }
  function origin(x,z){const g=new T.Group();g.position.set(x,height(x,z),z);group.add(g);return g;}
  function sign(p,words,x,y,z,width){
    const c=document.createElement('canvas');c.width=512;c.height=104;const ctx=c.getContext('2d');
    ctx.fillStyle='#533d31';ctx.fillRect(0,0,512,104);ctx.strokeStyle='#d3ae75';ctx.strokeRect(6,6,500,92);
    ctx.font='bold 44px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#fff0c9';ctx.fillText(words,256,53,480);
    const map=new T.CanvasTexture(c);map.colorSpace=T.SRGBColorSpace;
    const m=new T.Mesh(new T.PlaneGeometry(width,width*104/512),new T.MeshBasicMaterial({map}));m.position.set(x,y,z);p.add(m);
  }

  function tower(parent,x,z,levels,glass,warm=false){
    const n=24,vertices=[],colors=[],indices=[],uv=[];
    for(let j=0;j<levels.length;j++){
      const [y,cx,rx,rz,twist=0]=levels[j];
      for(let i=0;i<n;i++){
        const a=2*Math.PI*i/n+twist,k=j*n+i,next=j*n+(i+1)%n;
        vertices.push(cx+rx*Math.cos(a),y,rz*Math.sin(a));uv.push(i/6,y/2.5);
        const tint=new T.Color(glass).multiplyScalar(.8+.19*Math.cos(a-.7)+.07*Math.sin(i*2.7));
        colors.push(tint.r,tint.g,tint.b);
        if(j)indices.push(k-n,k,next,next,next-n,k-n);
      }
    }
    const geo=new T.BufferGeometry();geo.setIndex(indices);geo.setAttribute('position',new T.Float32BufferAttribute(vertices,3));geo.setAttribute('color',new T.Float32BufferAttribute(colors,3));geo.computeVertexNormals();
    if(!glassMap){
      const c=document.createElement('canvas');c.width=c.height=256;const ctx=c.getContext('2d');
      for(let col=0;col<8;col++)for(let row=0;row<9;row++){
        const shade=112+Math.round(16*Math.sin(col*.82)+8*Math.cos(row*3+col));
        ctx.fillStyle='rgb('+shade+','+(shade+23)+','+(shade+36)+')';ctx.fillRect(col*32,row*29,32,29);
        ctx.fillStyle=(row*11+col*3)%8===0?'#b8a690':'#889eac';ctx.fillRect(col*32+1,row*29+1,30,4);
        ctx.fillStyle='#667b8a';ctx.fillRect(col*32,row*29,1,29);
      }
      glassMap=new T.CanvasTexture(c);glassMap.colorSpace=T.SRGBColorSpace;glassMap.wrapS=glassMap.wrapT=T.RepeatWrapping;
    }
    geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));
    const surface=new T.Mesh(geo,new T.MeshStandardMaterial({map:glassMap,vertexColors:true,metalness:.10,roughness:.42,emissive:warm?0x40313d:0x283c48,emissiveIntensity:.60,side:T.DoubleSide}));surface.position.set(x,0,z);parent.add(surface);surface.castShadow=true;
    const [topY,topX,topW,topD]=levels.at(-1);
    const roof=mesh(parent,new T.CylinderGeometry(1,1,.08,n),warm?0x9c939c:0x95a6ad,x+topX,topY,z);roof.scale.set(topW,1,topD);
    const lines=[],ribs=[];
    for(let j=1;j<levels.length;j++){
      const [ya,xa,wa,da]=levels[j-1],[yb,xb,wb,db]=levels[j];
      for(let row=1;row<=(yb-ya)/.42;row++){
        const t=row*.42/(yb-ya),y=ya+(yb-ya)*t;
        for(let i=0;i<n;i++){for(const k of [i,i+1]){const a=k*2*Math.PI/n;lines.push(x+xa+(xb-xa)*t+(wa+(wb-wa)*t+.01)*Math.cos(a),y,z+(da+(db-da)*t+.01)*Math.sin(a));}}
      }
      for(let i=0;i<n;i+=2){const a=i*2*Math.PI/n;ribs.push(x+xa+wa*Math.cos(a),ya,z+da*Math.sin(a),x+xb+wb*Math.cos(a),yb,z+db*Math.sin(a));}
    }
    for(const [points,color] of [[lines,warm?0xc5a384:0x8a9fa8],[ribs,warm?0xb790bc:0x657989]]){
      const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(points,3));parent.add(new T.LineSegments(g,new T.LineBasicMaterial({color})));
    }
  }

  function camel(x,z,heading,size){
    const g=origin(x,z);g.rotation.y=heading;g.scale.setScalar(size);
    const coat=0xb18455,shadow=0x94704c;
    ball(g,0,1.44,0,.43,.57,.91,coat);ball(g,0,1.92,-.06,.33,.50,.48,coat);
    for(const s of [-1,1])for(const front of [-1,1]){
      const xx=s*.25,zz=front*.55,knee=zz+(front===1?.09:-.17)+s*.04;
      rod(g,[xx,1.34,zz],[xx,.69,knee],.073,coat);ball(g,xx,.69,knee,.083,.10,.08,shadow);
      rod(g,[xx,.7,knee],[xx,.12,zz+s*.09],.052,coat);ball(g,xx,.078,zz+s*.09+.05,.094,.073,.15,shadow);
    }
    const curve=new T.CatmullRomCurve3([[0,1.58,.53],[0,1.55,.92],[0,1.73,1.23],[0,2.17,1.33],[0,2.31,1.49]].map(p=>new T.Vector3(...p)));
    mesh(g,new T.TubeGeometry(curve,22,.134,10,false),coat);
    ball(g,0,2.32,1.50,.145,.18,.24,coat);ball(g,0,2.26,1.74,.132,.103,.18,0xb79062);
    for(const s of [-1,1]){ball(g,s*.104,2.47,1.40,.048,.102,.045,coat);ball(g,s*.136,2.34,1.55,.021,.027,.023,0x302820);}
    ball(g,0,1.94,-.22,.39,.165,.46,0x87473b);ball(g,0,2.035,-.25,.29,.103,.36,0xb69663);
    for(const s of [-1,1])rod(g,[s*.33,1.93,-.29],[s*.413,1.25,-.18],.022,0x684b37);
    rod(g,[0,1.47,-.83],[.09,.83,-.99],.038,shadow);blocks.push([x,z,1.6*size]);
  }

  function stadium(){
    const x=-10,z=-7,g=origin(x,z);
    const oval=(rx,rz,y,h,color)=>{
      const m=mesh(g,new T.CylinderGeometry(1,1,h,80),color,0,y,0);m.scale.set(rx,1,rz);
    };
    oval(6.8,5.1,.32,.74,0xbcab8c);oval(6.4,4.8,.72,.1,0xa35448);oval(4.9,3.4,.79,.1,0x5c9662);
    box(g,0,.86,0,7.4,.03,4.45,0x499461);
    for(const xx of [-3.62,0,3.62])box(g,xx,.885,0,.05,.024,4.42,0xe3e6cd);
    for(const zz of [-2.18,2.18])box(g,0,.885,zz,7.25,.024,.05,0xe3e6cd);
    for(const side of [-1,1]){
      for(let row=0;row<4;row++){
        const pts=[];
        for(let i=0;i<=26;i++){
          const a=Math.PI*(.12+.76*i/26),c=Math.cos(a),s=Math.sin(a)*side;
          for(const [r,h] of [[row*.22,.85+row*.22],[row*.22+.22,1+row*.22]])pts.push(c*(5.38+r),h,s*(3.45+r));
        }
        const idx=[];for(let i=0;i<26;i++){const n=i*2;idx.push(n,n+1,n+2,n+2,n+1,n+3);}
        const geo=new T.BufferGeometry();geo.setIndex(idx);geo.setAttribute('position',new T.Float32BufferAttribute(pts,3));geo.computeVertexNormals();mesh(g,geo,row%2?0xa45447:0xc16b58);
      }
      const pts=[],idx=[];
      for(let i=0;i<=28;i++){
        const a=Math.PI*(.18+.64*i/28);
        pts.push(6.9*Math.cos(a),2.66,side*5.15*Math.sin(a),5.1*Math.cos(a),2.91,side*3.78*Math.sin(a));
        if(i){const k=i*2;idx.push(k-2,k-1,k,k,k-1,k+1);}
        if(i%4===0)rod(g,[6.85*Math.cos(a),.5,side*5.1*Math.sin(a)],[6.9*Math.cos(a),2.68,side*5.15*Math.sin(a)],.065,0xb9c2b6);
      }
      const geo=new T.BufferGeometry();geo.setIndex(idx);geo.setAttribute('position',new T.Float32BufferAttribute(pts,3));geo.computeVertexNormals();mesh(g,geo,0x8aafb5);
    }
    for(const sx of [-1,1])for(const sz of [-1,1]){
      rod(g,[sx*5.45,.3,sz*3.5],[sx*5.6,4.1,sz*3.6],.067,0xaaa594);
      box(g,sx*5.6,4.1,sz*3.6,.88,.27,.15,0xe8dfb4);
    }
    blocks.push([x,z,6.8,5.1]);
  }

  if(trip.feature==='qatar'){
    const skyline=origin(0,-22);
    for(const [x,z,h,w,shape,c] of [[-16,2,8,1.2,0,0x628a99],[-13,0,10,1.1,1,0x7595a6],[-4,-1,12,1.3,2,0x476d84],[0,0,9.5,1.4,3,0x949ca3],[3,1,10,1.35,1,0x567989],[6,1,9,1.1,2,0xb19a83],[9,3,8.4,1.1,0,0x7d9399]]){
      const levels=[[0,0,w,.88],[.56*h,shape===0?.25:0,w*(shape===1?.65:1),1],[h,shape===0?.52:0,w*(shape===3?.4:1),.94]];
      if(shape===3)levels.push([h+.9,0,.06,.05]);tower(skyline,x,z,levels,c);
    }
    const twins=origin(-8,-14);
    for(const s of [-1,1]){
      const levels=[[0,0,1.9,1.75],[1.7,s*.4,1.45,1.61],[3.4,s*1.65,1.12,1.39],[5.7,s*2.53,.96,1.12],[8.6,s*2.85,.93,.99],[11.5,s*2.58,.77,.86],[12.4,s*2.42,.68,.75]];
      tower(twins,0,0,levels,0x615976,true);
      for(const k of [-.5,.5])rod(twins,[s*2.42+k,12.32,.12],[s*2.25+k,13.31,.12],.054,0xbab0c1);
    }
    const marina=origin(15,-6);marina.position.y=0;
    for(let i=0;i<12;i++){
      const a=(i/13)*Math.PI*1.78+.14,xx=5.6*Math.cos(a),zz=4.4*Math.sin(a),h=1.65+.36*(i%4);
      const b=box(marina,xx,h/2+.2,zz,1.35,h,1.4,i%2?0xca9d7d:0xe2c19b);b.rotation.y=-a;
      ball(marina,xx,h+.18,zz,.68,.29,.68,0xb38466);
    }
    for(let i=0;i<9;i++){const a=i/9*Math.PI*1.6;const boat=ball(marina,3.8*Math.cos(a),-1.30,2.7*Math.sin(a),.17,.12,.55,0xf5edd7);boat.rotation.y=-a;}
    camel(6,5,.65,1);camel(8.8,4,.30,.91);
  }else {
    stadium();
    // A leafy belt of apartment blocks gives the stadium and works their city context.
    for(let i=0;i<18;i++){
      const a=-.65+i*.105, x=20.8*Math.cos(a),z=20.8*Math.sin(a);
      const g=origin(x,z),w=1.7+(i%3)*.25,h=2.1+(i%4)*.64;
      box(g,0,h/2,0,w,h,1.48,[0xcaad96,0xcbbaa0,0xaac0b4,0xb99f8a][i%4]);
      box(g,0,h+.04,0,w+.14,.13,1.61,0xe0d2b9);
      for(let k=0;k<3;k++)for(let j=.72;j<h;j+=.82)box(g,(k-1)*.49,j,.755,.27,.39,.07,0x5d797b);
      blocks.push([x,z,w/2,.82]);
    }
    for(let i=0;i<36;i++){
      const a=i*2.39996, r=18.5+(i%4)*1.23, x=r*Math.cos(a),z=r*Math.sin(a);
      if(z<-12||x>13||Math.abs(x+8)<2.8&&z>11||Math.hypot(x+10,z+7)<7||Math.hypot(x-5,z-13)<2.3)continue;
      const g=origin(x,z);rod(g,[0,0,0],[.08,1.65,0],.12,0x715e49);
      for(let j=0;j<3;j++)ball(g,.55*Math.cos(2.2*j),1.85+.3*(j%2),.48*Math.sin(2.2*j),.91,1.03,.83,[0x63835d,0x799363,0x53795e][j]);
      blocks.push([x,z,.45]);
    }
  }

  const [tx,tz]=trip.tea.counter,stall=origin(tx,tz);
  box(stall,0,.65,0,2.8,1.3,1.4,0x89664e);
  box(stall,0,1.33,.1,3.05,.12,1.65,0xd6b994);
  for(const s of [-1,1])rod(stall,[s*1.34,.7,-.49],[s*1.34,2.75,-.49],.057,0x5b5549);
  for(let i=0;i<9;i++){const awning=box(stall,-1.44+i*.36,2.61,.05,.36,.08,1.92,i%2?0x9b5451:0xe1c591);awning.rotation.x=.14;}
  sign(stall,trip.feature==='qatar'?'كرك  ·  KARAK':'चाय  ·  CHAI',0,2.23,.68,2.8);
  for(let i=0;i<4;i++)mesh(stall,new T.CylinderGeometry(.10,.074,.16,16),0xf2e0c5,-.65+i*.3,1.47,.45);
  ball(stall,.81,1.59,0,.23,.23,.2,0xaaa391);
  blocks.push([tx,tz,1.6,1]);
  return blocks;
}
