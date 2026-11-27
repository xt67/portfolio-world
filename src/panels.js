import {journeys} from './journeys.js';
import {projects} from './content.js';
import {repositories,catalogDate} from './catalog.js';
export const projectImages={aurora:'/projects/aurora.png',autocar:'/projects/autocar.svg',cass:'/projects/cass.png',paqs:'/projects/paqs.png'};
export const destinations=Object.keys(journeys);
const tabs=[['about','About'],['experience','Experience'],['resume','Resume'],['achievements','Achievements'],['future','Future aim']];
export function personalMarkup(section='about'){
 const cards={
 about:`<article class="identity-card"><div class="avatar-badge">RR</div><div><small>THE HUMAN BEHIND THE CODE</small><h2>Rayan Rahman</h2><span>@xt67</span></div></article><p>I build projects that explore how machines learn, understand data and interact with the world. My current work spans synthetic chest X-ray augmentation, autonomous-driving simulation, conversational analytics and air-quality data.</p><p>My next goal is to pursue a master’s in Robotics and AI.</p>`,
 experience:`<h2>Project experience</h2><p>Select an exhibit to explore its methods and implementation.</p>${Object.entries(projects).map(([id,p])=>`<button class="secondary" data-project-card="${id}">${p.name}</button>`).join(' ')}`,
 resume:`<h2>Project résumé</h2><article class="resume-card"><h3>Rayan Rahman · xt67</h3><p>Machine learning, robotics and data projects</p>${Object.values(projects).map(p=>`<details><summary>${p.name}</summary><p>${p.description}</p></details>`).join('')}<p>Future aim · Master’s in Robotics and AI</p><a class="secondary" href="/project-resume.txt" download>Download project résumé</a></article>`,
 achievements:`<h2>Project milestones</h2><details><summary>AURORA feasibility run</summary><p>Completed a two-epoch feasibility run on 52 TB training images.</p></details><details><summary>AutoCar evaluation</summary><p>Compared controllers in repeated CARLA scenarios with held-out driving sessions.</p></details>`,
 future:`<div class="eyebrow">My next chapter</div><h2>Robotics + AI</h2><article class="profile-card future-card"><span class="card-number">AIM / MASTER’S STUDY</span><h3>From learning systems<br>to intelligent machines.</h3><p>I’m planning to pursue a master’s in Robotics and AI. This is a future goal, not a claim of admission or enrolment.</p><span class="status-tag">Looking ahead</span></article>`
 };
 return `<div class="eyebrow">Rayan Rahman / xt67</div><nav class="profile-tabs" aria-label="Personal profile">${tabs.map(([id,name])=>`<button data-profile="${id}" ${section===id?'aria-current="page"':''}>${name}</button>`).join('')}</nav>${cards[section]||cards.about}`;
}
const escapeHtml=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const repositoryArt=name=>/Car/.test(name)?'car':/Water|AQI/.test(name)?'environment':/Vision|Reconstruction|Mars/.test(name)?'vision':/Heartbeat|AURORA/.test(name)?'health':/Robot/.test(name)?'robot':/Snake/.test(name)?'game':'code';
const artPaths={
 car:'<path d="M25 64h110v22H25zM45 64l14-25h43l20 25"/><circle cx="48" cy="88" r="10"/><circle cx="115" cy="88" r="10"/>',
 environment:'<path d="M80 22c-4 15-30 30-30 52a30 30 0 0060 0c0-22-26-37-30-52zM20 104h120M23 94h17m83 0h14"/>',
 vision:'<path d="M25 35h110v65H25zM47 35v65m65-65v65M25 57h110M25 79h110M62 35l18-12 18 12"/><circle cx="80" cy="68" r="18"/>',
 health:'<path d="M15 66h32l9-26 16 51 16-66 13 41h44M40 103h80"/>',
 robot:'<path d="M40 105h80M55 105V86l39-32-14-23M94 54l21 5 15-15M80 31l-9-15"/><circle cx="55" cy="86" r="9"/><circle cx="94" cy="54" r="9"/><circle cx="80" cy="31" r="9"/>',
 game:'<path d="M35 35h65v20H60v20h60v20H35z"/><circle cx="122" cy="35" r="7"/>',
 code:'<path d="M53 40L29 65l24 25m54-50 24 25-24 25M88 28l-16 74"/>'
};
const featuredByRepo=new Map(Object.entries(projects).map(([id,p])=>[p.repo,id]));
const streamlitWater='https://water-capacity-analysis.streamlit.app/';

