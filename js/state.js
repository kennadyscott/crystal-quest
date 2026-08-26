/* Crystal Quest — save, XP, unlocks, badges */
const SAVE_KEY = 'cq-save';
const AVATAR_KEY = 'cq-avatar';
const XP_PER_LEVEL = 250;
const LAND_UNLOCKS = {
  place: ['mult', 'frac'],
  mult: ['dec'],
  frac: ['geo'],
  geo: ['data'],
  dec: [],
  data: []
};
const LAND_REQUIRES = {
  place: null,
  mult: 'place',
  dec: 'mult',
  frac: 'place',
  geo: 'frac',
  data: 'geo'
};
const BADGE_DEFS = {
  'first-quest': { icon: '⭐', name: 'First Crystal', hint: 'Complete your first quest' },
  'land-place': { icon: '🏔️', name: 'Place Value Champion', hint: 'Conquer Place Value' },
  'land-mult': { icon: '✖️', name: 'Times & Share Hero', hint: 'Conquer Multiplication & Division' },
  'land-dec': { icon: '💠', name: 'Decimal Explorer', hint: 'Conquer Decimals' },
  'land-frac': { icon: '🍕', name: 'Fraction Friend', hint: 'Conquer Fractions' },
  'land-geo': { icon: '📐', name: 'Shape Ranger', hint: 'Conquer Geometry' },
  'land-data': { icon: '📊', name: 'Data Detective', hint: 'Conquer Data' },
  'smash-3': { icon: '💥', name: 'Perfect Smash', hint: 'Earn 3 stars in Crystal Smash' },
  'streak-3': { icon: '🔥', name: 'On Fire', hint: 'Learn 3 days in a row' },
  'all-crystals': { icon: '👑', name: 'Crystal Master', hint: 'Collect all six land crystals' }
};
const TREASURE_DEFS = {
  'crystal-place': { icon: '💎', name: 'Hill Crystal', land: 'place' },
  'crystal-mult': { icon: '💜', name: 'Purple Peak Crystal', land: 'mult' },
  'crystal-dec': { icon: '❄️', name: 'Ice Crystal', land: 'dec' },
  'crystal-frac': { icon: '🏖️', name: 'Tide Crystal', land: 'frac' },
  'crystal-geo': { icon: '🏛️', name: 'Ruin Crystal', land: 'geo' },
  'crystal-data': { icon: '🌲', name: 'Forest Crystal', land: 'data' }
};

let save = null;

function todayStr(){
  const d = new Date();
  return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
}
function ydayStr(){
  const d = new Date(); d.setDate(d.getDate()-1);
  return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
}
function levelFromXP(xp){ return Math.max(1, 1 + Math.floor((xp||0) / XP_PER_LEVEL)); }
function totalQuestCount(){
  return LAND_KEYS.reduce((n,k)=> n + LANDS[k].quests.length, 0);
}

function emptyQuestLog(){
  const quests = {};
  LAND_KEYS.forEach(k => {
    LANDS[k].quests.forEach(q => {
      quests[q.name] = { status:'lock', stars:0, xp:0, bestPost:0 };
    });
  });
  return quests;
}

function defaultAvatar(){
  try{
    const a = JSON.parse(localStorage.getItem(AVATAR_KEY));
    if(a && a.id) return { id: a.id };
  }catch(e){}
  return { id:'maya' };
}

function newAdventureSave(studentName, avatar){
  const quests = emptyQuestLog();
  const first = LANDS.place.quests[0].name;
  quests[first].status = 'prog';
  return {
    version: 1,
    studentName: studentName || 'Explorer',
    avatar: avatar || defaultAvatar(),
    xp: 0,
    level: 1,
    streak: 1,
    lastPlayed: todayStr(),
    mode: 'adventure',
    assignment: null,
    diagnostic: { taken:false, scores:{}, skipped:false },
    lands: { place:'open', mult:'locked', dec:'locked', frac:'locked', geo:'locked', data:'locked' },
    quests,
    badges: [],
    treasures: []
  };
}

