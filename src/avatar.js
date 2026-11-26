import * as T from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const tau = 2 * Math.PI;
const vec = (point) => new T.Vector3(...point);
const blend = (a, b, strength) => new T.Color(a).lerp(new T.Color(b), strength);

// Elliptical cross-sections allow the jaw, waist, legs and sleeves to narrow independently.
function rings(sections, sides = 24) {
  const positions = [], indices = [];
  for (const [y, width, depth, x = 0, z = 0] of sections) {
    for (let i = 0; i < sides; i++) {
      const angle = tau * i / sides;
      positions.push(x + width * Math.sin(angle), y, z + depth * Math.cos(angle));
    }
  }
  for (let row = 0; row < sections.length - 1; row++) {
    for (let i = 0; i < sides; i++) {
      const a = row * sides + i, b = row * sides + (i + 1) % sides;
      indices.push(a, b, b + sides, a, b + sides, a + sides);
    }
  }
  for (let i = 1; i < sides - 1; i++) {
    const last = (sections.length - 1) * sides;
    indices.push(0, i + 1, i, last, last + i, last + i + 1);
  }
  const geometry = new T.BufferGeometry();
  geometry.setAttribute('position', new T.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function patch(points, triangles) {
  const geometry = new T.BufferGeometry();
  geometry.setAttribute('position', new T.Float32BufferAttribute(points.flat(), 3));
  geometry.setIndex(triangles);
  geometry.computeVertexNormals();
  return geometry;
}

// Each lock and trailing fabric tip follows a quadratic arc with a raised central ridge.
function blade(start, bend, end, width, depth, axis = [1, 0, 0]) {
  const arc = new T.QuadraticBezierCurve3(vec(start), vec(bend), vec(end));
  const points = [], faces = [];
  const broad = vec(axis).normalize();
  const normal = new T.Vector3();
  for (let i = 0; i <= 8; i++) {
    const t = i / 8;
    const center = arc.getPoint(t);
    normal.crossVectors(arc.getTangent(t), broad).normalize();
    const radius = Math.max(.012, Math.pow(1 - t, .65) * (.58 + .65 * Math.sin(t * Math.PI)));
    for (const [w, h] of [[-1, 0], [0, 1], [1, 0], [0, -.65]]) {
      points.push(center.clone().addScaledVector(broad, w * width * radius)
        .addScaledVector(normal, h * depth * radius).toArray());
    }
    if (i === 0) continue;
    for (let side = 0; side < 4; side++) {
      const a = (i - 1) * 4 + side, b = (i - 1) * 4 + (side + 1) % 4;
      faces.push(a, b, b + 4, a, b + 4, a + 4);
    }
  }
  return patch(points, faces);
}

export function createAvatar(options = {}) {
  const ember = options.style === 'ember';
  const skin = options.skin ?? (ember ? '#d89d7c' : '#bb876a');
  const hair = options.hair ?? (ember ? '#642b42' : '#1a2236');
  const accent = options.accent ?? (ember ? '#dc6850' : '#638df1');
  const hairLight = blend(hair, '#8892a7', .2);
  const hairShade = blend(hair, '#120e20', .36);
  const main = ember ? '#39263f' : '#233044';
  const dark = ember ? '#211c2e' : '#171e2d';
  const clothLight = ember ? '#62415b' : '#38495f';
  const metal = ember ? '#e6bd7a' : '#a9c2d8';
  const lining = blend(accent, dark, .55);
  const leather = '#312839';
  const root = new T.Group();
  root.name = ember ? 'Ember courier' : 'Shadow ranger';

  // Bake rigid details together. Each animated joint draws once even with embroidered
  // trim, eyes and individually sculpted hair locks.
  const material = new T.MeshStandardMaterial({
    vertexColors: true, side: T.DoubleSide, roughness: .8, metalness: .045
  });
  const batches = new Map();
  function joint(parent, x = 0, y = 0, z = 0) {
    const group = new T.Group();
    group.position.set(x, y, z);
    parent.add(group);
    return group;
  }
  function add(parent, geometry, color, position = [0, 0, 0], scale = [1, 1, 1], tilt = 0) {
    geometry.scale(...scale).rotateZ(tilt).translate(...position);
    const mesh = geometry.index ? geometry.toNonIndexed() : geometry;
    if (geometry !== mesh) geometry.dispose();
    mesh.deleteAttribute('uv');
    const rgb = new T.Color(color);
    const colors = new Float32Array(mesh.attributes.position.count * 3);
    for (let i = 0; i < colors.length; i += 3) rgb.toArray(colors, i);
    mesh.setAttribute('color', new T.BufferAttribute(colors, 3));
    if (!batches.has(parent)) batches.set(parent, []);
    batches.get(parent).push(mesh);
  }
  function oval(parent, color, x, y, z, width, height, depth, tilt = 0) {
    add(parent, new T.SphereGeometry(1, 16, 12), color, [x, y, z], [width, height, depth], tilt);
  }
  function seam(parent, color, points, radius) {
    add(parent, new T.TubeGeometry(new T.CatmullRomCurve3(points.map(vec)),
      Math.max(6, points.length * 3), radius, 5, false), color);
  }
  function cloth(parent, color, points) {
    const indices = [];
    for (let i = 2; i < points.length; i++) indices.push(0, i - 1, i);
    add(parent, patch(points, indices), color);
  }
  const body = joint(root);
  const torso = joint(body);
  const head = joint(torso, 0, 1.60, 0);
  const legs = [], arms = [], tails = [], braids = [];

  // Head sections define a smooth cheek-to-chin contour, temple and brow plane.
  add(head, rings([[.005,.018,.027,0,.035],[.022,.052,.057,0,.025],
    [.055,.089,.081,0,.012],[.105,.12,.1],[.158,.13,.111],
    [.205,.126,.108],[.248,.11,.095],[.275,.067,.064],[.282,.016,.018]]), skin);
  add(torso, rings([[1.49,.071,.064],[1.54,.057,.051],[1.625,.048,.05]]), skin);
  for (const side of [-1, 1]) {
    const s = side;
    oval(head, skin, s*.124,.111,-.002,.021,.038,.018,s*-.17);
    oval(head, blend(skin, '#a86765', .4), s*.137,.108,.007,.009,.02,.01);
    if (ember || s === -1) {
      oval(head, metal, s*.134,.084,.009,.009,.009,.009);
      add(head, new T.OctahedronGeometry(1), accent, [s*.134,.064,.01], [.008,.017,.008]);
    }
    // Almond-shaped eye whites follow the curve of the cheek. The contour and
    // highlighted iris stand clear at the close-up distance used in the wardrobe.
    const inner = [s*.022,.142,.108], outer = [s*.098,.151,.074];
    const upper = [s*.059,.162,.102], lower = [s*.059,.130,.101];
    add(head, patch([inner, upper, outer, lower, [s*.061,.145,.106]], [0,1,4,1,2,4,2,3,4,3,0,4]), '#fff5e8');
    const irisTilt = s*.4;
    for (const [c, r, height, offset] of [[dark,.017,.016,0],[accent,.013,.014,.0015],['#231f32',.0065,.012,.003]]) {
      const pupil = new T.SphereGeometry(1,14,10);
      pupil.scale(r,height,.003).rotateY(irisTilt);
      add(head, pupil, c, [s*.058,.146,.107+offset]);
    }
    oval(head,'#fff6dc',s*.054,.152,.116,.004,.004,.002);
    seam(head,hairShade,[inner,upper,outer,[s*.109,.157,.066]],ember?.0037:.0032);
    seam(head,hairShade,[[s*.022,.176,.107],[s*.060,.182+(ember?.003:0),.101],[s*.094,.179,.08]],ember?.0038:.0053);
  }
  oval(head, skin, 0,.113,.103,.012,.027,.015);
  oval(head, blend(skin,'#a66563',.12),0,.096,.113,.016,.009,.013);
  const lip = blend(skin,ember?'#9e3f53':'#804d51',ember?.62:.46);
  seam(head,lip,[[-.028,.064,.086],[-.009,.066,.094],[0,.064,.095],[.009,.066,.094],[.028,.065,.086]],.0028);
  if (ember) oval(head,blend(skin,'#cb6d76',.55),0,.06,.094,.019,.0035,.0027);

  // A made-to-fit cap keeps skin out of the swept locks even when the camera orbits.
  const capPoints = [], capFaces = [];
  const crownY = .169;
  for (let row = 0; row <= 10; row++) for (let i = 0; i < 28; i++) {
    const a = tau * i / 28, front = Math.cos(a);
    const endAngle = 1.79 - .46*front - .10*Math.max(0,front)*Math.sin(2*a);
    const phi = .002 + (endAngle-.002)*row/10;
    capPoints.push([.139*Math.sin(phi)*Math.sin(a), crownY+.126*Math.cos(phi), -.006+.118*Math.sin(phi)*front]);
    if (!row) continue;
    const u = (row-1)*28+i, v = (row-1)*28+(i+1)%28;
    capFaces.push(u,v+28,v,u,u+28,v+28);
  }
  add(head,patch(capPoints,capFaces),hair);
  const lock = (parent, color, a,b,c,w,d,axis) => add(parent,blade(a,b,c,w,d,axis),color);
  for (let i = 0; i < 12; i++) {
    const a = (i+.5)/12*tau, s = Math.sin(a), c = Math.cos(a);
    if (c > .42) continue;
    const endY = ember ? .03 + .025*Math.cos(i*2.4) : .082 + .021*Math.cos(i*2.4);
    lock(head,i%3 ? hair : hairLight,[s*.085,.26,c*.066],[s*.15,.2,c*.13],
      [s*(ember?.128:.152),endY,c*.123-.013],.048,.022,[c,0,-s]);
  }
  const bangs = ember ? [
    [[-.062,.276,.054],[-.06,.21,.136],[.006,.151,.111],.043],
    [[-.037,.279,.057],[.016,.218,.143],[.075,.172,.10],.049],
    [[-.018,.275,.054],[.075,.239,.116],[.117,.136,.065],.045],
    [[-.073,.26,.055],[-.133,.192,.092],[-.12,.061,.069],.036],
    [[.076,.256,.047],[.143,.17,.073],[.111,.041,.085],.035]
  ] : [
    [[-.06,.278,.04],[-.123,.25,.114],[-.134,.143,.07],.045],
    [[-.068,.274,.054],[-.077,.224,.139],[-.089,.122,.094],.048],
    [[-.042,.287,.051],[-.054,.218,.141],[-.013,.157,.117],.049],
    [[-.017,.284,.046],[.031,.228,.146],[.058,.137,.107],.052],
    [[.009,.283,.041],[.087,.244,.126],[.123,.161,.071],.047],
    [[.057,.266,.045],[.121,.223,.095],[.15,.179,.038],.037]
  ];
  bangs.forEach(([a,b,c,w], i) => lock(head,i%3===1?hairLight:hair,a,b,c,w,.023));
  if (ember) {
    oval(head,hairShade,0,.228,-.124,.067,.063,.074);
    oval(head,metal,0,.218,-.165,.055,.041,.033);
    const pony = joint(head,0,.216,-.171);
    braids.push(pony);
    for (let i = 0; i < 7; i++) {
      const x = (i-3)*.018;
      lock(pony,i%3===1?hairLight:hair,[x*.5,.012,0],[x*1.9+.05,-.18,-.113],
        [x*.93+.065,-.39+.038*Math.cos(i),-.05+(i%2)*.018],.035,.025);
    }
    for (const s of [-1,1]) {
      lock(head,accent,[0,.22,-.157],[s*.09,.265,-.164],[s*.098,.2,-.158],.025,.013,[0,1,0]);
    }
  } else {
    for (let i = 0; i < 6; i++) {
      const x = (i-2.5)*.033;
      lock(head,i%3===2?hairLight:hair,[x,.247,.017],[x+.017,.30,-.035],
        [x+.03,.31+.015*Math.cos(i*1.7),-.115+(i%2)*.025],.04,.026);
    }
  }

  const shoulder = ember ? .18 : .207;
  add(torso,rings([[.91,.142,.095],[1.0,ember?.169:.155,.105],[1.117,ember?.12:.143,.089],
    [1.24,ember?.142:.162,.107],[1.355,ember?.175:.194,ember?.124:.117],
    [1.448,shoulder,.104],[1.496,shoulder-.015,.091],[1.532,.079,.069]]),main);
  add(torso,rings([[1.502,.095,.079],[1.568,.082,.073],[1.581,.071,.066]]),dark);
  add(torso,rings([[1.552,.085,.075],[1.562,.084,.074]]),metal);
  const shoulderY = 1.449;
  // Both outfits have a different front closure, split coat and a readable back device.
  for (const s of [-1,1]) {
    const lapel = [[s*.076,1.536,.035],[s*shoulder*.97,1.465,.041],
      [s*.134,1.368,.096],[s*.029,ember?1.19:1.27,.102],[s*.054,1.408,.116]];
    cloth(torso,clothLight,lapel);
    seam(torso,ember?metal:accent,[lapel[0],lapel[4],lapel[3]],.0045);
    seam(torso,clothLight,[[s*.071,1.50,-.079],[s*.153,1.42,-.089],[s*.09,1.28,-.101],[s*.06,1.16,-.087]],.006);
  }
  add(torso,rings([[1.06,.148,.10],[1.111,.145,.099]]),leather);
  add(torso,rings([[1.105,.147,.101],[1.115,.145,.1]]),metal);
  add(torso,new T.OctahedronGeometry(1),metal,[0,1.088,.106],[.031,.027,.009]);
  if (ember) {
    for (const s of [-1,1]) {
      seam(torso,metal,[[s*.103,1.407,.102],[s*.065,1.315,.114],[s*.083,1.22,.092],[s*.056,1.124,.082]],.0038);
      cloth(torso,lining,[[s*.03,1.23,.105],[s*.107,1.385,.107],[s*.152,1.36,.076],[s*.114,1.255,.085]]);
    }
    add(torso,new T.OctahedronGeometry(1),accent,[0,1.485,.096],[.018,.031,.009]);
  } else {
    const strap = [[-.176,1.474,.059],[-.14,1.492,.076],[.134,1.175,.059],[.121,1.145,.055]];
    cloth(torso,leather,strap);
    seam(torso,metal,[[.008,1.306,.118],[.035,1.329,.114]],.009);
    for (let i=0; i<3; i++) oval(torso,metal,-.048,1.33-i*.075,.113-i*.006,.007,.007,.004);
  }
  // Offset layered panels reveal the lining and preserve room for the leg swing.
  for (const s of [-1,1]) {
    const tail = joint(body,0,1.061,0);
    tails.push(tail);
    const length = ember ? (s>0?.38:.47) : .48;
    const inner = [s*.025,-.035,-.103], outer = [s*.148,-.005,.035];
    const outerHem = [s*(ember?.232:.216),-length+.075,.018];
    const midHem = [s*.145,-length-.018,-.145];
    const innerHem = [s*.038,-length+.05,-.164];
    const fold = [s*.137,-.18,-.111];
    add(tail,patch([inner,outer,outerHem,midHem,innerHem,fold],
      [0,1,5,1,2,5,2,3,5,3,4,5,4,0,5]),main);
    cloth(tail,lining,[[s*.13,-.032,.057],outer,[outerHem[0],outerHem[1]+.003,.022],
      [s*.177,-length+.041,.053]]);
    seam(tail,ember?metal:accent,[outerHem,midHem,innerHem],.0045);
  }
  const insigniaY=1.391;
  const badge = [[0,insigniaY+.067,-.109],[-.05,insigniaY,-.126],[0,insigniaY-.069,-.119],[.05,insigniaY,-.126]];
  seam(torso,metal,[...badge,badge[0]],.004);
  add(torso,new T.OctahedronGeometry(1),accent,[0,insigniaY,-.127],[.021,.039,.008]);

  for (const s of [-1,1]) {
    const hip = joint(body,s*(ember?.086:.091),.915,0);
    const knee = joint(hip,0,-.435,0);
    const thigh = ember ? '#423445' : '#2a3446';
    add(hip,rings([[-.442,.061,.061],[-.374,.065,.065],[-.228,.08,.084],
      [-.082,.09,.092],[.013,.081,.079]],18),thigh);
    add(knee,rings([[-.428,.052,.067],[-.362,.048,.06],[-.26,.051,.061],
      [-.161,.068,.075],[-.057,.068,.066],[.019,.061,.06]],18),dark);
    add(knee,rings([[-.37,.053,.07],[-.327,.053,.065],[-.168,.072,.077],
      [ember?-.018:-.096,.07,.068]],18),leather);
    const bootTop = ember ? -.016 : -.094;
    add(knee,rings([[bootTop-.02,.071,.071],[bootTop,.072,.071]],18),ember?metal:clothLight);
    oval(knee,leather,0,-.413,.034,.067,.064,.122);
    oval(knee,dark,0,-.45,.039,.07,.027,.125);
    seam(knee,metal,[[s*.042,-.394,.089],[s*.038,-.354,.065],[s*.049,-.291,.039]],.005);
    legs.push({hip,knee,s});

    const arm = joint(torso,s*shoulder,shoulderY,0);
    arm.rotation.z=s*.089;
    const elbow = joint(arm,0,-.245,0);
    const armWidth = ember ? .060 : .071;
    add(arm,rings([[-.253,.047,.05],[-.19,.054,.055],[-.089,armWidth,.068],
      [-.016,armWidth+.007,.071],[.039,.048,.05]],18),ember?skin:main);
    add(arm,rings([[-.125,armWidth+.005,.074],[-.055,armWidth+.014,.079],[.018,armWidth+.005,.071],
      [.054,.032,.039]],18),s===-1?clothLight:main);
    add(arm,rings([[-.127,armWidth+.006,.075],[-.113,armWidth+.008,.075]],18),s===-1?metal:accent);
    add(elbow,rings([[-.225,.032,.035],[-.179,.033,.039],[-.095,.047,.051],
      [.012,.048,.051]],16),ember?skin:dark);
    add(elbow,rings([[-.194,.038,.042],[-.148,.046,.05],[-.068,.052,.055]],16),leather);
    add(elbow,rings([[-.19,.04,.044],[-.175,.04,.046]],16),metal);
    oval(elbow,ember?skin:dark,0,-.249,.003,.035,.06,.033,s*-.083);
    oval(elbow,ember?skin:dark,-s*.029,-.239,.019,.016,.033,.018,s*-.2);
    arms.push({arm,elbow,s});
  }
  const assets = [];
  for (const [parent,parts] of batches) {
    const geometry = mergeGeometries(parts);
    parts.forEach(part=>part.dispose());
    const surface = new T.Mesh(geometry,material);
    surface.castShadow = true;
    surface.receiveShadow = true;
    parent.add(surface);
    assets.push(geometry);
  }
  root.userData.animate = (time = 0, movementAmount = 0, seated = false) => {
    const stride = Math.sin(time*9);
    const motion = seated ? 0 : T.MathUtils.clamp(movementAmount,0,1);
    body.position.y = seated ? -.34 : Math.cos(time*18)*.014*motion;
    torso.rotation.z = Math.sin(time*9)*motion*.018;
    head.rotation.z = Math.sin(time*1.45)*.017;
    head.rotation.y = Math.sin(time*.65)*.034;
    for (const {hip,knee,s} of legs) {
      hip.rotation.x = seated ? -1.28 : s*stride*motion*.53;
      knee.rotation.x = seated ? 1.38 : Math.max(0,-s*Math.cos(time*9))*motion*.61;
    }
    for (const {arm,elbow,s} of arms) {
      arm.rotation.x = seated ? -.39 : -s*stride*motion*.49 - .035;
      elbow.rotation.x = seated ? -.74 : -.13 - Math.max(0,s*stride)*motion*.28;
    }
    tails.forEach((tail,i)=>{ tail.rotation.x = .018 + motion*.12 + Math.sin(time*(motion?9:1.7)+i)*(.013+.046*motion); });
    braids.forEach(pony=>{ pony.rotation.z = .06*Math.sin(time*(motion?4.5:1.5)); });
  };
  root.userData.dispose = () => { assets.forEach(geometry=>geometry.dispose()); material.dispose(); };
  root.userData.animate();
  return root;
}
