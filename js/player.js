/* Crystal Quest — quest player + mini-games */
const QP_STEPS = ['Pre-Test','Lesson','Practice','Game','Post-Test'];
const CHEERS = ["You've got this!","Nice thinking!","Keep going!","So close to conquering!","Crystal power! ✦","Big brain moves!"];
const pick = arr => arr[Math.floor(Math.random()*arr.length)];
const SLOTS = [[8,8],[58,4],[22,52],[64,50]];

let QP = null;
let actx = null, muted = false;

function shuffle(arr){
  const a = arr.slice();
  for(let i=a.length-1;i>0;i--){
    const j = Math.floor(Math.random()*(i+1));
    [a[i],a[j]] = [a[j],a[i]];
  }
  return a;
}
function shuffleMC(item){
  if(!item || !item.a) return item;
  const pairs = item.a.map((text,i)=>({ text, i }));
  const sh = shuffle(pairs);
  if(item.type === 'multiselect'){
    const cs = (item.cs||[]).map(ci => sh.findIndex(p=>p.i===ci)).sort((x,y)=>x-y);
    return Object.assign({}, item, { a: sh.map(p=>p.text), cs });
  }
  if(item.type && item.type !== 'multiple_choice') return item;  // dd, dropdown: untouched
  return Object.assign({}, item, { a: sh.map(p=>p.text), c: sh.findIndex(p=>p.i===item.c) });
}

function sfx(kind){
  if(muted) return;
  try{
    actx = actx || new (window.AudioContext||window.webkitAudioContext)();
    const t = actx.currentTime;
    const play = (f,st,d,type='sine',g=.11)=>{
      const o=actx.createOscillator(), ga=actx.createGain();
      o.type=type; o.frequency.value=f;
      ga.gain.setValueAtTime(g, t+st);
      ga.gain.exponentialRampToValueAtTime(.001, t+st+d);
      o.connect(ga); ga.connect(actx.destination);
      o.start(t+st); o.stop(t+st+d);
    };
    if(kind==='correct'){ play(660,0,.12); play(880,.09,.16); }
    else if(kind==='wrong'){ play(150,0,.2,'square',.07); }
    else if(kind==='click'){ play(440,0,.06,'triangle',.06); }
    else if(kind==='fanfare'){ [523,659,784,1047].forEach((f,i)=>play(f,i*.12,.3)); }
    else if(kind==='unlock'){ play(392,0,.15); play(523,.13,.15); play(659,.26,.35); }
  }catch(e){}
}
function qpMute(){ muted = !muted; const el=$('#qpMute'); if(el) el.textContent = muted?'🔇':'🔊'; }

function confetti(n=120){
  const c = $('#confettiC'); if(!c) return;
  const x = c.getContext('2d');
  c.width = innerWidth; c.height = innerHeight;
  const cols = ['#e8148b','#7b2ff7','#ffd166','#22b573','#3fb7e8','#ff5da6'];
  const P = [];
  for(let i=0;i<n;i++) P.push({
    x: innerWidth/2 + (Math.random()-.5)*360, y: innerHeight*.4,
    vx:(Math.random()-.5)*14, vy:-6-Math.random()*11,
    s:6+Math.random()*7, r:Math.random()*Math.PI, vr:(Math.random()-.5)*.3, col:cols[i%6]
  });
  let fr = 0;
  (function tick(){
    x.clearRect(0,0,c.width,c.height);
    P.forEach(p=>{ p.x+=p.vx; p.y+=p.vy; p.vy+=.35; p.r+=p.vr;
      x.save(); x.translate(p.x,p.y); x.rotate(p.r); x.fillStyle=p.col;
      x.fillRect(-p.s/2,-p.s/2,p.s,p.s*.6); x.restore(); });
    if(++fr<160) requestAnimationFrame(tick); else x.clearRect(0,0,c.width,c.height);
  })();
}
function flyXP(text, x, y){
  const el = document.createElement('div');
  el.className='flyxp'; el.textContent=text;
  el.style.left=(x||innerWidth/2)+'px'; el.style.top=(y||innerHeight/2)+'px';
  document.body.appendChild(el);
  setTimeout(()=>el.remove(), 1000);
}

function say(t){
  const b = $('#qpBubble'); if(!b) return;
  b.textContent = t; b.style.animation='none'; void b.offsetWidth; b.style.animation='';
}

function launchQuest(title, opts){
  const Q = QUEST_CONTENT[title];
  if(!Q){ toast('🚀','This quest is coming soon!'); return; }
  const review = !!(opts && opts.review);
  const pre = (Q.pre||[]).map(shuffleMC);
  const practice = (Q.practice||[]).map(shuffleMC);
  const post = (Q.post||[]).map(shuffleMC);
  QP = {
    title, Q, land: Q.land,
    step: review ? 2 : 0,
    i:0, preScore:0, practiceXP:0, firstTry:true,
    gScore:0, gCombo:0, gIdx:0, gTime:(Q.game&&Q.game.time)||45, timer:null, postScore:0,
    review, pre, practice, post, busy:false, gStars:0,
    sortSel:null, sortPlaced:{}, sortWrong:0
  };
  $('#qpTitle').textContent = title + (review ? ' · Review' : '');
  $('#qpLand').textContent = 'Land of ' + (LANDS[Q.land]||{}).title;
  $('#questPlayer').classList.add('open');
  if(typeof syncAvatar==='function') syncAvatar();
  say(pick(review
    ? ["Let's sharpen this!","Review time!","You've got this one."]
    : ["Let's do this!","Adventure time!","I believe in you!"]));
  sfx('click');
  renderQP();
}

function qpQuit(){
  if(QP && QP.timer) clearInterval(QP.timer);
  $('#questPlayer').classList.remove('open');
  QP = null;
}

function qpAskQuit(){
  if(!QP) return;
  if(QP.review){ qpQuit(); return; }
  if(QP.step>=5){ qpQuit(); return; }
  if(confirm('Leave this quest? Your progress in this run will not be saved.')) qpQuit();
}

function qpSteps(){
  const steps = QP.review ? ['Practice','Game'] : QP_STEPS;
  const stepIdx = QP.review ? (QP.step===2?0:1) : QP.step;
  $('#qpSteps').innerHTML = steps.map((s,i)=>
    `<span class="qp-step${i<stepIdx?' done':(i===stepIdx?' cur':'')}">${i<stepIdx?'✓ ':''}${s}</span>`).join('');
}

function dots(n, i){
  return `<div class="qp-dots">${Array.from({length:n},(_,k)=>`<span class="qp-dot${k<=i?' on':''}"></span>`).join('')}</div>`;
}

function qList(){
  if(QP.step===0) return QP.pre;
  if(QP.step===2) return QP.practice;
  return QP.post;
}

/* stem figure (inline SVG from the builder's math models) + option bodies
   that may be plain text or {text?, svg?, alt?} — "selectable image" MC. */
function figHtml(item){
  return item && item.figure && item.figure.svg
    ? `<div class="qp-fig" role="img" aria-label="${(item.figure.alt||'').replace(/"/g,'&quot;')}">${item.figure.svg}</div>` : '';
}
function optBody(o){
  if(o && typeof o === 'object'){
    return `${o.svg ? `<span class="qp-optfig">${o.svg}</span>` : ''}${o.text ? `<span>${o.text}</span>` : ''}`;
  }
  return o;
}
function qCard(kicker, item, showHint){
  return `<div class="qp-card">
    <div class="qp-kicker">${kicker}</div>
    <div class="qp-q">${item.q}</div>
    ${figHtml(item)}
    <div class="qp-answers">${item.a.map((o,k)=>`<button class="qp-ans${o&&o.svg?' has-fig':''}" id="ans${k}" onclick="qpAns(${k})">${optBody(o)}</button>`).join('')}</div>
    <div id="qpHintBox">${showHint&&item.hint?`<div class="qp-hint">💡 ${item.hint}</div>`:''}</div>
    ${dots(qList().length, QP.i)}
  </div>`;
}

