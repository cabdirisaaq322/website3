let KEY=localStorage.getItem('adminkey')||'';key.value=KEY;
async function login(){KEY=key.value;localStorage.setItem('adminkey',KEY);
const r=await fetch('/api/admin/overview',{headers:{'x-admin-key':KEY}}).then(r=>r.json());
stat.textContent=r.error?'❌ wrong key':'✅ '+r.totalApps+' apps • '+r.totalDownloads+' downloads';
if(!r.error){ov.textContent='('+r.totalApps+')';siteName.value=r.siteName}list()}
f.onsubmit=async e=>{e.preventDefault();msg.textContent='Uploading...';
const r=await fetch('/api/admin/apps',{method:'POST',headers:{'x-admin-key':KEY},body:new FormData(f)}).then(r=>r.json());
msg.textContent=r.error?'❌ '+r.error:'✅ '+r.name;if(!r.error){f.reset();list()}};
async function list(){const d=await fetch('/api/apps?limit=100&sort=updated').then(r=>r.json());
document.getElementById('list').innerHTML=d.items.map(a=>'<div class="approw"><div style="flex:1"><b>'+a.name+'</b><br><small>'+a.slug+' • v'+a.version+'</small></div><a href="/app/'+a.slug+'" target="_blank">View</a> <button onclick="delApp(\''+a.id+'\')">Del</button></div>').join('')}
async function delApp(id){if(!confirm('Delete?'))return;await fetch('/api/admin/apps/'+id,{method:'DELETE',headers:{'x-admin-key':KEY}});list()}
async function saveSet(){const r=await fetch('/api/admin/settings',{method:'POST',headers:{'Content-Type':'application/json','x-admin-key':KEY},body:JSON.stringify({siteName:siteName.value,adminKey:newKey.value||undefined})}).then(r=>r.json());alert(JSON.stringify(r))}
async function loadHeroAdmin(){
const h=await fetch('/api/admin/hero',{headers:{'x-admin-key':KEY}}).then(r=>r.json());
document.getElementById('heroList').innerHTML=h.map((s,i)=>'<div style="border:1px solid var(--line);border-radius:12px;padding:10px;margin:8px 0"><b>Slide '+(i+1)+'</b> '+(s.img?'<img src="'+s.img+'" style="width:60px;height:60px;object-fit:cover;border-radius:10px">':'<small>no image</small>')+'<br><input id="ht'+i+'" value="'+((s.title||'').replace(/"/g,'&quot;'))+'"><input id="hs'+i+'" value="'+((s.sub||'').replace(/"/g,'&quot;'))+'"><input id="hb'+i+'" value="'+((s.btn||'').replace(/"/g,'&quot;'))+'"><input id="hl'+i+'" value="'+((s.link||'').replace(/"/g,'&quot;'))+'"><input id="hu'+i+'" value="'+((!s.img||s.img.startsWith('/uploads'))?'':s.img)+'" placeholder="Image URL or upload"><input type="file" id="hf'+i+'" accept="image/*"><button class="primary" onclick="saveHero('+i+')">Save</button></div>').join('');
}
async function saveHero(i){
const fd=new FormData();fd.append('index',i);
fd.append('title',document.getElementById('ht'+i).value);fd.append('sub',document.getElementById('hs'+i).value);fd.append('btn',document.getElementById('hb'+i).value);fd.append('link',document.getElementById('hl'+i).value);fd.append('imgUrl',document.getElementById('hu'+i).value);
const f=document.getElementById('hf'+i).files[0];if(f)fd.append('img',f);
await fetch('/api/admin/hero',{method:'POST',headers:{'x-admin-key':KEY},body:fd});alert('Saved');loadHeroAdmin();
}
login();loadHeroAdmin();
