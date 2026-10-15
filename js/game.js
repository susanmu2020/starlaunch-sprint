// Donation link. Leave '' to hide the Support button entirely; set to e.g. 'https://ko-fi.com/yourname' to show it.
const SUPPORT_URL = '';
function supportBtn(){if(!/^https?:\/\//i.test(SUPPORT_URL))return '';const u=SUPPORT_URL.replace(/[&"<>]/g,c=>({'&':'&amp;','"':'&quot;','<':'&lt;','>':'&gt;'})[c]);return `<div class="support"><a class="supportBtn" id="bSupport" href="${u}" target="_blank" rel="noopener noreferrer">☕ Support the game</a></div>`;}
(()=>{
const GAME='Starlaunch Sprint',cv=document.getElementById('game'),c=cv.getContext('2d'),W=960,H=544,ov=document.getElementById('overlay');
const $=id=>document.getElementById(id),SOLID='#=B?US';
let hero;try{hero=migrateHero(JSON.parse(localStorage.getItem('ss_hero')||'null'));}catch(e){hero=null;}hero=hero||{...PRESETS[0]};localStorage.setItem('ss_hero',JSON.stringify(hero));
let unlocked=+localStorage.getItem('ss_unlocked')||1;
let state='title',L,P,cam={x:0,y:0},score=0,lives=3,coins=0,time=300,lvl=0,parts=[],items=[],shots=[],T=0,clearT=0,frameAcc=0,bumps=[];
const keys={};
const KM={ArrowLeft:'left',KeyA:'left',ArrowRight:'right',KeyD:'right',ArrowUp:'jump',KeyW:'jump',Space:'jump',KeyZ:'jump',ShiftLeft:'action',ShiftRight:'action',KeyX:'action',ArrowDown:'down',KeyS:'down'};
addEventListener('keydown',e=>{Sound.init();if(KM[e.code]){keys[KM[e.code]]=true;if(state==='play'||state==='team')e.preventDefault();}
 if(e.code==='KeyP'||e.code==='Escape')togglePause();if(e.code==='KeyM')toggleMute();
 if(e.code==='Enter'&&state==='title')showSelect();});
addEventListener('keyup',e=>{if(KM[e.code])keys[KM[e.code]]=false;});
document.querySelectorAll('#touch button').forEach(b=>{const k=b.dataset.k,on=e=>{e.preventDefault();Sound.init();keys[k]=true;b.classList.add('on')},off=e=>{e.preventDefault();keys[k]=false;b.classList.remove('on')};
 b.addEventListener('touchstart',on);b.addEventListener('touchend',off);b.addEventListener('touchcancel',off);b.addEventListener('mousedown',on);b.addEventListener('mouseup',off);b.addEventListener('mouseleave',off);});
if('ontouchstart' in window||navigator.maxTouchPoints>0)$('touch').dataset.mobile='1';
$('muteBtn').onclick=toggleMute;$('pauseBtn').onclick=togglePause;
function toggleMute(){Sound.init();$('muteBtn').textContent=Sound.toggle()?'🔇':'🔊';}
$('muteBtn').textContent=Sound.muted?'🔇':'🔊';
function togglePause(){if(state==='team'||state==='teampause'){Team.pause();return;}if(state==='play'){state='pause';Sound.music(false);panel(`<h2>Paused</h2><button class="btn" id="bRes">Resume</button><button class="btn sec" id="bQuit">Quit to title</button>`);$('bRes').onclick=resume;$('bQuit').onclick=showTitle;}else if(state==='pause')resume();}
function resume(){state='play';ov.innerHTML='';Sound.music(true);}
function panel(h){ov.innerHTML=`<div class="panel">${h}</div>`;const b=ov.querySelector('button');b&&b.focus();}
function setPlayUI(on){$('hud').classList.toggle('hidden',!on);$('touch').classList.toggle('hidden',!(on&&$('touch').dataset.mobile));}
const esc=s=>String(s).replace(/[&<>"']/g,m=>'&#'+m.charCodeAt(0)+';');
// ---------- screens
function showTitle(){state='title';setPlayUI(false);Sound.music(false);
 panel(`<h1>STARLAUNCH SPRINT</h1><p>Run, stomp &amp; jetpack your way to the launch pad!</p><p>Hero: <b>${esc(hero.name)}</b></p>
 <button class="btn" id="bPlay">▶ Play</button><button class="btn sec" id="bChar">Choose Hero</button><br><button class="btn" id="bTeam">👥 Team Race 2v2</button><button class="btn sec" id="bTop">🏆 Top 10</button><br>${unlocked>1?'<button class="btn sec" id="bLv">Level Select</button>':''}
 <p style="font-size:13px;opacity:.8">Arrows/WASD move · Space/Up jump (hold = higher) · Shift/X run &amp; boost</p><p style="font-size:11px;opacity:.75;max-width:520px;margin:8px auto 0">Starlaunch Sprint is an original game with original characters. Not affiliated with, endorsed, or sponsored by Nintendo or any other company.</p>${supportBtn()}`);
 $('bPlay').onclick=()=>startGame(0);$('bTeam').onclick=Team.menu;$('bTop').onclick=Team.showTop;$('bChar').onclick=showSelect;if($('bLv'))$('bLv').onclick=showLevels;}
let previews=[];
function showSelect(){state='select';setPlayUI(false);
 const opts=[...PRESETS,{id:'custom',name:'Create your own',type:'custom',shirt:'#3fae5a',pants:'#2f3e8f',hair:'#5a3a1a',skin:'#e8b48a',hat:'cap'}];
 if(hero.type==='custom')opts[opts.length-1]={...hero,id:'custom'};
 panel(`<h2>Choose your hero</h2><div class="cards">${opts.map((o,i)=>`<div class="card ${hero.id===o.id?'sel':''}" data-i="${i}" tabindex="0"><canvas width="100" height="110"></canvas><div>${esc(o.id==='custom'?'✏️ Create your own':o.name)}</div></div>`).join('')}</div>
 <div id="custBox"></div><button class="btn" id="bGo">Let's go!</button><button class="btn sec" id="bBack">Back</button>`);
 previews=[...ov.querySelectorAll('.card')].map(el=>({el,cf:opts[+el.dataset.i]}));
 let sel=opts.findIndex(o=>o.id===hero.id);if(sel<0)sel=0;
 const pick=i=>{sel=i;previews.forEach(p=>p.el.classList.toggle('sel',+p.el.dataset.i===i));const o=opts[i];
  $('custBox').innerHTML=o.id!=='custom'?'':`<div class="cust"><label>Hero name</label><input type="text" id="cName" maxlength="16" value="${esc(o.name==='Create your own'?'':o.name)}" placeholder="Your hero name">
  ${['shirt','pants','hair','skin'].map(k=>`<label>${k[0].toUpperCase()+k.slice(1)} color</label><input type="color" id="c_${k}" value="${o[k]}">`).join('')}
  <label>Hat</label><select id="cHat">${HATS.map(h=>`<option ${o.hat===h?'selected':''}>${h}</option>`).join('')}</select></div>`;
  if(o.id==='custom'){const up=()=>{o.name=$('cName').value.trim()||'Hero';['shirt','pants','hair','skin'].forEach(k=>o[k]=$('c_'+k).value);o.hat=$('cHat').value;};
   $('custBox').querySelectorAll('input,select').forEach(e=>e.oninput=up);up();}};
 previews.forEach(p=>{p.el.onclick=()=>pick(+p.el.dataset.i);p.el.onkeydown=e=>{if(e.key==='Enter')pick(+p.el.dataset.i)}});pick(sel);
 $('bGo').onclick=()=>{hero={...opts[sel]};if(hero.id==='custom'&&!hero.name.trim())hero.name='Hero';localStorage.setItem('ss_hero',JSON.stringify(hero));showTitle();};
 $('bBack').onclick=showTitle;}
function showLevels(){state='levels';panel(`<h2>Level Select</h2><div class="lvls">${THEMES.map((t,i)=>`<button class="btn ${i<unlocked?'':'sec'}" ${i<unlocked?'':'disabled'} data-l="${i}">${i+1}. ${t.name}${i<unlocked?'':' 🔒'}</button>`).join('<br>')}</div><button class="btn sec" id="bBack">Back</button>`);
 ov.querySelectorAll('[data-l]').forEach(b=>b.onclick=()=>startGame(+b.dataset.l));$('bBack').onclick=showTitle;}
function shareText(){return`I beat ${GAME} as ${hero.name} with ${score} points! Play: ${location.href.split('#')[0]}`;}
async function share(btn){const t=shareText();try{if(navigator.share){await navigator.share({title:GAME,text:t});return;}}catch(e){}
 try{await navigator.clipboard.writeText(t);btn.textContent='Copied!';}catch(e){prompt('Copy this:',t);}}
// ---------- game
function startGame(l){score=0;lives=3;coins=0;startLevel(l);}
function startLevel(l){lvl=l;L=buildLevel(l);time=l===3?240:300;items=[];shots=[];parts=[];bumps=[];
 P={x:64,y:GROUND*32-56,w:22,h:56,vx:0,vy:0,face:1,on:false,coy:0,buf:0,shield:false,jet:0,star:0,inv:0,dead:0,st:'idle',plat:null,win:false};
 cam.x=0;state='play';ov.innerHTML='';setPlayUI(true);Sound.music(true);
 banner(`World ${l+1}: ${L.theme.name}`);}
let bannerT=0,bannerS='';function banner(s){bannerS=s;bannerT=150;}
const tileAt=(px,py)=>{const tx=Math.floor(px/32),ty=Math.floor(py/32);if(ty<0||ty>=LH||tx<0||tx>=L.w)return tx<0||tx>=L.w?'S':' ';return L.g[ty][tx];};
const solidAt=(px,py)=>SOLID.includes(tileAt(px,py));
function moveBody(b,onHead){b.x+=b.vx;
 if(b.vx>0&&(solidAt(b.x+b.w,b.y+2)||solidAt(b.x+b.w,b.y+b.h-1)||solidAt(b.x+b.w,b.y+b.h/2))){b.x=Math.floor((b.x+b.w)/32)*32-b.w-.01;b.hitW=1;b.vx=0;}
 else if(b.vx<0&&(solidAt(b.x,b.y+2)||solidAt(b.x,b.y+b.h-1)||solidAt(b.x,b.y+b.h/2))){b.x=Math.floor(b.x/32)*32+32.01;b.hitW=-1;b.vx=0;}else b.hitW=0;
 b.y+=b.vy;b.on=false;
 if(b.vy>=0&&(solidAt(b.x+2,b.y+b.h)||solidAt(b.x+b.w-2,b.y+b.h))){b.y=Math.floor((b.y+b.h)/32)*32-b.h;b.vy=0;b.on=true;}
 else if(b.vy<0){const l=solidAt(b.x+3,b.y),r=solidAt(b.x+b.w-3,b.y);if(l||r){const hx=Math.floor((l&&r?b.x+b.w/2:l?b.x+3:b.x+b.w-3)/32),hy=Math.floor(b.y/32);b.y=hy*32+32;b.vy=1;onHead&&onHead(hx,hy);}}}
function headHit(tx,ty){const t=L.g[ty][tx];
 if(t==='?'){L.g[ty][tx]='U';bumps.push({tx,ty,t:8});const k=L.items[tx+','+ty]||'coin';
  if(k==='coin'){getCoin(tx*32+16,ty*32-10);}else{items.push({kind:k,x:tx*32+4,y:ty*32-2,w:24,h:24,vx:k==='star'?2.5:1.5,vy:-3,rise:14});Sound.sfx.power();}}
 else if(t==='B'){if(P.shield||P.star){L.g[ty][tx]=' ';score+=50;Sound.sfx.brick();for(let i=0;i<6;i++)parts.push({x:tx*32+16,y:ty*32+16,vx:(Math.random()-.5)*8,vy:-Math.random()*8-2,life:50,col:'#c0603a',s:6});}else{bumps.push({tx,ty,t:8});Sound.sfx.bump();}}
 else Sound.sfx.bump();
 L.enemies.forEach(e=>{if(!e.dead&&e.type!=='boss'&&Math.abs(e.x+e.w/2-tx*32-16)<30&&Math.abs(e.y+e.h-ty*32)<6)killEnemy(e,100);});}
function getCoin(x,y){coins++;score+=100;Sound.sfx.coin();parts.push({x,y,vx:0,vy:-4,life:30,txt:'+100'});if(coins%50===0){lives++;banner('1-UP!');}}
function killEnemy(e,pts){e.dead=1;e.dt=30;score+=pts;Sound.sfx.stomp();parts.push({x:e.x+e.w/2,y:e.y,vx:0,vy:-2,life:40,txt:'+'+pts});}
function hurt(){if(P.inv>0||P.star>0||P.dead)return;if(P.shield){P.shield=false;P.inv=100;Sound.sfx.hurt();return;}die();}
function die(){if(P.dead)return;P.dead=1;P.vy=-11;P.vx=0;Sound.music(false);Sound.sfx.die();}
const ov2=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
function update(){T+=1/60;if(bannerT>0)bannerT--;
 if(state==='team'||state==='teamboard'){Team.update();return;}
 parts=parts.filter(p=>(p.x+=p.vx,p.y+=p.vy,p.vy+=p.txt?0:.4,--p.life>0));
 if(state==='clear'){clearT++;if(clearT>40)P.y-=Math.min(12,(clearT-40)*.25);if(clearT%3===0)parts.push({x:L.goal.x+(Math.random()-.5)*20,y:L.goal.y-(clearT>40?(clearT-40)*(clearT-40)*.12:0)+10,vx:(Math.random()-.5)*3,vy:2,life:30,col:'#ffd447',s:5});
  if(clearT===170)levelDone();return;}
 if(state!=='play')return;
 if(P.dead){P.dead++;P.vy+=.5;P.y+=P.vy;if(P.dead>130){lives--;if(lives<=0)gameOver();else startLevel(lvl);}return;}
 P.fc=(P.fc||0)+1;if(P.fc%60===0&&time>0){time--;if(time===0)die();}
 const run=keys.action,max=P.star?6.5:run?6:4,acc=P.on?.55:.35;
 if(keys.left){P.vx=Math.max(P.vx-acc,-max);P.face=-1}else if(keys.right){P.vx=Math.min(P.vx+acc,max);P.face=1}else P.vx*=P.on?.78:.95;
 if(Math.abs(P.vx)<.1)P.vx=0;
 if(keys.jump&&!P.jl)P.buf=7;P.jl=keys.jump;if(P.buf>0)P.buf--;
 if(P.on)P.coy=7;else if(P.coy>0)P.coy--;
 if(P.buf>0&&P.coy>0){P.vy=-12.6-Math.abs(P.vx)*.25;P.coy=0;P.buf=0;P.on=false;P.plat=null;Sound.sfx.jump();}
 if(!keys.jump&&P.vy<-4&&!P.jetting)P.vy=-4;
 P.jetting=false;if(P.jet>0){P.jet--;if(keys.jump&&!P.on&&P.vy>-7&&P.coy===0){P.vy-=1.1;P.jetting=true;if(T*60%4<1)Sound.sfx.jet();parts.push({x:P.x+(P.face>0?2:20),y:P.y+P.h-20,vx:(Math.random()-.5),vy:3,life:15,col:'#ff8a2a',s:4});}}
 P.vy=Math.min(P.vy+.62,13);
 // moving platforms
 L.movers.forEach(m=>{const ox=m.x,oy=m.y,s=Math.sin(T*m.sp+m.ph)*.5+.5;m.x=m.x0+m.rx*s;m.y=m.y0+m.ry*s;m.dx=m.x-ox;m.dy=m.y-oy;});
 if(P.plat){P.x+=P.plat.dx;P.y+=P.plat.dy;}
 const prevB=P.y+P.h;moveBody(P,headHit);P.plat=null;
 L.movers.forEach(m=>{if(P.vy>=0&&P.x+P.w>m.x&&P.x<m.x+m.w&&prevB<=m.y+Math.max(2,m.dy+2)+P.vy&&P.y+P.h>=m.y-1&&P.y+P.h<=m.y+14){P.y=m.y-P.h;P.vy=0;P.on=true;P.plat=m;}});
 if(P.x<cam.x)P.x=cam.x,P.vx=Math.max(0,P.vx);
 P.st=!P.on?(P.jetting?'fly':'jump'):Math.abs(P.vx)>.3?'run':'idle';
 if(P.inv>0)P.inv--;if(P.star>0){P.star--;if(P.star===1)Sound.music(true);}
 if(P.y>LH*32+60)die();
 // coins
 L.coins.forEach(k=>{if(!k.taken&&Math.abs(k.x-P.x-P.w/2)<20&&k.y>P.y-10&&k.y<P.y+P.h+10){k.taken=true;getCoin(k.x,k.y);}});
 // items
 items.forEach(it=>{if(it.rise>0){it.rise--;it.y-=2;return;}it.vy=Math.min(it.vy+.5,10);if(it.kind==='star'&&it.on)it.vy=-8;moveBody(it);if(it.hitW)it.vx=-it.hitW*Math.abs(it.vx||1.5);if(it.vx===0)it.vx=1.5;
  if(ov2(it,P)){it.got=true;Sound.sfx.power();score+=1000;parts.push({x:it.x,y:it.y,vx:0,vy:-2,life:50,txt:it.kind==='jet'?'JETPACK!':it.kind==='star'?'SUPERNOVA!':'SHIELD!'});
   if(it.kind==='shield')P.shield=true;if(it.kind==='jet')P.jet=60*7;if(it.kind==='star'){P.star=60*9;}}});
 items=items.filter(i=>!i.got&&i.y<LH*32+50);
 // enemies
 L.enemies.forEach(e=>{if(e.dead){e.dt--;return;}if(Math.abs(e.x-P.x)>W+100&&e.type!=='boss')return;e.t+=1/60;
  if(e.type==='flyer'){e.x+=Math.sin(e.t*.8)*1.2;e.y=e.y0+Math.sin(e.t*2.2)*48;}
  else if(e.type==='boss')bossAI(e);
  else{e.vy=Math.min(e.vy+.5,10);if(e.type==='hopper'&&e.on&&Math.random()<.02)e.vy=-9;
   const ahead=e.vx>0?e.x+e.w+2:e.x-2;if(e.on&&e.type==='walker'&&!solidAt(ahead,e.y+e.h+4)&&lvl>0)e.vx*=-1;
   moveBody(e);if(e.hitW)e.vx=e.hitW*-(1+lvl*.25);e.onGround=e.on;if(e.y>LH*32+50)e.dead=1,e.dt=0;}
  if(ov2(e,P)&&!P.dead){
   if(P.star>0&&e.type!=='boss'){killEnemy(e,200);return;}
   if(P.vy>0&&P.y+P.h-e.y<20){if(e.type==='boss'){if(e.inv<=0){e.hp--;e.inv=70;Sound.sfx.boss();score+=2000;shake=15;if(e.hp<=0){e.dead=1;e.dt=60;L.goal.hidden=false;banner('Boss defeated! Reach the rocket!');for(let i=0;i<30;i++)parts.push({x:e.x+40,y:e.y+50,vx:(Math.random()-.5)*10,vy:-Math.random()*10,life:60,col:['#ffd447','#ff3b3b','#fff'][i%3],s:6});}}P.vy=-12;}
    else{killEnemy(e,200);P.vy=keys.jump?-12:-8;}}
   else if(!(e.type==='boss'&&e.inv>40))hurt();}});
 L.enemies=L.enemies.filter(e=>!e.dead||e.dt>0);
 shots.forEach(s=>{s.x+=s.vx;s.y+=s.vy;s.life--;if(ov2(s,P))hurt(),s.life=0;});shots=shots.filter(s=>s.life>0);
 // goal
 const G=L.goal;if(!G.hidden&&P.x+P.w>G.x-20&&P.x<G.x+20){state='clear';clearT=0;P.vx=0;P.x=G.x-P.w/2;score+=time*10;Sound.music(false);Sound.sfx.win();}
 // camera
 const tx=Math.max(0,Math.min(L.w*32-W,P.x-W*.4+P.vx*20));cam.x+=(tx-cam.x)*.12;}
let shake=0;
function bossAI(e){if(e.inv>0)e.inv--;e.shoot-=1/60;const fast=1+(3-e.hp)*.5;
 e.vy=Math.min(e.vy+.5,12);if(e.vx===0)e.vx=-2;e.vx=Math.sign(e.vx)*2*fast;
 if(e.on&&Math.random()<.008*fast)e.vy=-11;moveBody(e);if(e.hitW)e.vx=-e.hitW*2;
 if(e.shoot<=0){e.shoot=2.6-(3-e.hp)*.6;const dx=P.x-e.x,d=Math.hypot(dx,P.y-e.y)||1;shots.push({x:e.x+40,y:e.y+40,w:14,h:14,vx:dx/d*4,vy:(P.y+20-e.y-40)/d*4,life:240});Sound.sfx.bump();}}
function levelDone(){if(lvl===3){win();return;}unlocked=Math.max(unlocked,lvl+2);localStorage.setItem('ss_unlocked',unlocked);state='levelclear';
 panel(`<h2>World ${lvl+1} cleared! 🚀</h2><p>Score: <b>${score}</b> · Coins: ${coins}</p><button class="btn" id="bNext">Next world ▶</button><button class="btn sec" id="bT">Title</button>`);
 $('bNext').onclick=()=>startLevel(lvl+1);$('bT').onclick=showTitle;}
function win(){state='win';setPlayUI(false);Sound.music(false);unlocked=4;localStorage.setItem('ss_unlocked',4);const best=Math.max(score,+localStorage.getItem('ss_best')||0);localStorage.setItem('ss_best',best);
 panel(`<h1>YOU WIN!</h1><p>${esc(hero.name)} blasted off to the stars!</p><p>Final score: <b>${score}</b> (best ${best})</p><button class="btn" id="bShare">📣 Share</button><button class="btn sec" id="bAgain">Play again</button>${supportBtn()}`);
 $('bShare').onclick=e=>share(e.target);$('bAgain').onclick=showTitle;}
function gameOver(){state='over';setPlayUI(false);Sound.music(false);panel(`<h1>GAME OVER</h1><p>Score: <b>${score}</b></p><button class="btn" id="bRetry">Retry world ${lvl+1}</button><button class="btn sec" id="bT">Title</button>`);
 $('bRetry').onclick=()=>startGame(lvl);$('bT').onclick=showTitle;}
// ---------- render
function drawBG(th,cx){const g=c.createLinearGradient(0,0,0,H);g.addColorStop(0,th.sky[0]);g.addColorStop(1,th.sky[1]);c.fillStyle=g;c.fillRect(0,0,W,H);
 if(th.stars){for(let i=0;i<80;i++){const x=((i*137.5-cx*.05)%W+W)%W,y=(i*71)%320;c.fillStyle=`rgba(255,255,255,${.4+.4*Math.sin(T*3+i)})`;c.fillRect(x,y,2,2);}}
 else{c.fillStyle='#ffffffcc';for(let i=0;i<6;i++){const x=((i*260-cx*.2+T*8)%(W+200)+W+200)%(W+200)-100,y=60+(i*53)%120;c.beginPath();c.ellipse(x,y,40,16,0,0,7);c.ellipse(x+25,y-10,28,18,0,0,7);c.ellipse(x-25,y-5,22,13,0,0,7);c.fill();}}
 [[th.hill2,.25,200,90],[th.hill,.5,120,60]].forEach(([col,f,amp,base])=>{c.fillStyle=col;c.beginPath();c.moveTo(0,H);for(let x=0;x<=W;x+=16){const wx=x+cx*f;c.lineTo(x,H-base-amp*.5-Math.sin(wx*.006)*amp*.4-Math.sin(wx*.017)*amp*.15);}c.lineTo(W,H);c.fill();});
 if(th.stars&&th.name.includes('City')){for(let i=0;i<20;i++){const x=((i*90-cx*.35)%(W+90)+W+90)%(W+90)-90,h=80+(i*37)%140;c.fillStyle='#120e2e';c.fillRect(x,H-110-h,60,h+20);c.fillStyle='#ffd44766';for(let j=0;j<h/20;j++)c.fillRect(x+8+(j%3)*16,H-100-h+j*18,6,8);}}}
function render(){c.setTransform(1,0,0,1,0,0);
 if(state==='team'||state==='teampause'||(Team.S&&Team.S.Lv&&/^team|board/.test(state))){Team.render(c);if(bannerT>0){c.globalAlpha=Math.min(1,bannerT/30);c.fillStyle='#0008';c.fillRect(0,200,W,60);c.fillStyle='#ffd447';c.font='bold 30px Trebuchet MS';c.textAlign='center';c.fillText(bannerS,W/2,241);c.globalAlpha=1;}return;}
 if(!L){drawBG(THEMES[0],T*40);drawTitleHero();return;}
 drawBG(L.theme,cam.x);const sx=shake>0?(Math.random()-.5)*shake:0;if(shake>0)shake--;
 c.translate(-Math.round(cam.x)+sx,0);
 const x0=Math.floor(cam.x/32),x1=x0+W/32+2;
 for(let y=0;y<LH;y++)for(let x=x0;x<x1&&x<L.w;x++){const ch=L.g[y][x];if(ch!==' '){const b=bumps.find(b=>b.tx===x&&b.ty===y);drawTile(c,ch,x*32,y*32-(b?Math.sin(b.t/8*Math.PI)*8:0),T,L.theme);}}
 bumps.forEach(b=>b.t--);bumps=bumps.filter(b=>b.t>0);
 L.movers.forEach(m=>{c.fillStyle='#ddd';rr(c,m.x,m.y,m.w,m.h,4);c.fillStyle='#7f5af0';c.fillRect(m.x+4,m.y+4,m.w-8,4);});
 L.coins.forEach(k=>{if(!k.taken&&k.x>cam.x-20&&k.x<cam.x+W+20)drawCoin(c,k.x,k.y,T)});
 if(!L.goal.hidden)drawRocket(c,L.goal.x,L.goal.y-(state==='clear'&&clearT>40?(clearT-40)**2*.12:0),T,state==='clear'&&clearT>40);
 items.forEach(i=>drawPower(c,i,T));
 L.enemies.forEach(e=>{if(e.x>cam.x-120&&e.x<cam.x+W+40)drawEnemy(c,e,T)});
 shots.forEach(s=>{c.fillStyle=(T*20|0)%2?'#ffd447':'#ff3b3b';c.beginPath();c.arc(s.x+7,s.y+7,7,0,7);c.fill();});
 if(!(P.inv>0&&(T*15|0)%2)&&!(state==='clear'&&clearT>40)){if(P.star>0){c.save();c.filter=`hue-rotate(${T*600%360}deg) saturate(2)`;}
  drawHero(c,P.x+P.w/2,P.y+P.h,hero,P.dead?'jump':P.st,T,P.face,{jet:P.jet>0,shield:P.shield});if(P.star>0)c.restore();}
 parts.forEach(p=>{if(p.txt){c.fillStyle='#fff';c.font='bold 14px sans-serif';c.textAlign='center';c.strokeStyle='#000';c.lineWidth=3;c.strokeText(p.txt,p.x,p.y);c.fillText(p.txt,p.x,p.y);}else{c.fillStyle=p.col;c.fillRect(p.x,p.y,p.s,p.s);}});
 c.setTransform(1,0,0,1,0,0);
 if(bannerT>0){c.globalAlpha=Math.min(1,bannerT/30);c.fillStyle='#0008';c.fillRect(0,200,W,60);c.fillStyle='#ffd447';c.font='bold 30px Trebuchet MS';c.textAlign='center';c.fillText(bannerS,W/2,241);c.globalAlpha=1;}
 if(P.jet>0||P.star>0){c.fillStyle='#0008';c.fillRect(10,40,160,14);c.fillStyle=P.star>0?'#ff7af0':'#ff8a2a';c.fillRect(12,42,156*(P.star>0?P.star/540:P.jet/420),10);}
 const bo=L.enemies.find(e=>e.type==='boss');if(bo){c.fillStyle='#fff';c.font='bold 16px sans-serif';c.textAlign='center';c.fillText('MEGA GRUMBOT',W/2,520);c.fillStyle='#400';c.fillRect(W/2-100,526,200,10);c.fillStyle='#f33';c.fillRect(W/2-100,526,200*bo.hp/3,10);}
 $('hName').textContent='🧑‍🚀 '+hero.name;$('hScore').textContent='★ '+score;$('hCoins').textContent='● '+coins;$('hLives').textContent='♥ '+lives;$('hLevel').textContent='W'+(lvl+1);$('hTime').textContent='⏱ '+time;$('hPow').textContent=P.shield?'🛡':'';}
function drawTitleHero(){c.fillStyle='#4cc35a';c.fillRect(0,H-64,W,64);c.fillStyle='#8b5a2b';c.fillRect(0,H-56,W,56);
 const all=PRESETS;all.forEach((p,i)=>drawHero(c,120+i*(720/(all.length-1)),H-64,p,'run',T+i*.3,1,{s:1.2}));}
let last=performance.now(),lastRaf=0;setInterval(()=>{const n=performance.now();if(n-lastRaf>250&&/^team/.test(state)){frameAcc+=Math.min(100,n-last);last=n;while(frameAcc>=1000/60){update();frameAcc-=1000/60;}}},1000/30);
function loop(now){lastRaf=now;frameAcc+=Math.min(100,now-last);last=now;while(frameAcc>=1000/60){update();frameAcc-=1000/60;}render();Team.tick();
 previews.forEach((p,i)=>{if(!p.el.isConnected)return;const pc=p.el.querySelector('canvas').getContext('2d');pc.clearRect(0,0,100,110);pc.fillStyle='#ffffff15';pc.fillRect(0,95,100,15);drawHero(pc,50,98,p.cf,p.el.classList.contains('sel')?'run':'idle',T+i,1,{s:1.25});});
 requestAnimationFrame(loop);}
window.__ss={get P(){return P},get state(){return state},get score(){return score},get coins(){return coins},keys,startGame,showSelect};
Team.init({panel,showTitle,setPlayUI,keys,banner,drawBG,getHero:()=>hero,setState:s=>{state=s;}});
showTitle();requestAnimationFrame(loop);
})();
