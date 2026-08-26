/* Crystal Quest — Crystal Diagnostic */
let DIAG = null;

function openDiag(){
  closeModal('diagModal');
  const practice = !!(save && (save.diagnostic && save.diagnostic.taken || (typeof questsDoneCount==='function' && questsDoneCount()>0)));
  DIAG = { i:0, scores:{}, answers: DIAG_ITEMS.map(it => shuffleMC(Object.assign({}, it))), practice };
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
  const land = LANDS[item.land].title;
  $('#diagBody').innerHTML = `<div class="qp-card">
    <div class="qp-kicker">Crystal Diagnostic · ${DIAG.i+1} of ${total} · ${land}</div>
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
  setTimeout(()=>{ DIAG.i++; renderDiag(); }, 550);
}

function renderDiagResults(){
  if(!DIAG.practice) applyDiagnosticScores(DIAG.scores);
  else addXP(20);
  const rows = LAND_KEYS.map(k=>{
    const n = DIAG.scores[k]||0;
    let mark;
    if(DIAG.practice) mark = n>=2 ? 'Strong' : (n===1 ? 'Getting there' : 'Worth another look');
    else mark = n>=2 ? 'Conquered — you already sparkle here' : (save.lands[k]==='open' ? 'Your path starts here' : (save.lands[k]==='conquered'?'Conquered':'Still locked — follow the bridges'));
    return `<div class="tr"><span>${LANDS[k].title}</span><span>${n}/2 · ${n>=2?'✦':(n===1?'~':'—')}</span></div>
      <div class="diag-note">${mark}</div>`;
  }).join('');
  $('#diagBody').innerHTML = `<div class="qp-card">
    <div class="qp-kicker">${DIAG.practice?'Check-in complete':'Your path is ready'}</div>
    <h3 class="qp-lt">Diagnostic complete!</h3>
    <p class="qp-lp">${DIAG.practice
      ? 'Nice check-in. Your adventure path stays as it is — +20 XP for the effort!'
      : 'Lands you aced are reviewable. Your first challenge is the first land that still needs you.'}</p>
    <div class="qp-tally">${rows}</div>
    <button class="btn btn-primary" onclick="finishDiag()">${DIAG.practice?'Back to the map ✦':'Enter the world ✦'}</button>
  </div>`;
  sfx('fanfare'); confetti(100);
}

function finishDiag(){
  const practice = DIAG && DIAG.practice;
  closeDiag();
  hideTitle();
  bootWorld();
  if(practice){ toast('✦','Check-in complete!'); return; }
  const t = continueTarget();
  toast('🗺️', t ? `Your path begins in ${LANDS[t.key].title}!` : 'The whole world is yours!');
}

function diagCancel(){
  if(DIAG && DIAG.practice){ closeDiag(); return; }
  closeDiag();
  skipToPlaceValue();
}

function skipToPlaceValue(){
  closeModal('diagModal');
  skipDiagnosticToStart();
  hideTitle();
  bootWorld();
  toast('🏔️','Begin in the Crystal Hills — Place Value awaits!');
}
