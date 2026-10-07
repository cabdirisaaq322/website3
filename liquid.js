// LiquidGlass WebGL engine (like liquid-glass.ybouane.com) + instant CSS fallback.
// панели получают data-lg="bar|hero|card|chip|btn" и data-radius.
// Если WebGL/CDN недоступен — остаётся красивый CSS glass, сайт работает.
(function(){
var CSS_OK = false;
function cssFallback(){
  if(CSS_OK) return; CSS_OK = true;
  document.querySelectorAll('.liquid').forEach(function(el){
    if(!el.querySelector('.lg-spec')){ var s=document.createElement('i'); s.className='lg-spec'; el.appendChild(s); }
  });
}
function tryWebGL(){
  var s=document.createElement('script');
  s.src='https://cdn.jsdelivr.net/npm/@ybouane/liquidglass/dist/index.js';
  s.onload=function(){
    try{
      if(!window.LiquidGlass) return cssFallback();
      var root=document.getElementById('root');
      var els=document.querySelectorAll('.liquid');
      var cfg={ bar:{blurAmount:.35,refraction:.8,edgeHighlight:.12,specular:.4,fresnel:1,cornerRadius:28,zRadius:30,saturation:.15,shadowOpacity:.25},
        hero:{blurAmount:.3,refraction:.7,edgeHighlight:.1,specular:.5,fresnel:1,cornerRadius:30,zRadius:36,saturation:.2,shadowOpacity:.3},
        card:{blurAmount:.28,refraction:.65,edgeHighlight:.09,specular:.35,fresnel:1,cornerRadius:22,zRadius:24,saturation:.12,shadowOpacity:.22},
        chip:{blurAmount:.3,refraction:.75,edgeHighlight:.1,specular:.3,fresnel:1,cornerRadius:20,zRadius:20,saturation:.1,shadowOpacity:.18},
        btn:{blurAmount:.2,refraction:.6,edgeHighlight:.12,specular:.5,cornerRadius:16,zRadius:18,button:true,shadowOpacity:.25} };
      els.forEach(function(el){ var k=el.getAttribute('data-lg')||'card'; el.setAttribute('data-config',JSON.stringify(cfg[k]||cfg.card)); });
      window.LiquidGlass.init({root:root,glassElements:els}).then(function(inst){
        window.__lg=inst;
        window.__lgRefresh=function(){ try{inst.markChanged&&inst.markChanged()}catch(e){} };
        cssFallback();
      }).catch(cssFallback);
    }catch(e){ cssFallback(); }
  };
  s.onerror=cssFallback;
  document.head.appendChild(s);
  setTimeout(cssFallback,2500);
}
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',tryWebGL); else tryWebGL();
})();
