/* Crystal Quest — pan, walk, camera follow */
const MAP_W = 1014, MAP_H = 806;
const PATH_SNAP = 28;
const WORLD_ART = { src:'assets/map.jpg?v=4', w:MAP_W, h:MAP_H };

function currentArt(){
  if(typeof inLand!=='undefined' && inLand && currentLandKey && LANDS[currentLandKey] && LANDS[currentLandKey].art){
    return LANDS[currentLandKey].art;
  }
  return WORLD_ART;
}
function mapW(){ return currentArt().w; }
function mapH(){ return currentArt().h; }

function applyMapArt(){
  const art = currentArt();
  const stage = $('#mapStage');
  const img = stage && stage.querySelector('img.art');
  if(stage){
    stage.style.width = art.w+'px';
    stage.style.height = art.h+'px';
  }
  if(img){
    if(img.getAttribute('src') !== art.src) img.src = art.src;
    img.style.width = art.w+'px';
    img.style.height = art.h+'px';
  }
  const blur = $('#bgBlur');
  if(blur){
    blur.style.backgroundImage = `url('${art.src}')`;
  }
}
/* Wooden / sand paths matching the painted map (map-pixel coords). */
const PATHS = [
  // Place Value trail
  [[215,400],[200,355],[188,310],[176,270],[168,230]],
  // Causeway place → hub → purple shore
  [[215,400],[255,425],[320,445],[390,455],[460,465],[510,470]],
  // Hub down to Fractions
  [[320,445],[280,500],[230,545],[195,590],[184,630]],
  // Fractions beach loop
  [[184,630],[155,600],[165,570],[190,600]],
  // Fractions → Geometry
  [[200,645],[270,665],[350,685],[430,700],[490,705]],
  // Geometry loop
  [[490,705],[520,670],[500,640],[470,660]],
  // Geometry → Data stepping stones
  [[520,700],[600,685],[690,660],[770,635],[830,610],[855,585]],
  // Data trail
  [[855,585],[860,545],[845,520]],
  // Purple island climb
  [[510,470],[545,440],[560,390],[552,340],[548,300],[560,255]],
  // Purple → Decimals bridge
  [[600,355],[680,345],[760,330],[840,315],[880,300]],
  // Decimals trail
  [[880,300],[900,275],[860,265]]
];

function closestOnSeg(px,py,ax,ay,bx,by){
  const abx=bx-ax, aby=by-ay;
  const den=abx*abx+aby*aby || 1;
  const t=Math.max(0, Math.min(1, ((px-ax)*abx+(py-ay)*aby)/den));
  const x=ax+t*abx, y=ay+t*aby;
  return { x, y, t, d:Math.hypot(px-x, py-y) };
}

function activePaths(){
  if(typeof inLand!=='undefined' && inLand && currentLandKey && LANDS[currentLandKey]){
    const L = LANDS[currentLandKey];
    if(L.paths){
      const open = typeof landGateOpen==='function' ? landGateOpen(currentLandKey) : true;
      if(L.gateAfter && !open) return L.paths.slice(0, L.pathsOpen || L.gateAfter);
      return L.paths;
    }
    if(L.path) return [L.path];
  }
  return PATHS;
}

function snapToPath(px, py){
  let best=null;
  activePaths().forEach(poly => {
    for(let i=0;i<poly.length-1;i++){
      const a=poly[i], b=poly[i+1];
      const p=closestOnSeg(px,py,a[0],a[1],b[0],b[1]);
      if(!best || p.d<best.d) best=p;
    }
  });
  return best;
}

