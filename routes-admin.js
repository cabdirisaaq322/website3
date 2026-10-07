const { adminAuth, slugify, Storage, getDB, save } = require('./base');

function registerAdmin(app, upload){
  app.get('/api/admin/overview', adminAuth, (req,res)=>{
    const db=getDB();
    res.json({
      totalApps:db.apps.length,
      totalDownloads:db.apps.reduce((s,a)=>s+(a.downloads||0),0),
      totalViews:db.apps.reduce((s,a)=>s+(a.views||0),0),
      totalReviews:db.reviews.length,
      siteName:db.settings.siteName
    });
  });

  const saveOne = async (f, prefix) => {
    if (!f) return null;
    if (f.buffer) { const r = await Storage.saveBuffer(f, prefix); return r ? r.url : null; }
    return Storage.saveFile(f);
  };

  app.post('/api/admin/apps', adminAuth, upload.fields([{name:'apk',maxCount:1},{name:'icon',maxCount:1},{name:'screenshots',maxCount:6}]), async (req,res)=>{
    const db=getDB(); const b=req.body||{}; const files=req.files||{};
    const slugBase=slugify(b.name||'app');
    let slug=slugBase, n=2; while(db.apps.find(a=>a.slug===slug)) slug=slugBase+'-'+(n++);
    const apk=(files.apk||[])[0], icon=(files.icon||[])[0], shots=(files.screenshots||[]);
    const shotsOut=[];
    for (const f of shots) shotsOut.push(await saveOne(f, 'shots'));
    if(b.screenshotUrls) String(b.screenshotUrls).split('\n').map(s=>s.trim()).filter(Boolean).forEach(x=>shotsOut.push(x));
    const app={ id:Date.now().toString(36)+Math.floor(Math.random()*999),
      name:b.name||'Untitled', slug, developer:b.developer||'Unknown',
      category:b.category||'tools', version:b.version||'1.0.0', os:b.os||'Android 5.0+',
      license:b.license||'Free', size:apk?apk.size:(parseInt(b.size)||0),
      downloads:parseInt(b.downloads)||0, views:0, rating:parseFloat(b.rating)||4.0, ratingCount:parseInt(b.ratingCount)||0,
      featured:(b.featured==='1'||b.featured==='on'), trending:(b.trending==='1'||b.trending==='on'), verified:true,
      description:b.description||'', changelog:b.changelog||'',
      tags:String(b.tags||'').split(',').map(s=>s.trim()).filter(Boolean),
      icon:icon?await saveOne(icon,'icons'):(b.iconUrl||null),
      screenshots:shotsOut, fileUrl:apk?await saveOne(apk,'apk'):(b.fileUrl||null),
      updatedAt:Date.now(), createdAt:Date.now(),
      versions:[{version:b.version||'1.0.0', changelog:b.changelog||'', size:apk?apk.size:0, updatedAt:Date.now()}]
    };
    db.apps.unshift(app); save(db); res.json(app);
  });

  app.put('/api/admin/apps/:id', adminAuth, upload.fields([{name:'apk',maxCount:1},{name:'icon',maxCount:1},{name:'screenshots',maxCount:6}]), async (req,res)=>{
    const db=getDB();
    const a=db.apps.find(x=>x.id===req.params.id);
    if(!a) return res.status(404).json({error:'Not found'});
    const b=req.body||{}, files=req.files||{};
    ['name','developer','category','version','os','license','description','changelog','fileUrl','externalUrl'].forEach(k=>{ if(b[k]!==undefined) a[k]=b[k]; });
    if(b.tags!==undefined) a.tags=String(b.tags).split(',').map(s=>s.trim()).filter(Boolean);
    if(b.downloads!==undefined) a.downloads=parseInt(b.downloads)||0;
    if(b.rating!==undefined) a.rating=parseFloat(b.rating)||a.rating;
    if(b.featured!==undefined) a.featured=(b.featured==='1'||b.featured==='on'||b.featured===true);
    if(b.trending!==undefined) a.trending=(b.trending==='1'||b.trending==='on'||b.trending===true);
    if((files.apk||[])[0]){ const f=files.apk[0]; a.fileUrl=await saveOne(f,'apk'); a.size=f.size; a.versions=a.versions||[]; a.versions.unshift({version:a.version, changelog:a.changelog||'', size:f.size, updatedAt:Date.now()}); }
    if((files.icon||[])[0]) a.icon=Storage.saveFile(files.icon[0]);
    if((files.screenshots||[]).length){ const out=[]; for(const f of files.screenshots) out.push(await saveOne(f,'shots')); a.screenshots=[...(a.screenshots||[]), ...out]; }
    a.updatedAt=Date.now(); save(db); res.json(a);
  });

  app.delete('/api/admin/apps/:id', adminAuth, (req,res)=>{
    const db=getDB();
    const i=db.apps.findIndex(x=>x.id===req.params.id);
    if(i<0) return res.status(404).json({error:'Not found'});
    const [gone]=db.apps.splice(i,1); save(db); res.json({ok:true, deleted:gone.slug});
  });

  app.post('/api/admin/settings', adminAuth, (req,res)=>{
    const db=getDB();
    if(req.body.siteName) db.settings.siteName=req.body.siteName;
    if(req.body.adminKey) db.settings.adminKey=String(req.body.adminKey).slice(0,200);
    save(db); res.json({ siteName: db.settings.siteName });
  });

  // HERO: get + update one of 3 slides (title/sub/btn/link + image upload or URL)
  app.get('/api/admin/hero', adminAuth, (req,res)=>{ res.json(getDB().hero||[]); });

  app.post('/api/admin/hero', adminAuth, upload.single('img'), async (req,res)=>{
    const db=getDB();
    db.hero=db.hero||[{},{},{}];
    while(db.hero.length<3) db.hero.push({});
    const i=Math.max(0,Math.min(2,parseInt(req.body.index)||0));
    const s=db.hero[i]||{};
    ['title','sub','btn','link'].forEach(k=>{ if(req.body[k]!==undefined) s[k]=String(req.body[k]).slice(0,200); });
    if(req.file) s.img = await saveOne(req.file, 'hero');
    else if(req.body.imgUrl!==undefined) s.img=req.body.imgUrl||null;
    if(req.body.clearImg==='1') s.img=null;
    db.hero[i]=s; save(db); res.json(db.hero);
  });
}
module.exports = registerAdmin;
