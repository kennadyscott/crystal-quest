/* Crystal Quest — map, HUD, title, ceremonies */
let inLand = false, currentLandKey = null;
let avatar = { id:'mai' };
let tempAv = { id:'mai' };
const NODE_XY = [[120,440],[300,340],[190,225],[390,150],[620,225],[840,120]];
const HUES = [
  {n:'Pink', v:0,    c:'#ec18c8'},
  {n:'Violet', v:305, c:'#8b35f6'},
  {n:'Ocean', v:240,  c:'#6d35ff'},
  {n:'Mint', v:180,   c:'#14b47e'}
];
const ACCS = ['','🎀','🧢','👑','⭐','😎'];

function fitMap(){
  if (typeof applyCamera==='function') applyCamera(true);
}
window.addEventListener('resize', fitMap);

function toast(icon,msg){
  const w = $('#toastWrap'); if(!w) return;
  const el = document.createElement('div');
  el.className='toast';
  el.innerHTML = `<span class="ti">${icon}</span><span>${msg}</span>`;
  w.appendChild(el);
  requestAnimationFrame(()=>el.classList.add('show'));
  setTimeout(()=>{el.classList.remove('show');setTimeout(()=>el.remove(),300);},2400);
}

function openModal(id){ const el=$('#'+id); if(el) el.classList.add('open'); }
function closeModal(id){ const el=$('#'+id); if(el) el.classList.remove('open'); }

function hideTitle(){ const t=$('#titleScreen'); if(t) t.classList.add('gone'); }
function showTitle(){
  if(inLand) exitLand();
  const t=$('#titleScreen'); if(t) t.classList.remove('gone');
  renderTitle();
}

function renderTitle(){
  const existing = loadSave();
  const cont = $('#titleContinue');
  if(existing && existing.studentName){
    cont.style.display = 'flex';
    cont.textContent = `Continue as ${existing.studentName} ▶`;
  } else {
    cont.style.display = 'none';
  }
}

function continueSave(){
  const s = loadSave();
  if(!s){ toast('✦','No adventure yet — start a new one!'); return; }
  setSave(s);
  hideTitle();
  bootWorld();
}

function startNewAdventure(){
  if(loadSave() && !confirm('Start a new adventure? This replaces the saved one on this device.')) return;
  $('#setupName').value = '';
  tempAv = { id:'mai' };
  renderAvatarGrid('setupAvGrid', tempAv.id);
  $('#setupPanel').classList.add('show');
}

function confirmNewAdventure(){
  const name = ($('#setupName').value||'').trim() || 'Explorer';
  const buddy = { id: (tempAv && tempAv.id) || 'mai' };
  const next = newAdventureSave(name, buddy);
  setSave(next);
  $('#setupPanel').classList.remove('show');
  hideTitle();
  bootWorld();
}

function playMayaShowcase(){
  if(loadSave() && loadSave().mode!=='showcase' && !confirm('Load Maya’s showcase? This replaces the saved adventure on this device.')) return;
  setSave(mayaShowcaseSave());
  hideTitle();
  bootWorld();
  toast('📜','Ms. Lopez left you an assignment — check the quests!');
}

function goHome(){
  if(inLand) exitLand();
}

function bootWorld(){
  avatar = (save && save.avatar) || defaultAvatar();
  tempAv = Object.assign({}, avatar);
  refreshHUD();
  renderWorldPills();
  const t = continueTarget();
  if(t){
    renderLand(t.key);
    const selected = document.querySelector(`.pill[data-key="${t.key}"]`);
    document.querySelectorAll('.pill').forEach(p=>p.classList.remove('selected'));
    if(selected && save.lands[t.key]!=='locked') selected.classList.add('selected');
  } else {
    renderLockedHome();
  }
  applyGate();
  syncAvatar();
  spawnWalker();
  if(typeof initExplore==='function') initExplore();
  fitMap();
  if(typeof showExploreIntro==='function') setTimeout(showExploreIntro, 400);
}

function animateXP(from, to){
  const el = $('#xpNum'); if(!el) return;
  let n = from;
  const step = ()=>{
    n += Math.max(1, Math.ceil((to-from)/20));
    if(n >= to){ el.innerHTML = to.toLocaleString()+' <span style="font-weight:600;color:var(--ink-soft)">XP</span>'; return; }
    el.innerHTML = n.toLocaleString()+' <span style="font-weight:600;color:var(--ink-soft)">XP</span>';
    requestAnimationFrame(step);
  };
  step();
}