function itemCard(kicker, item, showHint){
  if(item && item.type==='drag_drop')  return ddCard(kicker, item);
  if(item && item.type==='multiselect') return msCard(kicker, item);
  if(item && item.type==='dropdown')   return dcCard(kicker, item);
  if(item && item.type==='equation_entry') return eqCard(kicker, item);
  if(item && item.type==='graph_plot') return (item.kind==='points' ? ptCard(kicker, item) : gpCard(kicker, item));
  if(item && item.type==='hot_spot') return hsCard(kicker, item);
  if(item && item.type==='match_grid') return mgCard(kicker, item);
  if(item && item.type==='number_line_plot') return nlCard(kicker, item);
  if(item && item.type==='text_entry') return teCard(kicker, item);
  if(item && item.type==='fraction_model') return fmCard(kicker, item);
  if(item && item.type==='hot_text') return htCard(kicker, item);
  return qCard(kicker, item, showHint);
}

/* ---- shared per-item state + shared check plumbing for the tail types ---- */
function stInit(prefix, item, mk){
  const key = prefix + QP.step + ':' + QP.i;
  if(QP.stKey === key) return QP.st;
  QP.stKey = key;
  QP.st = mk(item);
  return QP.st;
}
function stCheck(good, wrongReset, hintFallback){
  const item = qList()[QP.i];
  sfx(good?'correct':'wrong');
  if(QP.step===2){
    if(!good){
      QP.firstTry = false;
      QP.busy = true;
      say('So close — look again!');
      setTimeout(()=>{
        if(wrongReset) wrongReset();
        QP.busy = false;
        renderQP();
        const hb = $('#qpHintBox');
        if(hb) hb.innerHTML = item.hint ? `<div class="qp-hint">💡 ${item.hint}</div>` : `<div class="qp-hint">💡 ${hintFallback}</div>`;
      }, 900);
      return;
    }
    qpPracticeAdvance(document.querySelector('.dd-check'));
    return;
  }
  qpOneShotAdvance(good);
}
const setEq = (a,b) => a.length===b.length && a.slice().sort().every((v,i)=>v===b.slice().sort()[i]);

/* ---- hot spot: tap regions on a figure ---- */
function hsCard(kicker, item){
  const st = stInit('hs', item, ()=>({sel:new Set()}));
  const need = (item.correct||[]).length;
  const regions = item.regions.map(r=>
    `<button class="hs-region${st.sel.has(r.id)?' on':''}" style="left:${r.x}%;top:${r.y}%;width:${r.r*2}%;padding-top:${r.r*2}%" onclick="qpHS('${r.id}')" aria-label="${(r.label||r.id)}"></button>`).join('');
  return `<div class="qp-card">
    <div class="qp-kicker">${kicker}</div>
    <div class="qp-q">${item.q}</div>
    <div class="qp-pick">Pick ${need}</div>
    <div class="qp-fig hs-fig" role="img" aria-label="${(item.figure.alt||'').replace(/"/g,'&quot;')}">${item.figure.svg}${regions}</div>
    <button class="btn btn-primary dd-check" onclick="qpHSCheck()"${st.sel.size===need?'':' disabled'}>Check my answer ✓</button>
    <div id="qpHintBox"></div>
    ${dots(qList().length, QP.i)}
  </div>`;
}
function qpHS(id){
  if(!QP || QP.busy) return;
  const st = QP.st;
  if(st.sel.has(id)) st.sel.delete(id); else st.sel.add(id);
  sfx('click');
  renderQP();
}
function qpHSCheck(){
  if(!QP || QP.busy) return;
  const item = qList()[QP.i];
  const sel = [...QP.st.sel];
  const good = setEq(sel, item.correct||[]);
  item.regions.forEach(r=>{
    const el = document.querySelector(`.hs-region[aria-label="${r.label||r.id}"]`);
    if(el && QP.st.sel.has(r.id)) el.classList.add((item.correct||[]).includes(r.id)?'good':'bad');
  });
  stCheck(good, ()=>{ [...QP.st.sel].forEach(id=>{ if(!(item.correct||[]).includes(id)) QP.st.sel.delete(id); }); }, 'The right taps stayed — find the rest!');
}

/* ---- match table grid: one column per row ---- */
function mgCard(kicker, item){
  const st = stInit('mg', item, ()=>({pick:{}}));
  const head = `<tr><th></th>${item.cols.map(c=>`<th>${c.label}</th>`).join('')}</tr>`;
  const rows = item.rows.map(r=>
    `<tr><td class="mg-rowlbl">${r.label}</td>${item.cols.map(c=>
      `<td><button class="mg-cell${st.pick[r.id]===c.id?' on':''}" id="mg-${r.id}-${c.id}" onclick="qpMG('${r.id}','${c.id}')" aria-label="${r.label}: ${c.label}"></button></td>`).join('')}</tr>`).join('');
  const all = item.rows.every(r=>st.pick[r.id]);
  return `<div class="qp-card">
    <div class="qp-kicker">${kicker}</div>
    <div class="qp-q">${item.q}</div>
    <table class="mg-table">${head}${rows}</table>
    <button class="btn btn-primary dd-check" onclick="qpMGCheck()"${all?'':' disabled'}>Check my answer ✓</button>
    <div id="qpHintBox"></div>
    ${dots(qList().length, QP.i)}
  </div>`;
}
function qpMG(rid, cid){
  if(!QP || QP.busy) return;
  QP.st.pick[rid] = QP.st.pick[rid]===cid ? undefined : cid;
  sfx('click');
  renderQP();
}
function qpMGCheck(){
  if(!QP || QP.busy) return;
  const item = qList()[QP.i];
  const wrong = item.rows.filter(r=>QP.st.pick[r.id] !== item.answer[r.id]).map(r=>r.id);
  const good = wrong.length===0;
  item.rows.forEach(r=>{
    const el = $('#mg-'+r.id+'-'+QP.st.pick[r.id]);
    if(el) el.classList.add(wrong.includes(r.id)?'bad':'good');
  });
  stCheck(good, ()=>{ wrong.forEach(rid=>{ delete QP.st.pick[rid]; }); }, 'The red rows bounced back — try them again!');
}

/* ---- number line: tap to place a point ---- */
function nlCard(kicker, item){
  const st = stInit('nl', item, ()=>({val:null}));
  const min = item.min ?? 0, max = item.max ?? 10, step = item.step || 1;
  const ticks = [];
  for(let v=min; v<=max+1e-9; v+=step){
    const x = ((v-min)/(max-min))*100;
    const whole = Math.abs(v - Math.round(v)) < 1e-9;
    ticks.push(`<div class="nl-tick${whole?' whole':''}" style="left:${x}%">${whole?`<span>${Math.round(v)}</span>`:''}</div>`);
  }
  const marker = st.val===null ? '' : `<div class="nl-marker" id="nlMarker" style="left:${((st.val-min)/(max-min))*100}%"></div>`;
  return `<div class="qp-card">
    <div class="qp-kicker">${kicker}</div>
    <div class="qp-q">${item.q}</div>
    <div class="nl-wrap" onclick="qpNL(event)"><div class="nl-line"></div>${ticks.join('')}${marker}</div>
    <div class="dd-help">Tap the number line to place your point.${st.val!==null?` You picked <b>${st.val}</b>.`:''}</div>
    <button class="btn btn-primary dd-check" onclick="qpNLCheck()"${st.val!==null?'':' disabled'}>Check my answer ✓</button>
    <div id="qpHintBox"></div>
    ${dots(qList().length, QP.i)}
  </div>`;
}
function qpNL(ev){
  if(!QP || QP.busy) return;
  const item = qList()[QP.i];
  const min = item.min ?? 0, max = item.max ?? 10, step = item.step || 1;
  const wrap = ev.currentTarget.getBoundingClientRect();
  const frac = Math.min(1, Math.max(0, (ev.clientX - wrap.left) / wrap.width));
  const raw = min + frac*(max-min);
  const snapped = Math.round((raw - min)/step)*step + min;
  QP.st.val = Math.round(snapped*1000)/1000;
  sfx('click');
  renderQP();
}
function qpNLCheck(){
  if(!QP || QP.busy || QP.st.val===null) return;
  const item = qList()[QP.i];
  const tol = item.tolerance ?? 0.001;
  const good = Math.abs(QP.st.val - item.target) <= tol;
  const m = $('#nlMarker'); if(m) m.classList.add(good?'good':'bad');
  stCheck(good, ()=>{ QP.st.val = null; }, 'Count the tick marks carefully, then tap again.');
}

