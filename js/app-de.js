(()=>{
'use strict';
const $=(q,r=document)=>r.querySelector(q), $$=(q,r=document)=>[...r.querySelectorAll(q)];
const KEY={fav:'osho-de-favorites-v1',recent:'osho-de-recents-v1',trial:'osho-de-three-day-v1'};
const load=(k,f)=>{try{return JSON.parse(localStorage.getItem(k))??f}catch(e){return f}};
const save=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}};
const today=()=>new Date().toISOString().slice(0,10);
const basename=()=>location.pathname.split('/').pop()||'index.html';
const isHome=()=>['index.html','main.html'].includes(basename());
const title=()=>($('article.detail-card h1')||$('header.hero h1'))?.textContent.trim()||document.title;
const lead=()=>$('.lead')?.textContent.trim()||'';
const isPractice=()=>!!$('article.detail-card') && (!!$('.step-flow')||!!$('audio')||!!$('.start-box')) && !basename().startsWith('guide-');
const pageObj=()=>({href:basename(),title:title(),lead:lead()});

function registerSW(){if('serviceWorker'in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('service-worker.js').catch(()=>{});}
registerSW();

function updateRecents(){
 if(!isPractice())return;
 let a=load(KEY.recent,[]).filter(x=>x.href!==basename()); a.unshift(pageObj()); save(KEY.recent,a.slice(0,6));
}
updateRecents();

function favHas(h){return load(KEY.fav,[]).some(x=>x.href===h)}
function favToggle(o){let a=load(KEY.fav,[]); const i=a.findIndex(x=>x.href===o.href); if(i>=0)a.splice(i,1);else a.unshift(o); save(KEY.fav,a.slice(0,20)); document.dispatchEvent(new CustomEvent('osho:fav')); return i<0;}

function addDetailFavorit(){
 if(!isPractice())return;
 const meta=$('.meta'); if(!meta)return;
 const b=document.createElement('button');b.type='button';b.className='favorite-btn';
 const draw=()=>{const on=favHas(basename());b.classList.toggle('on',on);b.innerHTML=(on?'♥':'♡')+' '+(on?'Favorit':'Favorit')}; draw();
 b.addEventListener('click',()=>{favToggle(pageObj());draw()});meta.appendChild(b);
}
addDetailFavorit();

function addCardFavorits(){
 if(!isHome())return;
 $$('#part3 .search-item').forEach(card=>{
   const a=card.querySelector('a.read-more'); if(!a)return;
   const o={href:a.getAttribute('href'),title:card.querySelector('h4')?.textContent.trim()||a.textContent.trim(),lead:card.querySelector('p')?.textContent.trim()||''};
   const b=document.createElement('button');b.type='button';b.className='card-fav';b.setAttribute('aria-label','Als Favorit markieren: '+o.title);
   const draw=()=>{const on=favHas(o.href);b.classList.toggle('on',on);b.textContent=on?'♥':'♡'}; draw();
   b.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();favToggle(o);draw();renderDashboard()});card.appendChild(b);
 });
}

function trial(){return load(KEY.trial,null)}
function completedCount(t){return t?.completed?.length||0}
function startTrial(o){
 const cur=trial();
 if(cur&&cur.href!==o.href&&completedCount(cur)<3){if(!confirm('Du machst derzeit das Drei-Tage-Experiment mit „'+cur.title+'“. Zu „'+o.title+'“ wechseln und die drei Tage neu beginnen?'))return cur;}
 const t={href:o.href,title:o.title,lead:o.lead||'',started:today(),completed:cur?.href===o.href?(cur.completed||[]):[]};save(KEY.trial,t);document.dispatchEvent(new CustomEvent('osho:trial'));return t;
}
function markTodayComplete(){
 let t=trial(); if(!t||t.href!==basename())return null;
 t.completed=t.completed||[]; if(!t.completed.includes(today()))t.completed.push(today()); t.completed=t.completed.slice(-3); save(KEY.trial,t);document.dispatchEvent(new CustomEvent('osho:trial'));return t;
}

