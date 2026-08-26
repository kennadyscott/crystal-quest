/* Crystal Quest — Crystal Diagnostic */
let DIAG = null;

function islandDiagItems(key){
  const items = [];
  LANDS[key].quests.forEach(q => {
    const C = QUEST_CONTENT[q.name];
    if(C && C.pre && C.pre[0]) items.push(shuffleMC(Object.assign({ land:key, quest:q.name }, C.pre[0])));
  });
  return items.slice(0, 4);
}

function openDiag(){
  closeModal('diagModal');
  DIAG = { mode:'practice', i:0, scores:{}, correct:0, answers: DIAG_ITEMS.map(it => shuffleMC(Object.assign({}, it))), practice:true };
  $('#diagPlayer').classList.add('open');
  renderDiag();
}

function openIslandDiag(key){
  const answers = islandDiagItems(key);
  if(!answers.length){ toast('✦','This land is not ready yet.'); return; }
  DIAG = { mode:'island', land:key, i:0, scores:{}, correct:0, answers, practice:false };
  $('#diagPlayer').classList.add('open');
  renderDiag();
}

function closeDiag(){
  $('#diagPlayer').classList.remove('open');
  DIAG = null;
}

function renderDiag(){
  if(!DIAG) return;
  const total = DIAG.answers.length;
  if(DIAG.i >= total){ renderDiagResults(); return; }
  const item = DIAG.answers[DIAG.i];
  const land = LANDS[item.land || DIAG.land].title;
  const kick = DIAG.mode==='island'
    ? `Land Diagnostic · ${LANDS[DIAG.land].title}`
    : `Crystal Diagnostic · ${land}`;
  $('#diagBody').innerHTML = `<div class="qp-card">
    <div class="qp-kicker">${kick} · ${DIAG.i+1} of ${total}</div>
    <div class="qp-q">${item.q}</div>
    <div class="qp-answers">${item.a.map((o,k)=>`<button class="qp-ans" id="dans${k}" onclick="diagAns(${k})">${o}</button>`).join('')}</div>
    ${dots(total, DIAG.i)}
  </div>`;
  $('#diagProgress').textContent = `${DIAG.i+1} / ${total}`;
}

function diagAns(k){
  const item = DIAG.answers[DIAG.i];
  const el = $('#dans'+k);
  const good = k===item.c;
  el.classList.add(good?'correct':'wrong');
  sfx(good?'correct':'wrong');
  DIAG.scores[item.land] = (DIAG.scores[item.land]||0) + (good?1:0);
  if(good) DIAG.correct = (DIAG.correct||0)+1;
  setTimeout(()=>{ DIAG.i++; renderDiag(); }, 550);
}

function renderDiagResults(){
  if(DIAG.mode==='island'){
    const key = DIAG.land;
    const total = DIAG.answers.length;
    const n = DIAG.correct||0;
    applyIslandDiagnostic(key, n, total);
    addXP(15);
    $('#diagBody').innerHTML = `<div class="qp-card">
      <div class="qp-kicker">Land of ${LANDS[key].title}</div>
      <h3 class="qp-lt">Path unlocked!</h3>
      <p class="qp-lp">You scored <b>${n} / ${total}</b>. We'll start you on the quests that will help you grow the fastest.</p>
      <button class="btn btn-primary" onclick="finishIslandDiag()">Enter ${LANDS[key].title} ✦</button>
    </div>`;
    sfx('fanfare'); confetti(90);
    return;
  }
  addXP(20);
  const rows = LAND_KEYS.map(k=>{
    const n = DIAG.scores[k]||0;
    const mark = n>=2 ? 'Strong' : (n===1 ? 'Getting there' : 'Worth another look');
    return `<div class="tr"><span>${LANDS[k].title}</span><span>${n}/2 · ${n>=2?'✦':'—'}</span></div>
      <div class="diag-note">${mark}</div>`;
  }).join('');
  $('#diagBody').innerHTML = `<div class="qp-card">
    <div class="qp-kicker">Check-in complete</div>
    <h3 class="qp-lt">Nice practice!</h3>
    <p class="qp-lp">This was just a warmup. Unlock lands by walking to them and taking that island's diagnostic.</p>
    <div class="qp-tally">${rows}</div>
    <button class="btn btn-primary" onclick="finishDiag()">Back to the map ✦</button>
  </div>`;
  sfx('fanfare');
}

function finishIslandDiag(){
  const key = DIAG && DIAG.land;
  closeDiag();
  if(typeof renderWorldPills==='function') renderWorldPills();
  if(typeof refreshHUD==='function') refreshHUD();
  const pill = document.querySelector(`.pill[data-key="${key}"]`);
  if(pill && typeof landClick==='function') landClick(key, pill);
}

function finishDiag(){
  closeDiag();
  hideTitle();
  const title = $('#titleScreen');
  if(title && !title.classList.contains('gone') && typeof bootWorld==='function') bootWorld();
  toast('✦','Back to the isles!');
}

function diagCancel(){
  closeDiag();
  if(DIAG && DIAG.mode==='island') return;
}

function skipToPlaceValue(){
  closeModal('diagModal');
  hideTitle();
  bootWorld();
}