/* ---- text entry: type a word or phrase ---- */
const teNorm = (x) => String(x??'').trim().toLowerCase().replace(/\s+/g,' ');
function teCard(kicker, item){
  const st = stInit('te', item, ()=>({val:''}));
  return `<div class="qp-card">
    <div class="qp-kicker">${kicker}</div>
    <div class="qp-q">${item.q}</div>
    <input class="te-input" id="teInput" type="text" autocomplete="off" value="${st.val.replace(/"/g,'&quot;')}" oninput="QP.st.val=this.value; const b=document.querySelector('.dd-check'); if(b) b.disabled=!this.value.trim();" placeholder="Type your answer…">
    <button class="btn btn-primary dd-check" onclick="qpTECheck()"${st.val.trim()?'':' disabled'}>Check my answer ✓</button>
    <div id="qpHintBox"></div>
    ${dots(qList().length, QP.i)}
  </div>`;
}
function qpTECheck(){
  if(!QP || QP.busy || !QP.st.val.trim()) return;
  const item = qList()[QP.i];
  const good = (item.accept||[]).some(a=>teNorm(a)===teNorm(QP.st.val));
  const el = $('#teInput'); if(el) el.classList.add(good?'good':'bad');
  stCheck(good, ()=>{}, 'Check your spelling and try again!');
}

/* ---- fraction model: tap parts to shade ---- */
function fmCard(kicker, item){
  const st = stInit('fm', item, ()=>({on:new Set()}));
  const parts = item.parts || 4;
  let fig;
  if(item.shape==='circle'){
    const R=70, C=80;
    const wedge = (i)=>{
      const a0 = (i/parts)*2*Math.PI - Math.PI/2, a1 = ((i+1)/parts)*2*Math.PI - Math.PI/2;
      const x0=C+R*Math.cos(a0), y0=C+R*Math.sin(a0), x1=C+R*Math.cos(a1), y1=C+R*Math.sin(a1);
      return `<path d="M${C},${C} L${x0.toFixed(1)},${y0.toFixed(1)} A${R},${R} 0 0 1 ${x1.toFixed(1)},${y1.toFixed(1)} Z" class="fm-part${st.on.has(i)?' on':''}" onclick="qpFM(${i})"/>`;
    };
    fig = `<svg viewBox="0 0 160 160" class="fm-svg">${Array.from({length:parts},(_,i)=>wedge(i)).join('')}</svg>`;
  } else {
    fig = `<div class="fm-bar">${Array.from({length:parts},(_,i)=>
      `<button class="fm-seg${st.on.has(i)?' on':''}" onclick="qpFM(${i})" aria-label="part ${i+1}"></button>`).join('')}</div>`;
  }
  return `<div class="qp-card">
    <div class="qp-kicker">${kicker}</div>
    <div class="qp-q">${item.q}</div>
    ${fig}
    <div class="dd-help">Tap parts to shade them. Shaded: <b>${st.on.size}</b> of ${parts}</div>
    <button class="btn btn-primary dd-check" onclick="qpFMCheck()"${st.on.size>0?'':' disabled'}>Check my answer ✓</button>
    <div id="qpHintBox"></div>
    ${dots(qList().length, QP.i)}
  </div>`;
}
function qpFM(i){
  if(!QP || QP.busy) return;
  if(QP.st.on.has(i)) QP.st.on.delete(i); else QP.st.on.add(i);
  sfx('click');
  renderQP();
}
function qpFMCheck(){
  if(!QP || QP.busy || !QP.st.on.size) return;
  const item = qList()[QP.i];
  const good = QP.st.on.size === item.target;
  stCheck(good, ()=>{ QP.st.on.clear(); }, `Shade exactly ${item.target} part${item.target===1?'':'s'}.`);
}

/* ---- coordinate points: tap grid intersections ---- */
function ptCard(kicker, item){
  const st = stInit('pt', item, ()=>({pts:[]}));
  const G = item.gridMax || 10, need = (item.targets||[]).length;
  const size = 300, cell = size/G;
  let grid = '';
  for(let i=0;i<=G;i++){
    grid += `<line x1="${i*cell}" y1="0" x2="${i*cell}" y2="${size}" class="pt-line"/><line x1="0" y1="${i*cell}" x2="${size}" y2="${i*cell}" class="pt-line"/>`;
    if(i<G||i===G){ grid += `<text x="${i*cell}" y="${size+16}" class="pt-lbl" text-anchor="middle">${i}</text><text x="-8" y="${size-i*cell+4}" class="pt-lbl" text-anchor="end">${i}</text>`; }
  }
  const marks = st.pts.map(p=>`<circle cx="${p.x*cell}" cy="${size-p.y*cell}" r="9" class="pt-dot" data-x="${p.x}" data-y="${p.y}"/>`).join('');
  return `<div class="qp-card">
    <div class="qp-kicker">${kicker}</div>
    <div class="qp-q">${item.q}</div>
    <div class="qp-pick">Place ${need} point${need===1?'':'s'}</div>
    <svg viewBox="-24 -8 ${size+40} ${size+32}" class="pt-svg" onclick="qpPT(event, ${G}, ${size})">${grid}${marks}</svg>
    <button class="btn btn-primary dd-check" onclick="qpPTCheck()"${st.pts.length===need?'':' disabled'}>Check my answer ✓</button>
    <div id="qpHintBox"></div>
    ${dots(qList().length, QP.i)}
  </div>`;
}
function qpPT(ev, G, size){
  if(!QP || QP.busy) return;
  const svg = ev.currentTarget;
  const pt = svg.createSVGPoint(); pt.x = ev.clientX; pt.y = ev.clientY;
  const p = pt.matrixTransform(svg.getScreenCTM().inverse());
  const cell = size/G;
  const x = Math.round(p.x/cell), y = Math.round((size-p.y)/cell);
  if(x<0||y<0||x>G||y>G) return;
  const st = QP.st;
  const at = st.pts.findIndex(q=>q.x===x&&q.y===y);
  if(at>=0) st.pts.splice(at,1); else st.pts.push({x,y});
  sfx('click');
  renderQP();
}
function qpPTCheck(){
  if(!QP || QP.busy) return;
  const item = qList()[QP.i];
  const key = (p)=>p.x+','+p.y;
  const good = setEq(QP.st.pts.map(key), (item.targets||[]).map(key));
  document.querySelectorAll('.pt-dot').forEach(d=>{
    const hit = (item.targets||[]).some(t=>String(t.x)===d.dataset.x && String(t.y)===d.dataset.y);
    d.classList.add(hit?'good':'bad');
  });
  stCheck(good, ()=>{ QP.st.pts = QP.st.pts.filter(p=>(item.targets||[]).some(t=>t.x===p.x&&t.y===p.y)); }, 'Remember: across first (x), then up (y)!');
}

/* ---- hot text: tap the words/phrases ---- */
function htCard(kicker, item){
  const st = stInit('ht', item, ()=>({sel:new Set()}));
  const spans = item.parts.filter(p=>typeof p==='object');
  const need = spans.filter(p=>p.correct).length;
  const bodyHtml = item.parts.map(p=> typeof p==='string' ? p :
    `<button class="ht-span${st.sel.has(p.id)?' on':''}" id="ht-${p.id}" onclick="qpHT('${p.id}')">${p.text}</button>`).join('');
  return `<div class="qp-card">
    <div class="qp-kicker">${kicker}</div>
    <div class="qp-q" style="font-size:22px">${item.q}</div>
    <div class="qp-pick">Pick ${need}</div>
    <div class="ht-text">${bodyHtml}</div>
    <button class="btn btn-primary dd-check" onclick="qpHTCheck()"${st.sel.size===need?'':' disabled'}>Check my answer ✓</button>
    <div id="qpHintBox"></div>
    ${dots(qList().length, QP.i)}
  </div>`;
}
function qpHT(id){
  if(!QP || QP.busy) return;
  if(QP.st.sel.has(id)) QP.st.sel.delete(id); else QP.st.sel.add(id);
  sfx('click');
  renderQP();
}
function qpHTCheck(){
  if(!QP || QP.busy) return;
  const item = qList()[QP.i];
  const correct = item.parts.filter(p=>typeof p==='object'&&p.correct).map(p=>p.id);
  const good = setEq([...QP.st.sel], correct);
  [...QP.st.sel].forEach(id=>{ const el=$('#ht-'+id); if(el) el.classList.add(correct.includes(id)?'good':'bad'); });
  stCheck(good, ()=>{ [...QP.st.sel].forEach(id=>{ if(!correct.includes(id)) QP.st.sel.delete(id); }); }, 'Your right picks stayed — reread for the rest!');
}