function addTrialControl(){
 if(!isPractice())return;
 const box=$('.start-box');if(!box)return;
 const wrap=document.createElement('div');wrap.className='three-day-control';
 const draw=()=>{
   const t=trial(),same=t?.href===basename(),n=same?completedCount(t):0;
   wrap.innerHTML=`<div><strong>3-Tage-Experiment</strong><span>${same?`${n}/3 Tage abgeschlossen`:'Praktiziere dieselbe Methode drei vollständige Male, bevor du entscheidest, ob du tiefer gehen möchtest.'}</span></div><button type="button">${same?(n>=3?'3-Tage-Experiment abgeschlossen':'3-Tage-Experiment fortsetzen'):'3-Tage-Experiment starten'}</button>`;
   wrap.querySelector('button').addEventListener('click',()=>{startTrial(pageObj());draw()});
 };draw();box.appendChild(wrap);document.addEventListener('osho:trial',draw);
}
addTrialControl();

function renderDashboard(){
 if(!isHome())return;
 let dash=$('#practice-dashboard');
 if(!dash){dash=document.createElement('section');dash.id='practice-dashboard';dash.className='practice-dashboard';$('.shell')?.prepend(dash)}
 const rec=load(KEY.recent,[]), fav=load(KEY.fav,[]), t=trial(), n=completedCount(t);
 const last=rec[0];
 const progress=t?`<div class="trial-card"><div class="trial-copy"><small>3-Tage-Experiment</small><strong>${t.title}</strong><span>${n>=3?'Du hast drei vollständige Sitzungen abgeschlossen. Spüre nun, ob du mit dieser Methode tiefer weitergehen möchtest.':`Sitzung ${Math.min(n+1,3)} · ${n}/3 abgeschlossen`}</span></div><div class="day-dots"><i class="${n>=1?'done':''}">1</i><i class="${n>=2?'done':''}">2</i><i class="${n>=3?'done':''}">3</i></div><a href="${t.href}">${n>=3?'Zu dieser Methode zurückkehren':'Praxis fortsetzen'}</a></div>`:'';
 const favs=fav.length?`<div class="dashboard-strip"><div class="strip-head"><strong>Meine Favoritn</strong><span>${fav.length} </span></div><div class="favorite-scroll">${fav.slice(0,8).map(x=>`<a href="${x.href}"><b>♥</b><span>${x.title}</span></a>`).join('')}</div></div>`:'';
 dash.innerHTML=`<div class="dashboard-head"><span>Meine Meditation</span><h2>Heute musst du nur mit einer beginnen.</h2><p>Du musst nicht jede Methode vergleichen. Wähle eine, erfahre sie vollständig und entscheide danach, ob du weitermachst.</p></div>
 <div class="dashboard-actions">
   <a class="dash-primary" href="${last?.href||'#method-finder'}"><b>▶</b><span><strong>${last?'Letzte Praxis fortsetzen':'Eine Meditation finden'}</strong><small>${last?last.title:'Schnell nach aktiv, passiv, Atmung, Tanz und mehr finden'}</small></span></a>
   <a href="#method-finder"><b>⌕</b><span><strong>Eine Meditation finden</strong><small>Schnell nach Praxisstil filtern</small></span></a>
   <a href="#book-path"><b>☷</b><span><strong>Das Buch lesen</strong><small>Durch die fünf Teile des Buches tiefer gehen</small></span></a>
 </div>${progress}${favs}`;
}
if(isHome()){addCardFavorits();renderDashboard();document.addEventListener('osho:fav',renderDashboard);document.addEventListener('osho:trial',renderDashboard)}

// Replace mobile home dock with daily-practice-first destinations.
function tuneHomeDock(){if(!isHome())return;const d=$('.mobile-dock');if(!d)return;d.innerHTML='<a class="accent" href="#practice-dashboard"><span class="icon">◉</span><span>Heute</span></a><a class="start" href="#featured"><span class="icon">★</span><span>Auswahl</span></a><a href="#method-finder"><span class="icon">⌕</span><span>Finden</span></a><a href="#book-path"><span class="icon">▤</span><span>Buch</span></a>'}
tuneHomeDock();

function stageData(){return $$('.practice-step-card').map((el,i)=>{
 const h=$('h3',el)?.textContent.trim()||`Phase ${i+1}`;
 const p=$('p',el)?.textContent.trim()||'';
 const img=$('img',el)?.getAttribute('src')||'';
 const kicker=$('.step-kicker',el)?.textContent.trim()||'';
 const m=(h+' '+p).match(/(\d+)\s*min/);
 return {el,h,p,img,kicker,mins:m?Number(m[1]):null};
});}

let wakeLock=null;
async function wake(){try{if('wakeLock'in navigator)wakeLock=await navigator.wakeLock.request('screen')}catch(e){}}
function unwake(){try{wakeLock?.release()}catch(e){}wakeLock=null}

