const LH=17,GROUND=14;
const THEMES=[
 {name:'Green Launch Hills',sky:['#6ec6ff','#c9f0ff'],g1:'#8b5a2b',g2:'#4cc35a',hill:'#3fa34d',hill2:'#2e7d3a',stars:false},
 {name:'Sunset Canyon',sky:['#ff8a5c','#ffd38a'],g1:'#a0522d',g2:'#e8a33d',hill:'#c0603a',hill2:'#8a3f2a',stars:false},
 {name:'Neon Night City',sky:['#1b1440','#4b2a8a'],g1:'#3a3a5a',g2:'#7f5af0',hill:'#2a2550',hill2:'#191538',stars:true},
 {name:'Orbital Boss Station',sky:['#05040f','#1b1440'],g1:'#4a5566',g2:'#9aa8bd',hill:'#151230',hill2:'#0c0a20',stars:true}];
function rng(s){return()=>(s=(s*1664525+1013904223)>>>0)/4294967296;}
function buildLevel(n){
 const R=rng(1234+n*777),boss=n===3,W=boss?64:150+n*40,th=THEMES[n];
 const g=[];for(let y=0;y<LH;y++)g.push(new Array(W).fill(' '));
 const L={n,w:W,g,coins:[],enemies:[],movers:[],items:{},theme:th,boss};
 const put=(x,y,c)=>{if(x>=0&&x<W&&y>=0&&y<LH)g[y][x]=c};
 const ground=(a,b,top=GROUND)=>{for(let x=a;x<b;x++)for(let y=top;y<LH;y++)put(x,y,y===top?'#':'=')};
 const coin=(x,y)=>L.coins.push({x:x*32+16,y:y*32+16,taken:false});
 const enemy=(type,x,y)=>L.enemies.push({type,x:x*32,y:y*32-(type==='flyer'?0:28),w:28,h:28,vx:-(1+n*.25)*(type==='flyer'?0:1),vy:0,y0:y*32,dead:0,t:R()*6});
 if(boss){ground(0,W);for(let y=4;y<GROUND;y++){put(0,y,'S');put(W-1,y,'S');}
  for(let x=0;x<W;x++)put(x,3,'S');
  [[10,10],[22,9],[40,9],[52,10]].forEach(([x,y])=>{for(let i=0;i<4;i++)put(x+i,y,'S')});
  put(16,10,'?');L.items['16,10']='shield';put(47,10,'?');L.items['47,10']='star';
  for(let i=0;i<5;i++)coin(23+i*.0+i,8);
  L.enemies.push({type:'boss',x:44*32,y:GROUND*32-100,w:80,h:100,vx:-2,vy:0,hp:3,inv:0,dead:0,t:0,shoot:2});
  L.goal={x:(W-6)*32,y:GROUND*32,hidden:true};return L;}
 let x=0;ground(0,14);x=14;
 // intro blocks
 put(8,10,'?');L.items['8,10']='shield';coin(4,11);coin(5,11);
 while(x<W-24){const seg=R();
  if(seg<.22){ // pit
   const pw=2+Math.floor(R()*(1.5+n));if(pw>=4&&R()<.7+n*.1){L.movers.push({x:x*32+8,y:(GROUND-1)*32,w:80,h:14,x0:x*32+8,y0:(GROUND-1)*32,rx:(pw-2)*32,ry:0,sp:.8+n*.3,ph:R()*6});}
   for(let i=0;i<pw;i++)coin(x+i,GROUND-4);x+=pw;const len=5+Math.floor(R()*6);ground(x,x+len);x+=len;}
  else if(seg<.45){ // block row
   const len=10;ground(x,x+len);const by=GROUND-4,bx=x+2;
   for(let i=0;i<5;i++){const q=R()<.4;put(bx+i,by,q?'?':'B');if(q)L.items[(bx+i)+','+by]=R()<.15?'jet':R()<.12?'star':R()<.3?'shield':'coin';}
   if(R()<.5){for(let i=1;i<4;i++)put(bx+i,by-4,'B');coin(bx+2,by-5);}
   enemy(R()<.5?'walker':'hopper',x+8,GROUND);x+=len;}
  else if(seg<.6){ // stairs
   const h=3+Math.floor(R()*2);ground(x,x+h*2+4);for(let i=0;i<h;i++)for(let j=0;j<=i;j++)put(x+i,GROUND-1-j,'U');
   for(let i=0;i<h;i++)for(let j=0;j<h-i;j++)put(x+h+2+i,GROUND-1-j,'U');coin(x+h+1,GROUND-h-2);x+=h*2+4;}
  else if(seg<.75){ // floating platforms over pit
   const len=12;ground(x,x+2);for(let i=0;i<3;i++){const px=x+3+i*3,py=GROUND-3-(i%2)*2;put(px,py,'B');put(px+1,py,'B');coin(px,py-1);coin(px+1,py-1);}
   if(n>0)enemy('flyer',x+6,GROUND-6);x+=len;ground(x-1,x+3);x+=3;}
  else if(seg<.88){ // vertical mover
   ground(x,x+2);L.movers.push({x:(x+2)*32,y:(GROUND-2)*32,w:72,h:14,x0:(x+2)*32,y0:(GROUND-5)*32,rx:0,ry:96,sp:.9,ph:R()*6});
   for(let i=0;i<3;i++)put(x+5+i,GROUND-7,'B');coin(x+6,GROUND-8);x+=8;ground(x,x+5);x+=5;}
  else{ // enemy alley
   const len=12;ground(x,x+len);const k=1+n;for(let i=0;i<k;i++)enemy(['walker','hopper','walker'][i%3],x+4+i*3,GROUND);
   for(let i=0;i<4;i++)coin(x+3+i*2,GROUND-3);x+=len;}
 }
 ground(x,W);L.goal={x:(W-10)*32,y:GROUND*32};
 for(let i=0;i<4;i++)for(let j=0;j<=i;j++)put(W-18+i,GROUND-1-j,'U');
 return L;}
