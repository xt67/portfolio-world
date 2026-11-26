import * as T from 'three';

function random(seed) {
  let n=seed;
  return ()=>((n=Math.imul(1664525,n)+1013904223>>>0)/4294967296);
}
function texture(width,height,paint) {
  const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
  paint(canvas.getContext('2d'));
  const map=new T.CanvasTexture(canvas);map.colorSpace=T.SRGBColorSpace;map.anisotropy=4;return map;
}

export function paintTownGround(material){
  const map=texture(256,256,ctx=>{
    const rand=random(237);ctx.fillStyle='#c9c48d';ctx.fillRect(0,0,256,256);
    for(let i=0;i<4400;i++){
      const x=rand()*256,y=rand()*256;
      ctx.fillStyle=['#d3d29c','#bcb881','#adad78','#c4c28e','#e2d09f'][i%5];ctx.globalAlpha=.2+rand()*.35;
      ctx.beginPath();ctx.ellipse(x,y,.7+rand()*4,.3+rand()*1.4,-.3,0,2*Math.PI);ctx.fill();
    }
  });
  map.wrapS=map.wrapT=T.RepeatWrapping;map.repeat.set(.11,.11);
  material.color.set(0xc6cd98);material.map=map;
}

export function atmosphere(scene,water){
  const sky=new T.Mesh(new T.SphereGeometry(540,36,20),new T.ShaderMaterial({
    side:T.BackSide,depthWrite:false,uniforms:{twilight:{value:0}},
    vertexShader:'varying vec3 vDir;void main(){vDir=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader:`varying vec3 vDir;uniform float twilight;
    float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
    float noise(vec2 p){vec2 i=floor(p),u=fract(p);u=u*u*(3.-2.*u);return mix(mix(hash(i),hash(i+vec2(1.,0.)),u.x),mix(hash(i+vec2(0.,1.)),hash(i+1.),u.x),u.y);}
    void main(){
      vec3 d=normalize(vDir);float h=max(d.y,0.);vec3 sun=normalize(vec3(-.62,.32,-.72));
      vec3 color=mix(vec3(.96,.81,.66),vec3(.19,.53,.74),smoothstep(-.06,.72,h));
      vec2 uv=d.xz/max(.08,d.y)*2.4;float c=noise(uv*.75)*.55+noise(uv*1.7)*.28+noise(uv*4.)*.13+noise(uv*9.)*.04;
      float clouds=smoothstep(.51,.60,c)*smoothstep(.05,.20,h);
      color=mix(color,mix(vec3(.83,.78,.79),vec3(1.,.95,.84),smoothstep(.54,.69,c)),clouds*.86);
      float s=max(dot(d,sun),0.);color+=vec3(.33,.19,.08)*pow(s,12.);color=mix(color,vec3(1.,.95,.77),smoothstep(.9986,.9991,s));
      color=mix(color,color*vec3(.12,.19,.34)+vec3(.015,.02,.055),twilight);
      gl_FragColor=vec4(color,1.);
      #include <colorspace_fragment>
    }`
  }));
  sky.frustumCulled=false;sky.renderOrder=-2;scene.add(sky);
  const sea=new T.ShaderMaterial({uniforms:{seconds:{value:0},twilight:{value:0}},vertexShader:`varying vec3 point;
  void main(){point=(modelMatrix*vec4(position,1.)).xyz;gl_Position=projectionMatrix*viewMatrix*vec4(point,1.);}`,
  fragmentShader:`varying vec3 point;uniform float seconds;uniform float twilight;
  void main(){vec2 p=point.xz;float t=seconds*.52;float swell=sin(p.y*.45+sin(p.x*.08+t))*.45+cos(p.x*.21-p.y*.6+t)*.32+sin(p.y*1.72+p.x*.09+t*2.)*.23;
   vec3 water=mix(vec3(.065,.31,.36),vec3(.19,.51,.52),swell*.5+.5);
   float crest=smoothstep(.73,.83,swell);water+=crest*vec3(.055,.075,.065);
   float haze=smoothstep(145.,390.,length(point.xz-cameraPosition.xz));water=mix(water,vec3(.76,.77,.68),haze);
   gl_FragColor=vec4(mix(water,water*vec3(.18,.27,.4),twilight),1.);
   #include <colorspace_fragment>
  }`});
  water.material=sea;
  return {tick(time,camera){sky.position.copy(camera.position);sea.uniforms.seconds.value=time;},night(on){sea.uniforms.twilight.value=sky.material.uniforms.twilight.value=Number(on);}};
}

let illustrationMaterial;
const tiles={souq:[0,.5],factory:[.5,.5],townhouse:[0,0],courtyard:[.5,0]};
export function illustratedWall(group,tile,x,y,z,width,height,angle=0){
  if(!illustrationMaterial){
    const atlas=new T.TextureLoader().load('/architecture.webp');
    atlas.colorSpace=T.SRGBColorSpace;atlas.anisotropy=8;
    illustrationMaterial=new T.MeshStandardMaterial({map:atlas,roughness:.97,emissiveMap:atlas,emissive:0x414141});
  }
  const geo=new T.PlaneGeometry(width,height),uv=geo.attributes.uv,[u,v]=tiles[tile];
  for(let i=0;i<uv.count;i++)uv.setXY(i,u+.002+uv.getX(i)*.496,v+.002+uv.getY(i)*.496);
  const wall=new T.Mesh(geo,illustrationMaterial);wall.position.set(x,y,z);wall.rotation.y=angle;wall.receiveShadow=true;group.add(wall);
}
export function paintHouse(group,house){
  const gulf=house.tint%2===0,tile=gulf?'courtyard':'townhouse';
  for(const side of [-1,1])illustratedWall(group,tile,side*(house.w/2+.024),house.height/2,0,house.d*.993,house.height*.997,side*Math.PI/2);
  illustratedWall(group,tile,0,house.height/2,house.d/2+.026,house.w*.996,house.height*.998);
  illustratedWall(group,gulf?'souq':tile,0,house.height/2,-house.d/2-.024,house.w*.99,house.height*.998,Math.PI);
}

function treeArt(palm){
  return texture(256,320,ctx=>{
    const rand=random(palm?149:287);
    ctx.lineCap='round';
    if(palm){
      ctx.strokeStyle='#795a46';ctx.lineWidth=10;ctx.beginPath();ctx.moveTo(129,319);ctx.quadraticCurveTo(151,203,125,109);ctx.stroke();
      for(let j=0;j<18;j++){const f=j/18;ctx.strokeStyle='#bc9b71';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(127+9*Math.sin(f*3),308-f*181);ctx.lineTo(135+9*Math.sin(f*3),306-f*181);ctx.stroke();}
      for(let i=0;i<16;i++){
        const angle=i*Math.PI*2/16+.08*rand(),sx=Math.cos(angle)*(.72+.27*rand()),sy=Math.sin(angle);
        for(let k=0;k<43;k++){
          const f=k/43,x=126+119*sx*f,y=106+65*sy*f-50*Math.sin(Math.PI*f)+20*f*f;
          ctx.strokeStyle=['#345c4d','#477257','#75905d','#8c9c65'][i%4];ctx.lineWidth=2.5;
          for(const side of [-1,1]){ctx.beginPath();ctx.moveTo(x,y);ctx.quadraticCurveTo(x+side*sx*2,y+5,x+side*(7+Math.sin(Math.PI*f)*9),y+8+Math.sin(Math.PI*f)*13);ctx.stroke();}
        }
      }
    }else{
      ctx.strokeStyle='#735f4b';ctx.lineWidth=13;ctx.beginPath();ctx.moveTo(125,319);ctx.quadraticCurveTo(136,220,118,163);ctx.stroke();
      for(let i=0;i<17;i++){const x=46+rand()*160,y=66+rand()*113;ctx.lineWidth=3+rand()*5;ctx.beginPath();ctx.moveTo(125,234-rand()*34);ctx.quadraticCurveTo((x+125)/2,y+49,x,y);ctx.stroke();}
      for(let j=0;j<2500;j++){
        const a=rand()*2*Math.PI,r=Math.sqrt(rand()),x=128+Math.cos(a)*110*r,y=129+Math.sin(a)*93*r+12*Math.sin(a*5);
        const light=(1-r)*.5+(128-y)/200+rand()*.45;
        ctx.fillStyle=light>.62?'#a0ad70':light>.36?'#849b68':light>.1?'#64835d':'#426b56';
        ctx.beginPath();ctx.ellipse(x,y,4+rand()*9,2+rand()*5,-.35,0,2*Math.PI);ctx.fill();
      }
    }
  });
}
export function plantPaintedTrees(world,trees,action){
  for(const palm of [false,true]){
    const instances=trees.filter((t,i)=>(i%4===0)===palm);
    const mat=new T.MeshStandardMaterial({map:treeArt(palm),roughness:1,side:T.DoubleSide,alphaTest:.47});
    const geo=new T.PlaneGeometry(palm?3.9:3.6,palm?5:4.6);geo.translate(0,(palm?5:4.6)/2,0);
    const mesh=new T.InstancedMesh(geo,mat,instances.length*2),dummy=new T.Object3D();
    instances.forEach((tree,i)=>{
      dummy.position.set(tree.x,.3,tree.z);dummy.scale.setScalar(tree.scale);
      for(let j=0;j<2;j++){dummy.rotation.y=i*1.87+j*Math.PI/2;dummy.updateMatrix();mesh.setMatrixAt(i*2+j,dummy.matrix);}
    });
    mesh.castShadow=mesh.receiveShadow=true;world.add(mesh);action(mesh,'look:Tree');
  }
}
function scallopArch(width,height,rise,depth,stone) {
  const profile=new T.Shape(),half=width/2,leg=.22;
  profile.moveTo(-half,0);profile.lineTo(-half,height);profile.lineTo(half,height);profile.lineTo(half,0);
  profile.lineTo(half-leg,0);profile.lineTo(half-leg,height-rise);
  profile.bezierCurveTo(half-leg,height-rise*.48,half*.65,height-rise*.57,half*.61,height-rise*.48);
  profile.bezierCurveTo(half*.42,height-rise*.19,half*.21,height-rise*.28,0,height-.15);
  profile.bezierCurveTo(-half*.21,height-rise*.28,-half*.42,height-rise*.19,-half*.61,height-rise*.48);
  profile.bezierCurveTo(-half*.65,height-rise*.57,-half+leg,height-rise*.48,-half+leg,height-rise);
  profile.lineTo(-half+leg,0);profile.closePath();
  return new T.Mesh(new T.ExtrudeGeometry(profile,{depth,bevelEnabled:true,bevelSegments:2,bevelSize:.027,bevelThickness:.025,curveSegments:8}),stone);
}

export function dressPavilion(g,color,box) {
  const stone=new T.MeshStandardMaterial({color:0xe1c5a0,roughness:.93});
  for(let i=0;i<3;i++){
    const x=(i-1)*2.91;
    const arch=scallopArch(2.93,1.17,.78,.21,stone);
    arch.position.set(x,2.89,2.51);g.add(arch);
    if(i<2)box(g,.14,2.89,.14,x+1.45,1.44,2.63,color);
  }
  for(let j=0;j<10;j++)box(g,.24,.19,.26,-4.03+j*.89,4.24,2.65,0xd9b989);
}

export function plazaTiles(){
  const map=texture(512,512,ctx=>{
    ctx.fillStyle='#e6d4ae';ctx.fillRect(0,0,512,512);ctx.translate(256,256);
    ctx.strokeStyle='#baa785';ctx.lineWidth=1;
    for(let p=-256;p<256;p+=32){ctx.strokeRect(-256,p,512,32);ctx.strokeRect(p,-256,32,512);}
    for(const [r,col,w] of [[222,'#aa735c',5],[210,'#69867b',3],[186,'#bda880',2],[101,'#b99a78',2]]){
      ctx.strokeStyle=col;ctx.lineWidth=w;ctx.beginPath();ctx.arc(0,0,r,0,2*Math.PI);ctx.stroke();
    }
    for(let i=0;i<24;i++){
      ctx.save();ctx.rotate(i*Math.PI/12);ctx.beginPath();ctx.moveTo(0,112);ctx.quadraticCurveTo(-28,152,0,190);ctx.quadraticCurveTo(28,152,0,112);ctx.fillStyle=i%2?'#bd8f73':'#93a18b';ctx.fill();ctx.restore();
    }
    ctx.fillStyle='#dbcba7';ctx.beginPath();ctx.arc(0,0,98,0,Math.PI*2);ctx.fill();
  });
  return new T.MeshBasicMaterial({map,side:T.DoubleSide});
}
