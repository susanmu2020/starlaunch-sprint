const PRESETS=[
 {id:'fox',name:'Sprocket the Fox',type:'fox',shirt:'#3b6e8f',pants:'#2b4c63',hair:'#e8762c',skin:'#e8762c',hat:'none'},
 {id:'astro',name:'Astro Ava',type:'astro',shirt:'#eeeeee',pants:'#dddddd',hair:'#6b3a1f',skin:'#c98b5e',hat:'none'},
 {id:'robot',name:'Bolt-9',type:'robot',shirt:'#8fa3b8',pants:'#5d6f82',hair:'#ff4d4d',skin:'#b8c7d6',hat:'none'},
 {id:'shroom',name:'Morel the Mushwiz',type:'shroom',shirt:'#6b4fb3',pants:'#4a357d',hair:'#d8343f',skin:'#f6e3c4',hat:'none'},
 {id:'penguin',name:'Pip Kickflip',type:'penguin',shirt:'#22263a',pants:'#22263a',hair:'#2ec4b6',skin:'#22263a',hat:'none'},
 {id:'cat',name:'Captain Whiskers',type:'cat',shirt:'#e85d75',pants:'#3d3d6b',hair:'#f09a3e',skin:'#f09a3e',hat:'none'}];
// Legacy hero ids from earlier versions -> new original heroes
const HERO_MIGRATE={rocket:'fox',bigtie:'shroom',snack:'penguin'};
function migrateHero(h){if(!h||typeof h!=='object')return null;const m=HERO_MIGRATE[h.id]||HERO_MIGRATE[h.type];if(m){const p=PRESETS.find(q=>q.id===m);return p?{...p}:null;}return h;}
const HATS=['none','cap','beanie','crown','propeller','cowboy'];
function rr(c,x,y,w,h,r){c.beginPath();c.roundRect?c.roundRect(x,y,w,h,r):c.rect(x,y,w,h);c.fill();}
function shade(hex,a){let n=parseInt(hex.slice(1),16),r=(n>>16)+a,g=((n>>8)&255)+a,b=(n&255)+a;const f=v=>Math.max(0,Math.min(255,v));return'#'+((1<<24)|(f(r)<<16)|(f(g)<<8)|f(b)).toString(16).slice(1);}
// draws hero with feet at (x,y) center-bottom. st: idle|run|jump|fly ; t time; face 1/-1; big bool
function drawHero(c,x,y,cf,st,t,face,opt={}){
 c.save();c.translate(x,y);c.scale(face*(opt.s||1),opt.s||1);
 const T=cf.type,run=st==='run',air=st==='jump'||st==='fly';
 const sw=run?Math.sin(t*18):0,bob=st==='idle'?Math.sin(t*4)*1:run?Math.abs(sw)*-2:0;
 c.translate(0,bob);
 if(opt.jet){c.fillStyle='#9aa';rr(c,-16,-34,8,18,3);c.fillStyle='#e2412f';rr(c,-17,-36,10,6,3);
  if(st==='fly'){c.fillStyle=['#ffd447','#ff8a2a','#fff'][(t*20|0)%3];c.beginPath();c.moveTo(-16,-16);c.lineTo(-8,-16);c.lineTo(-12,-4-Math.random()*10);c.fill();}}
 if(T==='cat'){c.strokeStyle=cf.skin;c.lineWidth=4;c.lineCap='round';c.beginPath();c.moveTo(-8,-14);c.quadraticCurveTo(-20,-18+Math.sin(t*6)*5,-18,-30);c.stroke();}
 if(T==='fox'){c.fillStyle=cf.skin;c.save();c.translate(-8,-18);c.rotate(-.6+Math.sin(t*7)*.25);c.beginPath();c.ellipse(-8,0,11,5,0,0,7);c.fill();c.fillStyle='#fff';c.beginPath();c.ellipse(-16,0,4,3.5,0,0,7);c.fill();c.restore();}
 if(T==='penguin'){c.save();c.translate(0,-2);c.rotate(Math.sin(t*3)*.04);c.fillStyle='#f2a93b';rr(c,-16,-3,34,4,2);c.fillStyle='#555';c.beginPath();c.arc(-10,2,2.5,0,7);c.arc(12,2,2.5,0,7);c.fill();c.restore();}
 // legs
 const pants=T==='penguin'?'#f28c28':cf.pants;c.fillStyle=pants;
 const l1=air?-4:sw*6,l2=air?5:-sw*6;
 c.save();c.translate(-4,-16);c.rotate(l1*.08);rr(c,-3,0,7,14,2);c.fillStyle=T==='robot'?'#333':'#3a2a20';rr(c,-4,11,10,5,2);c.restore();
 c.fillStyle=pants;c.save();c.translate(4,-16);c.rotate(l2*.08);rr(c,-3,0,7,14,2);c.fillStyle=T==='robot'?'#333':'#3a2a20';rr(c,-4,11,10,5,2);c.restore();
 // torso
 c.fillStyle=cf.shirt;rr(c,-10,-32,20,18,5);
 if(T==='fox'){c.fillStyle='#f2c14e';c.fillRect(-10,-20,20,3);c.fillStyle='#ccd';c.fillRect(4,-30,3,10);c.beginPath();c.arc(5.5,-31,3,0,7);c.fill();}
 if(T==='penguin'){c.fillStyle='#f4f4f4';c.beginPath();c.ellipse(1,-23,7,8,0,0,7);c.fill();c.fillStyle=cf.hair;c.fillRect(-10,-33,20,4);c.save();c.translate(-9,-31);c.rotate(Math.sin(t*9)*.3-.3);c.fillRect(-12,-2,12,4);c.restore();}
 if(T==='shroom'){c.fillStyle='#ffd447';c.fillRect(-10,-17,20,3);c.save();c.translate(9,-24);c.rotate(-.3);c.fillStyle='#8b5a2b';c.fillRect(-1,-14,3,22);c.fillStyle=`hsl(${t*160%360},90%,70%)`;c.beginPath();c.arc(.5,-16,3.5+Math.sin(t*8),0,7);c.fill();c.restore();}
 if(T==='astro'){c.fillStyle='#2b6cd4';c.fillRect(-6,-27,6,4);c.fillStyle='#e2412f';c.fillRect(1,-27,5,4);}
 if(T==='robot'){c.fillStyle='#ffd447';c.beginPath();c.arc(0,-23,3,0,7);c.fill();}
 // arms
 const a=air?-1.2:run?-sw*.8:Math.sin(t*4)*.1;
 c.fillStyle=cf.shirt;c.save();c.translate(7,-29);c.rotate(a);rr(c,-2,0,5,12,2);c.fillStyle=T==='robot'?'#666':cf.skin;c.beginPath();c.arc(.5,13,3,0,7);c.fill();c.restore();
 // head
 const hy=-46;c.fillStyle=T==='robot'?cf.skin:cf.skin;
 if(T==='robot'){rr(c,-13,hy-11,26,22,5);c.fillStyle='#222';rr(c,-9,hy-6,18,9,3);c.fillStyle=(t*2|0)%5?'#4dff9a':'#222';c.fillRect(-6,hy-4,4,4);c.fillRect(3,hy-4,4,4);
  c.strokeStyle='#666';c.lineWidth=2;c.beginPath();c.moveTo(0,hy-11);c.lineTo(0,hy-18);c.stroke();c.fillStyle=cf.hair;c.beginPath();c.arc(0,hy-19,3,0,7);c.fill();}
 else{c.beginPath();c.ellipse(1,hy,13,14,0,0,7);c.fill();
  if(T==='cat'){c.beginPath();c.moveTo(-11,hy-8);c.lineTo(-8,hy-20);c.lineTo(-2,hy-12);c.moveTo(11,hy-8);c.lineTo(8,hy-20);c.lineTo(2,hy-12);c.fill();
   c.fillStyle='#fff';c.beginPath();c.ellipse(5,hy+5,7,5,0,0,7);c.fill();c.strokeStyle='#333';c.lineWidth=1;c.beginPath();c.moveTo(8,hy+4);c.lineTo(17,hy+2);c.moveTo(8,hy+6);c.lineTo(17,hy+7);c.stroke();
   c.fillStyle='#ff7aa8';c.beginPath();c.arc(6,hy+2,2,0,7);c.fill();}
  // hair
  c.fillStyle=cf.hair;
  if(T==='fox'){c.fillStyle=cf.skin;c.beginPath();c.moveTo(-11,hy-7);c.lineTo(-9,hy-22);c.lineTo(-2,hy-12);c.moveTo(11,hy-7);c.lineTo(9,hy-22);c.lineTo(2,hy-12);c.fill();
   c.fillStyle='#fff';c.beginPath();c.moveTo(-2,hy+2);c.quadraticCurveTo(8,hy-2,17,hy+4);c.quadraticCurveTo(8,hy+12,-2,hy+8);c.fill();c.fillStyle='#222';c.beginPath();c.arc(16,hy+3,2,0,7);c.fill();
   c.fillStyle='#5a3a1a';c.fillRect(-13,hy-10,26,3);c.fillStyle='#7fd4ff';c.strokeStyle='#5a3a1a';c.lineWidth=2;c.beginPath();c.arc(-3,hy-10,4,0,7);c.arc(6,hy-10,4,0,7);c.fill();c.stroke();}
  else if(T==='penguin'){c.fillStyle='#f4f4f4';c.beginPath();c.ellipse(5,hy+3,8,8,0,0,7);c.fill();c.fillStyle='#f28c28';c.beginPath();c.moveTo(10,hy+1);c.lineTo(19,hy+3);c.lineTo(10,hy+6);c.fill();
   c.fillStyle='#2ec4b6';c.beginPath();c.ellipse(0,hy-7,14,10,0,Math.PI,0);c.fill();c.fillStyle='#fff';c.fillRect(-14,hy-8,28,3);c.beginPath();c.arc(-2,hy-18,3.5,0,7);c.fill();}
  else if(T==='human'||T==='custom'){c.beginPath();c.ellipse(0,hy-8,13,8,0,Math.PI,0);c.fill();c.fillRect(-13,hy-9,5,10);}
  // eyes
  const bl=(t*1.3%4)<.08;c.fillStyle='#fff';c.beginPath();c.ellipse(6,hy-1,3.5,bl?.6:4.5,0,0,7);c.fill();
  c.fillStyle='#1a1a2e';if(!bl){c.beginPath();c.arc(7,hy,2,0,7);c.fill();}
  // smile
  c.strokeStyle='#5a2a1a';c.lineWidth=2;c.beginPath();c.arc(5,hy+5,4,.2,Math.PI-.6);c.stroke();
  if(T!=='cat'&&T!=='penguin'&&T!=='fox'){c.fillStyle=shade(cf.skin,-30);c.beginPath();c.arc(-9,hy+1,3,0,7);c.fill();}
  if(T==='shroom'){const w=Math.sin(t*5)*1.5;c.fillStyle=cf.hair;c.beginPath();c.ellipse(0,hy-8+w*.3,22,14,0,Math.PI,0);c.lineTo(22,hy-5);c.lineTo(-22,hy-5);c.fill();c.fillStyle='#fff';[[-12,-12],[2,-17],[13,-10],[-3,-9]].forEach(([dx,dy],k)=>{c.beginPath();c.arc(dx,hy+dy+w*.3,k%2?3:2.5,0,7);c.fill();});}
  if(T==='astro'){c.strokeStyle='#bfe6ff';c.lineWidth=3;c.fillStyle='#bfe6ff33';c.beginPath();c.arc(1,hy,17,0,7);c.fill();c.stroke();c.fillStyle='#fff8';c.beginPath();c.ellipse(8,hy-9,4,2,-.6,0,7);c.fill();}
 }
 drawHat(c,cf.hat,hy);
 if(opt.shield){c.strokeStyle=`hsla(${t*200%360},90%,70%,.8)`;c.lineWidth=3;c.beginPath();c.ellipse(0,-30,22,34,0,0,7);c.stroke();}
 c.restore();}
