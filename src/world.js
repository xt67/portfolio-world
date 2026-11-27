import {loadLook,saveLook,openWardrobe} from './wardrobe.js';
import {journeys} from './journeys.js';
import {installDestinations,exploreDestination} from './expedition.js';
import {MovementKeys,actionForKey,defaultBindings} from './movement.js';
import {steerBoat,upstreamHeading,WATER_Y,riverLocation} from './sailing.js';
import QRCode from 'qrcode';
import {createWorld,locations} from './world-scene.js';
import {projects,icons} from './content.js';
import {stepCar,stepVehicle,makeSession} from './simulation.js';
import './world.css';
import {personalMarkup,galleryMarkup,flightMarkup,projectImages,destinations,clanMarkup,repositoryCards} from './panels.js';
import {LAND,roads,riverX,bridges,RIVER_HALF} from './navigation.js';
const $=s=>document.querySelector(s);
$('#app').innerHTML=`<canvas id="world" aria-label="Rayan Rahman's interactive portfolio island"></canvas><div id="interface" class="onboarding"><header class="topbar"><a href="?" class="brand">rayan rahman <span>XT67 / A WORLD OF EXPERIMENTS</span></a><nav class="toolbar" aria-label="Portfolio navigation"><button class="glass" id="help">Help · Esc</button><button class="glass" id="wardrobe">Character</button><button class="glass" id="vehicle">Drive · C</button><button class="glass" id="overview">Map · O</button><button class="glass" id="passport">Trail <span id="stamp-count">0/5</span></button><button class="glass" id="menu">Explore ☰</button><button class="glass round" id="theme" aria-label="Switch to night mode">☾</button><button class="glass round" id="home" aria-label="Return to central plaza">⌂</button></nav></header><div class="title-card" id="title-card"><h1>Arrival plaza</h1><p>Drag to turn. Pick a lane or open the map.</p></div><div class="labels" id="labels"></div><div id="flight-status" class="flight-status glass" role="status"></div><div class="bottom-left"><div class="location glass"><small>YOU ARE HERE</small><span id="area">Arrival plaza</span><span id="travel-mode">ON FOOT</span></div></div><div class="instructions"><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> move · <kbd>C</kbd> switch walk / car · click ground to walk<br><kbd>E</kbd> interact · <kbd>M</kbd> menu · <kbd>O</kbd> world map</div><div class="map glass"><span>THE WORLD</span><svg viewBox="-151 -134 310 226" aria-label="Island overview">${Object.entries(journeys).map(([name,s])=>`<g class="map-region" data-region="${name}"><path transform="translate(${s.center.join(' ')})" d="M-24 5 Q-31 -9 -18 -18 T9 -21 Q28 -23 25 -7 T22 12 Q9 22 -6 19 T-24 5Z" fill="#bfaa84" stroke="#f1d5a4"/><text x="${s.center[0]}" y="${s.center[1]+4}" text-anchor="middle">${name}</text></g>`).join('')}<polygon points="${LAND.map(p=>p.join(',')).join(' ')}" fill="#487466" stroke="#a3bea0" stroke-width="1"/><polyline points="${Array.from({length:161},(_,i)=>[riverX(i-80),i-80].join(',')).join(' ')}" fill="none" stroke="#79c4ca" stroke-width="7"/>${roads.map(r=>`<polyline points="${r.points.map(p=>p.join(',')).join(' ')}" fill="none" stroke="#ceb78c" stroke-width="${r.width*.6}"/>`).join('')}${locations.map(l=>`<circle class="mapdot" data-map="${l.id}" cx="${l.x}" cy="${l.z}" r="3"><title>${l.name}</title></circle>`).join('')}<circle id="map-player" r="1.9" fill="#fff" stroke="#234c45" stroke-width=".6"/></svg></div><div class="touchpad" aria-label="Walk controls"><button data-walk="arrowup" aria-label="Walk forward">↑</button><button data-walk="arrowleft" aria-label="Walk left">←</button><button data-walk="arrowdown" aria-label="Walk back">↓</button><button data-walk="arrowright" aria-label="Walk right">→</button></div><button class="hint" id="nearby"></button><div class="drive-hud"><div class="drive-stats glass"><span><b id="speed">0</b>SIM KM/H</span><span><b id="timer">45</b>SECONDS</span></div><div class="drive-actions"><button class="glass" id="reset-car">Reset car · R</button><button class="primary" id="finish">Finish drive ↗</button></div><div class="drive-tip glass" id="drive-tip">↑ / W accelerate · ← → / A D steer · ↓ / S brake / reverse</div><div class="drive-controls"><div><button data-drive="arrowleft" aria-label="Steer left">←</button><button data-drive="arrowright" aria-label="Steer right">→</button></div><div><button data-drive="arrowdown" aria-label="Brake / reverse">↓</button><button data-drive="arrowup" aria-label="Accelerate">↑</button></div></div></div><div class="welcome" id="welcome"><div class="welcome-card"><div class="eyebrow">RAYAN RAHMAN / XT67</div><h1>From Jamshedpur<br><em>to Qatar.</em></h1><p>I’m Rayan. I was born in Jamshedpur and spent my childhood in Qatar. Start in the neighbourhood, stop for chai, or catch a flight to either shore.</p><button class="primary" id="enter">Start exploring ↗</button> <button class="glass pick-look" id="welcome-look">Choose character</button><div class="keys">WASD / ARROWS TO MOVE · C TO SWITCH WALK / CAR<br>Touch controls available on mobile. Drag to orbit · Help for controls.</div></div></div></div><dialog id="detail" aria-label="Portfolio details"></dialog>`;
let appearance=loadLook();
let sailing=false,boatState={x:riverX(49),z:49,heading:Math.PI},yaw=.27,pitch=.24,distance=13,drag=null,dragged=false,flightTo='',island=null,departAt=0,pause=false;
const quotes=['A quiet moment can change the shape of a busy day.','Take the long way when you have time to notice it.','A small beginning is still a beginning.'];
let cups=0;
function standUp(){if(!seated)return;seated=false;for(let i=0;i<16;i++){const a=i*Math.PI/8,x=player.x+2.4*Math.cos(a),z=player.z+2.4*Math.sin(a);if(!W.town.blocked(x,z,.95)){player.x=x;player.z=z;break;}}}
function setBoatControls(on){
  $('#interface').classList.toggle('sailing',on);
  const names=on?['Sail forward','Turn boat left','Reverse boat','Turn boat right']:['Walk forward','Walk left','Walk back','Walk right'];
  document.querySelectorAll('[data-walk]').forEach((b,i)=>b.setAttribute('aria-label',names[i]));
  $('#vehicle').setAttribute('aria-pressed',String(on));
  W.marker.visible=!on;
}
function landBoat(){if(!sailing)return;sailing=false;keys.clear();setBoatControls(false);W.town.setSailing(false);$('#travel-mode').textContent='ON FOOT';player.x=24;player.z=46.6;$('#vehicle').textContent='Drive · C';}
function help(){pause=true;show('<div class="eyebrow">Field guide</div><h2>Controls & settings</h2><p>Walk with WASD or the arrow keys, or tap the ground. Drag the scene to orbit. Scroll to zoom. E interacts, C switches transport, O opens the map and M opens destinations.</p><p>In a car, Up accelerates and Down brakes then reverses. At the riverside, W or ↑ takes you forward along the river. S or ↓ reverses. A/D or ←/→ turn the bow left and right. Release the steering key to follow a bend. Both bridges have a clear channel beneath them. C returns you to the dock.</p><label>Camera angle <select id="angle"><option>Street view</option><option>Overhead</option><option>Low angle</option></select></label><label> Movement keys <select id="layout"><option value="wasd">WASD + arrows</option><option value="zqsd">ZQSD + arrows</option></select></label><div class="actions"><button class="primary" id="resume-game">Resume</button></div>');$('#layout').value=layout;$('#layout').onchange=e=>{layout=e.target.value;bindings={...layouts[layout]};customBindings=false;dialog.querySelector('fieldset')?.remove();configureKeys();};$('#angle').selectedIndex=pitch>1?1:pitch<.4?2:0;$('#angle').onchange=e=>pitch=[.62,1.25,.32][e.target.selectedIndex];$('#resume-game').onclick=()=>dialog.close();configureKeys();}
let layout='wasd';
const layouts={wasd:defaultBindings,zqsd:{z:'w',q:'a',s:'s',d:'d'}};
let bindings={...layouts.wasd};
let customBindings=false;
function configureKeys(){
 const field=document.createElement('fieldset');
 field.innerHTML='<legend>Custom movement keys</legend><p>Select a direction, then press a letter. Arrow keys always work.</p>';
 const reserved=new Set(['c','e','m','o','r']);
 for(const [action,label] of Object.entries({w:'Forward',s:'Back',a:'Left',d:'Right'})){
   const button=document.createElement('button');button.className='secondary';
   button.textContent=label+' · '+(Object.keys(bindings).find(k=>bindings[k]===action)||action).toUpperCase();
   button.onclick=()=>{button.textContent='Press a letter for '+label;button.onkeydown=e=>{
     const k=e.key.toLowerCase();if(k==='escape'||k==='tab')return;
     e.preventDefault();if(!/^[a-z]$/.test(k)||reserved.has(k)){button.textContent='Choose another letter';return;}
     const previous=Object.keys(bindings).find(old=>bindings[old]===action);
     const displaced=bindings[k];
     delete bindings[previous];
     if(displaced&&displaced!==action)bindings[previous]=displaced;
     bindings[k]=action;customBindings=true;field.remove();configureKeys();dialog.querySelector('#resume-game').focus();
   };};field.append(button);
 }
 dialog.querySelector('.actions').before(field);
}
let seatTarget=null,seated=false;const stamps=new Set();let touring=false,overview=false,tourState={x:0,z:5,heading:Math.PI,speed:0};
let W,entered=false,driving=false,night=false,nearby=null,target=null,arrivalAction=null,game=null,last=0;const keys=new MovementKeys(),player={x:0,z:5};const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;const dialog=$('#detail');let focusBefore=null;
function show(html){keys.clear();tourState.speed=0;target=null;focusBefore=document.activeElement;dialog.innerHTML='<button class="close" aria-label="Close dialog">×</button>'+html;dialog.querySelector('.close').onclick=()=>dialog.close();if(!dialog.open)dialog.showModal();}
dialog.addEventListener('close',()=>{keys.clear();if(focusBefore?.isConnected)focusBefore.focus();});
dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
function enter(){entered=true;$('#interface').classList.remove('onboarding');$('#welcome').style.display='none';$('#enter').blur();}
function customize(){
  if(!W||driving||flightTo)return;
  pause=true;
  openWardrobe(dialog,show,appearance,next=>{
    appearance=next;W.setAvatar(next);saveLook(next);
  });
}
$('#wardrobe').onclick=$('#welcome-look').onclick=customize;
$('#enter').onclick=enter;$('#help').onclick=help;
dialog.addEventListener('close',()=>pause=false);
const surface=$('#world');
surface.onpointerdown=e=>{dragged=false;drag=[e.clientX,e.clientY];surface.setPointerCapture(e.pointerId);};
surface.onpointermove=e=>{if(!drag)return;const dx=e.clientX-drag[0],dy=e.clientY-drag[1];if(!dragged&&Math.hypot(dx,dy)<4)return;dragged=true;overview=false;yaw-=dx*.009;pitch=Math.max(.2,Math.min(1.45,pitch+dy*.007));drag=[e.clientX,e.clientY];};
surface.onpointercancel=()=>{drag=null;dragged=true;};surface.onwheel=e=>{e.preventDefault();distance=Math.max(5,Math.min(440,distance*Math.exp(Math.sign(e.deltaY)*.17)));};
function menu(){enter();show(`<div class="eyebrow">The world directory</div><h2>Where to?</h2><p>Walk through the world, jump to a destination, or open any project directly.</p><div class="menu-grid">${locations.map(l=>`<button data-visit="${l.id}">${l.name} <small>Visit this part of the island ↗</small></button>`).join('')}<button id="about">About Rayan<small>Resume, achievements & contact</small></button></div>`);dialog.querySelectorAll('[data-visit]').forEach(el=>el.onclick=()=>visit(el.dataset.visit,true));$('#about').onclick=()=>about();}
$('#menu').onclick=menu;
function about(section='about'){show(personalMarkup(section));dialog.querySelectorAll('[data-project-card]').forEach(b=>b.onclick=()=>openPlace(b.dataset.projectCard));dialog.querySelectorAll('[data-profile]').forEach(b=>b.onclick=()=>about(b.dataset.profile));}
function gallery(owner='all'){
 show(galleryMarkup(owner));
 dialog.querySelectorAll('[data-project-card]').forEach(b=>b.onclick=()=>openPlace(b.dataset.projectCard));
 const update=()=>{dialog.querySelector('#repository-cards').innerHTML=repositoryCards(dialog.querySelector('#repo-owner').value,dialog.querySelector('#repo-search').value);};
 dialog.querySelector('#repo-owner').onchange=update;dialog.querySelector('#repo-search').oninput=update;
}
const trailStops=[['lab','Activate the research exhibit'],['ccp','Meet the cat collective'],['chai','Stop for chai'],['river','Take a riverside break'],['airport','Send a scenic flight']];
function stamp(id){stamps.add(id);$('#stamp-count').textContent=`${stamps.size}/5`;}
function passport(){show(`<div class="eyebrow">Your discovery trail</div><h2>Take the long way home.</h2><p>Five little moments around the neighbourhood. Your stamps stay in this tab.</p><div class="trail-grid">${trailStops.map(([id,label])=>`<button data-trail="${id}" class="${stamps.has(id)?'collected':''}"><span>${stamps.has(id)?'✓':'◇'}</span>${label}<small>${stamps.has(id)?'Discovered':'Visit this stop'}</small></button>`).join('')}</div><p class="notice">A playful visitor trail. These are experience stamps, not real-world memberships or qualifications.</p>`);dialog.querySelectorAll('[data-trail]').forEach(b=>b.onclick=()=>visit(b.dataset.trail,true));}
$('#passport').onclick=()=>{enter();passport();};
function clan(id){show(clanMarkup(id));$('#clan-projects').onclick=()=>gallery(id==='lab'?'xt67-Lab':'Cat-Communist-Party-CCP');$('#clan-action').onclick=()=>{W.town.activate(id);stamp(id);dialog.close();};}
function neighbourhood(id){
 if(['chai','tea2','tea3'].includes(id)){const stall=locations.find(l=>l.id===id);show(`<div class="eyebrow">${stall.name}</div><h2>One chai. Many ideas.</h2><p>“The best shortcut? Follow the lane past the arcade. The lab is up north; the cat crew is across the river.”</p><p>Take a moment at this little roadside stall before your next discovery.</p><button class="primary" id="tea-break">Drink a chai</button><details><summary>Support Rayan</summary><p><a target="_blank" rel="noopener" href="https://buymeacoffee.com/xt67">Buy Me a Coffee</a> · <a target="_blank" rel="noopener" href="https://xt67-lab.github.io/buymeachai/support.html?name=Rayan%20Rahman&amp;upi=onlystudies790-1%40oksbi">Buy Me a Chai</a></p><img src="/chai-upi.jpg" alt="UPI payment QR for Rayan Rahman" width="200"></details>`);$('#tea-break').onclick=()=>{stamp('chai');$('#tea-break').textContent=`You drank a chai at ${stall.name} · ${++cups} ${cups===1?'cup':'cups'} this visit`;$('#tea-break').disabled=true;$('#tea-break').insertAdjacentHTML('beforebegin','<div class="tea-sip" aria-label="Sipping chai">☕</div>');};
 }else{show(`<div class="eyebrow">Riverside steps</div><h2>A little pause.</h2><p>Watch the boats drift down the river. Sit by the water, then use any movement key to continue exploring.</p><button class="primary" id="sit">Sit by the river</button> <button class="secondary" id="sail">Sail a boat</button>`);$('#sail').onclick=()=>{if(touring)toggleVehicle();sailing=true;seated=false;boatState={x:riverX(49),z:49,heading:upstreamHeading(49)};player.x=boatState.x;player.z=boatState.z;yaw=boatState.heading+Math.PI;overview=false;pitch=.29;target=null;arrivalAction=null;keys.clear();setBoatControls(true);W.town.setSailing(true);$('#vehicle').textContent='Return to dock · C';stamp('river');dialog.close();};$('#sit').onclick=()=>{stamp('river');if(touring)toggleVehicle();seated=true;seatTarget={x:22,z:42};player.x=22;player.z=42;dialog.close();};}
}
let currentRegion='';
const homeRunway=[18,-58];
function startFlight(to){
  keys.clear();target=null;arrivalAction=null;overview=true;flightTo=to;departAt=performance.now();
  const airstrip=name=>[journeys[name].center[0]-8,journeys[name].center[1]+16];
  const from=currentRegion?airstrip(currentRegion):homeRunway;
  const end=to==='home'?homeRunway:airstrip(to);
  W.town.fly(from,end,reduced?.35:4);
  document.body.classList.add('in-flight');
  const status=$('#flight-status');status.innerHTML=`Flying to ${to==='home'?'the home airport':to} <button class="primary">Land now</button>`;
  status.style.display='block';status.querySelector('button').onclick=land;
}
function flyHome(){
  island?.dispose();island=null;document.body.classList.remove('off-island');startFlight('home');
}
function sharePlace(place){
  const url=new URL(location.href);
  if(place)url.searchParams.set('visit',place.toLowerCase());else url.searchParams.delete('visit');
  history.replaceState(null,'',url);
}
function returnToAirport(){
  sharePlace(null);
  island?.dispose();island=null;flightTo='';keys.clear();target=null;overview=false;
  document.body.classList.remove('off-island','in-flight');
  $('#flight-status').style.display='none';
  currentRegion='';distance=13;player.x=0;player.z=-55.4;
  airport();
}
function land(){
  if(!flightTo)return;
  const destination=flightTo;flightTo='';keys.clear();
  W.town.endFlight(destination==='home'?null:[journeys[destination].center[0]-8,journeys[destination].center[1]+16]);document.body.classList.remove('in-flight');
  if(destination==='home'){returnToAirport();return;}
  currentRegion=destination;sharePlace(destination);yaw=.1;pitch=.29;distance=14;
  document.body.classList.add('off-island');$('#flight-status').style.display='none';
  island=exploreDestination(W,destination,flyHome,(angle,tilt=.20,zoom=13)=>{yaw=angle;pitch=tilt;distance=zoom;});
}
function airport(){
  show(flightMarkup());
  dialog.querySelectorAll('[data-flight]').forEach(button=>button.onclick=()=>{
    const destination=destinations[Number(button.dataset.flight)];
    dialog.close();landBoat();if(touring)toggleVehicle();standUp();
    keys.clear();target=null;arrivalAction=null;
    stamp('airport');startFlight(destination);
  });
}
function toggleVehicle(){standUp();if(sailing){landBoat();return;}if(!W||driving)return;if(!touring&&W.town.blocked(player.x,player.z,1.55)){show('<h2>Find room to drive</h2><p>Step clear of nearby objects, then press C to enter the car.</p>');return;}seated=false;enter();touring=!touring;target=null;arrivalAction=null;keys.clear();tourState={x:player.x,z:player.z,heading:W.avatar.rotation.y,speed:0};$('#vehicle').textContent=touring?'Walk · C':'Drive · C';$('#vehicle').setAttribute('aria-pressed',String(touring));document.querySelectorAll('[data-walk]').forEach(b=>b.setAttribute('aria-label',(touring?{arrowup:'Accelerate car',arrowdown:'Brake or reverse car',arrowleft:'Steer car left',arrowright:'Steer car right'}:{arrowup:'Walk forward',arrowdown:'Walk back',arrowleft:'Walk left',arrowright:'Walk right'})[b.dataset.walk]));$('#travel-mode').textContent=touring?'DRIVING · W / ↑ forward · S / ↓ reverse':'ON FOOT';$('#title-card').classList.add('hidden');}
$('#vehicle').onclick=toggleVehicle;
$('#overview').onclick=()=>{enter();overview=!overview;};
function visit(id,instant=false){if(!W)return;landBoat();seated=false;enter();dialog.close();const l=locations.find(x=>x.id===id);overview=false;tourState.speed=0;target={x:l.x,z:l.z+4.6};arrivalAction=id;if(instant){player.x=target.x;player.z=target.z;target=null;arrivalAction=null;openPlace(id);}$('#title-card').classList.add('hidden');}
function openPlace(id){if(id.startsWith('look:')){const label=id.slice(5);const observations={Tree:'Rest in the shade and watch the neighbourhood go by.',House:'A rooftop water tank catches the light above the awning.',Streetlight:'Switch between dusk and daylight to see the street lamps glow.',Bridge:'This crossing joins the two banks. Follow either lane to explore the next neighbourhood.',Street:'Follow the bends to the market, the research guild or the river.'};show(`<h2>${label}</h2><p>${observations[label]||'Look around this corner of the neighbourhood.'}</p><button class="secondary" id="look-around">Look around</button>`);const button=$('#look-around');
 if(label==='Streetlight'){button.textContent=night?'Switch to daylight':'Light the streets';button.onclick=()=>{$('#theme').click();dialog.close();};}
 else if(label==='Tree'){button.textContent='Pause in the shade';button.onclick=()=>{button.replaceWith(document.createTextNode(quotes[Math.floor(Math.random()*quotes.length)]));};}
 else {button.onclick=()=>{overview=false;yaw+=Math.PI/3;dialog.close();};}return;}if(id==='bench'){show(`<h2>Take a seat</h2><p>${quotes[Math.floor(Math.random()*quotes.length)]}</p><button id="rest" class="primary">Sit here</button>`);$('#rest').onclick=()=>{if(touring)toggleVehicle();seated=true;if(seatTarget){player.x=seatTarget.x;player.z=seatTarget.z;}dialog.close();};return;}if(id==='lab'||id==='ccp'){clan(id);return;}if(['chai','tea2','tea3','river'].includes(id)){neighbourhood(id);return;}if(id==='personal'){about();return;}if(id==='gallery'){gallery();return;}if(id==='airport'){airport();return;}if(id==='connect'){connect();return;}const p=projects[id];show(`<div class="eyebrow">${p.kind}</div><h2>${p.name}</h2><img class="snapshot" src="${projectImages[id]}" alt="${p.name} project preview"><p>${p.description}</p><ul>${p.details.map(x=>`<li>${x}</li>`).join('')}</ul><p class="notice">${p.note}</p><div class="actions"><a href="https://github.com/xt67/${p.repo}" target="_blank" rel="noopener noreferrer">View source ↗</a><a href="/stories/${id}.html" target="_blank" rel="noopener">Read project walkthrough</a>${id==='autocar'?'<button class="primary" id="play">Use the driving PC ↗</button>':''}</div>`);$('#play')?.addEventListener('click',consent);}
