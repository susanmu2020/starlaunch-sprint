// Starlaunch Sprint — Team Race 2v2 (online via WebRTC/PeerJS, or offline vs NPCs)
const Team=(()=>{
const TC=['#4da3ff','#ff5a5a'],TN=['Team Blue','Team Red'],BONUS=[1000,600,300,100],TLIM=180,PFX='starlaunch-sprint-';
const DIFF={easy:{max:4.2,react:.25,run:0,coin:0,hold:12},normal:{max:5,react:.6,run:1,coin:.4,hold:16},hard:{max:5.7,react:1,run:1,coin:.9,hold:19}};
const ORD=['1st','2nd','3rd','4th'];
let A=null,S=null,LB=null,previews=[],count=null,keyJc=0,keyJl=false;
const $=id=>document.getElementById(id),esc=s=>String(s).replace(/[&<>"']/g,m=>'&#'+m.charCodeAt(0)+';');
const base=()=>location.href.split('#')[0].split('?')[0];
const rand=a=>a[Math.floor(Math.random()*a.length)];
function init(api){A=api;const q=new URLSearchParams(location.search).get('room');if(q)setTimeout(()=>join(q.toUpperCase()),50);}
// ---------------- transport
function makeTransport(conn){const t={open:true,send(o){try{if(t.open)conn.send(o)}catch(e){}},onmsg:null,onclose:null,close(){t.open=false;try{conn.close()}catch(e){}}};
 conn.on('data',d=>{t.seen=Date.now();t.onmsg&&t.onmsg(d)});const cl=()=>{if(!t.open)return;t.open=false;t.onclose&&t.onclose();};conn.on('close',cl);conn.on('error',cl);
 // ICE failure detection
 const pc=conn.peerConnection;if(pc)pc.addEventListener('iceconnectionstatechange',()=>{if(['failed','disconnected','closed'].includes(pc.iceConnectionState))setTimeout(()=>{if(['failed','closed'].includes(pc.iceConnectionState))cl()},3000)});
 return t;}
// BroadcastChannel transport for local testing (?net=bc): same-origin tabs
function bcPeer(id){const ch=new BroadcastChannel('ss-'+id);return ch;}
const PEERCFG={config:{iceServers:new URLSearchParams(location.search).get('ice')==='none'?[]:[{urls:'stun:stun.l.google.com:19302'},{urls:'stun:stun1.l.google.com:19302'}]}};
const useBC=()=>new URLSearchParams(location.search).get('net')==='bc';
setInterval(()=>{const ts=[LB&&LB.t,S&&S.t].filter((x,i,a)=>x&&a.indexOf(x)===i);ts.forEach(t=>{if(!t.open)return;t.send({t:'ping'});t.seen=t.seen||Date.now();if(Date.now()-t.seen>6000){t.open=false;t.onclose&&t.onclose();}});},1000);
function newCode(){const a='ABCDEFGHJKMNPQRSTUVWXYZ23456789';let s='';for(let i=0;i<5;i++)s+=a[Math.floor(Math.random()*a.length)];return s;}
// ---------------- lobby
function defHero(){return {...((typeof migrateHero==='function'&&migrateHero(A.getHero()))||PRESETS[0])};}
function menu(){cleanup();A.setState('teammenu');A.setPlayUI(false);
 const online=typeof Peer!=='undefined'||useBC();
 A.panel(`<h2>👥 Team Race 2v2</h2><p>Blue team (you + a friend) races Red team (2 NPC rivals) on the same level.</p>
 <button class="btn" id="tCreate" ${online?'':'disabled'}>🌐 Create online room</button><br>
 <input id="tCode" maxlength="5" placeholder="CODE" style="font-size:20px;width:110px;text-align:center;text-transform:uppercase;padding:6px;border-radius:8px;border:none"> <button class="btn" id="tJoin" ${online?'':'disabled'}>Join room</button><br>
 <button class="btn sec" id="tOff">🤖 Offline: you + NPC teammate</button><br><button class="btn sec" id="tBack">Back</button>
 <p style="font-size:11px;opacity:.75;max-width:520px;margin:8px auto 0">Online play connects the two devices directly (WebRTC peer-to-peer) using a free public signaling server to find each other. No accounts; no data stored.</p>`);
 $('tCreate').onclick=host;$('tJoin').onclick=()=>{const c=$('tCode').value.trim().toUpperCase();if(c.length>=4)join(c);};
 $('tCode').onkeydown=e=>{e.stopPropagation();if(e.key==='Enter')$('tJoin').click();};
 $('tOff').onclick=()=>lobbyOpen({role:'off'});$('tBack').onclick=A.showTitle;}
function host(){const code=newCode();const lb={role:'host',code,status:'Opening room…'};
 if(useBC()){const ch=bcPeer(code);lb.bc=ch;ch.onmessage=e=>{if(e.data&&e.data.__hello&&!lb.t){lb.t=bcTransport(ch,'h');wireHost(lb);}};lb.status='Waiting for a friend to join…';lobbyOpen(lb);return;}
 const peer=new Peer(PFX+code,PEERCFG);lb.peer=peer;lobbyOpen(lb);
 peer.on('open',()=>{lb.status='Waiting for a friend to join…';updLobby();});
 peer.on('connection',conn=>{if(lb.t&&lb.t.open){conn.on('open',()=>{conn.send({t:'full'});setTimeout(()=>conn.close(),300)});return;}
  conn.on('open',()=>{lb.t=makeTransport(conn);wireHost(lb);});});
 peer.on('error',e=>{if(e.type==='unavailable-id'){peer.destroy();host();return;}lb.status='⚠️ Network error: '+e.type+' (try offline mode)';updLobby();});
 peer.on('disconnected',()=>{try{peer.reconnect()}catch(e){}});}
function bcTransport(ch,me){const t={open:true,send(o){if(t.open)ch.postMessage({from:me,d:o})},onmsg:null,onclose:null,close(){if(t.open){ch.postMessage({from:me,bye:1});t.open=false;}}};
 ch.onmessage=e=>{const m=e.data;if(!m||m.from===me||m.__hello)return;t.seen=Date.now();if(m.bye){t.open=false;t.onclose&&t.onclose();return;}t.onmsg&&t.onmsg(m.d);};
 addEventListener('beforeunload',()=>t.close());return t;}
function wireHost(lb){const t=lb.t;lb.connected=true;lb.status='Friend connected ✅ — pick heroes, then Start!';
 t.onmsg=m=>onMsg(m);t.onclose=()=>{lb.connected=false;lb.t=null;lb.other=null;
  if(S&&S.role==='host'&&S.racers){S.racers[1].ctrl='npc';S.racers[1].name+=' (NPC)';S.t=null;A.banner('Friend disconnected — an NPC took over');}
  else{lb.status='Friend left. Waiting for a friend to join…';updLobby();}};
 t.send({t:'hello',hero:lb.mine,cfg:cfg(lb)});updLobby();}
function join(code){cleanup();const lb={role:'guest',code,status:'Connecting to room '+code+'…'};lobbyOpen(lb);
 const fail=msg=>{if(LB!==lb&&!(S&&S.lb===lb))return;lostPanel(msg);};
 if(useBC()){const ch=bcPeer(code);lb.t=bcTransport(ch,'g');ch.postMessage({__hello:1});wireGuest(lb,fail);return;}
 if(typeof Peer==='undefined'){fail('Online play unavailable.');return;}
 const peer=new Peer(PEERCFG);lb.peer=peer;
 peer.on('open',()=>{const conn=peer.connect(PFX+code,{reliable:true});conn.on('open',()=>{lb.t=makeTransport(conn);wireGuest(lb,fail);});});
 peer.on('error',e=>fail(e.type==='peer-unavailable'?'Room '+code+' not found. Check the code or ask your friend for a new link.':'Network error: '+e.type));
 setTimeout(()=>{if(!lb.t&&LB===lb)fail('Could not reach room '+code+' (timeout).');},15000);}
function wireGuest(lb,fail){lb.connected=true;lb.status='Connected to host ✅ — pick your hero. Host starts the race.';
 lb.t.onmsg=m=>onMsg(m);lb.t.onclose=()=>fail('Lost connection to the host.');lb.t.send({t:'hello',hero:lb.mine});updLobby();}
function lostPanel(msg){cleanup();A.setState('teammenu');A.setPlayUI(false);A.panel(`<h2>Connection</h2><p>${esc(msg)}</p><button class="btn" id="tM">Team Race menu</button><button class="btn sec" id="tT">Title</button>`);$('tM').onclick=menu;$('tT').onclick=A.showTitle;}
function cleanup(){if(S&&S.lb&&S.lb!==LB)S.lb=null;const lb=LB||(S&&S.lb);if(lb){try{lb.t&&lb.t.close()}catch(e){}try{lb.peer&&lb.peer.destroy()}catch(e){}try{lb.bc&&lb.bc.close()}catch(e){}}LB=null;S=null;}
const cfg=lb=>({diff:lb.diff,lv:lb.lv});
const optsList=()=>[...PRESETS.map(p=>({...p})),{id:'custom',name:'My Hero',type:'custom',shirt:'#3fae5a',pants:'#2f3e8f',hair:'#5a3a1a',skin:'#e8b48a',hat:'cap'}];
function lobbyOpen(lb){LB=lb;A.setState('lobby');A.setPlayUI(false);lb.mine=lb.mine||defHero();lb.diff=lb.diff||'normal';lb.lv=lb.lv||'0';
 if(lb.role==='off'&&!lb.other)lb.other={...rand(PRESETS.filter(p=>p.id!==lb.mine.id))};
 const me=lb.role==='guest'?2:1,oth=3-me,isHost=lb.role!=='guest',opts=optsList();
 const link=lb.code?base()+'?room='+lb.code+(useBC()?'&net=bc':'')+(new URLSearchParams(location.search).get('ice')==='none'?'&ice=none':''):'';
 A.panel(`<h2>👥 Team Race 2v2 ${lb.role==='off'?'· Offline':'· Online'}</h2>
 ${lb.code?`<div class="room">Room code <b id="tRC">${lb.code}</b> <input id="tLink" readonly value="${esc(link)}"> <button class="btn sec mini" id="tCopy">📋 Copy invite</button></div>`:''}
 <p id="tStat" class="stat">${lb.role==='off'?'You + an NPC teammate vs 2 NPC rivals.':esc(lb.status)}</p>
 <div class="cols2"><div class="col"><h3 style="color:${TC[0]}">P${me} · You${isHost&&lb.role!=='off'?' (host)':''}</h3><canvas id="pvMe" width="110" height="110"></canvas>
  <div class="chips">${opts.map((o,i)=>`<button class="chip" data-i="${i}">${esc(o.id==='custom'?'✏️ Create your own':o.name)}</button>`).join('')}</div><div id="tCust"></div></div>
 <div class="col"><h3 style="color:${TC[0]}">P${oth} · ${lb.role==='off'?'NPC teammate':'Friend'}</h3><canvas id="pvOth" width="110" height="110"></canvas><p id="tOthN">—</p>${lb.role==='off'?'<button class="chip" id="tReroll">🎲 Reroll</button>':''}</div></div>
 <div class="cfg">NPC skill <select id="tDiff" ${isHost?'':'disabled'}>${['easy','normal','hard'].map(d=>`<option value="${d}">${d[0].toUpperCase()+d.slice(1)}</option>`).join('')}</select>
  Course <select id="tLv" ${isHost?'':'disabled'}>${THEMES.slice(0,3).map((t,i)=>`<option value="${i}">${i+1}. ${t.name}</option>`).join('')}<option value="series">🏆 3-level series</option></select></div>
 ${isHost?'<button class="btn" id="tStart">🏁 Start race</button>':'<p class="stat">Waiting for host to start…</p>'}<button class="btn sec" id="tBack">Back</button>`);
 $('tDiff').value=lb.diff;$('tLv').value=lb.lv;
 const sendCfg=()=>{lb.diff=$('tDiff').value;lb.lv=$('tLv').value;lb.t&&lb.t.send({t:'cfg',cfg:cfg(lb)});};$('tDiff').onchange=sendCfg;$('tLv').onchange=sendCfg;
 if($('tCopy'))$('tCopy').onclick=async e=>{const tx=`Join my Starlaunch Sprint Team Race! Room ${lb.code}: ${link}`;try{if(navigator.share){await navigator.share({title:'Starlaunch Sprint',text:tx,url:link});return;}}catch(_){}try{await navigator.clipboard.writeText(link);e.target.textContent='Copied!';}catch(_){$('tLink').select();}};
 if($('tReroll'))$('tReroll').onclick=()=>{lb.other={...rand(PRESETS.filter(p=>p.id!==lb.other.id&&p.id!==lb.mine.id))};updLobby();};
 const pick=i=>{let o=opts[i];if(o.id==='custom'){o=lb.mine.type==='custom'?lb.mine:o;}lb.mine={...o};
  ov().querySelectorAll('.chip[data-i]').forEach(b=>b.classList.toggle('sel',+b.dataset.i===i));
  $('tCust').innerHTML=lb.mine.type!=='custom'?'':`<div class="cust"><label>Name</label><input type="text" id="tcN" maxlength="14" value="${esc(lb.mine.name)}">
   <label>Shirt</label><input type="color" id="tcS" value="${lb.mine.shirt}"><label>Hair</label><input type="color" id="tcH" value="${lb.mine.hair}"><label>Skin</label><input type="color" id="tcK" value="${lb.mine.skin}"><label>Hat</label><select id="tcHat">${HATS.map(h=>`<option ${lb.mine.hat===h?'selected':''}>${h}</option>`).join('')}</select></div>`;
  if(lb.mine.type==='custom'){const up=()=>{lb.mine.name=($('tcN').value.trim()||'Hero').slice(0,14);lb.mine.shirt=$('tcS').value;lb.mine.hair=$('tcH').value;lb.mine.skin=$('tcK').value;lb.mine.hat=$('tcHat').value;sendHero();};
   $('tCust').querySelectorAll('input,select').forEach(e=>{e.oninput=up;e.onkeydown=ev=>ev.stopPropagation();});}
  sendHero();};
 const sendHero=()=>{lb.t&&lb.t.send({t:'hero',hero:lb.mine});};
 ov().querySelectorAll('.chip[data-i]').forEach(b=>b.onclick=()=>pick(+b.dataset.i));
 let si=opts.findIndex(o=>o.id===lb.mine.id);pick(si<0?0:si);
 previews=[{cv:$('pvMe'),h:()=>lb.mine},{cv:$('pvOth'),h:()=>lb.other}];
 if($('tStart'))$('tStart').onclick=()=>{if(lb.role==='host'&&!lb.connected){$('tStat').textContent='⏳ Waiting for your friend to join first… (or use Offline mode)';return;}hostStart(lb);};
 $('tBack').onclick=()=>{cleanup();menu();};updLobby();}
const ov=()=>document.getElementById('overlay');
function updLobby(){const lb=LB;if(!lb||!$('tStat'))return;if(lb.role!=='off')$('tStat').textContent=lb.status;$('tOthN').textContent=lb.other?lb.other.name:(lb.role==='off'?'':'(not connected)');
 if(lb.role==='guest'){$('tDiff').value=lb.diff;$('tLv').value=lb.lv;}}
// ---------------- messages
function onMsg(m){const lb=LB||(S&&S.lb);if(!m||!m.t)return;
 switch(m.t){
 case 'hello':case 'hero':if(lb){lb.other=m.hero&&{...(migrateHero(m.hero)||m.hero),name:String(m.hero.name||'Hero').slice(0,14)};if(m.cfg){lb.diff=m.cfg.diff;lb.lv=m.cfg.lv;}updLobby();}break;
 case 'cfg':if(lb){lb.diff=m.cfg.diff;lb.lv=m.cfg.lv;updLobby();}break;
 case 'full':lostPanel('That room is already full.');break;
 case 'start':guestStart(m);break;
 case 'level':if(S)loadLevel(m.li);break;
 case 's':if(S&&S.role==='guest')applySnap(m);break;
 case 'board':if(S){S.state='board';showBoard(m.b);}break;
 case 'in':if(S&&S.role==='host'&&S.racers)S.racers[1].in=m.k;break;
 case 'lobby':backToLobby(false);break;
 case 'rematch':if(S&&S.role==='host')hostStart(S.lb);break;}}
// ---------------- race setup
function mkRacer(i,team,hero,ctrl){return{i,team,hero,name:hero.name,ctrl,x:0,y:0,w:22,h:56,vx:0,vy:0,face:1,on:false,coy:0,buf:0,jcSeen:0,st:'idle',plat:null,resp:0,safeX:64,falls:0,fallX:-1,coins:0,stomps:0,lv:0,fin:0,place:0,inv:0,stun:0,behind:0,tot:0,totTime:0,in:{l:0,r:0,j:0,a:0,jc:0},ai:{hold:0,stuck:0,lastX:0,jc:0}};}
function hostStart(lb){const humans=[lb.mine,lb.other||rand(PRESETS)];const used=humans.map(h=>h.id);
 const pool=PRESETS.filter(p=>!used.includes(p.id)).sort(()=>Math.random()-.5);
 const npcs=[pool[0]||PRESETS[2],pool[1]||PRESETS[3]].map(p=>({...p,name:'Rival '+p.name.split(' ')[0]}));
 const heroes=[humans[0],humans[1],npcs[0],npcs[1]],levels=lb.lv==='series'?[0,1,2]:[+lb.lv];
 const msg={t:'start',heroes,levels,diff:lb.diff};lb.t&&lb.t.send(msg);begin(lb,msg);}
function guestStart(m){const lb=LB||(S&&S.lb);begin(lb,m);}
function begin(lb,m){LB=null;const role=lb.role;
 S={role,lb,t:lb.t||null,diff:m.diff,levels:m.levels,li:0,me:role==='guest'?1:0,state:'race'};
 const p2ctrl=role==='off'?'npc':role==='host'?'remote':'local';
 S.racers=[mkRacer(0,0,m.heroes[0],role==='guest'?'remote':'local'),mkRacer(1,0,m.heroes[1],p2ctrl),mkRacer(2,1,m.heroes[2],'npc'),mkRacer(3,1,m.heroes[3],'npc')];
 if(role==='off')S.racers[1].name+=' (NPC)';
 loadLevel(0);}
function loadLevel(li){S.li=li;S.n=S.levels[li];S.Lv=buildLevel(S.n);S.Lv.enemies.forEach(e=>e.alive=1);S.tiles=[];S.parts=[];S.frame=0;S.T=0;S.time=TLIM;S.finCount=0;S.endT=0;S.state='count';S.cd=180;S.cam={x:0};S.bumps=[];
 S.racers.forEach((r,k)=>{Object.assign(r,{x:30+k*40,y:GROUND*32-56,vx:0,vy:0,on:false,resp:0,safeX:30+k*40,falls:0,fallX:-1,coins:0,stomps:0,lv:0,fin:0,place:0,inv:0,stun:0,behind:0,plat:null,face:1});r.sx=r.x;r.sy=r.y;});
 A.setState('team');ov().innerHTML='';A.setPlayUI(false);$('touch').classList.toggle('hidden',!$('touch').dataset.mobile);Sound.music(true);
 A.banner(`${S.levels.length>1?'Race '+(li+1)+'/'+S.levels.length+' · ':''}${THEMES[S.n].name}`);}
// ---------------- physics
function tile(px,py){const tx=Math.floor(px/32),ty=Math.floor(py/32);if(tx<0||tx>=S.Lv.w)return'S';if(ty<0||ty>=LH)return' ';return S.Lv.g[ty][tx];}
const solid=(x,y)=>'#=B?US'.includes(tile(x,y));
function move(b,onHead){b.x+=b.vx;
 if(b.vx>0&&(solid(b.x+b.w,b.y+2)||solid(b.x+b.w,b.y+b.h-1)||solid(b.x+b.w,b.y+b.h/2))){b.x=Math.floor((b.x+b.w)/32)*32-b.w-.01;b.hitW=1;b.vx=0;}
 else if(b.vx<0&&(solid(b.x,b.y+2)||solid(b.x,b.y+b.h-1)||solid(b.x,b.y+b.h/2))){b.x=Math.floor(b.x/32)*32+32.01;b.hitW=-1;b.vx=0;}else b.hitW=0;
 b.y+=b.vy;b.on=false;
 if(b.vy>=0&&(solid(b.x+2,b.y+b.h)||solid(b.x+b.w-2,b.y+b.h))){b.y=Math.floor((b.y+b.h)/32)*32-b.h;b.vy=0;b.on=true;}
 else if(b.vy<0){const l=solid(b.x+3,b.y),r=solid(b.x+b.w-3,b.y);if(l||r){const hx=Math.floor((l&&r?b.x+b.w/2:l?b.x+3:b.x+b.w-3)/32),hy=Math.floor(b.y/32);b.y=hy*32+32;b.vy=1;onHead&&onHead(hx,hy);}}}
const isMe=r=>r.i===S.me;
function pop(x,y,txt,col){S.parts.push({x,y,vx:0,vy:-1.5,life:40,txt,col});}
function headHit(r,tx,ty){const t=S.Lv.g[ty][tx];
 if(t==='?'){S.Lv.g[ty][tx]='U';S.tiles.push([tx,ty,'U']);S.bumps.push({tx,ty,t:8});giveCoin(r,tx*32+16,ty*32-10);}
 else if(isMe(r))Sound.sfx.bump();
 S.Lv.enemies.forEach(e=>{if(e.alive&&Math.abs(e.x+e.w/2-tx*32-16)<30&&Math.abs(e.y+e.h-ty*32)<6)stomp(r,e);});}
function giveCoin(r,x,y){r.coins++;r.lv+=100;if(isMe(r)){Sound.sfx.coin();pop(x,y,'+100');}}
function stomp(r,e){e.alive=0;e.dt=30;r.stomps++;r.lv+=200;if(isMe(r)){Sound.sfx.stomp();pop(e.x+14,e.y,'+200');}}
const ov2=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
function groundCol(x){for(let y=GROUND-6;y<LH;y++)if(solid(x,y*32+4))return y;return -1;}
function placeRespawn(r){let x=r.safeX;if(Math.abs(r.fallX-x)<8)r.falls++;else{r.falls=1;r.fallX=x;}
 if(r.falls>=3){for(let cx=x+64;cx<S.Lv.w*32;cx+=16){if(groundCol(cx)>=0&&groundCol(cx+32)>=0&&groundCol(cx+64)>=0){x=cx;break;}}r.falls=0;}
 const gy=groundCol(x+11);r.x=x;r.y=(gy<0?GROUND:gy)*32-r.h;r.vx=r.vy=0;r.inv=60;r.plat=null;}
function step(r,inp,predict){
 if(r.fin){r.vx=0;r.st='idle';return;}
 if(r.resp>0){r.resp--;if(r.resp===0&&!predict)placeRespawn(r);return;}
 if(r.inv>0)r.inv--;const ctl=r.stun>0?(r.stun--,{}):inp;
 const max=r.ctrl==='npc'?DIFF[S.diff].max:(ctl.a?6:4),acc=r.on?.55:.35;
 if(ctl.l){r.vx=Math.max(r.vx-acc,-max);r.face=-1}else if(ctl.r){r.vx=Math.min(r.vx+acc,max);r.face=1}else r.vx*=r.on?.78:.95;
 if(Math.abs(r.vx)<.1)r.vx=0;
 if((ctl.jc|0)!==r.jcSeen){r.jcSeen=ctl.jc|0;r.buf=7;}if(r.buf>0)r.buf--;
 if(r.on)r.coy=7;else if(r.coy>0)r.coy--;
 if(r.buf>0&&r.coy>0){r.vy=-12.6-Math.abs(r.vx)*.25;r.coy=0;r.buf=0;r.on=false;r.plat=null;if(isMe(r))Sound.sfx.jump();}
 if(!ctl.j&&r.vy<-4)r.vy=-4;r.vy=Math.min(r.vy+.62,13);
 if(r.plat){r.x+=r.plat.dx;r.y+=r.plat.dy;}
 const prevB=r.y+r.h;move(r,predict?null:(tx,ty)=>headHit(r,tx,ty));r.plat=null;
 S.Lv.movers.forEach(m=>{if(r.vy>=0&&r.x+r.w>m.x&&r.x<m.x+m.w&&prevB<=m.y+Math.max(2,m.dy+2)+r.vy&&r.y+r.h>=m.y-1&&r.y+r.h<=m.y+14){r.y=m.y-r.h;r.vy=0;r.on=true;r.plat=m;}});
 if(r.x<0)r.x=0,r.vx=0;
 if(r.on&&!r.plat&&solid(r.x+2,r.y+r.h+2)&&solid(r.x+r.w-2,r.y+r.h+2))r.safeX=r.x;
 r.st=!r.on?'jump':Math.abs(r.vx)>.3?'run':'idle';
 if(predict)return;
 if(r.y>LH*32+40){r.resp=75;r.y=LH*32+200;if(isMe(r))Sound.sfx.hurt();return;}
 S.Lv.coins.forEach((k,ci)=>{if(!k.taken&&Math.abs(k.x-r.x-r.w/2)<20&&k.y>r.y-10&&k.y<r.y+r.h+10){k.taken=true;giveCoin(r,k.x,k.y);}});
 S.Lv.enemies.forEach(e=>{if(!e.alive||!ov2(e,r))return;if(r.vy>0&&r.y+r.h-e.y<20){stomp(r,e);r.vy=ctl.j?-12:-8;}
  else if(r.inv<=0){r.inv=90;r.stun=30;r.vy=-7;r.vx=-3*r.face;if(isMe(r))Sound.sfx.hurt();}});
 const G=S.Lv.goal;if(r.x+r.w>G.x-20){r.fin=S.frame;r.place=++S.finCount;r.x=G.x-20-r.w+(r.place-1)*0;if(isMe(r)){Sound.sfx.win();A.banner(`You finished ${ORD[r.place-1]}!`);}}
 // human far behind teammate → respawn near teammate
 const mate=S.racers.find(o=>o.team===r.team&&o!==r);
 if(r.ctrl!=='npc'&&mate&&!mate.fin&&!mate.resp&&mate.x-r.x>900){if(++r.behind>150){r.behind=0;r.safeX=mate.safeX;r.fallX=-1;placeRespawn(r);if(isMe(r))A.banner('Warped to your teammate!');}}else r.behind=0;}
// ---------------- NPC AI
function hasGround(x,y){for(let ty=Math.floor(y/32);ty<LH;ty++)if(solid(x,ty*32+2))return true;return S.Lv.movers.some(m=>x>m.x&&x<m.x+m.w&&m.y>y-10&&m.y<y+200);}
function ai(r){const d=DIFF[S.diff],a=r.ai,inp={l:0,r:1,j:0,a:d.run,jc:a.jc};let want=false;
 const fx=r.x+r.w/2,fy=r.y+r.h,sp=Math.abs(r.vx);
 if(r.on){for(let dx=14;dx<=20+sp*7;dx+=8)if(!hasGround(fx+dx,fy+2)){want=true;break;}
  if(solid(r.x+r.w+14,fy-10)||solid(r.x+r.w+14,r.y+r.h/2))want=true;
  for(const e of S.Lv.enemies){if(!e.alive)continue;const dx=e.x-(r.x+r.w);if(dx>-4&&dx<50+sp*6&&Math.abs(e.y+e.h-fy)<50){want=true;break;}}
  if(Math.random()<d.coin*.1)for(const k of S.Lv.coins){if(!k.taken&&k.x-fx>10&&k.x-fx<70&&fy-k.y>50&&fy-k.y<140){want=true;break;}}}
 if(Math.abs(r.x-a.lastX)<.5&&!r.fin&&!r.resp)a.stuck++;else a.stuck=0;a.lastX=r.x;if(a.stuck>18){want=true;a.stuck=0;}
 if(want&&r.on&&a.hold<=0&&Math.random()<d.react){a.hold=d.hold+Math.random()*4;inp.jc=++a.jc;}
 if(a.hold>0){a.hold--;inp.j=1;}return inp;}
// ---------------- local input
function localInput(){const k=A.keys;if(k.jump&&!keyJl)keyJc++;keyJl=!!k.jump;return{l:k.left?1:0,r:k.right?1:0,j:k.jump?1:0,a:k.action?1:0,jc:keyJc};}
// ---------------- update
function update(){if(!S)return;S.T+=1/60;const L=S.Lv;
 S.parts=S.parts.filter(p=>(p.x+=p.vx,p.y+=p.vy,--p.life>0));
 if(S.state==='board'||S.state==='inter')return;
 L.movers.forEach(m=>{const ox=m.x,oy=m.y,s=Math.sin(S.T*m.sp+m.ph)*.5+.5;m.x=m.x0+m.rx*s;m.y=m.y0+m.ry*s;m.dx=m.x-ox;m.dy=m.y-oy;});
 const li=localInput(),me=S.racers[S.me];
 if(S.state==='count'){if(S.role!=='guest'){S.cd--;if(S.cd<=0)S.state='race';}if(S.cd%60===0&&S.cd>0)Sound.sfx.bump();if(S.role==='host'&&S.frame++%3===0)snap();camUpd();return;}
 if(S.role==='guest'){S.lastSent=S.lastSent||0;const ks=JSON.stringify(li);if(ks!==S.lastIn||S.frame%4===0){S.t&&S.t.send({t:'in',k:li});S.lastIn=ks;}
  S.frame++;step(me,li,true);
  S.racers.forEach(r=>{if(r===me){if(r.hx===undefined)return;const dx=r.hx-r.x,dy=r.hy-r.y;if(r.hresp||Math.abs(dx)>110||Math.abs(dy)>110){r.x=r.hx;r.y=r.hy;r.vy=r.hvy;}else{r.x+=dx*.12;if(Math.abs(dy)>40)r.y+=dy*.2;}return;}
   if(r.hx===undefined)return;r.x+=(r.hx-r.x)*.35;r.y+=(r.hy-r.y)*.35;});
  L.enemies.forEach(e=>{if(e.hx!==undefined){e.x+=(e.hx-e.x)*.35;e.y+=(e.hy-e.y)*.35;}if(!e.alive&&e.dt>0)e.dt--;});camUpd();return;}
 // host / offline authoritative
 S.frame++;if(S.frame%60===0&&S.time>0)S.time--;
 S.racers.forEach(r=>{const inp=r.ctrl==='local'?li:r.ctrl==='npc'?ai(r):r.in;step(r,inp,false);});
 L.enemies.forEach(e=>{if(!e.alive){if(e.dt>0)e.dt--;return;}if(!S.racers.some(r=>Math.abs(e.x-r.x)<W0+100))return;e.t+=1/60;
  if(e.type==='flyer'){e.x+=Math.sin(e.t*.8)*1.2;e.y=e.y0+Math.sin(e.t*2.2)*48;}
  else{e.vy=Math.min(e.vy+.5,10);if(e.type==='hopper'&&e.on&&Math.random()<.02)e.vy=-9;const ahead=e.vx>0?e.x+e.w+2:e.x-2;
   if(e.on&&e.type==='walker'&&!solid(ahead,e.y+e.h+4)&&S.n>0)e.vx*=-1;move(e);if(e.hitW)e.vx=e.hitW*-(1+S.n*.25);if(e.y>LH*32+50)e.alive=0,e.dt=0;}});
 const humans=S.racers.filter(r=>r.ctrl!=='npc');
 if(S.finCount===4||S.time<=0)endLevel();
 else if(humans.length&&humans.every(r=>r.fin)){if(!S.endT){S.endT=S.frame;A.banner('Rivals have 8 seconds to finish!');}if(S.frame-S.endT>480)endLevel();}
 else if(S.finCount>0&&!S.grace){S.grace=S.frame;}
 if(S.grace&&S.frame-S.grace>60*45)endLevel();
 if(S.role==='host'&&S.frame%3===0)snap();camUpd();}
const W0=960;
function camUpd(){const me=S.racers[S.me],tx=Math.max(0,Math.min(S.Lv.w*32-W0,me.x-W0*.4+me.vx*20));S.cam.x+=(tx-S.cam.x)*.12;}
function snap(){if(!S.t)return;const L=S.Lv;
 S.t.send({t:'s',T:S.T,f:S.frame,time:S.time,st:S.state,cd:S.cd,
  r:S.racers.map(r=>[Math.round(r.x),Math.round(r.y),+r.vy.toFixed(1),r.face,r.st,r.resp,r.coins,r.stomps,r.lv,r.fin,r.place,r.inv,r.ctrl==='npc'?1:0]),
  c:L.coins.map(k=>k.taken?1:0).join(''),e:L.enemies.map(e=>[Math.round(e.x),Math.round(e.y),e.alive,e.vx>0?1:0]),tl:S.tiles,fc:S.finCount});}
function applySnap(m){const L=S.Lv;if(!L)return;S.T=m.T;S.time=m.time;S.state=m.st==='count'?'count':'race';S.cd=m.cd;S.finCount=m.fc;
 m.r.forEach((a,k)=>{const r=S.racers[k];const pc=r.coins,pf=r.fin;r.hx=a[0];r.hy=a[1];r.hvy=a[2];r.hresp=a[5];if(!isMe(r)){r.face=a[3];r.st=a[4];}else if(a[5])r.st='jump';
  r.resp=a[5];r.coins=a[6];r.stomps=a[7];r.lv=a[8];r.fin=a[9];r.place=a[10];r.inv=a[11];
  if(isMe(r)){if(r.coins>pc){Sound.sfx.coin();pop(r.x+11,r.y-6,'+100');}if(r.fin&&!pf){Sound.sfx.win();A.banner(`You finished ${ORD[r.place-1]}!`);}}
  if(k===1&&a[12]&&r.ctrl!=='npc'&&!isMe(r)){}});
 for(let i=0;i<L.coins.length;i++)L.coins[i].taken=m.c[i]==='1';
 m.e.forEach((a,i)=>{const e=L.enemies[i];if(!e)return;e.hx=a[0];e.hy=a[1];if(e.alive&&!a[2])e.dt=30;e.alive=a[2];e.vx=a[3]?1:-1;});
 m.tl.forEach(([x,y,ch])=>{if(L.g[y][x]!==ch){L.g[y][x]=ch;S.bumps.push({tx:x,ty:y,t:8});}});}
// ---------------- results
function endLevel(){if(S.state==='inter'||S.state==='board')return;const rs=S.racers;
 const order=[...rs].sort((a,b)=>(a.fin?a.place:99)-(b.fin?b.place:99)||b.x-a.x);
 order.forEach((r,k)=>{r.rank=k;const tb=r.fin?Math.max(0,Math.round((TLIM-r.fin/60)*10)):0;r.lvTotal=r.lv+BONUS[k]+tb;r.tb=tb;r.tot+=r.lvTotal;r.totTime+=r.fin?r.fin/60:TLIM;r.sc=(r.sc||0)+r.coins;r.ss=(r.ss||0)+r.stomps;r.allFin=(r.allFin!==false)&&!!r.fin;});
 const last=S.li>=S.levels.length-1;
 const rows=[...rs].sort((a,b)=>b.tot-a.tot).map((r,k)=>({rank:k+1,hero:r.hero,name:r.name,team:r.team,coins:r.sc,stomps:r.ss,time:r.allFin?r.totTime.toFixed(1)+'s':'DNF',score:r.tot,me:r.i,lvRank:r.rank+1}));
 const teams=[0,1].map(t=>rows.filter(r=>r.team===t).reduce((s,r)=>s+r.score,0));
 const b={rows,teams,final:last,li:S.li,n:S.levels.length,course:THEMES[S.n].name};
 S.t&&S.t.send({t:'board',b});showBoard(b);}
function showBoard(b){S.state=b.final?'board':'inter';Sound.music(false);if(b.final)Sound.sfx.win();A.setPlayUI(false);
 const win=b.teams[0]===b.teams[1]?-1:b.teams[0]>b.teams[1]?0:1;S.lastBoard=b;
 const names=b.rows.filter(r=>r.team===win).map(r=>r.name),tot=b.teams[win]||b.teams[0];
 const title=b.final?(win<0?'🤝 It\'s a tie!':`🏆 ${TN[win]} wins!`):`Race ${b.li+1}/${b.n} results`;
 A.panel(`<div class="board">${b.final?`<div class="winban" style="--tc:${win<0?'#ffd447':TC[win]}">${title}<small>${win<0?'':esc(names.join(' & '))+' · '+tot+' pts'}</small></div>`:`<h2>${title}</h2>`}
 <table class="lb"><thead><tr><th>#</th><th>Hero</th><th>Name</th><th>Team</th><th>●</th><th>Stomps</th><th>${b.n>1?'Total time':'Finish'}</th><th>Score</th></tr></thead><tbody>
 ${b.rows.map((r,k)=>`<tr style="animation-delay:${k*.25}s" class="${r.me===S.me?'meRow':''}"><td>${['🥇','🥈','🥉','4'][k]}</td><td><canvas width="44" height="44" data-h="${k}"></canvas></td><td>${esc(r.name)}</td><td><span class="tag" style="background:${TC[r.team]}">${TN[r.team].split(' ')[1]}</span></td><td>${r.coins}</td><td>${r.stomps}</td><td>${r.time}</td><td class="cnt" data-v="${r.score}">0</td></tr>`).join('')}</tbody></table>
 <div class="teams"><span style="color:${TC[0]}">${TN[0]}: <b class="cnt" data-v="${b.teams[0]}">0</b></span><span style="color:${TC[1]}">${TN[1]}: <b class="cnt" data-v="${b.teams[1]}">0</b></span></div>
 ${b.final?`<button class="btn" id="bRe">🔁 Rematch</button><button class="btn sec" id="bCh">Change heroes</button><button class="btn sec" id="bSh">📣 Share</button><button class="btn sec" id="bTi">Title</button>${typeof supportBtn==='function'?supportBtn():''}`:
  S.role!=='guest'?`<button class="btn" id="bNx">Next race ▶</button>`:'<p class="stat">Host will start the next race…</p>'}</div>`);
 previews=b.rows.map((r,k)=>({cv:ov().querySelector(`canvas[data-h="${k}"]`),h:()=>r.hero,s:.5,y:43}));count={t0:performance.now()};
 if(!b.final){if($('bNx'))$('bNx').onclick=()=>{const li=S.li+1;S.t&&S.t.send({t:'level',li});loadLevel(li);};return;}
 // local Top 10
 const mine=b.rows.find(r=>r.me===S.me);if(mine&&!S.saved){S.saved=1;saveTop({n:mine.name,h:mine.hero.name,s:mine.score,team:TN[mine.team],won:mine.team===win,mode:S.role==='off'?'vs NPC':'Online',d:new Date().toISOString().slice(0,10)});}
 $('bRe').onclick=()=>{if(S.role==='guest'){S.t&&S.t.send({t:'rematch'});$('bRe').textContent='Asked host…';}else hostStart(S.lb);};
 $('bCh').onclick=()=>{S.t&&S.t.send({t:'lobby'});backToLobby();};$('bTi').onclick=()=>{cleanup();A.showTitle();};
 $('bSh').onclick=async e=>{const t=win<0?`Tie game in Starlaunch Sprint Team Race (${tot} pts each)! Play: ${base()}`:`Team ${names.join(' & ')} won Starlaunch Sprint Team Race with ${tot} pts! Play: ${base()}`;
  try{if(navigator.share){await navigator.share({title:'Starlaunch Sprint',text:t});return;}}catch(_){}try{await navigator.clipboard.writeText(t);e.target.textContent='Copied!';}catch(_){prompt('Copy this:',t);}};}
function backToLobby(){if(!S)return;const lb=S.lb;S=null;lb.connected=!!(lb.t&&lb.t.open);if(lb.role==='host')lb.status=lb.connected?'Friend connected ✅ — pick heroes, then Start!':'Waiting for a friend to join…';
 if(lb.t){lb.t.onmsg=onMsg;}lobbyOpen(lb);}
// ---------------- Top 10
function getTop(){try{return JSON.parse(localStorage.getItem('ss_top10')||'[]')}catch(e){return[]}}
function saveTop(e){const a=getTop();a.push(e);a.sort((x,y)=>y.s-x.s);localStorage.setItem('ss_top10',JSON.stringify(a.slice(0,10)));}
function showTop(){A.setState('top');const a=getTop();A.panel(`<h2>🏆 All-time Top 10 (this device)</h2>${a.length?`<table class="lb"><thead><tr><th>#</th><th>Name</th><th>Hero</th><th>Team</th><th>Mode</th><th>Date</th><th>Score</th></tr></thead><tbody>${a.map((e,i)=>`<tr style="animation-delay:${i*.08}s"><td>${i+1}</td><td>${esc(e.n)}</td><td>${esc(e.h)}</td><td>${esc(e.team)}${e.won?' 🏆':''}</td><td>${esc(e.mode)}</td><td>${esc(e.d)}</td><td><b>${e.s}</b></td></tr>`).join('')}</tbody></table>`:'<p>No Team Race scores yet — go race!</p>'}<button class="btn sec" id="tB">Back</button>${typeof supportBtn==='function'?supportBtn():''}`);$('tB').onclick=A.showTitle;}
// ---------------- render
function render(c){if(!S||!S.Lv)return;const L=S.Lv,cx=Math.round(S.cam.x);A.drawBG(L.theme,cx);c.save();c.translate(-cx,0);
 const x0=Math.floor(cx/32),x1=x0+W0/32+2;
 for(let y=0;y<LH;y++)for(let x=x0;x<x1&&x<L.w;x++){const ch=L.g[y][x];if(ch!==' '){const b=S.bumps.find(b=>b.tx===x&&b.ty===y);drawTile(c,ch,x*32,y*32-(b?Math.sin(b.t/8*Math.PI)*8:0),S.T,L.theme);}}
 S.bumps.forEach(b=>b.t--);S.bumps=S.bumps.filter(b=>b.t>0);
 L.movers.forEach(m=>{c.fillStyle='#ddd';rr(c,m.x,m.y,m.w,m.h,4);c.fillStyle='#7f5af0';c.fillRect(m.x+4,m.y+4,m.w-8,4);});
 L.coins.forEach(k=>{if(!k.taken&&k.x>cx-20&&k.x<cx+W0+20)drawCoin(c,k.x,k.y,S.T)});
 drawRocket(c,L.goal.x,L.goal.y,S.T,false);
 // checkered finish line
 for(let i=0;i<14;i++){c.fillStyle=i%2?'#fff':'#111';c.fillRect(L.goal.x-24,GROUND*32-14*32+i*32,6,32);c.fillStyle=i%2?'#111':'#fff';c.fillRect(L.goal.x-18,GROUND*32-14*32+i*32,6,32);}
 L.enemies.forEach(e=>{if((e.alive||e.dt>0)&&e.x>cx-120&&e.x<cx+W0+40)drawEnemy(c,{...e,dead:e.alive?0:1,dt:e.dt||0},S.T)});
 const ord=[...S.racers].sort((a,b)=>(isMe(a)?1:0)-(isMe(b)?1:0));
 ord.forEach(r=>{if(r.resp>0&&r.y>LH*32)return;if(r.x<cx-60||r.x>cx+W0+60)return;
  if(r.inv>0&&(S.T*15|0)%2&&!isMe(r))c.globalAlpha=.5;else if(r.inv>0&&(S.T*15|0)%2)c.globalAlpha=.55;
  const col=TC[r.team];outlined(c,r,col);c.globalAlpha=1;
  // name tag
  const label=(isMe(r)?'▼ ':'')+r.name+(r.fin?' · '+ORD[r.place-1]:'');c.font='bold 12px Trebuchet MS';const tw=c.measureText(label).width+12,tx=r.x+r.w/2-tw/2,ty=r.y-30-(r.i%2)*0;
  c.fillStyle=col;c.globalAlpha=.9;rr(c,tx,ty,tw,17,8);c.globalAlpha=1;c.fillStyle='#fff';c.textAlign='center';c.fillText(label,r.x+r.w/2,ty+13);});
 S.parts.forEach(p=>{c.font='bold 14px sans-serif';c.textAlign='center';c.strokeStyle='#000';c.lineWidth=3;c.strokeText(p.txt,p.x,p.y);c.fillStyle=p.col||'#fff';c.fillText(p.txt,p.x,p.y);});
 // off-screen racer arrows
 c.restore();S.racers.forEach(r=>{if(isMe(r))return;const sx=r.x-cx;if(sx<-10||sx>W0+10){const right=sx>W0;c.fillStyle=TC[r.team];c.font='bold 13px Trebuchet MS';c.textAlign=right?'right':'left';const y=Math.max(90,Math.min(500,r.y));c.fillText((right?'':'◀ ')+r.name+(right?' ▶':''),right?W0-8:8,y);}});
 hud(c);}
const OC=document.createElement('canvas'),OS=document.createElement('canvas');OC.width=OS.width=96;OC.height=OS.height=110;
function outlined(c,r,col){const o=OC.getContext('2d'),q=OS.getContext('2d');o.clearRect(0,0,96,110);drawHero(o,48,104,r.hero,r.st,S.T+r.i*.2,r.face,{});
 q.globalCompositeOperation='source-over';q.clearRect(0,0,96,110);q.drawImage(OC,0,0);q.globalCompositeOperation='source-in';q.fillStyle=col;q.fillRect(0,0,96,110);
 const X=Math.round(r.x+r.w/2-48),Y=Math.round(r.y+r.h-104);[[2,0],[-2,0],[0,2],[0,-2]].forEach(([dx,dy])=>c.drawImage(OS,X+dx,Y+dy));c.drawImage(OC,X,Y);}
function hud(c){const me=S.racers[S.me],L=S.Lv;c.fillStyle='#000a';rr(c,8,8,300,58,10);c.fillStyle='#fff';c.font='bold 16px Trebuchet MS';c.textAlign='left';
 const live=[...S.racers].sort((a,b)=>(a.fin?a.place:9)-(b.fin?b.place:9)||b.x-a.x),pos=live.indexOf(me)+1;
 c.fillText(`${me.name}  ★ ${me.tot+me.lv}  ● ${me.coins}`,18,30);c.fillStyle='#ffd447';c.fillText(`Pos ${ORD[pos-1]}/4   ⏱ ${S.time}${me.resp>0?'   respawning…':''}`,18,54);
 // progress bar
 const bx=330,bw=560,by=18;c.fillStyle='#000a';rr(c,bx-8,8,bw+16,40,10);c.fillStyle='#ffffff55';c.fillRect(bx,by+10,bw,4);c.fillStyle='#ffd447';c.fillRect(bx+bw-3,by,6,24);
 S.racers.forEach((r,k)=>{const p=Math.max(0,Math.min(1,r.x/(L.goal.x-20)));c.fillStyle=TC[r.team];c.beginPath();c.arc(bx+p*bw,by+12+(k%2?6:-6),isMe(r)?7:5,0,7);c.fill();if(isMe(r)){c.strokeStyle='#fff';c.lineWidth=2;c.stroke();}});
 c.font='bold 11px Trebuchet MS';c.fillStyle='#fff';c.textAlign='left';c.fillText('START',bx,by+36);c.textAlign='right';c.fillText('🚀 FINISH',bx+bw,by+36);
 if(S.state==='count'){const n=Math.ceil(S.cd/60);c.fillStyle='#ffd447';c.strokeStyle='#000';c.lineWidth=6;c.font='bold 90px Trebuchet MS';c.textAlign='center';const s=n>0?String(n):'GO!';c.strokeText(s,W0/2,320);c.fillText(s,W0/2,320);}
 if(S.role!=='off'){c.font='11px Trebuchet MS';c.textAlign='right';c.fillStyle=S.t&&S.t.open?'#7f7':'#f77';c.fillText(S.t&&S.t.open?'● online':'● offline',W0-90,530);}}
function tick(){previews.forEach(p=>{if(!p.cv||!p.cv.isConnected)return;const pc=p.cv.getContext('2d'),h=p.h();pc.clearRect(0,0,p.cv.width,p.cv.height);if(!h)return;drawHero(pc,p.cv.width/2,p.y||100,h,'run',performance.now()/1000,1,{s:p.s||1.2});});
 if(count){const k=Math.min(1,(performance.now()-count.t0)/1500);ov().querySelectorAll('.cnt').forEach(el=>el.textContent=Math.round(+el.dataset.v*k));if(k>=1)count=null;}}
function pause(){if(!S||S.state==='board'||S.state==='inter')return;
 if(S.role==='off'){if(S.paused){S.paused=false;A.setState('team');ov().innerHTML='';Sound.music(true);return;}S.paused=true;A.setState('teampause');Sound.music(false);A.panel(`<h2>Paused</h2><button class="btn" id="bRes">Resume</button><button class="btn sec" id="bQ">Quit to title</button>`);$('bRes').onclick=pause;$('bQ').onclick=()=>{cleanup();A.showTitle();};return;}
 A.panel(`<h2>Leave the online race?</h2><p style="font-size:13px">The race keeps running (online games can't pause).</p><button class="btn" id="bRes">Keep racing</button><button class="btn sec" id="bQ">Leave</button>`);$('bRes').onclick=()=>ov().innerHTML='';$('bQ').onclick=()=>{cleanup();A.showTitle();};}
return{init,menu,update,render,tick,showTop,pause,get S(){return S},get LB(){return LB},endLevel:()=>S&&S.role!=='guest'&&endLevel(),host,join,getTop};})();