function addMeditationMode(){
 if(!isPractice()||!$('audio')||!$('.step-flow'))return;
 const stages=stageData(), audios=$$('audio'); if(!stages.length||!audios.length)return;
 const download=$('.media-link[download]')?.getAttribute('href')||$('.secondary-action[download]')?.getAttribute('href')||'';
 const startActions=$('.start-actions');
 if(startActions){const b=document.createElement('button');b.type='button';b.className='meditation-mode-launch';b.innerHTML='<span>◉</span> Meditationsmodus öffnen';startActions.prepend(b);b.addEventListener('click',open)}
 // Make the central mobile button enter meditation mode instead of simply scrolling to audio.
 const old=$('.dock-play'); if(old){const b=old.cloneNode(true);old.replaceWith(b);b.querySelector('span:last-child').textContent='Meditieren';b.setAttribute('aria-label','Meditationsmodus öffnen');b.addEventListener('click',open)}
 
 const ov=document.createElement('div');ov.className='meditation-mode';ov.hidden=true;
 ov.innerHTML=`<div class="mm-shell"><header><button class="mm-close" type="button" aria-label="Meditationsmodus verlassen">×</button><div><small>Meditationsmodus</small><strong class="mm-title"></strong></div><button class="mm-fav" type="button" aria-label="Favorit">♡</button></header>
 <div class="mm-progress"><span></span></div><main><div class="mm-stage-meta"><span class="mm-count"></span><span class="mm-duration"></span></div><h2 class="mm-stage-title"></h2><figure class="mm-image-wrap"><img class="mm-image" alt=""/></figure><p class="mm-instruction"></p><div class="mm-clock">--:--</div></main>
 <footer><button class="mm-prev" type="button">← Zurück</button><button class="mm-play" type="button">▶ Start</button><button class="mm-next" type="button">Weiter →</button></footer>
 <div class="mm-tools"><button class="mm-finish" type="button">Praxis beenden</button>${download?`<a href="${download}" download>↓ Audio herunterladen</a>`:''}</div></div>`;
 document.body.appendChild(ov);
 const completion=document.createElement('div');completion.className='completion-screen';completion.hidden=true;completion.innerHTML=`<div class="completion-inner"><span>Praxis abgeschlossen</span><h2>Urteile nicht zu schnell.</h2><p>Sitze eine Weile. Nimm Körper, Gedanken und Gefühle wahr.<br/><strong>Beobachte einfach.</strong></p><button class="complete-today" type="button">Heutige Praxis abschließen</button><button class="completion-close" type="button">Zurück zur Methode</button></div>`;document.body.appendChild(completion);
 let si=0, ai=0, timer=null, manualElapsed=0, manualStarted=0;
 const timed=stages.filter(x=>x.mins), timedStarts=[]; let sum=0; timed.forEach(x=>{timedStarts.push(sum);sum+=x.mins*60});
 const allTimed = timed.length>0 && timed.length===stages.filter(x=>x.kicker!=='Vorbereitung').length;
 const singleAudio=audios.length===1;
 function fmt(sec){sec=Math.max(0,Math.floor(sec));return String(Math.floor(sec/60)).padStart(2,'0')+':'+String(sec%60).padStart(2,'0')}
 function currentPhaseByAudio(){if(!singleAudio||!allTimed)return null;const t=audios[0].currentTime;let idx=0;for(let i=0;i<timedStarts.length;i++)if(t>=timedStarts[i])idx=i;return stages.indexOf(timed[idx])}
 function render(){
   const s=stages[si];$('.mm-title',ov).textContent=title();$('.mm-count',ov).textContent=`${s.kicker||'Phase'} · ${si+1}/${stages.length}`;$('.mm-duration',ov).textContent=s.mins?`${s.mins} Min.`:'Zuerst vorbereiten';$('.mm-stage-title',ov).textContent=s.h;$('.mm-instruction',ov).textContent=s.p;
   const im=$('.mm-image',ov), iw=$('.mm-image-wrap',ov);if(s.img){im.src=s.img;im.alt=s.h+' · Bewegungsreferenz';iw.hidden=false}else iw.hidden=true;
   $('.mm-prev',ov).disabled=si===0;$('.mm-next',ov).textContent=si===stages.length-1?'Beenden →':'Weiter →';
   updateClock();
 }
 function updateClock(){
   const s=stages[si], c=$('.mm-clock',ov);let pct=0;
   if(singleAudio&&allTimed&&s.mins&&audios[0].duration){const idx=timed.indexOf(s),start=timedStarts[idx],end=start+s.mins*60,cur=audios[0].currentTime;c.textContent=fmt(end-cur);pct=Math.min(100,Math.max(0,cur/audios[0].duration*100));}
   else if(s.mins&&manualStarted){const elapsed=(Date.now()-manualStarted)/1000+manualElapsed;c.textContent=fmt(s.mins*60-elapsed);pct=Math.min(100,Math.max(0,(si/(stages.length-1||1))*100));}
   else c.textContent=s.mins?fmt(s.mins*60):'Vorbereitung';
   $('.mm-progress span',ov).style.width=pct+'%';
 }
 function setPhase(n,seek=false){si=Math.max(0,Math.min(stages.length-1,n));manualElapsed=0;manualStarted=audios.some(a=>!a.paused)?Date.now():0;if(seek&&singleAudio&&allTimed){const s=stages[si],idx=timed.indexOf(s);if(idx>=0)audios[0].currentTime=timedStarts[idx]}render()}
 function pauseAll(){audios.forEach(a=>a.pause());$('.mm-play',ov).textContent='▶ Weiter';manualStarted=0}
 async function togglePlay(){
   const playing=audios.some(a=>!a.paused);
   if(playing){pauseAll();return}
   if(stages[si].kicker==='Vorbereitung'&&stages.length>1) setPhase(1,false);
   const a=audios[ai]||audios[0];try{await a.play();$('.mm-play',ov).textContent='Ⅱ Pause';manualStarted=Date.now();wake()}catch(e){}
 }
 function open(){ov.hidden=false;document.body.classList.add('meditation-open');si=0;ai=0;render();const t=trial();if(!t||t.href!==basename())startTrial(pageObj())}
 function close(){pauseAll();ov.hidden=true;document.body.classList.remove('meditation-open');unwake()}
 function finish(){pauseAll();ov.hidden=true;completion.hidden=false;document.body.classList.add('meditation-open');unwake()}
 $('.mm-close',ov).addEventListener('click',close);$('.mm-play',ov).addEventListener('click',togglePlay);$('.mm-prev',ov).addEventListener('click',()=>setPhase(si-1,true));$('.mm-next',ov).addEventListener('click',()=>si>=stages.length-1?finish():setPhase(si+1,true));$('.mm-finish',ov).addEventListener('click',finish);
 const fav=$('.mm-fav',ov);const drawFav=()=>{const on=favHas(basename());fav.textContent=on?'♥':'♡';fav.classList.toggle('on',on)};drawFav();fav.addEventListener('click',()=>{favToggle(pageObj());drawFav()});document.addEventListener('osho:fav',drawFav);
 $('.completion-close',completion).addEventListener('click',()=>{completion.hidden=true;document.body.classList.remove('meditation-open')});
 $('.complete-today',completion).addEventListener('click',()=>{let t=trial();if(!t||t.href!==basename())t=startTrial(pageObj());t=markTodayComplete();const n=completedCount(t),btn=$('.complete-today',completion);btn.disabled=true;btn.textContent=n>=3?'3-Tage-Experiment abgeschlossen ✓':`Heute abgeschlossen ✓ · ${n}/3`;const p=$('p',completion);if(n>=3)p.innerHTML='Drei vollständige Sitzungen sind beendet.<br/>Frage dich jetzt:<strong>Hilft diese Meditation, dass Freude und Sensibilität in mir wachsen?</strong>';});
 audios.forEach((a,i)=>{
   a.addEventListener('play',()=>{$('.mm-play',ov).textContent='Ⅱ Pause';ai=i;wake()});a.addEventListener('pause',()=>{if(!audios.some(x=>!x.paused))$('.mm-play',ov).textContent='▶ Weiter'});
   a.addEventListener('timeupdate',()=>{const idx=currentPhaseByAudio();if(idx!==null&&idx!==si){si=idx;render()}else updateClock()});
   a.addEventListener('ended',()=>{if(i<audios.length-1){ai=i+1;audios[ai].play().catch(()=>{});}else finish()});
 });
 timer=setInterval(()=>{if(!ov.hidden)updateClock()},500);
 document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&!ov.hidden&&audios.some(a=>!a.paused))wake()});
}
addMeditationMode();
})();