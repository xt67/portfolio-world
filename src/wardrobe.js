import * as T from 'three';
import {createAvatar} from './avatar.js';

const storageKey = 'xt67.traveller.v1';
const styles = {
  shadow: {label: 'Boy', name: 'Night courier', accent: '#68b9e1'},
  ember: {label: 'Girl', name: 'Ember duelist', accent: '#ed806e'}
};
const palettes = {
  skin: [['Porcelain','#f3cbb4'],['Honey','#dcaa83'],['Bronze','#ad775b'],['Umber','#805345'],['Mahogany','#59392f']],
  hair: [['Ink','#252332'],['Chestnut','#673e38'],['Platinum','#e3d6bb'],['Plum','#613e63'],['Midnight','#313e5e']],
  accent: [['Glacier','#68b9e1'],['Ember','#ed806e'],['Iris','#a996eb'],['Jade','#67b89b'],['Gold','#e4b65c']]
};

export function validatedLook(value) {
  const style = Object.hasOwn(styles, value?.style) ? value.style : 'shadow';
  const defaults = {skin:'#dcaa83', hair:'#252332', accent:styles[style].accent};
  const result = {style};
  for (const [field, choices] of Object.entries(palettes)) {
    result[field] = choices.some(([, hex]) => hex === value?.[field]) ? value[field] : defaults[field];
  }
  return result;
}

export function loadLook() {
  try { return validatedLook(JSON.parse(localStorage.getItem(storageKey))); }
  catch { return validatedLook(); }
}

export function saveLook(look) {
  try { localStorage.setItem(storageKey, JSON.stringify(validatedLook(look))); } catch {}
}

function modelPreview(canvas, look) {
  const renderer = new T.WebGLRenderer({canvas, antialias:true, alpha:true});
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.7));
  renderer.setClearColor(0,0);
  renderer.toneMapping = T.ACESFilmicToneMapping;
  const scene = new T.Scene();
  scene.add(new T.HemisphereLight(0xfff1ec, 0x7e7794, 2.2));
  for (const [color, intensity, position] of [[0xffe3c6,2.8,[3,4,4]],[0xbbcaff,2.4,[-2,2,-2]]]) {
    const lamp = new T.DirectionalLight(color,intensity);
    lamp.position.set(...position);
    scene.add(lamp);
  }
  const camera = new T.PerspectiveCamera(27,1,.05,25);
  let lastWidth=0,lastHeight=0;
  let avatar, angle=.18, portrait=false, animation=0, pointer=null;
  function update(next) {
    if (avatar) { scene.remove(avatar); avatar.userData.dispose(); }
    avatar = createAvatar(next);
    scene.add(avatar);
  }
  update(look);
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  function draw(time) {
    const {width,height} = canvas.getBoundingClientRect();
    if (width && height) {
      if(width!==lastWidth||height!==lastHeight){renderer.setSize(width,height,false);lastWidth=width;lastHeight=height;}
      camera.aspect = width/height;
      const focus = portrait ? 1.58 : .99;
      const depth = (portrait ? 1.6 : 4.65) / Math.min(1,camera.aspect*1.7);
      camera.position.set(0,focus+.035,depth);
      camera.lookAt(0,focus,0);
      camera.updateProjectionMatrix();
      avatar.rotation.y=angle;
      avatar.userData.animate(reduceMotion ? 0 : time/1000,0);
      renderer.render(scene,camera);
    }
    animation=requestAnimationFrame(draw);
  }
  animation=requestAnimationFrame(draw);
  canvas.onpointerdown=e=>{pointer=e.clientX;canvas.setPointerCapture(e.pointerId);};
  canvas.onpointermove=e=>{if(pointer!==null){angle+=(e.clientX-pointer)*.018;pointer=e.clientX;}};
  canvas.onpointerup=canvas.onlostpointercapture=()=>{pointer=null;};
  return {
    update, rotate:()=>{angle+=Math.PI/4;}, zoom:()=>{portrait=!portrait;return portrait;},
    dispose(){cancelAnimationFrame(animation);avatar.userData.dispose();renderer.dispose();renderer.forceContextLoss();}
  };
}

export function openWardrobe(dialog, show, current, apply) {
  const draft={...current};
  const radio=(group,value,checked,label,content)=>`<label title="${label}"><input type="radio" name="${group}" value="${value}" aria-label="${label}" ${checked?'checked':''}>${content}</label>`;
  const stylesHtml=Object.entries(styles).map(([key,item])=>radio('style',key,key===draft.style,item.label,`<span><b>${item.label}</b><small>${item.name}</small></span>`)).join('');
  const colors=Object.entries(palettes).map(([key,choices])=>`<fieldset class="color-row"><legend>${{skin:'Skin tone',hair:'Hair',accent:'Outfit trim'}[key]}</legend>${choices.map(([label,hex])=>radio(key,hex,hex===draft[key],label,`<span style="--swatch:${hex}"></span>`)).join('')}</fieldset>`).join('');
  show(`<div class="wardrobe"><div class="wardrobe-stage"><canvas aria-label="3D character preview. Drag to turn."></canvas><div class="stage-buttons"><button id="turn-model">Rotate ↻</button><button id="zoom-model" aria-pressed="false">Portrait</button></div></div><form class="wardrobe-form"><h2>Your character</h2><fieldset class="style-row"><legend>Character style</legend>${stylesHtml}</fieldset>${colors}<button class="primary" type="submit">Wear this look</button></form></div>`);
  dialog.classList.add('wardrobe-dialog');
  const preview=modelPreview(dialog.querySelector('canvas'),draft);
  dialog.querySelector('#turn-model').onclick=preview.rotate;
  const zoom=dialog.querySelector('#zoom-model');
  zoom.onclick=()=>{const closeUp=preview.zoom();zoom.setAttribute('aria-pressed',String(closeUp));zoom.textContent=closeUp?'Full length':'Portrait';};
  const form=dialog.querySelector('form');
  form.onchange=({target})=>{
    const previous=draft.style;
    draft[target.name]=target.value;
    if(target.name==='style' && draft.accent===styles[previous].accent){
      draft.accent=styles[draft.style].accent;
      form.querySelector(`input[name=accent][value="${draft.accent}"]`).checked=true;
    }
    preview.update(draft);
  };
  form.onsubmit=e=>{e.preventDefault();apply({...draft});dialog.close();};
  dialog.addEventListener('close',()=>{preview.dispose();dialog.classList.remove('wardrobe-dialog');},{once:true});
}
