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
  const pairs = item.a.map((text,i)=>({ text, ok:i===item.c }));
  const sh = shuffle(pairs);
  return Object.assign({}, item, { a: sh.map(p=>p.text), c: sh.findIndex(p=>p.ok) });
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

function qCard(kicker, item, showHint){
  return `<div class="qp-card">
    <div class="qp-kicker">${kicker}</div>
    <div class="qp-q">${item.q}</div>
    <div class="qp-answers">${item.a.map((o,k)=>`<button class="qp-ans" id="ans${k}" onclick="qpAns(${k})">${o}</button>`).join('')}</div>
    <div id="qpHintBox">${showHint&&item.hint?`<div class="qp-hint">💡 ${item.hint}</div>`:''}</div>
    ${dots(qList().length, QP.i)}
  </div>`;
}

function renderQP(){
  QP.busy = false;
  qpSteps();
  const B = $('#qpBody');
  if(QP.step===0){ B.innerHTML = qCard('Warm-up · show what you know', qList()[QP.i], false); }
  else if(QP.step===1){ B.innerHTML = `<div class="qp-card">${QP.Q.lesson}</div>`; say('Watch closely… ✨'); }
  else if(QP.step===2){ QP.firstTry = true; B.innerHTML = qCard('Practice · hints unlocked', qList()[QP.i], false); }
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
    B.innerHTML = qCard('Post-Test · prove it!', qList()[QP.i], false);
    if(QP.i===0) say('Show what you learned!');
  }
}

function qpNext(){ QP.step++; QP.i=0; renderQP(); }

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
    QP.busy = true;
    if(QP.firstTry){ QP.practiceXP+=5; const r=el.getBoundingClientRect(); flyXP('+5 XP', r.left+r.width/2, r.top); }
    say(pick(CHEERS));
    setTimeout(()=>{ QP.i++; QP.firstTry=true;
      if(QP.i>=qList().length){ QP.step=3; renderQP(); } else renderQP(); }, 700);
    return;
  }
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