function tryWalkOnPath(dx, dy){
  const nx=walker.x+dx, ny=walker.y+dy;
  const snap=snapToPath(nx, ny);
  if(!snap) return false;
  const along=(snap.x-walker.x)*dx + (snap.y-walker.y)*dy;
  const snapR = (inLand && LANDS[currentLandKey] && LANDS[currentLandKey].art) ? 42 : PATH_SNAP;
  if(snap.d <= snapR && along >= -0.4){
    walker.x=snap.x; walker.y=snap.y;
    return true;
  }
  return false;
}
const AVATARS = [
  { id:'mai',    label:'Mai' },
  { id:'imani',  label:'Imani' },
  { id:'darius', label:'Darius' },
  { id:'nolan',  label:'Nolan' },
  { id:'lena',   label:'Lena' }
];
function avatarSrc(id, frame){
  const ok = AVATARS.some(a => a.id===id);
  const who = ok?id:'mai';
  const file = frame ? (who+'-'+frame+'.png') : (who+'.png');
  return 'assets/avatars/' + file + '?v=5';
}
function avatarOf(id){ return AVATARS.find(a => a.id===id) || AVATARS[0]; }
const WALK_FRAMES = ['walk-1','walk-2','walk-3','walk-4'];
const preloadedWalk = {};
function preloadWalk(id){
  const who = (AVATARS.some(a => a.id===id) ? id : 'mai');
  if(preloadedWalk[who]) return;
  preloadedWalk[who] = true;
  WALK_FRAMES.forEach(f => { const im = new Image(); im.src = avatarSrc(who, f); });
}

let mapCam = { x: MAP_W/2, y: MAP_H/2, scale: 1 };
let camMode = 'overview'; // overview until first walk, then follow
let walker = { x: 176, y: 360, facing: 1, moving: false, frame: 0, frameT: 0 };
let exploreDrag = null;
let exploreRaf = 0;
let exploreBound = false;
let suppressClick = false;
const held = {};

function exploreBusy(){
  const title = $('#titleScreen');
  if(title && !title.classList.contains('gone')) return true;
  if(document.querySelector('.modal-scrim.open')) return true;
  if($('#questPlayer') && $('#questPlayer').classList.contains('open')) return true;
  if($('#diagPlayer') && $('#diagPlayer').classList.contains('open')) return true;
  const ae = document.activeElement;
  if(ae && (ae.tagName==='INPUT' || ae.tagName==='TEXTAREA')) return true;
  return false;
}

function targetScale(){
  const hero = $('#hero');
  if(!hero) return 1;
  const W = mapW(), H = mapH();
  if(camMode==='overview'){
    return Math.min(hero.clientWidth / W, hero.clientHeight / H) * 0.96;
  }
  if(camMode==='land'){
    if(currentArt().src !== WORLD_ART.src){
      return Math.max(hero.clientWidth / W, hero.clientHeight / H);
    }
    return Math.max(hero.clientWidth / W, hero.clientHeight / H) * 1.85;
  }
  return Math.max(hero.clientWidth / W, hero.clientHeight / H) * 1.08;
}

function clampWalker(){
  const W = mapW(), H = mapH();
  walker.x = Math.max(40, Math.min(W-40, walker.x));
  walker.y = Math.max(70, Math.min(H-24, walker.y));
}

function clampCam(){
  const hero = $('#hero'); if(!hero) return;
  const s = mapCam.scale;
  const W = mapW(), H = mapH();
  const halfW = hero.clientWidth / (2 * s);
  const halfH = hero.clientHeight / (2 * s);
  if(W <= halfW*2) mapCam.x = W/2;
  else mapCam.x = Math.min(W - halfW, Math.max(halfW, mapCam.x));
  if(H <= halfH*2) mapCam.y = H/2;
  else mapCam.y = Math.min(H - halfH, Math.max(halfH, mapCam.y));
}