function drawHat(c,h,hy){if(!h||h==='none')return;
 if(h==='cap'){c.fillStyle='#e2412f';c.beginPath();c.ellipse(0,hy-9,13,8,0,Math.PI,0);c.fill();c.fillRect(4,hy-11,14,4);}
 if(h==='beanie'){c.fillStyle='#3fae5a';c.beginPath();c.ellipse(0,hy-8,14,11,0,Math.PI,0);c.fill();c.fillStyle='#fff';c.beginPath();c.arc(0,hy-20,4,0,7);c.fill();}
 if(h==='crown'){c.fillStyle='#ffd447';c.beginPath();c.moveTo(-10,hy-10);c.lineTo(-10,hy-22);c.lineTo(-5,hy-15);c.lineTo(0,hy-24);c.lineTo(5,hy-15);c.lineTo(10,hy-22);c.lineTo(10,hy-10);c.fill();}
 if(h==='propeller'){c.fillStyle='#7f5af0';c.beginPath();c.ellipse(0,hy-9,13,8,0,Math.PI,0);c.fill();c.fillStyle='#ffd447';const w=Math.abs(Math.sin(performance.now()/60))*12;c.fillRect(-w,hy-20,w*2,3);c.fillRect(-1,hy-19,2,4);}
 if(h==='cowboy'){c.fillStyle='#8b5a2b';c.fillRect(-18,hy-11,36,4);rr(c,-9,hy-22,18,13,4);}}