const socials=[['github','https://github.com/xt67','GitHub'],['instagram','https://www.instagram.com/lol_rayyann/','Instagram'],['linkedin','https://www.linkedin.com/in/rayan-rahman-xt67/','LinkedIn'],['x','https://x.com/xrahman088','X'],['mail','mailto:rayanrahman088@gmail.com','Email']];
async function connect(){show(`<div class="eyebrow">Beyond the island</div><h2>Say hello.</h2><p>Research questions, interesting ideas or just a hello.<br>Find me around the internet.</p><div class="social-links">${socials.map(([icon,url,name])=>`<a href="${url}" aria-label="${name}" title="${name}" ${icon==='mail'?'':'target="_blank" rel="noopener noreferrer"'}><svg viewBox="0 0 24 24" aria-hidden="true">${icons[icon]}</svg></a>`).join('')}</div><a href="mailto:rayanrahman088@gmail.com">rayanrahman088@gmail.com ↗</a><div class="qr"><img id="qr" alt="Scan to visit github.com/xt67"><div><strong>Take the code with you.</strong><p>Scan to explore my GitHub.<br><a href="https://github.com/xt67" target="_blank" rel="noopener noreferrer">github.com/xt67 ↗</a></p></div></div>`);const url=await QRCode.toDataURL('https://github.com/xt67',{width:220,margin:2,color:{dark:'#294d43',light:'#f4efde'}});if($('#qr'))$('#qr').src=url;}
$('#home').onclick=()=>{landBoat();seated=false;enter();player.x=0;player.z=5;tourState.speed=0;overview=false;target=null;arrivalAction=null;keys.clear();$('#title-card').classList.remove('hidden');};
$('#theme').onclick=()=>{night=!night;W?.night(night);$('#theme').textContent=night?'☀':'☾';$('#theme').setAttribute('aria-label',night?'Switch to day mode':'Switch to night mode');};
$('#nearby').onclick=()=>{if(nearby)openPlace(nearby.id);};
function consent(){if(!W)return;show(`<div class="eyebrow">AutoCar / a playful experiment</div><h2>Your turn at the wheel.</h2><p>Drive the oval for 45 seconds. Use W / ↑ to accelerate and S / ↓ to brake, then reverse. Stay on the asphalt and take home a participation certificate.</p><p class="notice">This experience is inspired by AutoCar-Sim. It does not train a real model. With your consent, simulated driving inputs stay in this tab, with optional JSON export. Nothing is uploaded. Closing this tab discards the session.</p><label class="consent-label"><input id="consent" type="checkbox"> I agree to this tab recording my simulated inputs for this experience.</label><div class="actions"><button class="primary" id="begin" disabled>Start the engine ↗</button></div>`);$('#consent').onchange=e=>$('#begin').disabled=!e.target.checked;$('#begin').onclick=startDrive;}
function freshCar(){return {x:15.95,z:0,heading:0,speed:0};}
function startDrive(){dialog.close();keys.clear();driving=true;target=null;game={state:freshCar(),elapsed:0,clock:0,samples:[],distance:0,onRoad:0,resets:0};W.world.visible=false;W.track.visible=true;$('#interface').classList.add('driving');}
$('#reset-car').onclick=()=>{if(game&&driving){game.state=freshCar();game.resets++;keys.clear();}};
function download(data,type,name){const u=URL.createObjectURL(new Blob([data],{type}));const a=document.createElement('a');a.href=u;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(u),1000);}
function finish(){if(!driving)return;driving=false;keys.clear();W.track.visible=false;W.world.visible=true;$('#interface').classList.remove('driving');const session={...makeSession(game.samples,game.elapsed),resets:game.resets};const metres=Math.round(game.distance),score=game.elapsed?Math.round(game.onRoad/game.elapsed*100):0;show(`<div class="eyebrow">Experience complete / AutoCar</div><h2>You took the wheel.</h2><p>Thanks for exploring the human side of autonomous driving.</p><div class="stats"><div><b>${metres} m</b><small>Simulated distance</small></div><div><b>${score}%</b><small>Time on track</small></div></div><p class="notice">${game.elapsed.toFixed(1)} seconds of play. No data was uploaded and no real model was trained. Your certificate recognises participation in this portfolio experience.</p><div class="actions"><button class="primary" id="certificate">Download certificate ↓</button><button class="secondary" id="export">Export session ↓</button><button class="secondary" id="again">Drive again ↗</button></div>`);$('#again').onclick=consent;$('#export').onclick=()=>download(JSON.stringify(session,null,2),'application/json',`xt67-session-${session.id}.json`);$('#certificate').onclick=()=>{const date=new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Kolkata',dateStyle:'long'}).format(new Date());const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800"><rect width="1200" height="800" fill="#173e43"/><rect x="35" y="35" width="1130" height="730" rx="12" fill="none" stroke="#f3c77e"/><g font-family="Arial,sans-serif" text-anchor="middle"><text x="600" y="140" fill="#f3c77e" font-size="22" letter-spacing="5">RAYAN RAHMAN / XT67</text><text x="600" y="275" fill="#f3f0de" font-size="55">Certificate of participation</text><text x="600" y="345" fill="#bdd2c4" font-size="24">Awarded to a curious driver</text><text x="600" y="420" fill="#f3f0de" font-size="25">For exploring the AutoCar browser driving experience</text><text x="600" y="475" fill="#f3c77e" font-size="25">${metres} simulated metres · ${game.elapsed.toFixed(1)} seconds · ${score}% on track</text><text x="600" y="560" fill="#bdd2c4" font-size="19">A little world. A lot of curiosity.</text><text x="600" y="595" fill="#bdd2c4" font-size="16">Participation only. This does not certify research contribution or real model training.</text><text x="600" y="675" fill="#bdd2c4" font-size="15">${date} · Session ${session.id}</text><text x="600" y="715" fill="#f3c77e" font-size="18">github.com/xt67</text></g></svg>`;download(svg,'image/svg+xml',`xt67-participation-${session.id}.svg`);};}
$('#finish').onclick=finish;
const controlled=['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright'];
addEventListener('keydown',e=>{if(dialog.open||e.ctrlKey||e.metaKey||e.altKey||e.isComposing)return;const key=actionForKey(e,bindings,layout==='wasd'&&!customBindings);
 if(flightTo){if(key==='enter')land();return;}
 if(island){if(controlled.includes(key)){e.preventDefault();keys.press(e.code||e.key,key);}if(key==='e'&&!e.repeat)island.perform();return;}
 if(key==='escape'&&entered){e.preventDefault();help();return;}if(!entered)return;if(e.repeat&&!controlled.includes(key))return;if(controlled.includes(key)){overview=false;standUp();e.preventDefault();keys.press(e.code||e.key,key);target=null;arrivalAction=null;$('#title-card').classList.add('hidden');}if(driving){if(key==='r')$('#reset-car').click();if(key==='escape')finish();}else{if(key==='e'&&nearby)openPlace(nearby.id);if(key==='m')menu();if(key==='c')toggleVehicle();if(key==='o')overview=!overview;}});
addEventListener('keyup',e=>keys.release(e.code||e.key));addEventListener('blur',()=>keys.clear());document.addEventListener('visibilitychange',()=>keys.clear());
document.querySelectorAll('[data-walk],[data-drive]').forEach(b=>{const key=b.dataset.walk||b.dataset.drive;b.onpointerdown=e=>{standUp();e.preventDefault();b.setPointerCapture(e.pointerId);overview=false;keys.press('touch'+e.pointerId,key);target=null;arrivalAction=null;};b.onpointerup=b.onpointercancel=b.onlostpointercapture=e=>keys.release('touch'+e.pointerId);});
function visibleInWorld(object){for(let node=object;node;node=node.parent)if(!node.visible)return false;return true;}
const hotspots=[];
const atlasLabels=Object.entries({...journeys,'Home neighbourhood':{center:[0,0]}}).map(([name,spec])=>{
  const button=document.createElement('button');button.className='place atlas-name';button.textContent=name;
  button.style.display='none';$('#labels').append(button);
  button.onclick=()=>{if(journeys[name])visit('airport',true);else $('#home').click();};
  return {button,center:spec.center};
});
try{W=createWorld($('#world'),appearance);installDestinations(W);for(const [i,l]of locations.entries()){const button=document.createElement('button');button.className='place';button.innerHTML=`${l.name}`;button.onclick=()=>visit(l.id,true);$('#labels').append(button);hotspots.push({l,button});}document.querySelectorAll('[data-region]').forEach(el=>el.onclick=()=>visit('airport',true));document.querySelectorAll('[data-map]').forEach(el=>el.onclick=()=>visit(el.dataset.map,true));
 const ray=new W.T.Raycaster(),ground=new W.T.Plane(new W.T.Vector3(0,1,0),-.5);$('#world').addEventListener('pointerup',e=>{drag=null;if(island){if(!dragged)island.point(e);return;}if(flightTo)return;if(dragged||!entered||driving||dialog.open)return;ray.setFromCamera(new W.T.Vector2(e.clientX/innerWidth*2-1,1-e.clientY/innerHeight*2),W.camera);const hits=ray.intersectObjects(W.interactables,false);const hit=hits.find(h=>visibleInWorld(h.object));if(hit){const id=hit.object.userData.action;if(sailing&&id!=='river')landBoat();if(id==='visitor'){customize();return;}if(id==='vehicle')toggleVehicle();else if(id==='drive')consent();else {if(id==='bench'){const pos=hit.object.userData.seat||hit.object.getWorldPosition(new W.T.Vector3());seatTarget={x:pos.x,z:pos.z};}openPlace(id);}return;}if(touring||sailing)return;const point=new W.T.Vector3();if(ray.ray.intersectPlane(ground,point)&&!W.town.blocked(point.x,point.z)){standUp();target={x:point.x,z:point.z};arrivalAction=null;$('#title-card').classList.add('hidden');}});const wanted=new URLSearchParams(location.search).get('visit')?.toLowerCase();
 const arrival=destinations.find(name=>name.toLowerCase()===wanted);
 if(arrival){enter();flightTo=arrival;land();}
 requestAnimationFrame(frame);
}catch(error){console.error(error);$('#interface').innerHTML='<div class="fallback"><h1>Rayan Rahman / xt67</h1><p>Your browser could not start the 3D world. Enable hardware acceleration or try another WebGL-compatible browser. You can also explore the projects on GitHub.</p><a href="https://github.com/xt67">GitHub ↗</a></div>';}
function frame(time){requestAnimationFrame(frame);const dt=document.hidden||pause?0:Math.min((time-last)/1000,.05);last=time;W.weather.tick(reduced?0:time/1000,W.camera);if(dialog.classList.contains('wardrobe-dialog'))return;if(island){island.tick(dt,keys,yaw,pitch,distance);return;}const {T,camera,avatar}=W;let moving=false;
 if(driving){const input={throttle:Number(keys.has('w')||keys.has('arrowup')),brake:Number(keys.has('s')||keys.has('arrowdown')),steer:Number(keys.has('a')||keys.has('arrowleft'))-Number(keys.has('d')||keys.has('arrowright'))};const old=game.state;game.state=stepCar(old,input,dt);const s=game.state;game.distance+=Math.hypot(s.x-old.x,s.z-old.z);game.elapsed+=dt;if(!s.offRoad)game.onRoad+=dt;game.clock+=dt;if(game.clock>=.1){game.clock-=.1;game.samples.push({time:Number(game.elapsed.toFixed(3)),...s,...input});}W.car.position.set(s.x,0,s.z);W.car.rotation.y=s.heading;const orbitRadius=distance*(innerWidth<700?.8:.65);const view=new T.Vector3(s.x+Math.sin(yaw)*Math.cos(pitch)*orbitRadius,Math.sin(pitch)*orbitRadius,s.z+Math.cos(yaw)*Math.cos(pitch)*orbitRadius);camera.position.lerp(view,reduced?1:1-Math.exp(-dt*5));camera.lookAt(s.x,0,s.z);$('#speed').textContent=(s.speed<0?'R ':'')+Math.round(Math.abs(s.speed)*3.6);$('#timer').textContent=Math.max(0,Math.ceil(45-game.elapsed));$('#drive-tip').textContent=s.offRoad?'Off track — steer back, or press R to reset':'↑ / W accelerate · ← → / A D steer · ↓ / S brake / reverse';if(game.elapsed>=45)finish();
 }else{
  if(entered&&!dialog.open&&!touring&&!sailing){let dx=Number(keys.has('d')||keys.has('arrowright'))-Number(keys.has('a')||keys.has('arrowleft')),dz=Number(keys.has('s')||keys.has('arrowdown'))-Number(keys.has('w')||keys.has('arrowup'));if(dx||dz){const len=Math.hypot(dx,dz);const sx=dx/len,sz=dz/len;dx=sx*Math.cos(yaw)+sz*Math.sin(yaw);dz=-sx*Math.sin(yaw)+sz*Math.cos(yaw);}else if(target){const len=Math.hypot(target.x-player.x,target.z-player.z);if(len<.25){target=null;if(arrivalAction){const id=arrivalAction;arrivalAction=null;openPlace(id);}}else{dx=(target.x-player.x)/len;dz=(target.z-player.z)/len;}}
   if(dx||dz){const nx=player.x+dx*6*dt,nz=player.z+dz*6*dt;const blocked=(x,z)=>W.town.blocked(x,z);if(!blocked(nx,player.z))player.x=nx;if(!blocked(player.x,nz))player.z=nz;avatar.rotation.y=Math.atan2(dx,dz);moving=true;}
  }
  if(touring&&entered&&!dialog.open){
   const input={throttle:Number(keys.has('w')||keys.has('arrowup')),brake:Number(keys.has('s')||keys.has('arrowdown')),steer:Number(keys.has('a')||keys.has('arrowleft'))-Number(keys.has('d')||keys.has('arrowright'))};
   tourState.x=player.x;tourState.z=player.z;const next=stepVehicle(tourState,input,dt,{forward:14,reverse:5});
   if(!W.town.blocked(next.x,next.z,1.55)){player.x=next.x;player.z=next.z;}else next.speed=0;
   tourState={...next,x:player.x,z:player.z};
   $('#travel-mode').textContent=`DRIVING · ${next.speed<0?'R ':''}${Math.round(Math.abs(next.speed)*3.6)} SIM KM/H`;
  }
  if(sailing&&!dialog.open){
    const held=(a,b)=>Number(keys.has(a)||keys.has(b)),previous=boatState.heading;
    boatState=steerBoat(boatState,held('w','arrowup')-held('s','arrowdown'),held('a','arrowleft')-held('d','arrowright'),dt,W.town.waterObstacles);
    player.x=boatState.x;player.z=boatState.z;
    if(!drag)yaw+=boatState.heading-previous;
    W.town.boat.position.set(player.x,WATER_Y,player.z);W.town.boat.rotation.y=boatState.heading;
    avatar.rotation.y=boatState.heading;
    $('#travel-mode').textContent='SAILING · W / S forward & reverse · A / D steer';
  }
  avatar.visible=!touring;W.town.travelCar.visible=touring;W.town.travelCar.position.set(player.x,W.town.heightAt(player.x,player.z),player.z);W.town.travelCar.rotation.y=tourState.heading;
  if(sailing)avatar.position.set(player.x-.56*Math.sin(boatState.heading),WATER_Y-.245,player.z-.56*Math.cos(boatState.heading));
  else avatar.position.set(player.x,W.town.heightAt(player.x,player.z)+(seated?.18:0),player.z);
  W.marker.position.set(player.x,W.town.heightAt(player.x,player.z)+.01,player.z);
  W.animateAvatar(reduced?0:time/1000,moving&&!reduced?1:0,seated||sailing);W.destination.visible=!!target;if(target)W.destination.position.set(target.x,.51,target.z);
  const zoom=innerWidth<700?1.4:1;const focus=entered&&!overview?new T.Vector3(player.x,sailing?WATER_Y+.90:W.town.heightAt(player.x,player.z)+1,player.z):new T.Vector3(0,0,-31);const offset=entered&&!overview?new T.Vector3(Math.sin(yaw)*Math.cos(pitch),Math.sin(pitch),Math.cos(yaw)*Math.cos(pitch)).multiplyScalar(distance*zoom):new T.Vector3(0,1,.8).normalize().multiplyScalar(Math.max(240,256/W.camera.aspect)*1.48);if(sailing&&!overview){
    // Keep the lens in the channel while passing beneath a deck, including on approach.
    const gap=Math.min(...bridges.map(b=>Math.abs(player.z-b.z)-b.width/2));
    const near=1-T.MathUtils.smoothstep(gap,3,18);
    offset.lerp(new T.Vector3(Math.sin(yaw)*3.15,.48,Math.cos(yaw)*3.15),near);
  }
  if(!flightTo)camera.position.lerp(focus.clone().add(offset),reduced?1:1-Math.exp(-dt*3));camera.lookAt(focus);nearby=locations.find(l=>Math.hypot(player.x-l.x,player.z-l.z)<7);$('#area').textContent=sailing?riverLocation(player.z):nearby?nearby.name:(Math.abs(player.x)<8&&Math.abs(player.z)<8?'Arrival plaza':W.town.roadName(player.x,player.z));$('#nearby').style.display=nearby&&entered&&!dialog.open?'block':'none';if(nearby)$('#nearby').textContent=`E · ${nearby.id==='autocar'?'Explore the garage':`Explore ${nearby.name}`} ↗`;$('#map-player').setAttribute('cx',player.x);$('#map-player').setAttribute('cy',player.z);
  const atlas=entered&&(overview||distance>125);
  const clip=atlas?2:.18;
  if(camera.near!==clip){camera.near=clip;camera.updateProjectionMatrix();}
  W.scene.fog.near=atlas?camera.position.length()+80:210;W.scene.fog.far=atlas?W.scene.fog.near+350:550;
  for(const {button,center} of atlasLabels){
    const p=new T.Vector3(center[0],7,center[1]).project(camera);
    button.style.display=atlas&&p.z<1&&Math.abs(p.x)<.97&&Math.abs(p.y)<.95?'block':'none';
    button.style.left=(p.x*.5+.5)*innerWidth+'px';button.style.top=(.5-p.y*.5)*innerHeight+'px';
  }
  hotspots.forEach(({l,button})=>{const p=new T.Vector3(l.x,6,l.z).project(camera);const x=(p.x*.5+.5)*innerWidth,y=(-p.y*.5+.5)*innerHeight;const half=button.offsetWidth/2+10;button.style.left=`${Math.max(half,Math.min(innerWidth-half,x))}px`;button.style.top=`${y}px`;button.style.display=entered&&!atlas&&(overview||Math.hypot(player.x-l.x,player.z-l.z)<36)&&p.z<1&&x>35&&x<innerWidth-35&&y>90&&y<innerHeight-110?'block':'none';});
 }
 W.town.tick(driving||document.hidden?0:dt,reduced);
 if(flightTo){
   const plane=W.town.plane.position;
   const view=new W.T.Vector3(plane.x+9,plane.y+4.0,plane.z+10.8);
   W.camera.position.lerp(view,reduced?1:1-Math.exp(-dt*4));W.camera.lookAt(plane);
   if(time-departAt>(reduced?350:4000)){land();return;}
 }
 if(!reduced&&!document.hidden)W.animated.forEach((o,i)=>o.rotation.z+=dt*(i?1:.3));W.renderer.render(W.scene,W.camera);
}