function applyCamera(instant){
  const hero = $('#hero'), stage = $('#mapStage');
  if(!hero || !stage) return;
  mapCam.scale = targetScale();
  clampCam();
  const s = mapCam.scale;
  const panel = $('#landPanel');
  const shift = (inLand && panel && panel.classList.contains('open')) ? (panel.offsetWidth * 0.42) : 0;
  const tx = hero.clientWidth/2 - shift - mapCam.x * s;
  const ty = hero.clientHeight/2 - mapCam.y * s;
  stage.style.top = '0px';
  stage.style.left = '0px';
  const zooming = camMode==='follow' && !instant && !exploreDrag;
  stage.style.transition = instant || exploreDrag
    ? 'none'
    : (zooming ? 'transform .75s cubic-bezier(.3,.85,.3,1)' : 'transform .18s ease-out');
  stage.style.transform = `translate(${tx}px,${ty}px) scale(${s})`;
  const blur = $('#bgBlur');
  if(blur){
    blur.style.transition = stage.style.transition.replace('transform','background-position, background-size');
    blur.style.backgroundSize = (mapW() * s) + 'px ' + (mapH() * s) + 'px';
    blur.style.backgroundPosition = tx + 'px ' + ty + 'px';
  }
}

function beginFollow(){
  if(camMode==='follow' || camMode==='land') return;
  camMode = 'follow';
  mapCam.x = walker.x;
  mapCam.y = walker.y;
  applyCamera(false);
}

function placeWalker(){
  const el = $('#walker'); if(!el) return;
  el.style.left = walker.x + 'px';
  el.style.top = walker.y + 'px';
  el.classList.toggle('moving', walker.moving);
  el.classList.toggle('flip', walker.facing < 0);
  const img = $('#walkerImg');
  if(img){
    const id = (save && save.avatar && save.avatar.id) || (avatar && avatar.id) || 'mai';
    const pose = walker.moving ? WALK_FRAMES[walker.frame % WALK_FRAMES.length] : null;
    const next = avatarSrc(id, pose);
    if(img.dataset.pose !== next){ img.src = next; img.dataset.pose = next; }
  }
}

function nearestLand(){
  if(inLand) return null;
  let best = null, bestD = 78;
  LAND_KEYS.forEach(key => {
    const c = LANDS[key].center;
    const d = Math.hypot(walker.x - c[0], walker.y - (c[1] + 36));
    if(d < bestD){ bestD = d; best = key; }
  });
  return best;
}

function nearestQuest(){
  if(!inLand || !currentLandKey) return null;
  const L = LANDS[currentLandKey];
  const nodes = (typeof landNodes==='function') ? landNodes(currentLandKey) : (L.nodes||[]);
  let best = null, bestD = 70;
  L.quests.forEach((q,i)=>{
    const xy = nodes[i]; if(!xy) return;
    const d = Math.hypot(walker.x - xy[0], walker.y - xy[1]);
    if(d < bestD){ bestD = d; best = { q, i, st: questStatus(q.name) }; }
  });
  return best;
}

function updateExploreHint(){
  const hint = $('#exploreHint'); if(!hint) return;
  if(exploreBusy()){ hint.classList.remove('show'); return; }
  if(inLand){
    const at = nearestQuest();
    if(at){
      const L = LANDS[currentLandKey];
      const partLocked = L.gateAfter && at.i >= L.gateAfter && !landGateOpen(currentLandKey);
      hint.innerHTML = partLocked
        ? `🔒 Master 3 shrines to open this part of the island`
        : (at.st==='lock'
          ? `🔒 Conquer the side-quests in order`
          : `↵  ${at.st==='done'?'Replay':'Play'} <b>${at.q.name}</b>`);
      hint.classList.add('show');
    } else {
      hint.innerHTML = 'Walk to a side-quest · <b>World Map</b> to leave';
      hint.classList.add('show');
    }
    return;
  }
  const key = nearestLand();
  if(key){
    const L = LANDS[key];
    const locked = save && save.lands[key]==='locked';
    hint.innerHTML = locked
      ? (canUnlockLand(key)
        ? `↵  Diagnostic to unlock <b>${L.title}</b>`
        : `🔒 Master a land first — only 2 at a time`)
      : `↵  Enter the Land of <b>${L.title}</b>`;
    hint.classList.add('show');
  } else if(camMode==='overview'){
    hint.innerHTML = 'Use the <b>arrow keys</b> to start exploring';
    hint.classList.add('show');
  } else {
    hint.innerHTML = 'Arrow keys to walk · Drag to look around';
    hint.classList.add('show');
  }
}