/* ---- graphing item renderer (STAAR "graphing", Grade-3 flavor) ----
   { type:'graph_plot', kind:'bars', q, max, categories:[{label,target}], hint? }
   Students raise each bar with +/− to match the data. kind:'points'
   (coordinate plotting) is reserved for upper-grade worlds.              */
function gpInitIfNeeded(item){
  const key = 'gp' + QP.step + ':' + QP.i;
  if(QP.gpKey === key) return;
  QP.gpKey = key;
  QP.gpVals = item.categories.map(()=>0);
  QP.gpTouched = false;
}
function gpCard(kicker, item){
  gpInitIfNeeded(item);
  const max = item.max || 10;
  const cols = item.categories.map((cat,i)=>{
    const v = QP.gpVals[i];
    return `<div class="gp-col">
      <div class="gp-val">${v}</div>
      <div class="gp-barwrap"><div class="gp-bar" id="gpbar${i}" style="height:${(v/max)*100}%"></div></div>
      <div class="gp-lbl">${cat.label}</div>
      <div class="gp-btns">
        <button class="gp-btn" onclick="qpGP(${i},-1)">−</button>
        <button class="gp-btn" onclick="qpGP(${i},1)">+</button>
      </div>
    </div>`;
  }).join('');
  const lines = [];
  for(let y=max; y>=0; y--) lines.push(`<div class="gp-line"><span>${y}</span></div>`);
  return `<div class="qp-card gp-card">
    <div class="qp-kicker">${kicker}</div>
    <div class="qp-q" style="font-size:22px">${item.q}</div>
    <div class="gp-chart">
      <div class="gp-grid">${lines.join('')}</div>
      <div class="gp-cols">${cols}</div>
    </div>
    <button class="btn btn-primary dd-check" onclick="qpGPCheck()"${QP.gpTouched?'':' disabled'}>Check my graph ✓</button>
    <div id="qpHintBox"></div>
    ${dots(qList().length, QP.i)}
  </div>`;
}
function qpGP(i, d){
  if(!QP || QP.busy) return;
  const item = qList()[QP.i];
  const max = item.max || 10;
  QP.gpVals[i] = Math.max(0, Math.min(max, QP.gpVals[i] + d));
  QP.gpTouched = true;
  sfx('click');
  renderQP();
}
function qpGPCheck(){
  if(!QP || QP.busy || !QP.gpTouched) return;
  const item = qList()[QP.i];
  const wrong = item.categories.map((c,i)=>i).filter(i=>QP.gpVals[i] !== item.categories[i].target);
  const good = wrong.length===0;
  item.categories.forEach((_,i)=>{
    const el = $('#gpbar'+i); if(!el) return;
    el.classList.add(wrong.includes(i)?'bad':'good');
  });
  sfx(good?'correct':'wrong');
  if(QP.step===2){
    if(!good){
      QP.firstTry = false;
      QP.busy = true;
      say('Check the red bars against the data!');
      setTimeout(()=>{
        QP.busy = false;
        renderQP();
        const hb = $('#qpHintBox');
        if(hb) hb.innerHTML = item.hint ? `<div class="qp-hint">💡 ${item.hint}</div>` : `<div class="qp-hint">💡 Count again — then raise or lower the red bars.</div>`;
      }, 900);
      return;
    }
    qpPracticeAdvance(document.querySelector('.dd-check'));
    return;
  }
  qpOneShotAdvance(good);
}

/* ---- equation-entry item renderer (STAAR "equation editor") ----
   { type:'equation_entry', q, accept:['24','4×6=24', …], hint? }
   Students build the answer on a keypad; grading = normalized match against
   the accept list, with a numeric fallback so 24 and 24.0 both pass.       */