function onLevelUp(level){
  const badge = document.querySelector('.level-badge');
  if(badge){
    badge.querySelector('.num').textContent = String(level);
    badge.classList.remove('pop'); void badge.offsetWidth; badge.classList.add('pop');
  }
  setTimeout(()=>{
    sfx('fanfare');
    toast('⬆️', `LEVEL ${level}! You're unstoppable, ${save.studentName}!`);
    confetti(140);
  }, 400);
}

function refreshHUD(){
  if(!save) return;
  const done = questsDoneCount();
  const total = totalQuestCount();
  const pct = total ? Math.round(done/total*100) : 0;
  const xpEl = $('#xpNum');
  if(xpEl) xpEl.innerHTML = save.xp.toLocaleString()+' <span style="font-weight:600;color:var(--ink-soft)">XP</span>';
  const lv = document.querySelector('.level-badge .num'); if(lv) lv.textContent = String(save.level);
  const st = $('#streakNum'); if(st) st.textContent = String(save.streak||1);
  const who = $('#studentName'); if(who) who.textContent = save.studentName;
  const hudPct = $('#hudPct'); if(hudPct) hudPct.textContent = pct+'%';
  const hudCount = $('#hudCount'); if(hudCount) hudCount.textContent = `${done} of ${total} Quests Completed`;
  const ring = $('#hudRingBar'); if(ring) ring.setAttribute('stroke-dashoffset', (131.9*(1-pct/100)).toFixed(1));
  const hudXP = $('#hudXP'); if(hudXP) hudXP.textContent = save.xp.toLocaleString();
  const hudBadges = $('#hudBadges'); if(hudBadges) hudBadges.textContent = String(save.badges.length);
  const hudTreas = $('#hudTreas'); if(hudTreas) hudTreas.textContent = String(save.treasures.length);
  const line = $('#hudBuddyLine');
  if(line) line.textContent = `Keep going, ${save.studentName}!`;
  const sub = $('#hudBuddySub');
  const t = continueTarget();
  const anyOpen = LAND_KEYS.some(k => save.lands[k]!=='locked');
  if(sub){
    if(t && questsDoneCount()<total){
      sub.textContent = buddyLineForLand(t.key);
    } else if(!anyOpen){
      sub.textContent = 'Walk to an island and take its diagnostic to begin.';
    } else {
      sub.textContent = 'You conquered every land. Replay quests anytime!';
    }
  }
  applyGate();
}

function landFlavor(key){
  const raw = (LANDS[key] && LANDS[key].flavor) || LANDS[key].title;
  return String(raw).replace(/^The /,'');
}

function pillMark(kind){
  if(kind==='done') return '<span class="mark done" aria-hidden="true">✓</span>';
  if(kind==='lock') return `<span class="mark lock" aria-hidden="true"><svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><rect x="2.4" y="5.4" width="7.2" height="5.1" rx="1.2"/><path d="M4.1 5.4V3.9a1.9 1.9 0 0 1 3.8 0v1.5"/></svg></span>`;
  return '<span class="mark gem" aria-hidden="true"></span>';
}

function pillHTML(key){
  const L = LANDS[key];
  const landState = save.lands[key];
  const stats = landQuestStats(key);
  const done = landState==='conquered' || stats.allDone;
  const locked = landState==='locked';
  const mark = pillMark(done ? 'done' : (locked ? 'lock' : 'gem'));
  const bar = (!locked && !done)
    ? `<span class="sub"><i style="width:${Math.round(stats.done/stats.total*100)}%"></i></span>`
    : '';
  return `${mark}<span class="copy"><span class="fl">${landFlavor(key)}</span><span class="nm">${L.title}</span>${bar}</span>`;
}

function renderWorldPills(){
  LAND_KEYS.forEach(key => {
    const pill = document.querySelector(`.pill[data-key="${key}"]`);
    if(!pill) return;
    const landState = save.lands[key];
    const stats = landQuestStats(key);
    const keepSel = pill.classList.contains('selected');
    pill.classList.remove('done','active-land','locked','unlock-glow');
    if(landState==='locked') pill.classList.add('locked');
    else if(landState==='conquered' || stats.allDone) pill.classList.add('done');
    else pill.classList.add('active-land');
    if(keepSel) pill.classList.add('selected');
    pill.style.minHeight = '';
    pill.style.minWidth = '';
    pill.innerHTML = pillHTML(key);
  });
}