export function projectDestination(r){
 if(r.homepage)return {href:r.homepage,label:r.homepage.includes('.vercel.app')?'Open live app':'Visit project site'};
 if(r.fullName==='xt67/AutoCar-Sim')return {href:'/?visit=drive',label:'Play the driving demo'};
 const featured=r.owner==='xt67'&&featuredByRepo.get(r.name);
 if(featured)return {href:'/stories/'+featured+'.html',label:'Read project walkthrough'};
 return {href:r.url+'#readme',label:'Read project notes'};
}
function projectCard(r){
 const {href,label}=projectDestination(r), art=repositoryArt(r.name);
 const link=(url,title,cls='')=>`<a class="${cls}" href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(title)}</a>`;
 const streamlit=r.fullName==='xt67/Qatar-Water-Intelligence'?link(streamlitWater,'Streamlit dashboard'):'';
 return `<article class="project-tile repo-tile"><div class="repo-art art-${art}"><svg viewBox="0 0 160 125" aria-hidden="true">${artPaths[art]}</svg><span>${escapeHtml(r.language||'Repository')}</span></div><div><small>${escapeHtml(r.owner)}${r.archived?' · ARCHIVED':''}</small><h3>${escapeHtml(r.name)}</h3><p>${escapeHtml(r.description)}</p><div class="repo-links">${link(href,label,'card-primary')}${streamlit}${link(r.url,'GitHub source')}</div></div></article>`;
}
export function repositoryCards(owner='all',query=''){
 const matches=repositories.filter(r=>(owner==='all'||r.owner===owner)&&`${r.name} ${r.description} ${r.language}`.toLowerCase().includes(query.trim().toLowerCase()));
 if(!matches.length)return `<p class="empty-catalog">${owner==='Cat-Communist-Party-CCP'?'No public repositories were returned for this organization. Its headquarters is open; project exhibits will appear when public repositories are available.':'No projects match this search.'}</p>`;
 return `<p class="catalog-count" role="status">${matches.length} public repositories</p><div class="project-card-grid">${matches.map(projectCard).join('')}</div>`;
}
export function galleryMarkup(owner='all'){return `<div class="eyebrow">The project arcade</div><h2>Made of curiosity.</h2><p>Research prototypes, games, tools and experiments from my public repositories.</p>${owner==='all'?`<div class="project-card-grid featured-projects">${Object.entries(projects).map(([id,p])=>{
 const repo=repositories.find(r=>r.owner==='xt67'&&r.name===p.repo);
 const {href,label}=projectDestination(repo||{owner:'xt67',fullName:'xt67/'+p.repo,name:p.repo});
 return `<a class="project-tile" href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer"><img src="${projectImages[id]}" alt="" loading="lazy"><div><small>FEATURED EXHIBIT</small><h3>${p.name}</h3><span>${label}</span></div></a>`;
}).join('')}</div>`:''}<div class="catalog-filters"><label>Find a project<input id="repo-search" type="search" placeholder="Try robotics, vision, Python…"></label><label>Collection<select id="repo-owner">${[['all','All collections'],['xt67','Rayan / xt67'],['xt67-Lab','xt67-Lab'],['Cat-Communist-Party-CCP','CCP collective']].map(([id,name])=>`<option value="${id}" ${id===owner?'selected':''}>${name}</option>`).join('')}</select></label></div><div id="repository-cards">${repositoryCards(owner)}</div><p class="small">Public GitHub snapshot · ${catalogDate}. Card artwork is illustrative; project claims and limitations remain in each repository.</p>`;}
export function clanMarkup(id){
 const lab=id==='lab',owner=lab?'xt67-Lab':'Cat-Communist-Party-CCP',count=repositories.filter(r=>r.owner===owner).length;
 return `<div class="clan-banner ${lab?'lab-banner':'crew-banner'}"><span class="clan-crest">${lab?'⚛':'♠'}</span><div><small>${lab?'THE RESEARCH GUILD':'THE CAT COLLECTIVE'}</small><h2>${lab?'xt67-Lab':'CCP hideout'}</h2></div></div><p>${lab?'A scientific research-lab setting for my GitHub organization. Meet the tinkerer at the terminal and bring the kinetic exhibit to life.':'A fictional mafia-film hideout for my GitHub organization: warm neon, a quiet courtyard and a cat who runs the place. Drop in and light up the crew sign.'}</p><p class="notice">${lab?'The guild is part of this portfolio world. Its exhibit is a playful animation, not a scientific measurement.':'The mafia / clan styling is fictional world-building, not a claim that the organization or its members are involved in crime.'}</p><div class="clan-mission"><small>YOUR NEXT DISCOVERY</small><h3>${lab?'Power up the research exhibit':'Meet the cat crew'}</h3><p>${lab?'The atom sculpture and antenna respond to the terminal.':'Switch on the hideout neon and collect your visitor stamp.'}</p><button class="primary" id="clan-action">${lab?'Activate exhibit':'Light up the hideout'}</button></div><p>${count?`${count} public repositories are available in this collection.`:'No public repositories were returned for this organization in the current GitHub snapshot.'}</p><div class="actions"><button class="secondary" id="clan-projects">Browse organization projects</button><a href="https://github.com/${owner}" target="_blank" rel="noopener noreferrer">Visit ${owner}</a></div>`;
}
export function flightMarkup(){return `<div class="eyebrow">Next chapter airport</div><h2>Two places I call home.</h2><p>Fly to my hometown or the place where I grew up. You can see both islands offshore on the world map.</p><figure class="airport-photo"><img src="/places/aircraft.webp" alt="White high-wing, single-engine aircraft in flight"><figcaption>The reference for our island hopper</figcaption></figure><div class="flight-board"><div class="flight-heading"><span>DESTINATION</span><span>VIRTUAL FLIGHT</span></div>${destinations.map((d,i)=>`<button data-flight="${i}"><span><small>XT ${String(i+1).padStart(2,'0')}</small>${d}<br><em>${journeys[d].title}</em></span><b>Take off ↗</b></button>`).join('')}</div>`;}