function tryEnterHere(){
  if(inLand){
    const at = nearestQuest();
    if(!at) return;
    selectLandQuest(at.q.name, currentLandKey);
    return;
  }
  const key = nearestLand();
  if(!key) return;
  const pill = document.querySelector(`.pill[data-key="${key}"]`);
  if(pill) landClick(key, pill);
}

function spawnWalker(){
  const t = (typeof continueTarget==='function' && save) ? continueTarget() : null;
  if(t && save && save.lands[t.key]!=='locked'){
    const c = LANDS[t.key].center;
    walker.x = c[0];
    walker.y = c[1] + 42;
  } else {
    walker.x = 390;
    walker.y = 455;
  }
  walker.facing = 1;
  walker.moving = false;
  walker.frame = 0;
  camMode = 'overview';
  mapCam.x = MAP_W/2;
  mapCam.y = MAP_H/2;
  clampWalker();
  syncWalkerArt();
  placeWalker();
  applyCamera(true);
}

function syncWalkerArt(){
  const id = (save && save.avatar && save.avatar.id) || (avatar && avatar.id) || 'mai';
  preloadWalk(id);
  const src = avatarSrc(id);
  const w = $('#walkerImg'); if(w){ w.src = src; w.dataset.pose = src; }
  const n = $('#walkerName'); if(n) n.textContent = (save && save.studentName) || '';
  const hud = $('#hudBuddyImg'); if(hud){ hud.src = src; hud.style.filter = ''; }
  const qb = $('#qpBuddyImg'); if(qb){ qb.src = src; qb.style.filter = ''; }
  const top = $('#topAvatarImg'); if(top) top.src = src;
}

function showExploreIntro(){
  openModal('exploreIntro');
}

function dismissExploreIntro(){
  closeModal('exploreIntro');
}

function exploreTick(){
  if(exploreBusy()){
    walker.moving = false;
    placeWalker();
    exploreRaf = requestAnimationFrame(exploreTick);
    return;
  }
  let dx = 0, dy = 0;
  if(held.ArrowLeft || held.a || held.A) dx -= 1;
  if(held.ArrowRight || held.d || held.D) dx += 1;
  if(held.ArrowUp || held.w || held.W) dy -= 1;
  if(held.ArrowDown || held.s || held.S) dy += 1;
  if(dx || dy){
    beginFollow();
    const len = Math.hypot(dx, dy) || 1;
    const step = (inLand && LANDS[currentLandKey] && LANDS[currentLandKey].art) ? 4.6 : 3.1;
    const moved = tryWalkOnPath((dx/len)*step, (dy/len)*step);
    if(dx) walker.facing = dx < 0 ? -1 : 1;
    walker.moving = !!moved;
    if(moved){
      walker.frameT += 1;
      if(walker.frameT >= 6){ walker.frameT = 0; walker.frame++; }
    }
    if(!(camMode==='land' && currentArt().src !== WORLD_ART.src)){
      mapCam.x += (walker.x - mapCam.x) * 0.14;
      mapCam.y += (walker.y - mapCam.y) * 0.14;
    }
    applyCamera(true);
  } else {
    walker.moving = false;
    walker.frame = 0;
    walker.frameT = 0;
  }
  placeWalker();
  updateExploreHint();
  exploreRaf = requestAnimationFrame(exploreTick);
}

