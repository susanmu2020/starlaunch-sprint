const Sound=(()=>{let ac=null,muted=localStorage.getItem('ss_muted')==='1',musicOn=false,mt=null,step=0,master;
function init(){if(ac)return;try{ac=new (window.AudioContext||window.webkitAudioContext)();master=ac.createGain();master.gain.value=muted?0:0.5;master.connect(ac.destination);}catch(e){}}
function tone(f,d,type='square',v=.15,slide=0,t0=0){if(!ac)return;const t=ac.currentTime+t0,o=ac.createOscillator(),g=ac.createGain();o.type=type;o.frequency.setValueAtTime(f,t);if(slide)o.frequency.exponentialRampToValueAtTime(Math.max(30,f+slide),t+d);g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.001,t+d);o.connect(g);g.connect(master);o.start(t);o.stop(t+d+.02);}
const sfx={jump:()=>tone(330,.18,'square',.12,500),coin:()=>{tone(988,.07);tone(1319,.25,'square',.12,0,.07)},stomp:()=>tone(220,.15,'triangle',.3,-150),
bump:()=>tone(140,.1,'square',.15),power:()=>[523,659,784,1047,1319].forEach((f,i)=>tone(f,.1,'square',.1,0,i*.07)),hurt:()=>tone(400,.4,'sawtooth',.15,-300),
die:()=>[494,415,349,262,196].forEach((f,i)=>tone(f,.18,'square',.12,0,i*.14)),win:()=>[523,659,784,1047,784,1047,1319].forEach((f,i)=>tone(f,.16,'square',.12,0,i*.11)),
jet:()=>tone(90+Math.random()*40,.06,'sawtooth',.05),boss:()=>tone(110,.3,'sawtooth',.2,-50),brick:()=>tone(180,.2,'noise'===0?'':'triangle',.2,-120)};
const mel=[523,0,659,784,0,659,523,0,587,0,698,880,0,698,587,0,523,659,784,1047,0,784,659,0,494,587,698,587,494,0,392,0];
const bass=[131,131,196,196,175,175,147,147];
function tick(){if(!ac||!musicOn)return;const n=mel[step%32];if(n)tone(n,.13,'square',.045);if(step%4===0)tone(bass[(step/4|0)%8],.3,'triangle',.12);step++;}
return{init,sfx:new Proxy(sfx,{get:(o,k)=>()=>{try{o[k]&&o[k]()}catch(e){}}}),
music(on){musicOn=on;if(on&&!mt)mt=setInterval(tick,150);if(!on&&mt){clearInterval(mt);mt=null}},
toggle(){muted=!muted;localStorage.setItem('ss_muted',muted?'1':'0');if(master)master.gain.value=muted?0:.5;return muted},get muted(){return muted}};})();
