console.log('moon loving started✨')
/* ================= Radar Canvas Config ================= */
const BLIP_COUNT=25
const SWEEP_SPEED=0.015
const SWEEP_HALF_WIDTH=Math.PI/42
const FADE_IN_SPEED=0.15
const FADE_OUT_SPEED=0.025
const MAX_BLIP_RADIUS_RATIO=0.95
const ENABLE_JITTER=!1
const JITTER_R=0.12
const JITTER_THETA=0.0004
const ENABLE_TRAIL=!0
const TRAIL_FADE_ALPHA=0.08
const BOUNCE_MODE=!1
const BLIP_COLORS=['#00ff62','#ffe600','#ff1c41']
const ENABLE_BLIP_DECAY_COLOR=!0
const BLIP_DECAY_MS=2250
const BLIP_COLOR_STAGES=[{t:0,c:[0,255,195]},{t:.35,c:[0,255,98]},{t:.6,c:[255,230,0]},{t:.85,c:[255,28,65]},{t:1,c:[0,120,90]}]
function lerp(a,b,t){return a+(b-a)*t}
function mixHex(a,b,t){return'#'+[0,1,2].map(i=>Math.round(lerp(a[i],b[i],t)).toString(16).padStart(2,'0')).join('')}
function decayColor(r){if(r<=0)return'#00ffc3';if(r>=1)return'#00785a';for(let i=0;i<BLIP_COLOR_STAGES.length-1;i++){const A=BLIP_COLOR_STAGES[i],B=BLIP_COLOR_STAGES[i+1];if(r>=A.t&&r<=B.t){const lt=(r-A.t)/(B.t-A.t);return mixHex(A.c,B.c,lt)}}return'#00ffc3'}
const canvas=document.getElementById('radarCanvas')
const ctx=canvas.getContext('2d')
let w,h,centerX,centerY,radius
let sweepAngle=-Math.PI/2
let sweepDir=1
let frameCount=0
let trailCanvas,trailCtx
function resizeCanvas(){w=canvas.width=canvas.offsetWidth;h=canvas.height=canvas.offsetHeight;centerX=0;centerY=h/2;radius=Math.min(w,h);if(ENABLE_TRAIL){trailCanvas=document.createElement('canvas');trailCanvas.width=w;trailCanvas.height=h;trailCtx=trailCanvas.getContext('2d');trailCtx.clearRect(0,0,w,h)}}
window.addEventListener('resize',resizeCanvas);resizeCanvas()
function randomColor(){return BLIP_COLORS[Math.floor(Math.random()*BLIP_COLORS.length)]}
function createBlip(){const theta=-Math.PI/2+Math.random()*Math.PI;const r=Math.sqrt(Math.random())*radius*MAX_BLIP_RADIUS_RATIO;return{r,theta,alpha:0,sizeBoost:0,lastHit:-9999,color:randomColor(),created:performance.now()}}
let blips=Array.from({length:BLIP_COUNT},createBlip)
function angleVisible(a){return a>=-Math.PI/2&&a<=Math.PI/2}
function normalizeAngle(a){a%=2*Math.PI;if(a>Math.PI)a-=2*Math.PI;if(a<-Math.PI)a+=2*Math.PI;return a}
function hexToRgba(hex,a=1){const h=hex.replace('#','');const bigint=parseInt(h,16);const r=(bigint>>16)&255;const g=(bigint>>8)&255;const b=bigint&255;return`rgba(${r},${g},${b},${a})`}
function updateBlips(){const current=normalizeAngle(sweepAngle);const visible=angleVisible(current);const now=performance.now();for(const blip of blips){const diff=Math.abs(blip.theta-current);if(visible&&diff<=SWEEP_HALF_WIDTH){blip.alpha=Math.min(1,blip.alpha+FADE_IN_SPEED);blip.sizeBoost=1;blip.lastHit=frameCount}else{blip.alpha=Math.max(0,blip.alpha-FADE_OUT_SPEED);blip.sizeBoost*=0.9}if(ENABLE_JITTER){blip.r+=(Math.random()-0.5)*JITTER_R;blip.theta+=(Math.random()-0.5)*JITTER_THETA;blip.r=Math.max(0,Math.min(blip.r,radius*MAX_BLIP_RADIUS_RATIO));if(blip.theta<-Math.PI/2)blip.theta=-Math.PI/2;if(blip.theta>Math.PI/2)blip.theta=Math.PI/2}if(ENABLE_BLIP_DECAY_COLOR&&blip.alpha<=0&&now-blip.created>BLIP_DECAY_MS){Object.assign(blip,createBlip())}}}
function drawBackground(mouseXRatio=0.5,mouseYRatio=0.5){const glowX=centerX+(mouseXRatio-0.5)*380;const glowY=centerY+(mouseYRatio-0.5)*380;const gradient=ctx.createRadialGradient(glowX,glowY,0,centerX,centerY,radius);gradient.addColorStop(0,'rgba(0,255,200,0.18)');gradient.addColorStop(1,'transparent');ctx.fillStyle=gradient;ctx.fillRect(0,0,w,h)}
function fadeTrail(){trailCtx.fillStyle=`rgba(0,0,0,${TRAIL_FADE_ALPHA})`;trailCtx.fillRect(0,0,w,h)}
function stampSweepToTrail(){trailCtx.save();trailCtx.globalCompositeOperation='lighter';const g=trailCtx.createRadialGradient(centerX,centerY,0,centerX,centerY,radius);g.addColorStop(0,'rgba(0,255,200,0.30)');g.addColorStop(1,'rgba(0,255,200,0)');trailCtx.fillStyle=g;trailCtx.beginPath();trailCtx.moveTo(centerX,centerY);trailCtx.arc(centerX,centerY,radius,sweepAngle-SWEEP_HALF_WIDTH,sweepAngle+SWEEP_HALF_WIDTH);trailCtx.closePath();trailCtx.fill();trailCtx.restore()}
function drawTrail(){ctx.drawImage(trailCanvas,0,0)}
function drawRings(){ctx.strokeStyle='rgba(0,255,200,0.28)';ctx.lineWidth=1;for(let i=1;i<=4;i++){ctx.beginPath();ctx.arc(centerX,centerY,(radius/4)*i,-Math.PI/2,Math.PI/2);ctx.stroke()}ctx.strokeStyle='rgba(0,255,200,0.15)';ctx.beginPath();ctx.moveTo(centerX,centerY-radius);ctx.lineTo(centerX,centerY+radius);ctx.stroke()}
function drawBlips(){const now=performance.now();for(const blip of blips){if(blip.alpha<=0)continue;let dynColor=blip.color;if(ENABLE_BLIP_DECAY_COLOR){const ratio=Math.min(1,(now-blip.created)/BLIP_DECAY_MS);dynColor=decayColor(ratio)}const x=centerX+blip.r*Math.cos(blip.theta);const y=centerY+blip.r*Math.sin(blip.theta);const size=2.2+blip.alpha*3.2+blip.sizeBoost*2.2;const glowRadius=size*4.5;const glow=ctx.createRadialGradient(x,y,0,x,y,glowRadius);glow.addColorStop(0,hexToRgba(dynColor,0.55*blip.alpha));glow.addColorStop(0.6,hexToRgba(dynColor,0.12*blip.alpha));glow.addColorStop(1,hexToRgba(dynColor,0));ctx.beginPath();ctx.fillStyle=glow;ctx.arc(x,y,glowRadius,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.fillStyle=hexToRgba(dynColor,0.25+blip.alpha*0.75);ctx.arc(x,y,size,0,Math.PI*2);ctx.fill();if(blip.sizeBoost>0.2){ctx.beginPath();ctx.fillStyle=hexToRgba('#ffffff',0.15+0.5*blip.alpha);ctx.arc(x,y,size*0.45,0,Math.PI*2);ctx.fill()}}}
function drawSweep(){const g=ctx.createRadialGradient(centerX,centerY,0,centerX,centerY,radius);g.addColorStop(0,'rgba(0,255,200,0.65)');g.addColorStop(1,'rgba(0,255,200,0)');ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(centerX,centerY);ctx.arc(centerX,centerY,radius,sweepAngle-SWEEP_HALF_WIDTH,sweepAngle+SWEEP_HALF_WIDTH);ctx.closePath();ctx.fill();ctx.strokeStyle='rgba(0,255,200,0.55)';ctx.lineWidth=1;ctx.beginPath();ctx.arc(centerX,centerY,radius,sweepAngle+SWEEP_HALF_WIDTH-0.002,sweepAngle+SWEEP_HALF_WIDTH+0.002);ctx.stroke()}
let mouseXRatio=0.5,mouseYRatio=0.5
document.addEventListener('mousemove',e=>{mouseXRatio=e.clientX/window.innerWidth;mouseYRatio=e.clientY/window.innerHeight})
function loop(){frameCount++;if(ENABLE_TRAIL)fadeTrail();ctx.clearRect(0,0,w,h);ctx.save();ctx.beginPath();ctx.arc(centerX,centerY,radius,-Math.PI/2,Math.PI/2);ctx.lineTo(centerX,centerY);ctx.closePath();ctx.clip();if(ENABLE_TRAIL)drawTrail();drawBackground(mouseXRatio,mouseYRatio);drawRings();updateBlips();drawBlips();drawSweep();if(ENABLE_TRAIL)stampSweepToTrail();ctx.restore();if(BOUNCE_MODE){sweepAngle+=sweepDir*SWEEP_SPEED;if(sweepAngle>=Math.PI/2){sweepAngle=Math.PI/2;sweepDir=-1}else if(sweepAngle<=-Math.PI/2){sweepAngle=-Math.PI/2;sweepDir=1}}else{sweepAngle+=SWEEP_SPEED}requestAnimationFrame(loop)}
loop()
;(function(){document.body.classList.add('hero-pre');window.addEventListener('load',()=>{requestAnimationFrame(()=>{document.body.classList.add('hero-ready')})})})()
;(function(){const c=document.getElementById('radarCanvas');if(!c)return;let t=0;function pulse(){t+=0.008;const v=0.96+Math.sin(t)*0.04;c.style.filter=`saturate(115%) brightness(${v})`;requestAnimationFrame(pulse)}requestAnimationFrame(pulse)})()
/* ================= Feature Cards ================= */
document.addEventListener('DOMContentLoaded',()=>{const wrappers=document.querySelectorAll('.feature-card-wrapper')
    const cards=document.querySelectorAll('.feature-card')
    if(!cards.length||!wrappers.length)return
    const prefersReduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const isSmall=window.matchMedia('(max-width: 640px)').matches
    wrappers.forEach(wrap=>{const dur=(Math.random()*6+8).toFixed(2)+'s'
        const delay=(Math.random()*4-2).toFixed(2)+'s'
        wrap.style.setProperty('--breath-duration',dur)
        wrap.style.setProperty('--breath-delay',delay)})
    const revealItems=document.querySelectorAll('.feature-card-wrapper.reveal')
    if(!prefersReduce){const io=new IntersectionObserver(entries=>{entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('revealed')
        io.unobserve(entry.target)}})},{threshold:0.25,rootMargin:'0px 0px -5% 0px'})
        revealItems.forEach((el,idx)=>{el.dataset.revealIndex=idx;io.observe(el)})}else{revealItems.forEach((el,idx)=>{el.dataset.revealIndex=idx;el.classList.add('revealed')})}
    if(prefersReduce||isSmall){cards.forEach(card=>{const wrap=card.closest('.feature-card-wrapper')
        function enter(){card.classList.add('is-hovered');wrap&&wrap.classList.add('pause-breath')}
        function leave(){card.classList.remove('is-hovered');wrap&&wrap.classList.remove('pause-breath')}
        card.addEventListener('pointerenter',enter)
        card.addEventListener('pointerleave',leave)
        card.addEventListener('focus',enter)
        card.addEventListener('blur',leave)
        card.addEventListener('touchstart',enter,{passive:!0})
        card.addEventListener('touchend',leave)})
        return}
    const MAX_TILT=14
    const SCALE_HOV=1.028
    const LERP_IN=0.20
    const LERP_OUT=0.24
    const state=[]
    cards.forEach(card=>{state.push({card,wrap:card.closest('.feature-card-wrapper'),hovering:!1,targetRX:0,targetRY:0,rx:0,ry:0})})
    function onEnter(s){s.hovering=!0;s.card.classList.add('is-hovered','tilt-active');s.wrap&&s.wrap.classList.add('pause-breath');if(!rafRunning)startRAF()}
    function onLeave(s){s.hovering=!1;s.targetRX=0;s.targetRY=0;s.card.classList.remove('is-hovered');s.wrap&&s.wrap.classList.remove('pause-breath');if(!rafRunning)startRAF()}
    function onMove(s,e){const rect=s.card.getBoundingClientRect();const dx=(e.clientX-(rect.left+rect.width/2))/(rect.width/2);const dy=(e.clientY-(rect.top+rect.height/2))/(rect.height/2);const cdx=Math.max(-1,Math.min(1,dx));const cdy=Math.max(-1,Math.min(1,dy));s.targetRY=cdx*MAX_TILT;s.targetRX=-cdy*MAX_TILT;if(!rafRunning)startRAF()}
    state.forEach(s=>{s.card.addEventListener('pointerenter',()=>onEnter(s))
        s.card.addEventListener('pointermove',e=>onMove(s,e))
        s.card.addEventListener('pointerleave',()=>onLeave(s))
        s.card.addEventListener('focus',()=>onEnter(s))
        s.card.addEventListener('blur',()=>onLeave(s))
        s.card.addEventListener('touchstart',()=>onEnter(s),{passive:!0})
        s.card.addEventListener('touchend',()=>onLeave(s))})
    let rafRunning=!1
    function startRAF(){rafRunning=!0;requestAnimationFrame(loopTilt)}
    function loopTilt(){let active=!1
        state.forEach(s=>{const f=s.hovering?LERP_IN:LERP_OUT
            s.rx+=(s.targetRX-s.rx)*f
            s.ry+=(s.targetRY-s.ry)*f
            const near=Math.abs(s.rx-s.targetRX)<0.05&&Math.abs(s.ry-s.targetRY)<0.05
            if(!s.hovering&&near){s.rx=s.targetRX=0;s.ry=s.targetRY=0}else active=!0
            const rx=Math.round(s.rx*10)/10
            const ry=Math.round(s.ry*10)/10
            const scale=s.hovering?SCALE_HOV:1
            s.card.style.transform=`translateZ(0) rotateX(${rx}deg) rotateY(${ry}deg) scale(${scale})`
            if(!s.hovering&&near)s.card.classList.remove('tilt-active')})
        if(active)requestAnimationFrame(loopTilt);else rafRunning=!1}})