function renderLockedHome(){
  $('#landTitle').textContent = 'Choose an island';
  $('#landAssignee').textContent = 'Walk the path, then take a diagnostic to unlock it.';
  const ul = $('#qlist');
  ul.innerHTML = `<li class="qempty">
    <div class="qe-ic">🗺️</div>
    <div class="qe-t">No lands unlocked yet</div>
    <div class="qe-s">You can have 2 lands in progress at a time. Walk to an island and press <b>Enter</b> to take its diagnostic.</div>
  </li>`;
  const tab = $('#drawerTab');
  if(tab) tab.innerHTML = '⚔️ Quests';
  const js = $('#journeyFooter .js');
  const bar = $('#journeyFooter .jbar i');
  if(js) js.textContent = '0 of 2 lands in progress';
  if(bar) bar.style.width = '0%';
  document.querySelectorAll('.pill').forEach(p=>p.classList.remove('selected'));
}

function renderLand(key){
  const L = LANDS[key];
  $('#landTitle').innerHTML = L.title;
  const st = save.lands[key];
  const stats = landQuestStats(key);
  let sub = L.flavor || '';
  if(st==='conquered') sub = 'Conquered! Replay any quest.';
  else if(assignmentPending() && save.assignment.land===key) sub = 'Assigned by Ms. Lopez';
  else if(st==='open') sub = `Land · ${stats.done} / ${stats.total} quests`;
  $('#landAssignee').textContent = sub;

  const ul = $('#qlist');
  ul.innerHTML = L.quests.map((q,i)=>{
    let qst = questStatus(q.name);
    if(isAssigned(q.name, key) && qst==='lock') qst = 'prog';
    const mark = qst==='done'?'✓':(qst==='lock'?'🔒':'');
    const tag = qst==='prog'?'<span class="qtag">In Progress</span>':`<span class="qmark">${mark}</span>`;
    return `<li class="qrow ${qst}" data-q="${q.name}"><span class="qn">${i+1}</span><span class="qic">${q.icon}</span><span class="qnm">${q.name}</span>${tag}</li>`;
  }).join('');
  ul.querySelectorAll('.qrow').forEach(row => {
    row.addEventListener('click', ()=> {
      const title = row.getAttribute('data-q');
      const qst = questStatus(title);
      const playableAssigned = isAssigned(title, key);
      if(qst==='lock' && !playableAssigned){
        toast('🔒','Conquer the quests before it first!');
        return;
      }
      openQuest(title, L.title, key, 0, playableAssigned && qst==='lock' ? 'prog' : qst);
    });
  });

  const tab = $('#drawerTab');
  if(tab){
    const n = L.quests.length;
    tab.innerHTML = `⚔️ Quests <span class="b1">${n}</span>`;
  }
  updateJourneyFooter(key);
}

function updateJourneyFooter(key){
  const stats = landQuestStats(key);
  const t = continueTarget();
  const js = $('#journeyFooter .js');
  const bar = $('#journeyFooter .jbar i');
  if(js){
    if(t && t.key===key && t.status!=='done'){
      const idx = LANDS[key].quests.findIndex(q=>q.name===t.title)+1;
      js.textContent = `Quest ${idx} of ${stats.total} · ${t.title}`;
    } else if(stats.allDone){
      js.textContent = 'Land conquered — review any quest';
    } else {
      js.textContent = `${stats.done} / ${stats.total} quests`;
    }
  }
  if(bar) bar.style.width = Math.round(stats.done/stats.total*100)+'%';
}

function toggleDrawer(open){
  $('#drawer').classList.toggle('collapsed', !open);
  $('#drawerTab').classList.toggle('show', !open);
  fitMap();
}

function shake(el){
  el.animate([
    {transform:'translate(-50%,-50%)'},
    {transform:'translate(calc(-50% - 6px),-50%)'},
    {transform:'translate(calc(-50% + 6px),-50%)'},
    {transform:'translate(-50%,-50%)'}
  ],{duration:280});
}

function landClick(key, el){
  const st = save.lands[key];
  if(st==='locked'){
    shake(el);
    const asg = save.assignment;
    if(asg && !asg.done && asg.land===key){
      toast('📜',`Ms. Lopez unlocked one quest here — opening it!`);
      setTimeout(()=>openQuest(asg.title, LANDS[key].title, key, 0, 'prog'), 600);
      return;
    }
    if(!canUnlockLand(key)){
      toast('🔒','You can have 2 lands in progress. Master one to open another!');
      return;
    }
    openIslandDiag(key);
    return;
  }
  document.querySelectorAll('.pill').forEach(p=>p.classList.remove('selected'));
  el.classList.add('selected');
  renderLand(key);
  enterLand(key);
}

