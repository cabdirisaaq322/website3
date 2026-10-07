const fs = require('fs');
const path = require('path');
const { publicApp, getDB, save } = require('./base');

function registerPublic(app, nanoid){
  app.get('/api/categories', (req,res)=>{ res.set('Cache-Control','public, max-age=120'); res.json(getDB().categories); });

  app.get('/api/apps', (req,res)=>{
    const db=getDB();
    let list=[...db.apps];
    const { q, category, sort='downloads', page=1, limit=24, featured, trending } = req.query;
    if(q){ const s=q.toLowerCase(); list=list.filter(a=>(a.name+' '+a.developer+' '+(a.description||'')+' '+((a.tags||[]).join(' '))).toLowerCase().includes(s)); }
    if(category && category!=='all') list=list.filter(a=>a.category===category);
    if(featured==='1') list=list.filter(a=>a.featured);
    if(trending==='1') list=list.filter(a=>a.trending);
    const sorts={ downloads:(a,b)=>b.downloads-a.downloads, rating:(a,b)=>b.rating-a.rating, updated:(a,b)=>b.updatedAt-a.updatedAt, name:(a,b)=>a.name.localeCompare(b.name) };
    list.sort(sorts[sort]||sorts.downloads);
    const p=Math.max(1, parseInt(page,10)||1), l=Math.min(100, Math.max(1, parseInt(limit,10)||24));
    const total=list.length;
    res.json({ items:list.slice((p-1)*l,p*l).map(publicApp), total, page:p, pages:Math.ceil(total/l) });
  });

  app.get('/api/apps/:slug', (req,res)=>{
    const db=getDB();
    const a=db.apps.find(x=>x.slug===req.params.slug||x.id===req.params.slug);
    if(!a) return res.status(404).json({error:'Not found'});
    a.views=(a.views||0)+1; save(db);
    const related=db.apps.filter(x=>x.id!==a.id&&x.category===a.category).slice(0,6).map(publicApp);
    const { fmtSize } = require('./base');
    res.json({ ...a, sizeText:fmtSize(a.size), related });
  });

  app.get('/api/apps/:slug/versions', (req,res)=>{
    const db=getDB();
    const a=db.apps.find(x=>x.slug===req.params.slug||x.id===req.params.slug);
    if(!a) return res.status(404).json({error:'Not found'});
    res.json(a.versions||[]);
  });

  app.get('/api/download/:slug', async (req,res)=>{
    const db=getDB();
    const a=db.apps.find(x=>x.slug===req.params.slug||x.id===req.params.slug);
    if(!a) return res.status(404).json({error:'Not found'});
    a.downloads=(a.downloads||0)+1; save(db);
    // 1) external direct link (Google Drive / MediaFire / any URL pasted in admin)
    if(a.externalUrl) return res.redirect(a.externalUrl);
    if(a.fileUrl){
      // 2) cloud file (R2/S3) -> signed redirect
      if(a.fileUrl.startsWith('http')||a.fileUrl.startsWith('s3://')){
        try { const { Storage } = require('./base'); const u = await Storage.downloadUrl(a.fileUrl); return res.redirect(u); }
        catch(e){ return res.redirect(a.fileUrl); }
      }
      // 3) local disk file
      const rel=a.fileUrl.startsWith('/')?a.fileUrl.slice(1):a.fileUrl;
      const abs=path.join(__dirname, rel);
      if(fs.existsSync(abs)) return res.download(abs, `${a.slug}-v${a.version}${path.extname(abs)||'.apk'}`);
    }
    res.status(404).send(`No file uploaded yet for ${a.name} v${a.version}. Admin: upload APK at /admin.`);
  });

  app.get('/api/apps/:slug/reviews', (req,res)=>{
    const db=getDB();
    res.json(db.reviews.filter(r=>r.appSlug===req.params.slug).slice(-50).reverse());
  });

  // HERO SLIDER (3 slides, editable from admin, always fresh)
  app.get('/api/hero', (req,res)=>{
    const db=getDB();
    res.set('Cache-Control','public, max-age=10');
    res.json(db.hero||[]);
  });

  app.post('/api/apps/:slug/reviews', (req,res)=>{
    const db=getDB();
    const { name='Guest', rating=5, text='' } = req.body||{};
    if(!String(text).trim()) return res.status(400).json({error:'Write something'});
    const rev={ id:nanoid(), appSlug:req.params.slug, name:String(name).slice(0,30), rating:Math.max(1,Math.min(5,parseInt(rating)||5)), text:String(text).slice(0,1000), createdAt:Date.now() };
    db.reviews.push(rev);
    const a=db.apps.find(x=>x.slug===req.params.slug);
    if(a){ const all=db.reviews.filter(r=>r.appSlug===a.slug); if(all.length){ a.rating=+(all.reduce((s,r)=>s+r.rating,0)/all.length).toFixed(1); a.ratingCount=all.length; } save(db); }
    else save(db);
    res.json(rev);
  });
  // ONE-CALL home: cached 30s server-side (no disk read per visitor)
  let homeCache=null,homeAt=0;
  app.get('/api/home', (req,res)=>{
    if(homeCache&&Date.now()-homeAt<30000){res.set('Cache-Control','public, max-age=30');return res.json(homeCache);}
    const db=getDB();
    const trending=db.apps.filter(a=>a.trending).slice(0,10).map(publicApp);
    const shelves=db.categories.map(c=>({
      slug:c.slug, name:c.name, icon:c.icon,
      items:db.apps.filter(a=>a.category===c.slug).sort((a,b)=>b.downloads-a.downloads).slice(0,10).map(publicApp)
    }));
    homeCache={ trending, shelves, total:db.apps.length };homeAt=Date.now();
    res.set('Cache-Control','public, max-age=30');res.json(homeCache);
  });
}
module.exports = registerPublic;
