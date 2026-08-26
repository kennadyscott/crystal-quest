/* Crystal Quest — pan, walk, camera follow */
const MAP_W = 1014, MAP_H = 806;
const AVATARS = [
  { id:'mai',    label:'Mai' },
  { id:'imani',  label:'Imani' },
  { id:'darius', label:'Darius' },
  { id:'nolan',  label:'Nolan' },
  { id:'lena',   label:'Lena' }
];
function avatarSrc(id){
  const ok = AVATARS.some(a => a.id===id);
  return 'assets/avatars/' + (ok?id:'mai') + '.png?v=3';
}
function avatarOf(id){ return AVATARS.find(a => a.id===id) || AVATARS[0]; }

let mapCam = { x: 549, y: 345, scale: 1 };
let walker = { x: 549, y: 380, facing: 1, moving: false };
let exploreDrag = null;
let exploreRaf = 0;
let exploreBound = false;
let suppressClick = false;
const held = {};

function exploreBusy(){
  if(inLand) return true;
  const title = $('#titleScreen');
  if(title && !title.classList.contains('gone')) return true;
  if(document.querySelector('.modal-scrim.open')) return true;
  if($('#questPlayer') && $('#questPlayer').classList.contains('open')) return true;
  if($('#diagPlayer') && $('#diagPlayer').classList.contains('open')) return true;
  const ae = document.activeElement;
  if(ae && (ae.tagName==='INPUT' || ae.tagName==='TEXTAREA')) return true;
  return false;
}

function coverScale(){
  const hero = $('#hero');
  if(!hero) return 1;
  return Math.max(hero.clientWidth / MAP_W, hero.clientHeight / MAP_H) * 1.06;
}

function clampWalker(){
  walker.x = Math.max(40, Math.min(MAP_W-40, walker.x));
  walker.y = Math.max(70, Math.min(MAP_H-24, walker.y));
}

function clampCam(){
  const hero = $('#hero'); if(!hero) return;
  const s = mapCam.scale;
  const halfW = hero.clientWidth / (2 * s);
  const halfH = hero.clientHeight / (2 * s);
  mapCam.x = Math.min(MAP_W - halfW, Math.max(halfW, mapCam.x));
  mapCam.y = Math.min(MAP_H - halfH, Math.max(halfH, mapCam.y));
}

function applyCamera(instant){
  const hero = $('#hero'), stage = $('#mapStage');
  if(!hero || !stage || inLand) return;
  mapCam.scale = coverScale();
  clampCam();
  const s = mapCam.scale;
  const tx = hero.clientWidth/2 - mapCam.x * s;
  const ty = hero.clientHeight/2 - mapCam.y * s;
  stage.style.top = '0px';
  stage.style.left = '0px';
  stage.style.transition = instant ? 'none' : (exploreDrag ? 'none' : 'transform .18s ease-out');
  stage.style.transform = `translate(${tx}px,${ty}px) scale(${s})`;
  const blur = $('#bgBlur');
  if(blur){
    blur.style.backgroundSize = (MAP_W * s) + 'px ' + (MAP_H * s) + 'px';
    blur.style.backgroundPosition = tx + 'px ' + ty + 'px';
  }
}

function placeWalker(){
  const el = $('#walker'); if(!el) return;
  el.style.left = walker.x + 'px';
  el.style.top = walker.y + 'px';
  el.classList.toggle('moving', walker.moving);
  el.classList.toggle('flip', walker.facing < 0);
}

function nearestLand(){
  let best = null, bestD = 78;
  LAND_KEYS.forEach(key => {
    const c = LANDS[key].center;
    const d = Math.hypot(walker.x - c[0], walker.y - (c[1] + 36));
    if(d < bestD){ bestD = d; best = key; }
  });
  return best;
}

function updateExploreHint(){
  const hint = $('#exploreHint'); if(!hint) return;
  if(exploreBusy()){ hint.classList.remove('show'); return; }
  const key = nearestLand();
  if(key){
    const L = LANDS[key];
    const locked = save && save.lands[key]==='locked';
    hint.innerHTML = locked
      ? `🔒 ${L.title} is still locked`
      : `↵  Enter the Land of <b>${L.title}</b>`;
    hint.classList.add('show');
  } else {
    hint.innerHTML = 'Arrow keys to walk · Drag to look around';
    hint.classList.add('show');
  }
}

function tryEnterHere(){
  const key = nearestLand();
  if(!key) return;
  const pill = document.querySelector(`.pill[data-key="${key}"]`);
  if(pill) landClick(key, pill);
}

function spawnWalker(){
  const t = (typeof continueTarget==='function' && save) ? continueTarget() : null;
  const key = t ? t.key : 'place';
  const c = LANDS[key].center;
  walker.x = c[0];
  walker.y = c[1] + 42;
  walker.facing = 1;
  mapCam.x = walker.x;
  mapCam.y = walker.y;
  clampWalker();
  syncWalkerArt();
  placeWalker();
  applyCamera(true);
}

function syncWalkerArt(){
  const id = (save && save.avatar && save.avatar.id) || (avatar && avatar.id) || 'mai';
  const src = avatarSrc(id);
  const w = $('#walkerImg'); if(w) w.src = src;
  const n = $('#walkerName'); if(n) n.textContent = (save && save.studentName) || '';
  const hud = $('#hudBuddyImg'); if(hud){ hud.src = src; hud.style.filter = ''; }
  const qb = $('#qpBuddyImg'); if(qb){ qb.src = src; qb.style.filter = ''; }
  const top = $('#topAvatarImg'); if(top) top.src = src;
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
    const len = Math.hypot(dx, dy) || 1;
    walker.x += (dx/len) * 2.6;
    walker.y += (dy/len) * 2.6;
    if(dx) walker.facing = dx < 0 ? -1 : 1;
    walker.moving = true;
    clampWalker();
    mapCam.x += (walker.x - mapCam.x) * 0.14;
    mapCam.y += (walker.y - mapCam.y) * 0.14;
    applyCamera(true);
  } else {
    walker.moving = false;
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
    if(e.target.closest('.pill,.lockchip,.drawer,.hud,.drawer-tab,.explore-hint')) return;
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
  host.innerHTML = AVATARS.map(a =>
    `<button type="button" class="av-pick${a.id===cur?' sel':''}" data-id="${a.id}" title="${a.label}">
      <img src="${avatarSrc(a.id)}" alt="${a.label}">
      <span>${a.label}</span>
    </button>`
  ).join('');
  host.querySelectorAll('.av-pick').forEach(btn => {
    btn.onclick = () => {
      tempAv = { id: btn.dataset.id };
      renderAvatarGrid(hostId, tempAv.id);
      const prev = $('#setupPrevImg'); if(prev) prev.src = avatarSrc(tempAv.id);
      const avp = $('#avPrevImg'); if(avp) avp.src = avatarSrc(tempAv.id);
    };
  });
}