function drawEnemy(c,e,t){c.save();c.translate(e.x+e.w/2,e.y+e.h);
 if(e.dead){c.scale(1,.3);}
 if(e.type==='walker'){ // grumpy bolt-bug
  const f=Math.sin(t*12+e.x)*3;c.fillStyle='#7a3fb5';c.beginPath();c.ellipse(0,-14,16,14,0,Math.PI,0);c.lineTo(16,-6);c.lineTo(-16,-6);c.fill();
  c.fillStyle='#2a1440';c.fillRect(-12+f,-6,8,6);c.fillRect(4-f,-6,8,6);
  c.fillStyle='#fff';c.beginPath();c.arc(-6,-16,4,0,7);c.arc(6,-16,4,0,7);c.fill();c.fillStyle='#000';c.fillRect(-7+e.vx/Math.abs(e.vx||1)*1.5,-17,3,4);c.fillRect(5+e.vx/Math.abs(e.vx||1)*1.5,-17,3,4);
  c.strokeStyle='#000';c.lineWidth=2;c.beginPath();c.moveTo(-11,-23);c.lineTo(-3,-20);c.moveTo(11,-23);c.lineTo(3,-20);c.stroke();}
 else if(e.type==='hopper'){ // spring slime
  const sq=e.onGround?1.2:.85;c.scale(sq,1/sq);c.fillStyle='#2fbf71';c.beginPath();c.ellipse(0,-12,15,12,0,0,7);c.fill();c.fillStyle='#ffffff55';c.beginPath();c.ellipse(-5,-17,5,3,0,0,7);c.fill();
  c.fillStyle='#000';c.fillRect(-6,-14,3,5);c.fillRect(4,-14,3,5);}
 else if(e.type==='flyer'){ // propeller drone
  c.fillStyle='#d94a4a';rr(c,-14,-22,28,16,6);c.fillStyle='#ffd447';c.fillRect(-4,-17,8,6);c.fillStyle='#000';c.fillRect(-2,-16,4,4);
  c.fillStyle='#ccc';const w=Math.abs(Math.sin(t*40))*14;c.fillRect(-w,-27,w*2,3);c.fillRect(-1,-27,2,6);}
 else if(e.type==='boss'){drawBoss(c,e,t);}
 c.restore();}
