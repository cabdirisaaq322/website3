let cat='all',cache=null,CATS=[];
const $=id=>document.getElementById(id);
const fmtN=n=>n>=1e6?(n/1e6).toFixed(1)+'M':n>=1e3?(n/1e3).toFixed(1)+'K':n||0;
const stars=r=>{let s='';for(let i=1;i<=5;i++)s+=i<=Math.round(r)?'★':'☆';return '<span class="stars">'+s+'</span>'};
const DESC={action:'Top action, shooter & battle royale games.',social:'Messengers, chats & social apps.',tools:'Browsers, VPN, cleaners & utilities.',music:'Music players & streamers.',video:'Video players & editors in 4K.',photography:'Cameras & photo editors.',productivity:'Notes, planners & office.',lifestyle:'Fitness, food & everyday apps.'};
const card=a=>{const ic=a.icon?'<img loading="lazy" decoding="async" src="'+a.icon+'" alt="" width="58" height="58">':'<div class="fakeicon">'+(a.name||'?')[0]+'</div>';
return '<a class="card liquid" data-lg="card" href="/app/'+a.slug+'"><span class="glass-content card-in">'+ic+'<span class="cbody"><b>'+a.name+'</b><small>'+(a.developer||'')+'</small><span class="rline">'+stars(a.rating)+' <small>'+a.rating+' • '+fmtN(a.downloads)+' ↓</small></span><small>v'+a.version+'</small></span></span></a>'};
function showUpload(){}
let SIDX=0,STIMER=null;
async function loadHero(){
try{
const h=await fetch('/api/hero').then(r=>r.json());
if(!h||!h.length) return;
$('slides').innerHTML=h.slice(0,3).map((s,i)=>{
const pic=s.img?'<img class="simg" src="'+s.img+'" alt="">':'<div class="sph">📱</div>';
return '<div class="slide'+(i===0?' on':'')+'"><div class="stxt"><h1>'+(s.title||'')+'</h1><p>'+(s.sub||'')+'</p><a class="sbtn" data-lg="btn" href="'+(s.link||'/')+'">'+(s.btn||'Download')+'</a></div>'+pic+'</div>';
}).join('');
$('dots').innerHTML=h.slice(0,3).map((_,i)=>'<button class="dot'+(i===0?' on':'')+'" onclick="slideGo('+i+')"></button>').join('');
SIDX=0;startSlide();
const sl=$('hero');
sl.onmouseenter=stopSlide;sl.onmouseleave=startSlide;
let tx=0;sl.ontouchstart=e=>tx=e.touches[0].clientX;sl.ontouchend=e=>{const dx=e.changedTouches[0].clientX-tx;if(Math.abs(dx)>40)slideMove(dx<0?1:-1)};
}catch(e){}
}
function slideShow(i){const els=document.querySelectorAll('.slide');if(!els.length)return;SIDX=(i+els.length)%els.length;els.forEach((el,k)=>el.classList.toggle('on',k===SIDX));document.querySelectorAll('.dot').forEach((d,k)=>d.classList.toggle('on',k===SIDX));}
function slideGo(i){slideShow(i);startSlide();}
function slideMove(d){slideShow(SIDX+d);startSlide();}
function startSlide(){stopSlide();STIMER=setInterval(()=>slideShow(SIDX+1),5000);}
function stopSlide(){if(STIMER)clearInterval(STIMER);STIMER=null;}
let homeCache=null,homeAt=0;
async function getHome(){if(homeCache&&Date.now()-homeAt<60000)return homeCache;homeCache=await fetch('/api/home').then(r=>r.json());homeAt=Date.now();return homeCache;}
function lgRefresh(){try{window.__lgRefresh&&window.__lgRefresh()}catch(e){}}
async function init(){
try{
const m=location.pathname.match(/\/category\/([\w-]+)/);const q=new URLSearchParams(location.search).get('cat');cat=(m&&m[1])||q||'all';
$('home').innerHTML='<div class="hrow"><div class="skel"></div><div class="skel"></div><div class="skel"></div></div>';
const data=await getHome();
loadHero();
let cats=[];try{cats=await fetch('/api/categories').then(r=>r.json())}catch(e){}
CATS=cats;cache=data;
$('cats').innerHTML='<button class="chip liquid" data-lg="chip" data-c="all" onclick="setCat(\'all\')">🌐 All</button>'+cats.map(c=>'<button class="chip liquid" data-lg="chip" data-c="'+c.slug+'" onclick="setCat(\''+c.slug+'\')">'+c.icon+' '+c.name+'</button>').join('');
applyCat();await browse();lgRefresh();
}catch(e){ const d=$('apps'); if(d) d.innerHTML='<p>Failed to load. <a href="/">Retry</a></p>'; }
}
function applyCat(){
document.querySelectorAll('.chip').forEach(b=>b.classList.toggle('on',b.dataset.c===cat));
const isAll=cat==='all';
$('hero').hidden=!isAll;$('cathead').hidden=isAll;$('home').hidden=!isAll;
$('navHome').classList.toggle('on',isAll);
if(!isAll){const c=CATS.find(x=>x.slug===cat)||{name:cat,icon:'📦'};const shelf=cache.shelves.find(x=>x.slug===cat);
$('catIc').textContent=c.icon;$('catName').textContent=c.name;$('catDesc').textContent=DESC[cat]||'';$('catCount').textContent=(shelf?shelf.items.length:0)+' apps';
$('browseTitle').textContent=c.icon+' '+c.name;
if(shelf&&shelf.items.length)$('apps').innerHTML=shelf.items.map(card).join('');
history.replaceState(null,'',cat==='all'?'/':'/category/'+cat);
}else{$('browseTitle').textContent='Browse all';history.replaceState(null,'','/');renderHome();}
window.scrollTo(0,0);
}
function renderHome(){const h=cache;let html='<h2 class="sect">🔥 Trending Now <small>'+h.trending.length+' hot</small></h2><div class="hrow">'+h.trending.slice(0,8).map(card).join('')+'</div>';
h.shelves.forEach(s=>{if(!s.items.length)return;html+='<h2 class="sect">'+s.icon+' '+s.name+' <small>'+s.items.length+'</small> <a href="/category/'+s.slug+'">View all →</a></h2><div class="hrow">'+s.items.slice(0,8).map(card).join('')+'</div>'});
$('home').innerHTML=html;}
function setCat(c){cat=c;applyCat();browse().then(lgRefresh);}
async function browse(){const s=$('sort').value,q=$('q').value.trim().toLowerCase();
if(cat!=='all'&&cache&&!q){const items=(cache.shelves.find(x=>x.slug===cat)||{items:[]}).items;
$('cnt').textContent=items.length+' apps';$('apps').innerHTML=items.map(card).join('')||'<p>No apps in this category yet.</p>';return;}
const d=await fetch('/api/apps?category='+cat+'&sort='+s+'&q='+encodeURIComponent(q)+'&limit=24').then(r=>r.json());
$('cnt').textContent=d.total+' results';$('apps').innerHTML=d.items.map(card).join('')||'<p>No apps.</p>';}
let t;function doSearch(now){clearTimeout(t);t=setTimeout(function(){browse().then(lgRefresh)},now?0:250)}
const qi=$('q');if(qi)qi.addEventListener('input',()=>doSearch(false));
init();
