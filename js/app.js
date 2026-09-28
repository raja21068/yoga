(()=>{
'use strict';
const $=(q,r=document)=>r.querySelector(q), $$=(q,r=document)=>[...r.querySelectorAll(q)];
const KEY={fav:'osho-favorites-v1',recent:'osho-recents-v1',trial:'osho-three-day-v1'};
const load=(k,f)=>{try{return JSON.parse(localStorage.getItem(k))??f}catch(e){return f}};
const save=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}};
const today=()=>new Date().toISOString().slice(0,10);
const basename=()=>location.pathname.split('/').pop()||'index.html';
const isHome=()=>basename()==='index.html';
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

function addDetailFavorite(){
 if(!isPractice())return;
 const meta=$('.meta'); if(!meta)return;
 const b=document.createElement('button');b.type='button';b.className='favorite-btn';
 const draw=()=>{const on=favHas(basename());b.classList.toggle('on',on);b.innerHTML=(on?'♥':'♡')+' '+(on?'已收藏':'收藏')}; draw();
 b.addEventListener('click',()=>{favToggle(pageObj());draw()});meta.appendChild(b);
}
addDetailFavorite();

function addCardFavorites(){
 if(!isHome())return;
 $$('#part3 .search-item').forEach(card=>{
   const a=card.querySelector('a.read-more'); if(!a)return;
   const o={href:a.getAttribute('href'),title:card.querySelector('h4')?.textContent.trim()||a.textContent.trim(),lead:card.querySelector('p')?.textContent.trim()||''};
   const b=document.createElement('button');b.type='button';b.className='card-fav';b.setAttribute('aria-label','收藏 '+o.title);
   const draw=()=>{const on=favHas(o.href);b.classList.toggle('on',on);b.textContent=on?'♥':'♡'}; draw();
   b.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();favToggle(o);draw();renderDashboard()});card.appendChild(b);
 });
}

function trial(){return load(KEY.trial,null)}
function completedCount(t){return t?.completed?.length||0}
function startTrial(o){
 const cur=trial();
 if(cur&&cur.href!==o.href&&completedCount(cur)<3){if(!confirm('你正在体验“'+cur.title+'”。要改成“'+o.title+'”并重新开始三天吗？'))return cur;}
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
   wrap.innerHTML=`<div><strong>三天体验</strong><span>${same?`已完成 ${n}/3 天`:'先用同一个方法完整体验三次，再决定要不要继续深入。'}</span></div><button type="button">${same?(n>=3?'三天体验完成':'继续三天体验'):'开始三天体验'}</button>`;
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
 const progress=t?`<div class="trial-card"><div class="trial-copy"><small>三天体验</small><strong>${t.title}</strong><span>${n>=3?'已经完成三次。现在可以感受：这个方法是否值得继续深入？':`第 ${Math.min(n+1,3)} 次 · 已完成 ${n}/3`}</span></div><div class="day-dots"><i class="${n>=1?'done':''}">1</i><i class="${n>=2?'done':''}">2</i><i class="${n>=3?'done':''}">3</i></div><a href="${t.href}">${n>=3?'回到这个方法':'继续练习'}</a></div>`:'';
 const favs=fav.length?`<div class="dashboard-strip"><div class="strip-head"><strong>我的收藏</strong><span>${fav.length} 个</span></div><div class="favorite-scroll">${fav.slice(0,8).map(x=>`<a href="${x.href}"><b>♥</b><span>${x.title}</span></a>`).join('')}</div></div>`:'';
 dash.innerHTML=`<div class="dashboard-head"><span>我的静心</span><h2>今天，从一个练习开始</h2><p>少一点浏览，多一点实际体验。同一个方法，给它一点时间。</p></div>
 <div class="dashboard-actions">
   <a class="dash-primary" href="${last?.href||'#method-finder'}"><b>▶</b><span><strong>${last?'继续上次练习':'找一个静心'}</strong><small>${last?last.title:'按主动、被动、呼吸、舞动等快速寻找'}</small></span></a>
   <a href="#method-finder"><b>⌕</b><span><strong>找一个静心</strong><small>按练习方式快速筛选</small></span></a>
   <a href="#part1"><b>☷</b><span><strong>按书阅读</strong><small>从第一部分开始慢慢读</small></span></a>
 </div>${progress}${favs}`;
}
if(isHome()){addCardFavorites();renderDashboard();document.addEventListener('osho:fav',renderDashboard);document.addEventListener('osho:trial',renderDashboard)}