function landNodes(key){
  const L = LANDS[key];
  if(L && L.nodes && L.nodes.length) return L.nodes;
  return NODE_XY.slice(0, (L && L.quests.length) || 0);
}

let worldPos = { x: 215, y: 400 };

function enterLand(key){
  const L = LANDS[key];
  if(typeof walker!=='undefined' && !inLand){
    worldPos = { x: walker.x, y: walker.y };
  }
  inLand = true; currentLandKey = key;
  const hero = $('#hero');
  if(hero) hero.classList.add('in-land');
  if(typeof applyMapArt==='function') applyMapArt();
  const nodes = landNodes(key);
  let idx = L.quests.findIndex(q => questStatus(q.name)!=='done');
  if(idx < 0) idx = Math.max(0, L.quests.length - 1);
  const start = L.spawn || nodes[idx] || L.center;
  if(typeof walker!=='undefined'){
    walker.x = start[0];
    walker.y = start[1];
    walker.moving = false;
    if(typeof placeWalker==='function') placeWalker();
  }
  if(typeof camMode!=='undefined'){
    camMode = 'land';
    mapCam.x = (L.art ? L.art.w/2 : start[0]);
    mapCam.y = (L.art ? L.art.h/2 : start[1]);
    applyCamera(false);
  }
  buildLandView(key);
  $('#landView').classList.add('open');
}

function exitLand(){
  const gate = currentLandKey && LANDS[currentLandKey] && LANDS[currentLandKey].worldGate;
  $('#landView').classList.remove('open');
  const hero = $('#hero');
  if(hero) hero.classList.remove('in-land','zoomed');
  document.querySelectorAll('.qsite').forEach(n=>n.remove());
  inLand = false; currentLandKey = null;
  if(typeof applyMapArt==='function') applyMapArt();
  if(typeof walker!=='undefined'){
    const back = gate || [worldPos.x, worldPos.y];
    walker.x = back[0];
    walker.y = back[1];
    walker.moving = false;
    if(typeof placeWalker==='function') placeWalker();
  }
  if(typeof camMode!=='undefined'){
    camMode = 'follow';
    if(typeof walker!=='undefined'){
      mapCam.x = walker.x;
      mapCam.y = walker.y;
    }
  }
  fitMap();
}

function buildLandView(key){
  const L = LANDS[key];
  const flavor = (L.flavor||'').replace(/^The /,'');
  $('#lvTitle').textContent = L.title;
  const kick = $('#lvKick');
  if(kick) kick.textContent = flavor || 'Conquer the';
  const map = $('#mapStage');
  map.querySelectorAll('.qsite').forEach(n=>n.remove());

  const stats = landQuestStats(key);
  const allDone = stats.allDone;
  $('#lvCount').textContent = stats.done + ' / ' + stats.total;
  $('#lvBar').style.width = Math.round(stats.done/stats.total*100) + '%';
  const gated = L.gateAfter && !landGateOpen(key);
  if(allDone){
    $('#lvSub').textContent = 'You conquered this land — every side-quest mastered!';
  } else if(gated){
    $('#lvSub').textContent = 'Master the first 3 shrines to open the rest of the island.';
  } else if(L.gateAfter){
    $('#lvSub').textContent = 'The rest of the island is open — finish the remaining shrines.';
  } else {
    $('#lvSub').textContent = 'Conquer every side-quest to claim this land.';
  }
  $('#lvBanner').style.display = allDone ? 'block' : 'none';

  const nodes = landNodes(key);
  L.quests.forEach((q,i)=>{
    let st = questStatus(q.name);
    if(isAssigned(q.name, key) && st==='lock') st = 'prog';
    const xy = nodes[i] || L.center;
    const partLocked = L.gateAfter && i >= L.gateAfter && !landGateOpen(key);
    const el = document.createElement('div');
    el.className = 'qsite ' + (st==='prog' ? 'cur' : st) + (partLocked ? ' gated' : '');
    el.style.left = xy[0]+'px';
    el.style.top = xy[1]+'px';
    el.dataset.q = q.name;
    const kind = partLocked || st==='lock' ? 'lock' : (st==='done' ? 'done' : 'gem');
    const label = q.short || q.name;
    el.innerHTML = `${pillMark(kind)}<span class="copy"><span class="fl">${label}</span><span class="nm">Shrine ${i+1} of ${L.quests.length}</span></span>`;
    el.addEventListener('click', ev => {
      ev.stopPropagation();
      if(partLocked){
        toast('🔒','Master the first 3 shrines to open this part of the island.');
        return;
      }
      if(st==='lock' && !isAssigned(q.name, key)){
        toast('🔒','Conquer the side-quests in order: next up is '+(L.quests.find(x=>questStatus(x.name)!=='done')||q).name+'.');
        return;
      }
      openQuest(q.name, L.title, key, 0, st);
    });
    map.appendChild(el);
  });
  if(typeof placeWalker==='function') placeWalker();
}