/* ================= Download Section Anim / Device Tilt ================= */
;(function(){const section=document.getElementById('download')
    if(!section)return
    const prefersReduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const isSmall=window.matchMedia('(max-width: 680px)').matches
    const revealTargets=section.querySelectorAll('.reveal')
    if(!prefersReduce){const io=new IntersectionObserver(entries=>{entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('revealed')
        io.unobserve(entry.target)}})},{threshold:0.22,rootMargin:'0px 0px -5% 0px'})
        revealTargets.forEach(el=>io.observe(el))}else{revealTargets.forEach(el=>el.classList.add('revealed'))}
    if(!prefersReduce&&!isSmall){const stage=section.querySelector('#deviceStage')
        let ticking=!1
        function handleMove(e){if(!stage)return
            const rect=stage.getBoundingClientRect()
            const sx=(e.clientX-(rect.left+rect.width/2))/(rect.width/2)
            const sy=(e.clientY-(rect.top+rect.height/2))/(rect.height/2)
            const clamp=v=>Math.max(-1,Math.min(1,v))
            const x=clamp(sx)
            const y=clamp(sy)
            if(!ticking){window.requestAnimationFrame(()=>{const tiltMax=10
                const rx=(-y*tiltMax).toFixed(2)
                const ry=(x*tiltMax).toFixed(2)
                stage.style.transform=`translateZ(0) rotateX(${rx}deg) rotateY(${ry}deg)`
                ticking=!1})
                ticking=!0}}
        function resetTilt(){if(stage)stage.style.transform=''}
        if(stage){stage.addEventListener('pointermove',handleMove)
            stage.addEventListener('pointerleave',resetTilt)}}const particleCanvas=section.querySelector('.dl-particles')
    if(particleCanvas&&!prefersReduce){const pctx=particleCanvas.getContext('2d')
        let w,h,particles
        const COUNT=26
        function resize(){w=particleCanvas.width=section.clientWidth;h=particleCanvas.height=section.clientHeight;particles=Array.from({length:COUNT},()=>spawn())}
        function spawn(){return{x:Math.random()*w,y:Math.random()*h,r:1+Math.random()*2.2,a:.2+Math.random()*.5,dx:(Math.random()-.5)*.15,dy:(Math.random()-.5)*.15,hue:165+Math.random()*40}}
        function step(){pctx.clearRect(0,0,w,h)
            particles.forEach(p=>{p.x+=p.dx
                p.y+=p.dy
                if(p.x<-10||p.x>w+10||p.y<-10||p.y>h+10)Object.assign(p,spawn())
                pctx.beginPath()
                pctx.fillStyle=`hsla(${p.hue} 100% 65% / ${p.a})`
                pctx.arc(p.x,p.y,p.r,0,Math.PI*2)
                pctx.fill()})
            requestAnimationFrame(step)}
        window.addEventListener('resize',resize)
        resize()
        step()}})()