function mayaShowcaseSave(){
  const quests = emptyQuestLog();
  const done = [
    'Read & Write Numbers','Compare Numbers','Rounding','Expanded Form','Number Patterns','Place Value Boss',
    'Equal Groups','Arrays','Facts Fluency','Multiply by 10s'
  ];
  done.forEach(n => { if(quests[n]){ quests[n].status='done'; quests[n].stars=3; quests[n].xp=40; } });
  if(quests['Division Basics']) quests['Division Basics'].status = 'prog';
  return {
    version: 1,
    studentName: 'Maya',
    avatar: defaultAvatar(),
    xp: 1250,
    level: 6,
    streak: 12,
    lastPlayed: todayStr(),
    mode: 'showcase',
    assignment: { land:'frac', title:'Comparing Fractions', done:false },
    diagnostic: { taken:true, scores:{ place:2, mult:1, dec:0, frac:1, geo:0, data:0 }, skipped:false },
    lands: { place:'conquered', mult:'open', dec:'locked', frac:'locked', geo:'locked', data:'locked' },
    quests,
    badges: ['first-quest','land-place','streak-3'],
    treasures: ['crystal-place']
  };
}

function persist(){
  try{ localStorage.setItem(SAVE_KEY, JSON.stringify(save)); }catch(e){}
  try{ if(save && save.avatar) localStorage.setItem(AVATAR_KEY, JSON.stringify(save.avatar)); }catch(e){}
}

function loadSave(){
  try{
    const raw = localStorage.getItem(SAVE_KEY);
    if(!raw) return null;
    const s = JSON.parse(raw);
    if(!s || s.version!==1 || !s.quests) return null;
    return s;
  }catch(e){ return null; }
}

function setSave(next){
  save = next;
  tickStreak();
  persist();
}

function tickStreak(){
  if(!save) return;
  const t = todayStr();
  if(save.lastPlayed === t) return;
  if(save.lastPlayed === ydayStr()) save.streak = (save.streak||0)+1;
  else save.streak = 1;
  save.lastPlayed = t;
  if(save.streak>=3) awardBadge('streak-3', true);
}

function questsDoneCount(){
  if(!save) return 0;
  return Object.values(save.quests).filter(q => q.status==='done').length;
}

function landQuestStats(key){
  const names = LANDS[key].quests.map(q=>q.name);
  let done=0, total=names.length, prog=null;
  names.forEach(n => {
    const st = (save.quests[n]||{}).status || 'lock';
    if(st==='done') done++;
    if(st==='prog') prog = n;
  });
  return { done, total, prog, allDone: done===total };
}

function questStatus(name){
  return (save && save.quests[name] && save.quests[name].status) || 'lock';
}

function setQuestStatus(name, status){
  if(!save.quests[name]) save.quests[name] = { status, stars:0, xp:0, bestPost:0 };
  save.quests[name].status = status;
}

function isAssigned(title, key){
  return !!(save && save.assignment && !save.assignment.done &&
    save.assignment.title===title && save.assignment.land===key);
}

function assignmentPending(){
  return !!(save && save.assignment && !save.assignment.done);
}

function isQuestPlayable(title, key){
  if(isAssigned(title, key)) return true;
  if(!save) return false;
  if(save.lands[key]==='locked') return false;
  const st = questStatus(title);
  return st==='prog' || st==='done';
}

function continueTarget(){
  if(!save) return null;
  // Prefer current in-progress quest on an open/conquered land
  for(const key of LAND_KEYS){
    if(save.lands[key]==='locked') continue;
    const names = LANDS[key].quests.map(q=>q.name);
    const prog = names.find(n => questStatus(n)==='prog');
    if(prog) return { title:prog, key, status:'prog' };
  }
  for(const key of LAND_KEYS){
    if(save.lands[key]==='locked') continue;
    const names = LANDS[key].quests.map(q=>q.name);
    const next = names.find(n => questStatus(n)!=='done');
    if(next) return { title:next, key, status: questStatus(next) };
  }
  // all done — last land boss for review
  const last = LANDS.data.quests[LANDS.data.quests.length-1].name;
  return { title:last, key:'data', status:'done' };
}

function addXP(n){
  if(!n) return;
  const from = save.xp;
  save.xp += n;
  const prev = save.level;
  save.level = levelFromXP(save.xp);
  persist();
  if(typeof animateXP==='function') animateXP(from, save.xp);
  if(typeof refreshHUD==='function') refreshHUD();
  if(save.level > prev && typeof onLevelUp==='function') onLevelUp(save.level);
}