function openQuest(title, land, key, curStep, status){
  if(assignmentPending() && !isAssigned(title,key) && status!=='done'){
    gateBlock();
    return;
  }
  $('#qmTitle').innerHTML = title;
  $('#qmLand').innerHTML = 'Land of ' + land;
  const steps = document.querySelectorAll('#qmPath .pstep');
  const cur = (curStep==null)?0:curStep;
  steps.forEach((s,i)=>{ s.classList.remove('cur','done');
    if(i<cur) s.classList.add('done'); else if(i===cur) s.classList.add('cur'); });
  const btn = $('#qmBtn');
  const playable = !!QUEST_CONTENT[title];
  const done = status==='done';
  btn.textContent = done ? 'Review Quest 🔍' : (playable ? 'Play Quest ▶' : 'Start Quest 🚀');
  btn.onclick = ()=>{
    closeModal('questModal');
    if(!playable){ toast('🚀','This quest is coming soon!'); return; }
    launchQuest(title, { review: done });
  };
  openModal('questModal');
}

function gateBlock(){
  toast('📜','Complete your assignment first!');
  setTimeout(()=>openModal('asgModal'), 550);
}

function applyGate(){
  if(!save) return;
  const pending = assignmentPending();
  const banner = $('#gateBanner');
  if(banner){
    banner.style.display = pending ? 'flex' : 'none';
    if(pending){
      banner.innerHTML = `<img src="assets/book.png" alt="" />
        <div>Assignment first! Complete <b>${save.assignment.title}</b> in the Land of ${LANDS[save.assignment.land].title} to continue your journey. <span class="gb-link" onclick="openModal('asgModal')">View</span></div>`;
    }
  }
  const target = continueTarget();
  const anyOpen = LAND_KEYS.some(k => save.lands[k]!=='locked');
  const cont = $('#contBtn');
  if(cont){
    cont.classList.toggle('btn-gated', pending);
    if(pending){
      cont.innerHTML = '🔒 Assignment First';
      cont.onclick = gateBlock;
    } else if(!target){
      cont.innerHTML = anyOpen ? 'Replay a Quest &nbsp;›' : 'Find an Island &nbsp;›';
      cont.onclick = continueQuest;
    } else {
      cont.innerHTML = 'Continue Quest &nbsp;›';
      cont.onclick = continueQuest;
    }
  }
  const jf = $('#journeyFooter'), go = $('#journeyGo');
  if(jf) jf.classList.toggle('gated', pending);
  if(go){
    go.textContent = pending ? '🔒' : '›';
    go.onclick = pending ? gateBlock : continueQuest;
  }
  const chip = $('#asgChip');
  if(chip){
    const has = !!save.assignment;
    chip.style.display = has ? '' : 'none';
    chip.classList.toggle('pulse', pending);
    chip.classList.toggle('done-chip', has && !pending);
    chip.innerHTML = pending
      ? '📜 New Assignment <span class="b1" id="asgBadge">1</span>'
      : '✅ Assignments';
  }
  const t = $('#asgRow1T'), due = $('#asgRow1Due'), row = $('#asgRow1');
  if(save && save.assignment){
    if(t) t.innerHTML = (save.assignment.done?'✓ ':'') + 'Fractions: Comparing Fractions';
    if(due){
      due.textContent = save.assignment.done ? '✓ Completed' : '📅 Due soon';
      due.style.color = save.assignment.done ? 'var(--emerald)' : '';
    }
    if(row) row.style.opacity = save.assignment.done ? .65 : 1;
  }
}

function continueQuest(){
  const t = continueTarget();
  if(!t){
    const anyOpen = LAND_KEYS.some(k => save.lands[k]!=='locked');
    toast(anyOpen ? '👑' : '🗺️', anyOpen
      ? 'Every land is conquered!'
      : 'Walk to an island and press Enter to unlock it.');
    return;
  }
  openQuest(t.title, LANDS[t.key].title, t.key, t.status==='prog'?0:0, t.status);
}