// Replace mobile home dock with daily-practice-first destinations.
function tuneHomeDock(){if(!isHome())return;const d=$('.mobile-dock');if(!d)return;d.innerHTML='<a class="accent" href="#practice-dashboard"><span class="icon">◉</span><span>今天</span></a><a class="start" href="#featured"><span class="icon">★</span><span>重点</span></a><a href="#method-finder"><span class="icon">⌕</span><span>找方法</span></a><a href="#part1"><span class="icon">▤</span><span>按书读</span></a>'}
tuneHomeDock();

function stageData(){return $$('.practice-step-card').map((el,i)=>{
 const h=$('h3',el)?.textContent.trim()||`第 ${i+1} 阶段`;
 const p=$('p',el)?.textContent.trim()||'';
 const img=$('img',el)?.getAttribute('src')||'';
 const kicker=$('.step-kicker',el)?.textContent.trim()||'';
 const m=(h+' '+p).match(/(\d+)\s*分钟/);
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
 if(startActions){const b=document.createElement('button');b.type='button';b.className='meditation-mode-launch';b.innerHTML='<span>◉</span> 进入静心模式';startActions.prepend(b);b.addEventListener('click',open)}
 // Make the central mobile button enter meditation mode instead of simply scrolling to audio.
 const old=$('.dock-play'); if(old){const b=old.cloneNode(true);old.replaceWith(b);b.querySelector('span:last-child').textContent='静心';b.setAttribute('aria-label','进入静心模式');b.addEventListener('click',open)}
 
 const ov=document.createElement('div');ov.className='meditation-mode';ov.hidden=true;
 ov.innerHTML=`<div class="mm-shell"><header><button class="mm-close" type="button" aria-label="退出静心模式">×</button><div><small>静心模式</small><strong class="mm-title"></strong></div><button class="mm-fav" type="button" aria-label="收藏">♡</button></header>
 <div class="mm-progress"><span></span></div><main><div class="mm-stage-meta"><span class="mm-count"></span><span class="mm-duration"></span></div><h2 class="mm-stage-title"></h2><figure class="mm-image-wrap"><img class="mm-image" alt=""/></figure><p class="mm-instruction"></p><div class="mm-clock">--:--</div></main>
 <footer><button class="mm-prev" type="button">← 上一步</button><button class="mm-play" type="button">▶ 开始</button><button class="mm-next" type="button">下一步 →</button></footer>
 <div class="mm-tools"><button class="mm-finish" type="button">结束练习</button>${download?`<a href="${download}" download>↓ 下载音频</a>`:''}</div></div>`;
 document.body.appendChild(ov);
 const completion=document.createElement('div');completion.className='completion-screen';completion.hidden=true;completion.innerHTML=`<div class="completion-inner"><span>练习结束</span><h2>不要急着判断。</h2><p>坐一会儿。看看身体、思想和感觉。<br/><strong>只是观照。</strong></p><button class="complete-today" type="button">完成今天的练习</button><button class="completion-close" type="button">回到方法</button></div>`;document.body.appendChild(completion);
 let si=0, ai=0, timer=null, manualElapsed=0, manualStarted=0;
 const timed=stages.filter(x=>x.mins), timedStarts=[]; let sum=0; timed.forEach(x=>{timedStarts.push(sum);sum+=x.mins*60});
 const allTimed = timed.length>0 && timed.length===stages.filter(x=>x.kicker!=='准备').length;
 const singleAudio=audios.length===1;
 function fmt(sec){sec=Math.max(0,Math.floor(sec));return String(Math.floor(sec/60)).padStart(2,'0')+':'+String(sec%60).padStart(2,'0')}
 function currentStageByAudio(){if(!singleAudio||!allTimed)return null;const t=audios[0].currentTime;let idx=0;for(let i=0;i<timedStarts.length;i++)if(t>=timedStarts[i])idx=i;return stages.indexOf(timed[idx])}
 function render(){
   const s=stages[si];$('.mm-title',ov).textContent=title();$('.mm-count',ov).textContent=`${s.kicker||'阶段'} · ${si+1}/${stages.length}`;$('.mm-duration',ov).textContent=s.mins?`${s.mins}分钟`:'先准备';$('.mm-stage-title',ov).textContent=s.h;$('.mm-instruction',ov).textContent=s.p;
   const im=$('.mm-image',ov), iw=$('.mm-image-wrap',ov);if(s.img){im.src=s.img;im.alt=s.h+' 动作参考';iw.hidden=false}else iw.hidden=true;
   $('.mm-prev',ov).disabled=si===0;$('.mm-next',ov).textContent=si===stages.length-1?'完成 →':'下一步 →';
   updateClock();
 }
 function updateClock(){
   const s=stages[si], c=$('.mm-clock',ov);let pct=0;
   if(singleAudio&&allTimed&&s.mins&&audios[0].duration){const idx=timed.indexOf(s),start=timedStarts[idx],end=start+s.mins*60,cur=audios[0].currentTime;c.textContent=fmt(end-cur);pct=Math.min(100,Math.max(0,cur/audios[0].duration*100));}
   else if(s.mins&&manualStarted){const elapsed=(Date.now()-manualStarted)/1000+manualElapsed;c.textContent=fmt(s.mins*60-elapsed);pct=Math.min(100,Math.max(0,(si/(stages.length-1||1))*100));}
   else c.textContent=s.mins?fmt(s.mins*60):'准备';
   $('.mm-progress span',ov).style.width=pct+'%';
 }
 function setStage(n,seek=false){si=Math.max(0,Math.min(stages.length-1,n));manualElapsed=0;manualStarted=audios.some(a=>!a.paused)?Date.now():0;if(seek&&singleAudio&&allTimed){const s=stages[si],idx=timed.indexOf(s);if(idx>=0)audios[0].currentTime=timedStarts[idx]}render()}
 function pauseAll(){audios.forEach(a=>a.pause());$('.mm-play',ov).textContent='▶ 继续';manualStarted=0}
 async function togglePlay(){
   const playing=audios.some(a=>!a.paused);
   if(playing){pauseAll();return}
   if(stages[si].kicker==='准备'&&stages.length>1) setStage(1,false);
   const a=audios[ai]||audios[0];try{await a.play();$('.mm-play',ov).textContent='Ⅱ 暂停';manualStarted=Date.now();wake()}catch(e){}
 }
 function open(){ov.hidden=false;document.body.classList.add('meditation-open');si=0;ai=0;render();const t=trial();if(!t||t.href!==basename())startTrial(pageObj())}
 function close(){pauseAll();ov.hidden=true;document.body.classList.remove('meditation-open');unwake()}
 function finish(){pauseAll();ov.hidden=true;completion.hidden=false;document.body.classList.add('meditation-open');unwake()}
 $('.mm-close',ov).addEventListener('click',close);$('.mm-play',ov).addEventListener('click',togglePlay);$('.mm-prev',ov).addEventListener('click',()=>setStage(si-1,true));$('.mm-next',ov).addEventListener('click',()=>si>=stages.length-1?finish():setStage(si+1,true));$('.mm-finish',ov).addEventListener('click',finish);
 const fav=$('.mm-fav',ov);const drawFav=()=>{const on=favHas(basename());fav.textContent=on?'♥':'♡';fav.classList.toggle('on',on)};drawFav();fav.addEventListener('click',()=>{favToggle(pageObj());drawFav()});document.addEventListener('osho:fav',drawFav);
 $('.completion-close',completion).addEventListener('click',()=>{completion.hidden=true;document.body.classList.remove('meditation-open')});
 $('.complete-today',completion).addEventListener('click',()=>{let t=trial();if(!t||t.href!==basename())t=startTrial(pageObj());t=markTodayComplete();const n=completedCount(t),btn=$('.complete-today',completion);btn.disabled=true;btn.textContent=n>=3?'三天体验完成 ✓':`今天完成 ✓ · ${n}/3`;const p=$('p',completion);if(n>=3)p.innerHTML='三次完整体验已经完成。<br/>现在问自己：<strong>这种静心是否能助长我的快乐和敏感性？</strong>';});
 audios.forEach((a,i)=>{
   a.addEventListener('play',()=>{$('.mm-play',ov).textContent='Ⅱ 暂停';ai=i;wake()});a.addEventListener('pause',()=>{if(!audios.some(x=>!x.paused))$('.mm-play',ov).textContent='▶ 继续'});
   a.addEventListener('timeupdate',()=>{const idx=currentStageByAudio();if(idx!==null&&idx!==si){si=idx;render()}else updateClock()});
   a.addEventListener('ended',()=>{if(i<audios.length-1){ai=i+1;audios[ai].play().catch(()=>{});}else finish()});
 });
 timer=setInterval(()=>{if(!ov.hidden)updateClock()},500);
 document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&!ov.hidden&&audios.some(a=>!a.paused))wake()});
}
addMeditationMode();
})();