/* ================= Footer Misc ================= */
;(function(){const y=document.getElementById('year')
    if(y)y.textContent=new Date().getFullYear()
    document.querySelectorAll('.soc-link,.footer-links a,.legal-inline a,.news-form button,.news-form input').forEach(el=>{el.addEventListener('focus',()=>el.classList.add('kb-focus'))
        el.addEventListener('blur',()=>el.classList.remove('kb-focus'))})})()
/* ================= Header Behaviours ================= */
;(function(){const header=document.getElementById('siteHeader')
    if(!header)return
    const MOBILE=window.matchMedia('(max-width:600px)').matches
    const SHOW_AT=MOBILE?0:120
    let visible=!1
    function onScroll(){const y=window.scrollY
        if(!visible&&y>SHOW_AT){header.classList.add('is-visible');visible=!0}else if(visible&&y<=SHOW_AT){if(SHOW_AT===0)return;header.classList.remove('is-visible');visible=!1}}
    window.addEventListener('scroll',onScroll,{passive:!0})
    if(window.scrollY>SHOW_AT||SHOW_AT===0){header.classList.add('is-visible');visible=!0}
    document.querySelectorAll('[data-scroll-target]').forEach(btn=>{btn.addEventListener('click',e=>{const sel=btn.getAttribute('data-scroll-target')
        const target=document.querySelector(sel)
        if(target){e.preventDefault();target.scrollIntoView({behavior:'smooth',block:'start'})}})})
    /* Header language + duplication avoided: translation system handles click globally */})()