function onLandUnlocked(key){
  const pill = document.querySelector(`.pill[data-key="${key}"]`);
  renderWorldPills();
  if(pill){ pill.classList.add('unlock-glow'); }
  sfx('unlock');
  toast('🗺️','NEW LAND UNLOCKED: '+LANDS[key].title+'! Cross the bridge!');
}

function afterQuestComplete(title, landKey, result){
  renderLand(currentLandKey || landKey);
  renderWorldPills();
  if(inLand && currentLandKey===landKey) buildLandView(landKey);
  refreshHUD();
  toast('✅', title+' conquered!');
  const L = LANDS[landKey];
  if(L && L.gateAfter && L.quests[L.gateAfter-1] && L.quests[L.gateAfter-1].name===title && landGateOpen(landKey) && !result.justConquered){
    toast('🗺️','The rest of the island is open!');
    sfx('unlock');
  }
  if(result.justConquered){
    setTimeout(()=>{
      toast('👑','LAND CONQUERED: '+LANDS[landKey].title+'! +100 XP');
      confetti(170); sfx('fanfare');
      if(inLand && currentLandKey===landKey) buildLandView(landKey);
    }, 900);
  }
}

function openAvatar(){
  tempAv = Object.assign({}, avatar);
  renderAvatarGrid('avPickGrid', tempAv.id);
  openModal('avatarModal');
}

function saveAvatar(){
  avatar = { id: (tempAv && tempAv.id) || 'mai' };
  if(save){ save.avatar = avatar; persist(); }
  try{ localStorage.setItem(AVATAR_KEY, JSON.stringify(avatar)); }catch(e){}
  syncAvatar();
  closeModal('avatarModal');
  toast('✦', 'Avatar saved — that\'s you on the map!');
}

function syncAvatar(){
  if(save && save.avatar && save.avatar.id) avatar = save.avatar;
  if(typeof syncWalkerArt==='function') syncWalkerArt();
  if(inLand && currentLandKey) buildLandView(currentLandKey);
}

function openCollection(){
  const badges = save.badges.map(id => {
    const b = BADGE_DEFS[id];
    return `<div class="col-item on"><div class="col-ic">${b.icon}</div><div class="col-n">${b.name}</div></div>`;
  }).join('') || '<p class="qp-lp">Earn badges by conquering quests and keeping a streak.</p>';
  const lockedBadges = Object.keys(BADGE_DEFS).filter(id => !save.badges.includes(id)).map(id => {
    const b = BADGE_DEFS[id];
    return `<div class="col-item"><div class="col-ic">❔</div><div class="col-n">${b.hint}</div></div>`;
  }).join('');
  const treas = Object.keys(TREASURE_DEFS).map(id => {
    const t = TREASURE_DEFS[id];
    const on = save.treasures.includes(id);
    return `<div class="col-item${on?' on':''}"><div class="col-ic">${on?t.icon:'🔒'}</div><div class="col-n">${on?t.name:LANDS[t.land].title+' crystal'}</div></div>`;
  }).join('');
  $('#colBadges').innerHTML = badges + lockedBadges;
  $('#colTreasures').innerHTML = treas;
  openModal('colModal');
}

function openAsgFromChip(){
  openModal('asgModal');
}

function clickAssignment(){
  closeModal('asgModal');
  const asg = save.assignment;
  if(!asg) return;
  const st = questStatus(asg.title);
  openQuest(asg.title, LANDS[asg.land].title, asg.land, 0, asg.done ? 'done' : (st==='lock'?'prog':st));
}

document.addEventListener('keydown', e=>{
  if(e.key==='Escape'){
    if(DIAG){ closeDiag(); return; }
    if(QP){ qpAskQuit(); return; }
    document.querySelectorAll('.modal-scrim.open').forEach(m=>m.classList.remove('open'));
  }
});

function initWorld(){
  document.querySelectorAll('.pill').forEach(el=>{
    el.addEventListener('click',()=>landClick(el.dataset.key, el));
  });
  document.querySelectorAll('.lockchip').forEach(el=>{
    el.addEventListener('click',()=>landClick(el.dataset.lock, el));
  });
  renderTitle();
  if(typeof initExplore==='function') initExplore();
  fitMap();
  window.addEventListener('load', fitMap);
}

initWorld();
