export const LAND=[[-60,-44],[-49,-61],[-18,-65],[16,-61],[48,-54],[61,-33],[59,15],[51,49],[20,59],[-20,57],[-57,37],[-64,4]];
export const riverX=z=>35+Math.sin(z*.065)*3;
export function insideLand(x,z){let inside=false;for(let i=0,j=LAND.length-1;i<LAND.length;j=i++){const [xi,zi]=LAND[i],[xj,zj]=LAND[j];if((zi>z)!==(zj>z)&&x<(xj-xi)*(z-zi)/(zj-zi)+xi)inside=!inside;}return inside;}
export function terrainAllows(x,z,margin=.5){
  if(!insideLand(x-margin,z-margin)||!insideLand(x+margin,z+margin))return false;
  const bridge=Math.abs(z-20)<3.6-margin||Math.abs(z+26)<3.6-margin;
  return Math.abs(x-riverX(z))>3.7+margin||bridge;
}
export function blockedByObjects(x,z,obstacles,margin=.4){return obstacles.some(o=>o.w?Math.abs(x-o.x)<o.w/2+margin&&Math.abs(z-o.z)<o.d/2+margin:Math.hypot(x-o.x,z-o.z)<o.r+margin);}