function drawBoss(c,e,t){const hurt=e.inv>0&&(t*20|0)%2;c.fillStyle=hurt?'#fff':'#4b4f6b';rr(c,-40,-70,80,62,12);
 c.fillStyle='#2a2d40';c.fillRect(-30,-8,22,8);c.fillRect(8,-8,22,8);c.fillStyle='#ff3b3b';c.beginPath();c.arc(-14,-48,8,0,7);c.arc(14,-48,8,0,7);c.fill();
 c.fillStyle='#000';c.fillRect(-16,-50,4,4);c.fillRect(12,-50,4,4);c.fillStyle='#ffd447';for(let i=0;i<6;i++)c.fillRect(-24+i*8,-28,6,8);
 c.fillStyle='#ffd447';c.beginPath();c.moveTo(-30,-70);c.lineTo(-20,-88);c.lineTo(-10,-70);c.moveTo(10,-70);c.lineTo(20,-88);c.lineTo(30,-70);c.fill();
 c.fillStyle='#f33';for(let i=0;i<e.hp;i++)c.fillRect(-20+i*14,-100,10,6);}
const TILE=32;
function drawTile(c,ch,x,y,t,theme){
 if(ch==='#'){c.fillStyle=theme.g1;c.fillRect(x,y,32,32);c.fillStyle=theme.g2;c.fillRect(x,y,32,6);c.fillStyle='#0002';c.fillRect(x+4,y+12,6,4);c.fillRect(x+18,y+22,8,4);}
 else if(ch==='='){c.fillStyle=theme.g1;c.fillRect(x,y,32,32);c.fillStyle='#0002';c.fillRect(x+4,y+12,6,4);c.fillRect(x+18,y+22,8,4);}
 else if(ch==='B'){c.fillStyle='#c0603a';c.fillRect(x,y,32,32);c.fillStyle='#7a3520';c.fillRect(x,y+15,32,2);c.fillRect(x+15,y,2,15);c.fillRect(x+7,y+17,2,15);c.fillRect(x+23,y+17,2,15);c.fillStyle='#e08a5f';c.fillRect(x,y,32,2);}
 else if(ch==='?'){const p=Math.sin(t*5)*.15+.85;c.fillStyle=`rgb(${255*p|0},${190*p|0},40)`;rr(c,x+1,y+1,30,30,5);c.fillStyle='#7a4a00';c.font='bold 22px monospace';c.textAlign='center';c.fillText('★',x+16,y+24);}
 else if(ch==='U'){c.fillStyle='#8a6a4a';rr(c,x+1,y+1,30,30,5);c.fillStyle='#5a4030';c.fillRect(x+6,y+6,4,4);c.fillRect(x+22,y+22,4,4);}
 else if(ch==='S'){c.fillStyle='#6b7a8f';c.fillRect(x,y,32,32);c.fillStyle='#8fa0b8';c.fillRect(x+2,y+2,28,4);c.fillStyle='#4a5566';c.fillRect(x+4,y+26,24,3);}}