/* Smooth scroll to top anchors */
document.querySelectorAll('a[href="#top"]').forEach(a=>{a.addEventListener('click',e=>{const topEl=document.getElementById('top')||document.body
    e.preventDefault()
    topEl.scrollIntoView({behavior:'smooth',block:'start'})})})
/* Unified smart download logic for any button with data-action="smart-download" */
;(function(){
    const apple='https://apps.apple.com/us/app/radarguard-alerts-speed-camera/id6751195451?platform=iphone'
    const android='https://play.google.com/store/apps/details?id=com.SpeedCamera.RadarAlerts'
    function handleSmartDownload(e){
        e.preventDefault()
        const ua=navigator.userAgent||navigator.vendor||window.opera
        const isAndroid=/Android/i.test(ua)
        const isIOS=/iPhone|iPad|iPod/i.test(ua)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1)
        if(isAndroid){
            window.location.href=android
        }else if(isIOS){
            window.location.href=apple
        }else{
            document.querySelector('#download')?.scrollIntoView({behavior:'smooth',block:'start'})
        }
    }
    document.querySelectorAll('[data-action="smart-download"]').forEach(btn=>{
        btn.addEventListener('click',handleSmartDownload)
        btn.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){handleSmartDownload(e)}})
    })
})()
/* ================= i18n (Brand name not translated) ================= */
;(function(){
    const DICT={
        en:{
            'meta.title':'RadarGuard Alerts',
            'header.homeAria':'RadarGuard Alerts: Speed camera home',
            'brand.logoAlt':'RadarGuard logo',
            'lang.select':'Select language',
            'cta.download':'Download',
            'cta.downloadAria':'Download',
            'cta.features':'Features',
            'product.type':'Speed camera',
            'hero.headingHtml':'Instant <span class="grad">Speed Camera</span> Awareness',
            'hero.lead':'Real‑time speed camera & hazard intelligence — fast, precise, privacy‑first. Adaptive radar visuals help you anticipate instead of react.',
            'flags.lowLatency':'Ultra‑low latency',
            'flags.privacy':'Privacy‑first',
            'flags.filtering':'Adaptive filtering',
            'features.sectionTitle':'Powerful Features',
            'features.sectionSub':'Core capabilities for real-time awareness',
            'features.speed.title':'Speed Detection',
            'features.speed.desc':'Instant alerts for nearby speed cameras and road limits.',
            'features.gps.title':'Precision GPS',
            'features.gps.desc':'Ultra-accurate positioning for better awareness.',
            'features.alerts.title':'Smart Alerts',
            'features.alerts.desc':'Intelligent notifications adapted to your driving route.',
            'features.community.title':'Community Reports',
            'features.community.desc':'Stay informed with live updates from other users.',
            'features.route.title':'Route Prediction',
            'features.route.desc':'Optimized navigation and hazard detection system.',
            'features.validation.title':'Crowd Validation',
            'features.validation.desc':'Camera updates weighted by recent confirmations to reduce stale alerts.',
            'download.titleHtml':'RadarGuard Alerts: <span class="dl-accent">Speed camera</span>',
            'download.tagline':'Real‑time speed camera & hazard intelligence that keeps you aware before you arrive — optimized for accuracy, battery efficiency and privacy.',
            'download.point1':'Ultra‑low latency live alerts.',
            'download.point2':'Privacy‑first: no selling of trip data.',
            'download.point3':'Crowd‑validated camera network.',
            'download.betaHtml':'Want early feature previews? <a href="#beta" class="dl-link" data-i18n="download.betaLink">Join the beta</a>.',
            'download.betaLink':'Join the beta',
            'download.appStoreAria':'Download RadarGuard Alerts on the App Store',
            'download.playStoreAria':'Download RadarGuard Alerts on Google Play',
            'download.devicePreviewAria':'App interface preview',
            'download.deviceImageAlt':'RadarGuard Alerts live interface',
            'store.getItOn':'Get it on',
            'store.appStore':'App Store',
            'store.playStore':'Google Play',
            'footer.tagline':'Real‑time speed camera & hazard awareness. Drive informed.',
            'footer.productHead':'Product',
            'footer.download':'Download',
            'footer.betaAccess':'Beta Access',
            'footer.pricingSoon':'Pricing (Soon)',
            'footer.faqPlaceholder':'FAQ (Placeholder)',
            'footer.resourcesHead':'Resources',
            'footer.support':'Support',
            'footer.blogPlaceholder':'Blog (Placeholder)',
            'footer.docsPlanned':'Docs (Planned)',
            'footer.changelog':'Changelog',
            'footer.community':'Community',
            'footer.companyHead':'Company',
            'footer.aboutUs':'About Us',
            'footer.privacyPolicy':'Privacy Policy',
            'footer.termsOfUse':'Terms of Use',
            'footer.careersFuture':'Careers (Future)',
            'footer.legalCenter':'Legal Center',
            'footer.stayUpdated':'Stay Updated',
            'footer.newsText':'Get early radar data drops & beta feature access. No spam.',
            'footer.emailLabel':'Email',
            'footer.subscribeBtn':'Subscribe',
            'footer.privacyNoteHtml':'By subscribing you agree to our <a href="#privacy" data-i18n="footer.privacyPolicyLink">privacy policy</a>.',
            'footer.privacyPolicyLink':'privacy policy',
            'footer.privacyPolicyShort':'Privacy',
            'footer.termsShort':'Terms',
            'footer.cookies':'Cookies',
            'footer.contact':'Contact',
            'footer.copyrightHtml':'&copy; <span id="year"></span> RadarGuard Alerts: Speed camera. All rights reserved.'
        },
        tr:{
            'meta.title':'RadarGuard Alerts',
            'header.homeAria':'RadarGuard Alerts: Hız kamerası ana sayfa',
            'brand.logoAlt':'RadarGuard logo',
            'lang.select':'Dil seç',
            'cta.download':'İndir',
            'cta.downloadAria':'İndir',
            'cta.features':'Özellikler',
            'product.type':'Speed camera',
            'hero.headingHtml':'Anında <span class="grad">Hız Kamerası</span> Farkındalığı',
            'hero.lead':'Gerçek zamanlı hız kamerası & tehlike zekâsı — hızlı, hassas, gizlilik öncelikli. Uyarlanabilir radar görselleri tepki yerine öngörü sağlar.',
            'flags.lowLatency':'Çok düşük gecikme',
            'flags.privacy':'Gizlilik öncelikli',
            'flags.filtering':'Uyarlanabilir filtreleme',
            'features.sectionTitle':'Güçlü Özellikler',
            'features.sectionSub':'Gerçek zamanlı farkındalık yetenekleri',
            'features.speed.title':'Hız Tespiti',
            'features.speed.desc':'Yakındaki hız kameraları ve sınırlar için anlık uyarılar.',
            'features.gps.title':'Hassas GPS',
            'features.gps.desc':'Daha iyi farkındalık için yüksek doğruluk.',
            'features.alerts.title':'Akıllı Uyarılar',
            'features.alerts.desc':'Sürüş rotana göre uyarlanmış bildirimler.',
            'features.community.title':'Topluluk Raporları',
            'features.community.desc':'Diğer kullanıcılardan canlı güncellemeler.',
            'features.route.title':'Rota Tahmini',
            'features.route.desc':'Optimize navigasyon ve tehlike tespiti.',
            'features.validation.title':'Topluluk Doğrulama',
            'features.validation.desc':'Ağırlıklı teyitlerle eski uyarılar azalır.',
            'download.titleHtml':'RadarGuard Alerts: <span class="dl-accent">Speed Camera</span>',
            'download.tagline':'Doğruluk, pil verimliliği ve gizlilik için optimize gerçek zamanlı hız kamerası & tehlike zekâsı.',
            'download.point1':'Çok düşük gecikmeli canlı uyarılar.',
            'download.point2':'Gizlilik öncelikli: veri satışı yok.',
            'download.point3':'Topluluk doğrulamalı kamera ağı.',
            'download.betaHtml':'Erken özellik ister misin? <a href="#beta" class="dl-link" data-i18n="download.betaLink">Beta\'ya katıl</a>.',
            'download.betaLink':'Beta\'ya katıl',
            'download.appStoreAria':'RadarGuard Alerts App Store indirme',
            'download.playStoreAria':'RadarGuard Alerts Google Play indirme',
            'download.devicePreviewAria':'Uygulama arayüz önizleme',
            'download.deviceImageAlt':'RadarGuard Alerts canlı arayüz',
            'store.getItOn':'İndir',
            'store.appStore':'App Store',
            'store.playStore':'Google Play',
            'footer.tagline':'Gerçek zamanlı hız kamerası & tehlike farkındalığı. Bilinçli sür.',
            'footer.productHead':'Ürün',
            'footer.download':'İndir',
            'footer.betaAccess':'Beta Erişimi',
            'footer.pricingSoon':'Fiyatlandırma (Yakında)',
            'footer.faqPlaceholder':'SSS (Yer Tutucu)',
            'footer.resourcesHead':'Kaynaklar',
            'footer.support':'Destek',
            'footer.blogPlaceholder':'Blog (Yer Tutucu)',
            'footer.docsPlanned':'Dokümanlar (Planlı)',
            'footer.changelog':'Değişiklik Günlüğü',
            'footer.community':'Topluluk',
            'footer.companyHead':'Şirket',
            'footer.aboutUs':'Hakkımızda',
            'footer.privacyPolicy':'Gizlilik Politikası',
            'footer.termsOfUse':'Kullanım Şartları',
            'footer.careersFuture':'Kariyer (Gelecek)',
            'footer.legalCenter':'Hukuk Merkezi',
            'footer.stayUpdated':'Güncel Kal',
            'footer.newsText':'Erken radar verisi & beta erişimi. Spam yok.',
            'footer.emailLabel':'E‑posta',
            'footer.subscribeBtn':'Abone Ol',
            'footer.privacyNoteHtml':'Abone olarak <a href="#privacy" data-i18n="footer.privacyPolicyLink">gizlilik politikasını</a> kabul edersin.',
            'footer.privacyPolicyLink':'gizlilik politikasını',
            'footer.privacyPolicyShort':'Gizlilik',
            'footer.termsShort':'Şartlar',
            'footer.cookies':'Çerezler',
            'footer.contact':'İletişim',
            'footer.copyrightHtml':'&copy; <span id="year"></span> RadarGuard Alerts: Speed camera. Tüm hakları saklıdır.'
        },
        de:{
            'meta.title':'RadarGuard Alerts',
            'header.homeAria':'RadarGuard Alerts: Blitzer Startseite',
            'brand.logoAlt':'RadarGuard Logo',
            'lang.select':'Sprache wählen',
            'cta.download':'Herunterladen',
            'cta.downloadAria':'Herunterladen',
            'cta.features':'Funktionen',
            'product.type':'Speed camera',
            'hero.headingHtml':'Sofortiges <span class="grad">Blitzer</span> Bewusstsein',
            'hero.lead':'Echtzeit Blitzer & Gefahren‑Intelligenz – schnell, präzise, datenschutzorientiert. Adaptive Radarvisualisierung hilft vorauszuplanen.',
            'flags.lowLatency':'Sehr geringe Latenz',
            'flags.privacy':'Datenschutz zuerst',
            'flags.filtering':'Adaptive Filterung',
            'features.sectionTitle':'Leistungsstarke Funktionen',
            'features.sectionSub':'Kernfunktionen für Echtzeit-Wahrnehmung',
            'features.speed.title':'Geschwindigkeits-Erkennung',
            'features.speed.desc':'Sofortwarnungen für nahe Blitzer & Limits.',
            'features.gps.title':'Präzises GPS',
            'features.gps.desc':'Hohe Genauigkeit für bessere Wahrnehmung.',
            'features.alerts.title':'Intelligente Warnungen',
            'features.alerts.desc':'Kontextbezogene Hinweise entlang deiner Route.',
            'features.community.title':'Community Meldungen',
            'features.community.desc':'Aktuelle Updates von anderen Fahrern.',
            'features.route.title':'Routenprognose',
            'features.route.desc':'Optimierte Navigation & Gefahrenerkennung.',
            'features.validation.title':'Crowd Validierung',
            'features.validation.desc':'Gewichtete Bestätigungen reduzieren veraltete Meldungen.',
            'download.titleHtml':'RadarGuard Alerts: <span class="dl-accent">Speed Camera</span>',
            'download.tagline':'Echtzeit Blitzer & Gefahren‑Intelligenz für Genauigkeit, Akkuschonung & Datenschutz.',
            'download.point1':'Sehr geringe Latenz bei Live-Warnungen.',
            'download.point2':'Datenschutz zuerst: keine Weitergabe von Fahrtdaten.',
            'download.point3':'Crowd‑validiertes Kameranetzwerk.',
            'download.betaHtml':'Frühe Funktionen testen? <a href="#beta" class="dl-link" data-i18n="download.betaLink">Zur Beta</a>.',
            'download.betaLink':'Zur Beta',
            'download.appStoreAria':'RadarGuard Alerts im App Store herunterladen',
            'download.playStoreAria':'RadarGuard Alerts bei Google Play herunterladen',
            'download.devicePreviewAria':'App Interface Vorschau',
            'download.deviceImageAlt':'RadarGuard Alerts Live Interface',
            'store.getItOn':'Hol es im',
            'store.appStore':'App Store',
            'store.playStore':'Google Play',
            'footer.tagline':'Echtzeit Blitzer- & Gefahrenbewusstsein. Fahre informiert.',
            'footer.productHead':'Produkt',
            'footer.download':'Herunterladen',
            'footer.betaAccess':'Beta Zugang',
            'footer.pricingSoon':'Preise (Bald)',
            'footer.faqPlaceholder':'FAQ (Platzhalter)',
            'footer.resourcesHead':'Ressourcen',
            'footer.support':'Unterstützung',
            'footer.blogPlaceholder':'Blog (Platzhalter)',
            'footer.docsPlanned':'Doku (Geplant)',
            'footer.changelog':'Changelog',
            'footer.community':'Community',
            'footer.companyHead':'Unternehmen',
            'footer.aboutUs':'Über Uns',
            'footer.privacyPolicy':'Datenschutzerklärung',
            'footer.termsOfUse':'Nutzungsbedingungen',
            'footer.careersFuture':'Karriere (Zukünftig)',
            'footer.legalCenter':'Rechtszentrum',
            'footer.stayUpdated':'Bleib Informiert',
            'footer.newsText':'Frühe Radar-Daten & Beta-Funktionen. Kein Spam.',
            'footer.emailLabel':'E-Mail',
            'footer.subscribeBtn':'Abonnieren',
            'footer.privacyNoteHtml':'Mit der Anmeldung stimmst du unserer <a href="#privacy" data-i18n="footer.privacyPolicyLink">Datenschutzerklärung</a> zu.',
            'footer.privacyPolicyLink':'Datenschutzerklärung',
            'footer.privacyPolicyShort':'Datenschutz',
            'footer.termsShort':'Nutzung',
            'footer.cookies':'Cookies',
            'footer.contact':'Kontakt',
            'footer.copyrightHtml':'&copy; <span id="year"></span> RadarGuard Alerts: Speed camera. Alle Rechte vorbehalten.'
        }
    }

    const LS_KEY='rg_lang'
    function $(s,c=document){return c.querySelector(s)}
    function $all(s,c=document){return [...c.querySelectorAll(s)]}

    function detectLang(){
        const qp=new URLSearchParams(location.search).get('lang')
        if(qp && DICT[qp]) return qp
        const stored=localStorage.getItem(LS_KEY)
        if(stored && DICT[stored]) return stored
        const nav=(navigator.language||'en').slice(0,2).toLowerCase()
        return DICT[nav]?nav:'en'
    }

    function applyAttrTranslations(el,langDict,base){
        const spec=el.getAttribute('data-i18n-attr')
        if(!spec) return
        spec.split(';').forEach(pair=>{
            if(!pair.trim())return
            const [attr,key]=pair.split(':')
            const k=key.trim()
            const val=langDict[k]??base[k]
            if(val!=null) el.setAttribute(attr.trim(),val)
        })
    }

    function translate(lang){
        const dict=DICT[lang]
        const base=DICT.en
        document.documentElement.setAttribute('data-app-lang',lang)
        const titleKey='meta.title'
        document.title = dict[titleKey]||base[titleKey]||'RadarGuard Alerts'
        $all('[data-i18n-html]').forEach(el=>{
            const k=el.getAttribute('data-i18n-html')
            const v=dict[k]??base[k]
            if(v!=null) el.innerHTML=v
        })
        $all('[data-i18n]').forEach(el=>{
            if(el.hasAttribute('data-i18n-html')) return
            const k=el.getAttribute('data-i18n')
            const v=dict[k]??base[k]
            if(v!=null) el.textContent=v
        })
        $all('[data-i18n-attr]').forEach(el=>applyAttrTranslations(el,dict,base))
        $all('[data-i18n]').forEach(el=>{
            if(el.hasAttribute('data-i18n-html')) return
            const k=el.getAttribute('data-i18n')
            const v=dict[k]??base[k]
            if(v!=null) el.textContent=v
        })
        const y=$('#year'); if(y) y.textContent=new Date().getFullYear()
        $all('.lang-btn,.lang-opt').forEach(btn=>{
            const active=btn.dataset.lang===lang
            btn.classList.toggle('is-active',active)
            if(btn.classList.contains('lang-btn')) btn.setAttribute('aria-pressed',active?'true':'false')
        })
        const toggle=$('.lang-toggle')
        if(toggle) toggle.textContent=lang.toUpperCase()+' ▾'
        localStorage.setItem(LS_KEY,lang)
    }

    function initLang(){
        translate(detectLang())
        document.addEventListener('click',e=>{
            const trg=e.target.closest('[data-lang]')
            if(trg){
                const l=trg.dataset.lang
                if(DICT[l]) translate(l)
            }
        },true)
        window.setAppLang=l=>{ if(DICT[l]) translate(l) }
    }

    function initLangDropdown(){
        const toggle=$('.lang-toggle')
        const menu=$('.lang-menu')
        if(!toggle||!menu) return
        toggle.addEventListener('click',()=>{
            const open=menu.classList.toggle('open')
            toggle.setAttribute('aria-expanded',open?'true':'false')
        })
        document.addEventListener('click',e=>{
            if(!menu.classList.contains('open')) return
            if(!menu.contains(e.target) && e.target!==toggle){
                menu.classList.remove('open')
                toggle.setAttribute('aria-expanded','false')
            }
        })
        document.addEventListener('keydown',e=>{
            if(e.key==='Escape'&&menu.classList.contains('open')){
                menu.classList.remove('open')
                toggle.setAttribute('aria-expanded','false')
                toggle.focus()
            }
        })
    }

    if(document.readyState==='loading'){
        document.addEventListener('DOMContentLoaded',()=>{initLang();initLangDropdown();})
    }else{
        initLang();initLangDropdown()
    }
})();

console.log('moon loving never ended✨')