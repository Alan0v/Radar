console.log('moon loving started✨')
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
const canvas=document.getElementById('radarCanvas')
const ctx=canvas.getContext('2d')
let w,h,centerX,centerY,radius
let sweepAngle=-Math.PI/2
let sweepDir=1
let frameCount=0
let trailCanvas,trailCtx
function resizeCanvas(){w=canvas.width=canvas.offsetWidth;h=canvas.height=canvas.offsetHeight;centerX=0;centerY=h/2;radius=Math.min(w,h);if(ENABLE_TRAIL){trailCanvas=document.createElement('canvas');trailCanvas.width=w;trailCanvas.height=h;trailCtx=trailCanvas.getContext('2d');trailCtx.clearRect(0,0,w,h)}}window.addEventListener('resize',resizeCanvas);resizeCanvas()
function randomColor(){return BLIP_COLORS[Math.floor(Math.random()*BLIP_COLORS.length)]}
function createBlip(){const theta=-Math.PI/2+Math.random()*Math.PI;const r=Math.sqrt(Math.random())*radius*MAX_BLIP_RADIUS_RATIO;return{r,theta,alpha:0,sizeBoost:0,lastHit:-9999,color:randomColor()}}
let blips=Array.from({length:BLIP_COUNT},createBlip)
function angleVisible(a){return a>=-Math.PI/2&&a<=Math.PI/2}
function normalizeAngle(a){a%=2*Math.PI;if(a>Math.PI)a-=2*Math.PI;if(a<-Math.PI)a+=2*Math.PI;return a}
function hexToRgba(hex,a=1){const h=hex.replace('#','');const bigint=parseInt(h,16);const r=(bigint>>16)&255;const g=(bigint>>8)&255;const b=bigint&255;return`rgba(${r},${g},${b},${a})`}
function updateBlips(){const current=normalizeAngle(sweepAngle);const visible=angleVisible(current);for(const blip of blips){const diff=Math.abs(blip.theta-current);if(visible&&diff<=SWEEP_HALF_WIDTH){blip.alpha=Math.min(1,blip.alpha+FADE_IN_SPEED);blip.sizeBoost=1;blip.lastHit=frameCount}else{blip.alpha=Math.max(0,blip.alpha-FADE_OUT_SPEED);blip.sizeBoost*=0.9}if(ENABLE_JITTER){blip.r+=(Math.random()-0.5)*JITTER_R;blip.theta+=(Math.random()-0.5)*JITTER_THETA;blip.r=Math.max(0,Math.min(blip.r,radius*MAX_BLIP_RADIUS_RATIO));if(blip.theta<-Math.PI/2)blip.theta=-Math.PI/2;if(blip.theta>Math.PI/2)blip.theta=Math.PI/2}}}
function drawBackground(mouseXRatio=0.5,mouseYRatio=0.5){const glowX=centerX+(mouseXRatio-0.5)*380;const glowY=centerY+(mouseYRatio-0.5)*380;const gradient=ctx.createRadialGradient(glowX,glowY,0,centerX,centerY,radius);gradient.addColorStop(0,'rgba(0,255,200,0.18)');gradient.addColorStop(1,'transparent');ctx.fillStyle=gradient;ctx.fillRect(0,0,w,h)}
function fadeTrail(){if(!ENABLE_TRAIL)return;trailCtx.fillStyle=`rgba(0,0,0,${TRAIL_FADE_ALPHA})`;trailCtx.fillRect(0,0,w,h)}
function stampSweepToTrail(){if(!ENABLE_TRAIL)return;trailCtx.save();trailCtx.globalCompositeOperation='lighter';const g=trailCtx.createRadialGradient(centerX,centerY,0,centerX,centerY,radius);g.addColorStop(0,'rgba(0,255,200,0.30)');g.addColorStop(1,'rgba(0,255,200,0)');trailCtx.fillStyle=g;trailCtx.beginPath();trailCtx.moveTo(centerX,centerY);trailCtx.arc(centerX,centerY,radius,sweepAngle-SWEEP_HALF_WIDTH,sweepAngle+SWEEP_HALF_WIDTH);trailCtx.closePath();trailCtx.fill();trailCtx.restore()}
function drawTrail(){if(!ENABLE_TRAIL)return;ctx.drawImage(trailCanvas,0,0)}
function drawRings(){ctx.strokeStyle='rgba(0,255,200,0.28)';ctx.lineWidth=1;for(let i=1;i<=4;i++){ctx.beginPath();ctx.arc(centerX,centerY,(radius/4)*i,-Math.PI/2,Math.PI/2);ctx.stroke()}ctx.strokeStyle='rgba(0,255,200,0.15)';ctx.beginPath();ctx.moveTo(centerX,centerY-radius);ctx.lineTo(centerX,centerY+radius);ctx.stroke()}
function drawBlips(){for(const blip of blips){if(blip.alpha<=0)continue;const baseColor=blip.color;const x=centerX+blip.r*Math.cos(blip.theta);const y=centerY+blip.r*Math.sin(blip.theta);const size=2.2+blip.alpha*3.2+blip.sizeBoost*2.2;const glowRadius=size*4.5;const glow=ctx.createRadialGradient(x,y,0,x,y,glowRadius);glow.addColorStop(0,hexToRgba(baseColor,0.55*blip.alpha));glow.addColorStop(0.6,hexToRgba(baseColor,0.12*blip.alpha));glow.addColorStop(1,hexToRgba(baseColor,0));ctx.beginPath();ctx.fillStyle=glow;ctx.arc(x,y,glowRadius,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.fillStyle=hexToRgba(baseColor,0.25+blip.alpha*0.75);ctx.arc(x,y,size,0,Math.PI*2);ctx.fill();if(blip.sizeBoost>0.2){ctx.beginPath();ctx.fillStyle=hexToRgba('#ffffff',0.15+0.5*blip.alpha);ctx.arc(x,y,size*0.45,0,Math.PI*2);ctx.fill()}}}
function drawSweep(){const g=ctx.createRadialGradient(centerX,centerY,0,centerX,centerY,radius);g.addColorStop(0,'rgba(0,255,200,0.65)');g.addColorStop(1,'rgba(0,255,200,0)');ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(centerX,centerY);ctx.arc(centerX,centerY,radius,sweepAngle-SWEEP_HALF_WIDTH,sweepAngle+SWEEP_HALF_WIDTH);ctx.closePath();ctx.fill();ctx.strokeStyle='rgba(0,255,200,0.55)';ctx.lineWidth=1;ctx.beginPath();ctx.arc(centerX,centerY,radius,sweepAngle+SWEEP_HALF_WIDTH-0.002,sweepAngle+SWEEP_HALF_WIDTH+0.002);ctx.stroke()}
let mouseXRatio=0.5,mouseYRatio=0.5
document.addEventListener('mousemove',e=>{mouseXRatio=e.clientX/window.innerWidth;mouseYRatio=e.clientY/window.innerHeight})
function loop(){frameCount++;if(ENABLE_TRAIL)fadeTrail();ctx.clearRect(0,0,w,h);ctx.save();ctx.beginPath();ctx.arc(centerX,centerY,radius,-Math.PI/2,Math.PI/2);ctx.lineTo(centerX,centerY);ctx.closePath();ctx.clip();drawTrail();drawBackground(mouseXRatio,mouseYRatio);drawRings();updateBlips();drawBlips();drawSweep();if(ENABLE_TRAIL)stampSweepToTrail();ctx.restore();if(BOUNCE_MODE){sweepAngle+=sweepDir*SWEEP_SPEED;if(sweepAngle>=Math.PI/2){sweepAngle=Math.PI/2;sweepDir=-1}else if(sweepAngle<=-Math.PI/2){sweepAngle=-Math.PI/2;sweepDir=1}}else{sweepAngle+=SWEEP_SPEED}requestAnimationFrame(loop)}
loop();(function(){document.body.classList.add('hero-pre')
    window.addEventListener('load',()=>{requestAnimationFrame(()=>{document.body.classList.add('hero-ready')})})})();(function(){const c=document.getElementById('radarCanvas');if(!c)return;let t=0;function pulse(){t+=0.008;const v=0.96+Math.sin(t)*0.04;c.style.filter=`saturate(115%) brightness(${v})`;requestAnimationFrame(pulse)}requestAnimationFrame(pulse)})()
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
        if(active)requestAnimationFrame(loopTilt);else rafRunning=!1}});(function(){const section=document.getElementById('download')
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
            stage.addEventListener('pointerleave',resetTilt)}}
    const particleCanvas=section.querySelector('.dl-particles')
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
        step()}})();(function(){const y=document.getElementById('year')
    if(y)y.textContent=new Date().getFullYear()
    document.querySelectorAll('.soc-link,.footer-links a,.legal-inline a,.news-form button,.news-form input').forEach(el=>{el.addEventListener('focus',()=>el.classList.add('kb-focus'))
        el.addEventListener('blur',()=>el.classList.remove('kb-focus'))})})();(function(){const header=document.getElementById('siteHeader')
    if(!header)return
    const SHOW_AT=120
    let visible=!1
    function onScroll(){const y=window.scrollY
        if(!visible&&y>SHOW_AT){header.classList.add('is-visible');visible=!0}else if(visible&&y<=SHOW_AT){header.classList.remove('is-visible');visible=!1}}
    window.addEventListener('scroll',onScroll,{passive:!0})
    if(window.scrollY>SHOW_AT){header.classList.add('is-visible');visible=!0}
    document.querySelectorAll('[data-scroll-target]').forEach(btn=>{btn.addEventListener('click',e=>{const sel=btn.getAttribute('data-scroll-target')
        const target=document.querySelector(sel)
        if(target){e.preventDefault();target.scrollIntoView({behavior:'smooth',block:'start'})}})})
    const inlineButtons=document.querySelectorAll('.lang-btn')
    const dropdownToggle=document.querySelector('.lang-toggle')
    const dropdownMenu=document.querySelector('.lang-menu')
    const dropdownOptions=document.querySelectorAll('.lang-opt')
    const allLang=[...inlineButtons,...dropdownOptions]
    function setLang(lang){allLang.forEach(b=>{const active=b.dataset.lang===lang
        b.classList.toggle('is-active',active)
        if(b.classList.contains('lang-btn'))b.setAttribute('aria-pressed',active?'true':'false')})
        if(dropdownToggle)dropdownToggle.textContent=lang.toUpperCase()+' ▾'}
    allLang.forEach(btn=>{btn.addEventListener('click',()=>{setLang(btn.dataset.lang)
        if(dropdownMenu&&dropdownMenu.classList.contains('open')){dropdownMenu.classList.remove('open')
            dropdownToggle&&dropdownToggle.setAttribute('aria-expanded','false')}})})
    if(dropdownToggle&&dropdownMenu){dropdownToggle.addEventListener('click',()=>{const open=dropdownMenu.classList.toggle('open')
        dropdownToggle.setAttribute('aria-expanded',open?'true':'false')})
        document.addEventListener('click',e=>{if(!dropdownMenu.classList.contains('open'))return
            if(!dropdownMenu.contains(e.target)&&e.target!==dropdownToggle){dropdownMenu.classList.remove('open')
                dropdownToggle.setAttribute('aria-expanded','false')}})
        document.addEventListener('keydown',e=>{if(e.key==='Escape'&&dropdownMenu.classList.contains('open')){dropdownMenu.classList.remove('open')
            dropdownToggle.setAttribute('aria-expanded','false')
            dropdownToggle.focus()}})}
    setLang('en')})()
document.querySelectorAll('a[href="#top"]').forEach(a=>{a.addEventListener('click',e=>{const topEl=document.getElementById('top')||document.body
    e.preventDefault()
    topEl.scrollIntoView({behavior:'smooth',block:'start'})})})
console.log('moon loving never ended✨')