function initExplore(){
  const hero = $('#hero');
  if(!hero) return;
  if(exploreBound) return;
  exploreBound = true;

  hero.addEventListener('pointerdown', e => {
    if(exploreBusy()) return;
    if(e.target.closest('.pill,.lockchip,.drawer,.hud,.drawer-tab,.explore-hint,.qsite,.lv-back,.lv-progress,.land-panel')) return;
    exploreDrag = { x:e.clientX, y:e.clientY, camX:mapCam.x, camY:mapCam.y, moved:false, id:e.pointerId };
    hero.classList.add('is-dragging');
    try{ hero.setPointerCapture(e.pointerId); }catch(_){}
  });
  hero.addEventListener('pointermove', e => {
    if(!exploreDrag) return;
    const s = mapCam.scale || 1;
    const dx = e.clientX - exploreDrag.x;
    const dy = e.clientY - exploreDrag.y;
    if(Math.hypot(dx,dy) > 4) exploreDrag.moved = true;
    mapCam.x = exploreDrag.camX - dx / s;
    mapCam.y = exploreDrag.camY - dy / s;
    clampCam();
    applyCamera(true);
  });
  const endDrag = () => {
    if(exploreDrag && exploreDrag.moved) suppressClick = true;
    exploreDrag = null;
    hero.classList.remove('is-dragging');
  };
  hero.addEventListener('click', e => {
    if(!suppressClick) return;
    e.stopPropagation();
    suppressClick = false;
  }, true);
  hero.addEventListener('pointerup', endDrag);
  hero.addEventListener('pointercancel', endDrag);

  window.addEventListener('keydown', e => {
    const intro = $('#exploreIntro');
    if(intro && intro.classList.contains('open') && ['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','w','a','s','d','W','A','S','D','Enter'].includes(e.key)){
      e.preventDefault();
      dismissExploreIntro();
      held[e.key] = true;
      return;
    }
    if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown',' '].includes(e.key)){
      if(!exploreBusy()) e.preventDefault();
    }
    held[e.key] = true;
    if(exploreBusy()) return;
    if(e.key==='Enter'){ e.preventDefault(); tryEnterHere(); }
  });
  window.addEventListener('keyup', e => { held[e.key] = false; });

  if(!exploreRaf) exploreRaf = requestAnimationFrame(exploreTick);
}

function renderAvatarGrid(hostId, selectedId){
  const host = $('#'+hostId); if(!host) return;
  const cur = selectedId || (tempAv && tempAv.id) || 'mai';
  // one-row carousel: arrows scroll the track; selection toggles classes in
  // place (no re-render) so the scroll position never jumps under a tap
  host.innerHTML = `
    <button type="button" class="av-arrow" aria-label="Previous adventurers">‹</button>
    <div class="av-track">${AVATARS.map(a =>
      `<button type="button" class="av-pick${a.id===cur?' sel':''}" data-id="${a.id}">
        <img src="${avatarSrc(a.id)}" alt="Adventurer option">
      </button>`).join('')}</div>
    <button type="button" class="av-arrow" aria-label="More adventurers">›</button>`;
  const track = host.querySelector('.av-track');
  const [back, fwd] = host.querySelectorAll('.av-arrow');
  // instant scroll: 'smooth' silently no-ops in some embedded browsers,
  // and the proximity snap settles the landing anyway
  const step = () => (track.querySelector('.av-pick')?.offsetWidth || 160) + 12;
  back.onclick = () => track.scrollBy({ left: -step() });
  fwd.onclick  = () => track.scrollBy({ left:  step() });
  track.querySelectorAll('.av-pick').forEach(btn => {
    btn.onclick = () => {
      tempAv = { id: btn.dataset.id };
      track.querySelectorAll('.av-pick').forEach(b => b.classList.toggle('sel', b === btn));
      const prev = $('#setupPrevImg'); if(prev) prev.src = avatarSrc(tempAv.id);
      const avp = $('#avPrevImg'); if(avp) avp.src = avatarSrc(tempAv.id);
    };
  });
  // start with the selected adventurer centered
  const sel = track.querySelector('.av-pick.sel');
  if(sel) track.scrollLeft = sel.offsetLeft - track.clientWidth/2 + sel.offsetWidth/2;
}