function drawCoin(c,x,y,t){const w=Math.abs(Math.cos(t*5+x*.05))*9+1;c.fillStyle='#ffd447';c.beginPath();c.ellipse(x,y,w,11,0,0,7);c.fill();c.fillStyle='#fff6';c.fillRect(x-1,y-7,2,10);}
function drawRocket(c,x,y,t,launched){c.save();c.translate(x,y);c.fillStyle='#555';c.fillRect(-40,-8,80,8);c.fillStyle='#888';c.fillRect(-36,-150,6,142);
 c.fillStyle='#eee';c.beginPath();c.moveTo(0,-160);c.quadraticCurveTo(22,-120,18,-30);c.lineTo(-18,-30);c.quadraticCurveTo(-22,-120,0,-160);c.fill();
 c.fillStyle='#e2412f';c.beginPath();c.moveTo(-18,-50);c.lineTo(-30,-12);c.lineTo(-18,-30);c.fill();c.beginPath();c.moveTo(18,-50);c.lineTo(30,-12);c.lineTo(18,-30);c.fill();
 c.fillStyle='#7fd4ff';c.beginPath();c.arc(0,-100,8,0,7);c.fill();c.strokeStyle='#999';c.lineWidth=3;c.stroke();
 if(launched){c.fillStyle=['#ffd447','#ff8a2a'][(t*20|0)%2];c.beginPath();c.moveTo(-14,-30);c.lineTo(14,-30);c.lineTo(0,10+Math.random()*30);c.fill();}
 c.fillStyle='#ffd447';c.font='bold 12px sans-serif';c.textAlign='center';c.fillText('GOAL',0,-60);c.restore();}
function drawPower(c,p,t){const x=p.x+p.w/2,y=p.y+p.h/2;c.save();c.translate(x,y);
 if(p.kind==='shield'){c.fillStyle='#4dc3ff';c.beginPath();c.moveTo(0,-13);c.lineTo(12,-7);c.quadraticCurveTo(10,8,0,14);c.quadraticCurveTo(-10,8,-12,-7);c.fill();c.fillStyle='#fff';c.fillRect(-2,-7,4,12);c.fillRect(-6,-3,12,4);}
 if(p.kind==='jet'){c.fillStyle='#bbb';rr(c,-10,-12,8,22,3);rr(c,2,-12,8,22,3);c.fillStyle='#e2412f';c.fillRect(-10,-14,20,5);c.fillStyle='#ffd447';c.fillRect(-8,10,4,4+Math.sin(t*30)*3);c.fillRect(4,10,4,4+Math.cos(t*30)*3);}
 if(p.kind==='star'){c.rotate(t*3);c.fillStyle=`hsl(${t*300%360},100%,60%)`;c.beginPath();for(let i=0;i<10;i++){const r=i%2?6:14,a=i*Math.PI/5;c.lineTo(Math.sin(a)*r,-Math.cos(a)*r);}c.fill();}
 c.restore();}