function awardBadge(id, silent){
  if(!save.badges.includes(id)){
    save.badges.push(id);
    persist();
    if(!silent && typeof toast==='function'){
      const b = BADGE_DEFS[id];
      toast('🏅', (b?b.name:'Badge')+' unlocked!');
    }
    if(typeof refreshHUD==='function') refreshHUD();
  }
}

function awardTreasure(id, silent){
  if(!save.treasures.includes(id)){
    save.treasures.push(id);
    persist();
    if(!silent && typeof toast==='function'){
      const t = TREASURE_DEFS[id];
      toast('💎', (t?t.name:'Treasure')+' claimed!');
    }
    if(typeof refreshHUD==='function') refreshHUD();
  }
}

function unlockLand(key, opts){
  if(!save || save.lands[key]!=='locked') return false;
  save.lands[key] = 'open';
  const first = LANDS[key].quests[0].name;
  if(questStatus(first)==='lock') setQuestStatus(first, 'prog');
  persist();
  if(typeof onLandUnlocked==='function') onLandUnlocked(key, opts||{});
  return true;
}

function conquerLand(key){
  save.lands[key] = 'conquered';
  awardTreasure('crystal-'+key);
  awardBadge('land-'+key);
  if(LAND_KEYS.every(k => save.lands[k]==='conquered')) awardBadge('all-crystals');
  persist();
  (LAND_UNLOCKS[key]||[]).forEach(next => {
    if(save.lands[next]==='locked') unlockLand(next);
  });
}

function applyQuestComplete(title, landKey, result){
  const q = save.quests[title] || (save.quests[title]={ status:'done', stars:0, xp:0, bestPost:0 });
  q.status = 'done';
  q.stars = Math.max(q.stars||0, result.stars||0);
  q.xp = (q.xp||0) + (result.xp||0);
  q.bestPost = Math.max(q.bestPost||0, result.postScore||0);
  if(result.stars>=3) awardBadge('smash-3');
  if(questsDoneCount()>=1) awardBadge('first-quest');

  if(save.assignment && save.assignment.title===title){
    save.assignment.done = true;
    const req = LAND_REQUIRES[landKey];
    if(save.lands[landKey]==='locked' && (!req || save.lands[req]==='conquered')){
      unlockLand(landKey);
    }
  }

  const names = LANDS[landKey].quests.map(x=>x.name);
  if(save.lands[landKey] !== 'locked'){
    const anyProg = names.some(n => questStatus(n)==='prog');
    const nextLocked = names.find(n => questStatus(n)==='lock');
    if(nextLocked && !anyProg) setQuestStatus(nextLocked, 'prog');
  }

  const stats = landQuestStats(landKey);
  let justConquered = false;
  if(stats.allDone && save.lands[landKey]!=='conquered'){
    justConquered = true;
    conquerLand(landKey);
    addXP(100);
  }
  persist();
  return { justConquered, stats };
}

function conquerLandFromDiag(key){
  LANDS[key].quests.forEach(q => {
    const rec = save.quests[q.name] || (save.quests[q.name]={ status:'done', stars:0, xp:0, bestPost:0 });
    rec.status = 'done';
    rec.stars = Math.max(rec.stars||0, 2);
  });
  save.lands[key] = 'conquered';
  awardTreasure('crystal-'+key, true);
  awardBadge('land-'+key, true);
}

function applyDiagnosticScores(scores){
  save.diagnostic = { taken:true, scores, skipped:false };
  LAND_KEYS.forEach(k => { save.lands[k] = 'locked'; });
  Object.keys(save.quests).forEach(n => { save.quests[n].status = 'lock'; });

  const ace = k => (scores[k]||0) >= 2;

  function walk(key){
    if(ace(key)){
      conquerLandFromDiag(key);
      (LAND_UNLOCKS[key]||[]).forEach(walk);
    } else {
      save.lands[key] = 'open';
      const first = LANDS[key].quests[0].name;
      setQuestStatus(first, 'prog');
    }
  }
  walk('place');
  if(LAND_KEYS.every(k => save.lands[k]==='conquered')) awardBadge('all-crystals', true);
  persist();
}

function skipDiagnosticToStart(){
  save.diagnostic = { taken:false, scores:{}, skipped:true };
  persist();
}