const EQ_KEYS = [['7','8','9','÷'],['4','5','6','×'],['1','2','3','−'],['0','.','=','+']];
function eqNorm(s){
  return String(s??'').replace(/\s+/g,'').replace(/[*xX]/g,'×').replace(/\//g,'÷').replace(/-/g,'−');
}
function eqInitIfNeeded(item){
  const key = 'eq' + QP.step + ':' + QP.i;
  if(QP.eqKey === key) return;
  QP.eqKey = key;
  QP.eqStr = '';
}
function eqCard(kicker, item){
  eqInitIfNeeded(item);
  return `<div class="qp-card">
    <div class="qp-kicker">${kicker}</div>
    <div class="qp-q">${item.q}</div>
    ${figHtml(item)}
    <div class="qp-eq-display" id="eqDisplay">${QP.eqStr || '<span class="eq-ghost">Build your answer…</span>'}</div>
    <div class="qp-keypad">
      ${EQ_KEYS.map(row => row.map(k =>
        `<button class="qp-key${/[÷×−+=.]/.test(k)?' op':''}" onclick="qpEQKey('${k}')">${k}</button>`).join('')).join('')}
      <button class="qp-key util" onclick="qpEQBack()">⌫</button>
      <button class="qp-key util" onclick="qpEQClear()">Clear</button>
    </div>
    <button class="btn btn-primary dd-check" onclick="qpEQCheck()"${QP.eqStr?'':' disabled'}>Check my answer ✓</button>
    <div id="qpHintBox"></div>
    ${dots(qList().length, QP.i)}
  </div>`;
}
function qpEQKey(k){
  if(!QP || QP.busy) return;
  if(QP.eqStr.length >= 24) return;
  QP.eqStr += k;
  sfx('click');
  renderQP();
}
function qpEQBack(){ if(!QP || QP.busy) return; QP.eqStr = QP.eqStr.slice(0,-1); renderQP(); }
function qpEQClear(){ if(!QP || QP.busy) return; QP.eqStr = ''; renderQP(); }
function eqMatches(item, input){
  const inp = eqNorm(input);
  if((item.accept||[]).some(a => eqNorm(a) === inp)) return true;
  const n = Number(inp.replace(/−/g,'-'));
  if(!Number.isNaN(n)){
    return (item.accept||[]).some(a => {
      const an = Number(eqNorm(a).replace(/−/g,'-'));
      return !Number.isNaN(an) && Math.abs(an - n) < 1e-9;
    });
  }
  return false;
}
function qpEQCheck(){
  if(!QP || QP.busy || !QP.eqStr) return;
  const item = qList()[QP.i];
  const good = eqMatches(item, QP.eqStr);
  const disp = $('#eqDisplay');
  if(disp) disp.classList.add(good?'good':'bad');
  sfx(good?'correct':'wrong');
  if(QP.step===2){
    if(!good){
      QP.firstTry = false;
      QP.busy = true;
      say('Check your equation — try again!');
      setTimeout(()=>{
        QP.busy = false;
        renderQP();
        const hb = $('#qpHintBox');
        if(hb) hb.innerHTML = item.hint ? `<div class="qp-hint">💡 ${item.hint}</div>` : `<div class="qp-hint">💡 Use ⌫ to fix it, then check again!</div>`;
      }, 900);
      return;
    }
    qpPracticeAdvance(document.querySelector('.dd-check'));
    return;
  }
  qpOneShotAdvance(good);
}

/* ---- multiselect item renderer ----
   { type:'multiselect', q, a:[options], cs:[correct indices], hint? }
   The stem should say how many to pick; we also show a "Pick N" chip.    */
function msInitIfNeeded(item){
  const key = 'ms' + QP.step + ':' + QP.i;
  if(QP.msKey === key) return;
  QP.msKey = key;
  QP.msSel = new Set();
}
function msCard(kicker, item){
  msInitIfNeeded(item);
  const need = (item.cs||[]).length;
  return `<div class="qp-card">
    <div class="qp-kicker">${kicker}</div>
    <div class="qp-q">${item.q}</div>
    ${figHtml(item)}
    <div class="qp-pick">Pick ${need}</div>
    <div class="qp-answers">${item.a.map((o,k)=>
      `<button class="qp-ans qp-ms${QP.msSel.has(k)?' picked':''}${o&&o.svg?' has-fig':''}" id="ans${k}" onclick="qpMSToggle(${k})">${optBody(o)}</button>`).join('')}</div>
    <button class="btn btn-primary dd-check" onclick="qpMSCheck()"${QP.msSel.size===need?'':' disabled'}>Check my answer ✓</button>
    <div id="qpHintBox"></div>
    ${dots(qList().length, QP.i)}
  </div>`;
}
function qpMSToggle(k){
  if(!QP || QP.busy) return;
  if(QP.msSel.has(k)) QP.msSel.delete(k); else QP.msSel.add(k);
  sfx('click');
  renderQP();
}
function qpMSCheck(){
  if(!QP || QP.busy) return;
  const item = qList()[QP.i];
  const sel = [...QP.msSel].sort((a,b)=>a-b);
  const want = (item.cs||[]).slice().sort((a,b)=>a-b);
  const good = sel.length===want.length && want.every((v,i)=>v===sel[i]);
  item.a.forEach((_,k)=>{
    const el = $('#ans'+k); if(!el) return;
    if(want.includes(k) && QP.msSel.has(k)) el.classList.add('correct');
    else if(QP.msSel.has(k)) el.classList.add('wrong');
  });
  sfx(good?'correct':'wrong');
  if(QP.step===2){
    if(!good){
      QP.firstTry = false;
      QP.busy = true;
      say('Almost — check the marked ones!');
      setTimeout(()=>{
        [...QP.msSel].forEach(k=>{ if(!want.includes(k)) QP.msSel.delete(k); });
        QP.busy = false;
        renderQP();
        const hb = $('#qpHintBox');
        if(hb) hb.innerHTML = item.hint ? `<div class="qp-hint">💡 ${item.hint}</div>` : `<div class="qp-hint">💡 The right picks stayed — find the rest!</div>`;
      }, 900);
      return;
    }
    qpPracticeAdvance(document.querySelector('.dd-check'));
    return;
  }
  qpOneShotAdvance(good);
}

/* ---- inline choice (dropdown-in-sentence) item renderer ----
   { type:'dropdown', q:'A triangle has [b1] sides.', blanks:{b1:{opts:[...], c:0}}, hint? } */
function dcInitIfNeeded(item){
  const key = 'dc' + QP.step + ':' + QP.i;
  if(QP.dcKey === key) return;
  QP.dcKey = key;
  QP.dcSel = {};
}
function dcCard(kicker, item){
  dcInitIfNeeded(item);
  const ids = Object.keys(item.blanks||{});
  const stem = item.q.replace(/\[(b\d+)\]/g, (_, b)=>{
    const bl = item.blanks[b]; if(!bl) return '____';
    return `<select class="qp-blank" id="blank-${b}" onchange="qpDCPick('${b}', this)">
      <option value="">— pick —</option>
      ${bl.opts.map((o,i)=>`<option value="${i}"${QP.dcSel[b]===i?' selected':''}>${o}</option>`).join('')}
    </select>`;
  });
  const allPicked = ids.every(b=>QP.dcSel[b]!==undefined);
  return `<div class="qp-card">
    <div class="qp-kicker">${kicker}</div>
    <div class="qp-q qp-dcq">${stem}</div>
    ${figHtml(item)}
    <button class="btn btn-primary dd-check" onclick="qpDCCheck()"${allPicked?'':' disabled'}>Check my answer ✓</button>
    <div id="qpHintBox"></div>
    ${dots(qList().length, QP.i)}
  </div>`;
}
function qpDCPick(b, el){
  if(!QP || QP.busy) return;
  if(el.value==='') delete QP.dcSel[b]; else QP.dcSel[b] = Number(el.value);
  sfx('click');
  renderQP();
}
function qpDCCheck(){
  if(!QP || QP.busy) return;
  const item = qList()[QP.i];
  const ids = Object.keys(item.blanks||{});
  const wrongIds = ids.filter(b=>QP.dcSel[b] !== item.blanks[b].c);
  const good = wrongIds.length===0;
  ids.forEach(b=>{
    const el = $('#blank-'+b); if(!el) return;
    el.classList.add(wrongIds.includes(b)?'bad':'good');
  });
  sfx(good?'correct':'wrong');
  if(QP.step===2){
    if(!good){
      QP.firstTry = false;
      QP.busy = true;
      say('So close — fix the red ones!');
      setTimeout(()=>{
        wrongIds.forEach(b=>{ delete QP.dcSel[b]; });
        QP.busy = false;
        renderQP();
        const hb = $('#qpHintBox');
        if(hb) hb.innerHTML = item.hint ? `<div class="qp-hint">💡 ${item.hint}</div>` : `<div class="qp-hint">💡 Read the sentence again with each choice!</div>`;
      }, 900);
      return;
    }
    qpPracticeAdvance(document.querySelector('.dd-check'));
    return;
  }
  qpOneShotAdvance(good);
}

function renderQP(){
  QP.busy = false;
  qpSteps();
  const B = $('#qpBody');
  if(QP.step===0){ B.innerHTML = itemCard('Warm-up · show what you know', qList()[QP.i], false); }
  else if(QP.step===1){ B.innerHTML = `<div class="qp-card">${QP.Q.lesson}</div>`; say('Watch closely… ✨'); }
  else if(QP.step===2){
    // firstTry is per-ITEM, not per-render — drag_drop re-renders on every tap
    const fk = QP.step + ':' + QP.i;
    if(QP.ftKey !== fk){ QP.ftKey = fk; QP.firstTry = true; }
    B.innerHTML = itemCard('Practice · hints unlocked', qList()[QP.i], false);
  }
  else if(QP.step===3){
    const kind = (QP.Q.game && QP.Q.game.type) || 'smash';
    const title = kind==='sort' ? '🧩 Crystal Sort!' : '💥 Crystal Smash!';
    B.innerHTML = `<div class="qp-card">
      <div class="qp-kicker">Mini-Game</div>
      <h3 class="qp-lt">${title}</h3>
      <p class="qp-lp">${QP.Q.game.intro||''}</p>
      <button class="btn btn-primary" onclick="qpStartGame()">Start! 🎮</button></div>`;
    say('My favorite part!');
  }
  else if(QP.step===4){
    B.innerHTML = itemCard('Post-Test · prove it!', qList()[QP.i], false);
    if(QP.i===0) say('Show what you learned!');
  }
}

function qpNext(){ QP.step++; QP.i=0; renderQP(); }

/* Shared advance paths — every item type (MC, drag_drop, …) scores through
   these so pre/practice/post semantics stay identical across types. */
function qpPracticeAdvance(anchorEl){
  QP.busy = true;
  if(QP.firstTry){
    QP.practiceXP+=5;
    if(anchorEl){ const r=anchorEl.getBoundingClientRect(); flyXP('+5 XP', r.left+r.width/2, r.top); }
  }
  say(pick(CHEERS));
  setTimeout(()=>{ QP.i++; QP.firstTry=true;
    if(QP.i>=qList().length){ QP.step=3; renderQP(); } else renderQP(); }, 700);
}
function qpOneShotAdvance(good){
  QP.busy = true;
  if(QP.step===0 && good) QP.preScore++;
  if(QP.step===4 && good) QP.postScore++;
  if(good) say(pick(CHEERS)); else say("No worries — we'll learn it!");
  setTimeout(()=>{
    QP.i++;
    if(QP.i < qList().length){ renderQP(); return; }
    if(QP.step===0){ QP.step=1; renderQP(); }
    else {
      if(QP.review){ qpReviewDone(); return; }
      if(QP.postScore>=2) qpResults();
      else { QP.step=1; QP.postScore=0; say("Let's review together — you're close!"); renderQP(); toast('💪',"Almost! One more look at the lesson."); }
    }
  }, 700);
}

function qpAns(k){
  if(!QP || QP.busy) return;
  const item = qList()[QP.i];
  const good = k===item.c;
  const el = $('#ans'+k);
  el.classList.add(good?'correct':'wrong');
  sfx(good?'correct':'wrong');
  if(QP.step===2){
    if(!good){
      QP.firstTry=false;
      $('#qpHintBox').innerHTML = item.hint ? `<div class="qp-hint">💡 ${item.hint}</div>` : `<div class="qp-hint">💡 Try another crystal!</div>`;
      say('Try again — use the hint!');
      return;
    }
    qpPracticeAdvance(el);
    return;
  }
  qpOneShotAdvance(good);
}

/* ---- drag_drop item renderer (tap-to-place, same pattern as Crystal Sort) ----
   Item shape (shared contract):
   { type:'drag_drop', q, zones:[{id,label}], tokens:[{id,text}],
     answer:{zoneId:[tokenIds]}, hint? }                                       */
function ddInitIfNeeded(item){
  const key = QP.step + ':' + QP.i;
  if(QP.ddKey === key) return;
  QP.ddKey = key;
  QP.ddSel = null;
  QP.ddPlace = {};                             // tokenId -> zoneId
  QP.ddOrder = shuffle(item.tokens.map(t=>t.id));
}
function ddCard(kicker, item){
  ddInitIfNeeded(item);
  const tokById = {};
  item.tokens.forEach(t=>{ tokById[t.id]=t; });
  const zones = item.zones.map(z=>{
    const placed = Object.keys(QP.ddPlace).filter(tid=>QP.ddPlace[tid]===z.id);
    return `<div class="dd-zone${QP.ddSel?' target':''}" onclick="qpDDZone('${z.id}')">
      <div class="dd-zone-h">${z.label}</div>
      <div class="dd-zone-items">${placed.map(tid=>
        `<button class="dd-chip in" id="ddtok-${tid}" onclick="qpDDReturn(event,'${tid}')">${tokById[tid].text}</button>`).join('')
        || '<span class="dd-empty">Tap here</span>'}</div>
    </div>`;
  }).join('');
  const pool = QP.ddOrder.filter(tid=>!(tid in QP.ddPlace)).map(tid=>
    `<button class="dd-chip${QP.ddSel===tid?' sel':''}" id="ddtok-${tid}" onclick="qpDDPick('${tid}')">${tokById[tid].text}</button>`).join('');
  const allPlaced = Object.keys(QP.ddPlace).length === item.tokens.length;
  return `<div class="qp-card dd-card">
    <div class="qp-kicker">${kicker}</div>
    <div class="qp-q dd-q">${item.q}</div>
    ${figHtml(item)}
    <div class="dd-zones">${zones}</div>
    <div class="dd-pool">${pool || '<span class="dd-empty">All placed — check your answer!</span>'}</div>
    <div class="dd-help">Tap a crystal, then tap the group it belongs in. Tap a placed crystal to take it back.</div>
    <button class="btn btn-primary dd-check" onclick="qpDDCheck()"${allPlaced?'':' disabled'}>Check my answer ✓</button>
    <div id="qpHintBox"></div>
    ${dots(qList().length, QP.i)}
  </div>`;
}
function qpDDPick(tid){
  if(!QP || QP.busy) return;
  QP.ddSel = QP.ddSel===tid ? null : tid;
  sfx('click');
  renderQP();
}
function qpDDZone(zid){
  if(!QP || QP.busy || !QP.ddSel) return;
  QP.ddPlace[QP.ddSel] = zid;
  QP.ddSel = null;
  sfx('click');
  renderQP();
}
function qpDDReturn(ev, tid){
  ev.stopPropagation();
  if(!QP || QP.busy) return;
  delete QP.ddPlace[tid];
  QP.ddSel = null;
  renderQP();
}
function ddCorrectZone(item, tid){
  const z = item.zones.find(z=> (item.answer[z.id]||[]).includes(tid));
  return z ? z.id : null;
}
function qpDDCheck(){
  if(!QP || QP.busy) return;
  const item = qList()[QP.i];
  if(Object.keys(QP.ddPlace).length !== item.tokens.length) return;
  const wrong = item.tokens.filter(t=> QP.ddPlace[t.id] !== ddCorrectZone(item, t.id)).map(t=>t.id);
  const good = wrong.length===0;
  item.tokens.forEach(t=>{
    const el = $('#ddtok-'+t.id);
    if(el) el.classList.add(wrong.includes(t.id)?'bad':'good');
  });
  sfx(good?'correct':'wrong');
  if(QP.step===2){
    if(!good){
      QP.firstTry = false;
      QP.busy = true;
      say('So close — the red ones bounced back!');
      setTimeout(()=>{
        wrong.forEach(tid=>{ delete QP.ddPlace[tid]; });
        QP.busy = false;
        renderQP();
        const hb = $('#qpHintBox');
        if(hb) hb.innerHTML = item.hint ? `<div class="qp-hint">💡 ${item.hint}</div>` : `<div class="qp-hint">💡 Look again at the ones that came back!</div>`;
      }, 900);
      return;
    }
    qpPracticeAdvance(document.querySelector('.dd-check'));
    return;
  }
  qpOneShotAdvance(good);
}

function qpStartGame(){
  const kind = (QP.Q.game && QP.Q.game.type) || 'smash';
  if(kind==='sort'){ qpStartSort(); return; }
  QP.gIdx=0; QP.gScore=0; QP.gCombo=0; QP.gTime=QP.Q.game.time||45;
  renderGame();
  QP.timer = setInterval(()=>{
    QP.gTime -= .1;
    const bar = $('#qpTimerBar');
    if(bar) bar.style.width = Math.max(0, QP.gTime/QP.Q.game.time*100)+'%';
    if(QP.gTime<=0){ clearInterval(QP.timer); gameOver(); }
  }, 100);
}

function renderGame(){
  const P = QP.Q.game.problems[QP.gIdx];
  const order = shuffle(P.opts);
  $('#qpBody').innerHTML = `<div class="qp-game">
    <div class="qp-ghud"><span>Problem ${QP.gIdx+1}/${QP.Q.game.problems.length}</span><span>⭐ ${QP.gScore}</span><span class="combo">${QP.gCombo>1?'🔥 Combo ×'+QP.gCombo:''}</span></div>
    <div class="qp-timer"><i id="qpTimerBar" style="width:${Math.max(0, QP.gTime/QP.Q.game.time*100)}%"></i></div>
    <div class="qp-gq">${P.q} = ?</div>
    <div class="qp-crystals">${order.map((o,k)=>
      `<button class="qp-crystal c${k}" style="left:${SLOTS[k][0]}%;top:${SLOTS[k][1]}%;animation-delay:${k*.4}s" onclick='qpCrystal(this, ${JSON.stringify(String(o))}, ${JSON.stringify(String(P.c))})'>${o}</button>`).join('')}
    </div></div>`;
}

function qpCrystal(el, val, correct){
  if(String(val)===String(correct)){
    QP.gCombo++; const pts = 10 + (QP.gCombo-1)*2; QP.gScore += pts;
    sfx('correct'); el.classList.add('shatter');
    const r = el.getBoundingClientRect(); flyXP('+'+pts, r.left+r.width/2, r.top);
    if(QP.gCombo===3) say('🔥 ON FIRE!');
    setTimeout(()=>{
      QP.gIdx++;
      if(QP.gIdx >= QP.Q.game.problems.length){ clearInterval(QP.timer); gameOver(); }
      else renderGame();
    }, 380);
  } else {
    QP.gCombo=0; sfx('wrong');
    el.classList.remove('wob'); void el.offsetWidth; el.classList.add('wob');
  }
}

function gameOver(){
  if(QP.timer){ clearInterval(QP.timer); QP.timer = null; }
  const max = QP.Q.game.problems.length;
  const solved = QP.gIdx;
  QP.gStars = solved>=max ? 3 : (solved>=Math.ceil(max*.6) ? 2 : 1);
  const nextLabel = QP.review ? 'Finish review ✦' : 'Final challenge → Post-Test 🏆';
  const nextFn = QP.review ? 'qpReviewDone()' : 'qpNext()';
  $('#qpBody').innerHTML = `<div class="qp-card">
    <div class="qp-kicker">Game Over</div>
    <div class="qp-stars">${'⭐'.repeat(QP.gStars)}${'☆'.repeat(3-QP.gStars)}</div>
    <h3 class="qp-lt">Score: ${QP.gScore}</h3>
    <p class="qp-lp">You smashed ${solved} of ${max} crystals!</p>
    <button class="btn btn-primary" onclick="${nextFn}">${nextLabel}</button></div>`;
  say(QP.gStars===3?'PERFECT SMASH!':'Great smashing!');
}

/* ---- Crystal Sort ---- */
function qpStartSort(){
  QP.sortSel = null;
  QP.sortPlaced = {};
  QP.sortWrong = 0;
  QP.gScore = 0;
  QP.gTime = 60;
  renderSort();
  QP.timer = setInterval(()=>{
    QP.gTime -= .1;
    const bar = $('#qpTimerBar');
    if(bar) bar.style.width = Math.max(0, QP.gTime/60*100)+'%';
    if(QP.gTime<=0){ clearInterval(QP.timer); sortOver(false); }
  }, 100);
}

function renderSort(){
  const G = QP.Q.game;
  const remaining = G.items.map((it,i)=>({it,i})).filter(x=> QP.sortPlaced[x.i]==null);
  const bins = G.bins.map(b=>{
    const filled = G.items.map((it,i)=>({it,i})).filter(x=>QP.sortPlaced[x.i]===b.id);
    return `<div class="sort-bin" data-bin="${b.id}" onclick="qpSortBin('${b.id}')" style="--bin:${b.color||'#7b2ff7'}">
      <div class="sort-bin-h">${b.label}</div>
      <div class="sort-bin-items">${filled.map(x=>`<span class="sort-chip in">${x.it.text}</span>`).join('')||'<span class="sort-empty">Drop here</span>'}</div>
    </div>`;
  }).join('');
  $('#qpBody').innerHTML = `<div class="qp-game sort-wrap">
    <div class="qp-ghud"><span>Sorted ${Object.keys(QP.sortPlaced).length}/${G.items.length}</span><span>⭐ ${QP.gScore}</span></div>
    <div class="qp-timer"><i id="qpTimerBar" style="width:${Math.max(0, QP.gTime/60*100)}%"></i></div>
    <div class="sort-bins">${bins}</div>
    <div class="sort-pool">${remaining.map(x=> {
      const sel = QP.sortSel===x.i ? ' sel' : '';
      return `<button class="sort-chip${sel}" onclick="qpSortPick(${x.i})">${x.it.text}</button>`;
    }).join('') || '<span class="sort-done-hint">All sorted!</span>'}</div>
    <p class="sort-help">Tap a crystal, then tap the bin it belongs in.</p>
  </div>`;
}

function qpSortPick(i){
  QP.sortSel = i;
  renderSort();
}
function qpSortBin(binId){
  if(QP.sortSel==null){ say('Pick a crystal first!'); return; }
  const item = QP.Q.game.items[QP.sortSel];
  if(item.bin===binId){
    QP.sortPlaced[QP.sortSel] = binId;
    QP.gScore += 12;
    sfx('correct');
    const idx = QP.sortSel;
    QP.sortSel = null;
    flyXP('+12', innerWidth/2, innerHeight/2);
    if(Object.keys(QP.sortPlaced).length >= QP.Q.game.items.length){
      clearInterval(QP.timer); sortOver(true);
    } else renderSort();
  } else {
    QP.sortWrong++;
    sfx('wrong');
    say('Not that bin — try the other one!');
    QP.sortSel = null;
    renderSort();
  }
}

function sortOver(perfect){
  if(QP.timer){ clearInterval(QP.timer); QP.timer = null; }
  const total = QP.Q.game.items.length;
  const got = Object.keys(QP.sortPlaced).length;
  QP.gStars = got===total ? (QP.sortWrong===0?3:2) : (got>=Math.ceil(total*.6)?2:1);
  const nextLabel = QP.review ? 'Finish review ✦' : 'Final challenge → Post-Test 🏆';
  const nextFn = QP.review ? 'qpReviewDone()' : 'qpNext()';
  $('#qpBody').innerHTML = `<div class="qp-card">
    <div class="qp-kicker">Sort Complete</div>
    <div class="qp-stars">${'⭐'.repeat(QP.gStars)}${'☆'.repeat(3-QP.gStars)}</div>
    <h3 class="qp-lt">Score: ${QP.gScore}</h3>
    <p class="qp-lp">You sorted ${got} of ${total} crystals${QP.sortWrong?` · ${QP.sortWrong} mix-ups`:''}.</p>
    <button class="btn btn-primary" onclick="${nextFn}">${nextLabel}</button></div>`;
  say(QP.gStars===3?'Perfect sort!':'Nice sorting!');
}

function qpResults(){
  const gameXP = Math.round(QP.gScore/4);
  const postXP = QP.postScore*5;
  QP.totalXP = 25 + QP.practiceXP + gameXP + postXP;
  qpStepsDone();
  $('#qpBody').innerHTML = `<div class="qp-card">
    <div class="qp-kicker">Quest Complete!</div>
    <div class="qp-stars">${'⭐'.repeat(QP.gStars||2)}${'☆'.repeat(3-(QP.gStars||2))}</div>
    <h3 class="qp-lt">${QP.title} — Conquered!</h3>
    <div class="qp-tally">
      <div class="tr"><span>Quest complete</span><span>+25 XP</span></div>
      <div class="tr"><span>Practice (first-try)</span><span>+${QP.practiceXP} XP</span></div>
      <div class="tr"><span>Mini-game score</span><span>+${gameXP} XP</span></div>
      <div class="tr"><span>Post-Test (${QP.postScore}/3)</span><span>+${postXP} XP</span></div>
      <div class="tr total"><span>Total</span><span>+${QP.totalXP} XP</span></div>
    </div>
    <button class="btn btn-primary" onclick="qpClaim()">Claim Reward ✦</button></div>`;
  say('WE DID IT!! 🎉');
  sfx('fanfare'); confetti(130);
}
function qpStepsDone(){
  QP.step=5;
  $('#qpSteps').innerHTML = QP_STEPS.map(s=>`<span class="qp-step done">✓ ${s}</span>`).join('');
}

function qpReviewDone(){
  if(QP.timer){ clearInterval(QP.timer); QP.timer=null; }
  $('#qpBody').innerHTML = `<div class="qp-card">
    <div class="qp-kicker">Review complete</div>
    <div class="qp-stars">${'⭐'.repeat(QP.gStars||2)}</div>
    <h3 class="qp-lt">Looking sharp!</h3>
    <p class="qp-lp">You already conquered ${QP.title}. Keep those skills sparkling.</p>
    <button class="btn btn-primary" onclick="qpQuit()">Back to the map ✦</button></div>`;
  say('Still got it!');
}

function qpClaim(){
  const title = QP.title, land = QP.Q.land, xp = QP.totalXP, stars = QP.gStars||2, post = QP.postScore;
  qpQuit();
  addXP(xp);
  const result = applyQuestComplete(title, land, { xp, stars, postScore: post });
  if(typeof afterQuestComplete==='function') afterQuestComplete(title, land, result);
}

/* ---- drag_drop demo (dev-only): open index.html?demo=dragdrop ----
   A fixture quest showing the drag_drop item type in every step it can
   appear in. Not part of canon content — real items come from the builder. */
const DD_DEMO_QUEST = {
  land: 'mult',
  pre: [
    { type:'drag_drop', q:'Drag each number into the group where it belongs.',
      zones:[{id:'z1',label:'Multiples of 5'},{id:'z2',label:'NOT multiples of 5'}],
      tokens:[{id:'t1',text:'15'},{id:'t2',text:'12'},{id:'t3',text:'30'},{id:'t4',text:'8'}],
      answer:{ z1:['t1','t3'], z2:['t2','t4'] } },
    { q:'5 × 4 = ?', a:['9','20','25','45'], c:1 }
  ],
  lesson: '<div class="qp-kicker">Lesson</div><h3 class="qp-lt">Groups have RULES</h3><p class="qp-lp">A sorting question gives every group a rule. Read the rule, test each crystal against it, then place it. Multiples of 5 always end in 0 or 5!</p><button class="btn btn-primary" onclick="qpNext()">Got it — let\'s practice! ✏️</button>',
  practice: [
    { type:'drag_drop', q:'Sort the facts: which equal 24 and which equal 18?',
      zones:[{id:'z1',label:'Equals 24'},{id:'z2',label:'Equals 18'}],
      tokens:[{id:'t1',text:'6 × 4'},{id:'t2',text:'3 × 6'},{id:'t3',text:'8 × 3'},{id:'t4',text:'2 × 9'}],
      answer:{ z1:['t1','t3'], z2:['t2','t4'] },
      hint:'Work each one out: 6 × 4 = 24, 3 × 6 = 18 — then match the rest.' }
  ],
  game: { type:'smash', intro:'Quick smash round!', time:30,
    problems:[ {q:'6 × 3', c:18, opts:[16,18,21,24]}, {q:'4 × 4', c:16, opts:[12,14,16,20]} ] },
  post: [
    { type:'drag_drop', q:'Last one! Sort the numbers into even and odd.',
      zones:[{id:'z1',label:'Even'},{id:'z2',label:'Odd'}],
      tokens:[{id:'t1',text:'14'},{id:'t2',text:'9'},{id:'t3',text:'22'},{id:'t4',text:'7'}],
      answer:{ z1:['t1','t3'], z2:['t2','t4'] } },
    { q:'7 × 2 = ?', a:['12','14','16','9'], c:1 },
    { q:'20 ÷ 4 = ?', a:['4','6','5','8'], c:2 }
  ]
};
/* ---- multiselect + inline-choice demo (dev-only): index.html?demo=items ---- */
const ITEMS_DEMO_QUEST = {
  land: 'mult',
  pre: [
    { type:'equation_entry', q:'There are 4 baskets with 6 apples in each. Type how many apples in all.',
      accept:['24','4×6=24','6×4=24'] },
    { type:'multiselect', q:'Pick the TWO facts that equal 12.',
      a:['3 × 4','2 × 5','6 × 2','4 × 2'], cs:[0,2] },
    { type:'dropdown', q:'4 × 3 is the same as [b1] groups of [b2].',
      blanks:{ b1:{opts:['4','3','7'], c:0}, b2:{opts:['4','3','12'], c:1} } },
    { q:'6 × 2 = ?', a:['8','10','12','14'], c:2 }
  ],
  lesson: '<div class="qp-kicker">Lesson</div><h3 class="qp-lt">More than one answer can be right!</h3><p class="qp-lp">Some questions ask you to pick TWO answers, or to finish a sentence by choosing the right words. Read carefully — the question always tells you how many to pick.</p><button class="btn btn-primary" onclick="qpNext()">Got it — let\'s practice! ✏️</button>',
  practice: [
    { type:'equation_entry', q:'Write a multiplication equation that shows 3 groups of 5 making 15.',
      accept:['3×5=15','5×3=15','15=3×5','15=5×3'],
      hint:'Groups × how many in each = total. Try 3 × 5 = 15.' },
    { type:'multiselect', q:'Pick the TWO numbers that are multiples of 4.',
      a:['12','14','20','18'], cs:[0,2],
      hint:'Count by 4s: 4, 8, 12, 16, 20 — which two are on the list?' },
    { type:'dropdown', q:'A number times [b1] is always [b2] the number itself.',
      blanks:{ b1:{opts:['1','2','0'], c:0}, b2:{opts:['double','equal to','less than'], c:1} },
      hint:'Multiplying by 1 keeps a number exactly the same.' }
  ],
  game: { type:'smash', intro:'Quick smash round!', time:30,
    problems:[ {q:'7 × 3', c:21, opts:[18,21,24,27]}, {q:'5 × 5', c:25, opts:[20,25,30,15]} ] },
  post: [
    { q:'Which bar shows 3/4 shaded?', c:1,
      a:[ {svg:"<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 40'><rect x='2' y='6' width='116' height='28' fill='none' stroke='#6d35ff' stroke-width='2'/><rect x='2' y='6' width='29' height='28' fill='#ec18c8'/></svg>", alt:'1/4 shaded'},
          {svg:"<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 40'><rect x='2' y='6' width='116' height='28' fill='none' stroke='#6d35ff' stroke-width='2'/><rect x='2' y='6' width='87' height='28' fill='#ec18c8'/></svg>", alt:'3/4 shaded'},
          {svg:"<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 40'><rect x='2' y='6' width='116' height='28' fill='none' stroke='#6d35ff' stroke-width='2'/><rect x='2' y='6' width='58' height='28' fill='#ec18c8'/></svg>", alt:'2/4 shaded'},
          'None of these' ] },
    { type:'graph_plot', kind:'bars', max:6,
      q:'The class voted for pets: cats 4, dogs 5, fish 2. Build the bar graph!',
      categories:[{label:'Cats', target:4},{label:'Dogs', target:5},{label:'Fish', target:2}] },
    { type:'multiselect', q:'Pick the TWO facts that equal 18.',
      a:['9 × 2','8 × 2','6 × 3','5 × 4'], cs:[0,2] },
    { type:'dropdown', q:'To share 15 stickers among 3 friends, use [b1] and each friend gets [b2].',
      blanks:{ b1:{opts:['division','addition'], c:0}, b2:{opts:['3','5','12'], c:1} } },
    { q:'9 × 2 = ?', a:['16','18','20','11'], c:1 }
  ]
};
const TAIL_DEMO_QUEST = {
  land: 'geo',
  pre: [
    { type:'hot_spot', q:'Tap the TWO shapes with straight sides only.',
      figure:{ svg:"<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 300 100'><rect x='10' y='20' width='60' height='60' fill='#f4d7f0' stroke='#6d35ff'/><circle cx='150' cy='50' r='32' fill='#f4d7f0' stroke='#6d35ff'/><polygon points='230,80 260,20 290,80' fill='#f4d7f0' stroke='#6d35ff'/></svg>", alt:'A square, a circle, and a triangle' },
      regions:[{id:'r1',x:13,y:50,r:12,label:'square'},{id:'r2',x:50,y:50,r:12,label:'circle'},{id:'r3',x:87,y:50,r:12,label:'triangle'}],
      correct:['r1','r3'] },
    { type:'match_grid', q:'Match each fact to its answer.',
      rows:[{id:'row1',label:'3 × 4'},{id:'row2',label:'2 × 9'},{id:'row3',label:'4 × 4'}],
      cols:[{id:'colA',label:'12'},{id:'colB',label:'18'},{id:'colC',label:'16'}],
      answer:{row1:'colA', row2:'colB', row3:'colC'} },
    { type:'number_line_plot', q:'Tap the number line to show 7.', min:0, max:10, step:1, target:7 }
  ],
  lesson: '<div class="qp-kicker">Lesson</div><h3 class="qp-lt">Lots of ways to show what you know!</h3><p class="qp-lp">Some questions ask you to tap a picture, fill a table, place a point, shade a shape, or even type a word. Read what the question asks for — then show it!</p><button class="btn btn-primary" onclick="qpNext()">Got it! ✏️</button>',
  practice: [
    { type:'fraction_model', q:'Shade 3/8 of the bar.', shape:'bar', parts:8, target:3,
      hint:'The bottom number (8) is the parts. The top number (3) is how many to shade.' },
    { type:'text_entry', q:'A shape with three sides is called a…', accept:['triangle','a triangle'],
      hint:'Tri- means three!' },
    { type:'hot_text', q:'Tap the TWO words that name quadrilaterals.',
      parts:['A ', {id:'s1',text:'square',correct:true}, ' rolls past a ', {id:'s2',text:'circle',correct:false}, ' and a ', {id:'s3',text:'rectangle',correct:true}, ' near a ', {id:'s4',text:'triangle',correct:false}, '.'],
      hint:'Quad- means four — count each shape\'s sides.' }
  ],
  game: { type:'smash', intro:'Quick smash!', time:30,
    problems:[ {q:'8 × 2', c:16, opts:[14,16,18,12]}, {q:'6 × 6', c:36, opts:[30,32,36,42]} ] },
  post: [
    { type:'graph_plot', kind:'points', gridMax:10, q:'Place points at (3, 4) and (7, 2).',
      targets:[{x:3,y:4},{x:7,y:2}] },
    { type:'fraction_model', q:'Shade 2/4 of the circle.', shape:'circle', parts:4, target:2 },
    { type:'number_line_plot', q:'Show 5 on the number line.', min:0, max:10, step:1, target:5 }
  ]
};
try{
  const _qp = new URLSearchParams(location.search);
  const _demo = { dragdrop:['Sorting Showcase', DD_DEMO_QUEST], items:['Item Showcase', ITEMS_DEMO_QUEST], items2:['Every Answer Type', TAIL_DEMO_QUEST] }[_qp.get('demo')];
  if(_demo){
    window.addEventListener('load', ()=>{
      QUEST_CONTENT[_demo[0]] = _demo[1];
      const t = document.getElementById('titleScreen');
      if(t) t.classList.add('gone');
      setTimeout(()=>launchQuest(_demo[0]), 350);
    });
  }
}catch(e){}
