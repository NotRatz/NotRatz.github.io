// naraka-configurator/app.js
// Recursive JSON editor + presets + import/export for QualitySettingsData.json

const DEFAULT = {
  preset: -1,
  l22GraphicQualityLevel: {
    m_modelQualityLevel: 0,
    m_tessellationQualityLevel: 0,
    m_visualEffectsQualityLevel: 0,
    m_textureQualityLevel: 0,
    m_shadowQualityLevel: 0,
    m_volumetricLightLevel: 0,
    m_cloudQualityLevel: 0,
    m_aoLevel: 0,
    m_SSRLevel: 0,
    m_AALevel: 0,
    m_PostProcessingLevel: 1,
    m_LightingQualityLevel: 0
  },
  l22SystemQualitySetting: {
    renderScale: 1.0,
    renderScaleStep: 0.05,
    aaMode: 2,
    checkboardRendering: 1,
    upSamplingType: 0,
    enableDlssDx12: true,
    enableDlssG: true,
    frameBoostDlssG: 0,
    enableDlssRR: false,
    randomDiscardFactor: 4.0,
    dlssMode: -2,
    xessMode: 101,
    xefgMode: 0,
    dlssSharpness: 0.5,
    lxFsr2Mode: 0,
    fsr2Sharpness: 0.0,
    lxFsr3Mode: 1,
    enbaleFSR3FrameInterpolation: false,
    nisQuality: 0,
    fullScreenMode: 0,
    resolutionWidth: 1920,
    resolutionHeight: 1080,
    frameRateLimit: -1,
    vSyncCount: 0,
    gamma: 2.2,
    maxLuma: 1.0,
    minLuma: 0.01,
    paperWhite: 9.0,
    mHDRMode: 0,
    reflexMode: 0,
    xellMode: 0,
    antiLag2Enabled: false,
    vrsMode: 0,
    colorBlindMode: 0,
    colorBlindStrength: 0.0,
    colorBlindQualityMode: false,
    nvHighlightsEnabled: false,
    styleMode: 0,
    motionBlurEnabled: false,
    raytracingEnabled: false,
    raytracingAO: false,
    raytracingGI: false,
    raytracingReflection: false,
    raytracingShadow: false,
    raytracingBVHAllInOne: false,
    raytracingBVHActorCountMax: 0,
    rtgiResolution: 1,
    characterAdditionalPhysics1: true,
    xboxQualityOption: 1
  }
};

const STORAGE_KEY = 'naraka.settings.v1';
function $(sel){ return document.querySelector(sel); }

let state = loadState() || JSON.parse(JSON.stringify(DEFAULT));
let editorHandle = null;

function loadState(){
  try{ const raw = localStorage.getItem(STORAGE_KEY); return raw ? JSON.parse(raw) : null; }catch(e){ return null; }
}

function saveState(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(state, null, 2)); renderPreview(); }
function resetToDefault(){ state = JSON.parse(JSON.stringify(DEFAULT)); saveState(); if (editorHandle) editorHandle.setValue(state); }
function renderPreview(){ const p = $('#json-preview'); if (p) p.textContent = JSON.stringify(state, null, 2); }

function animatePreview(){ const p = document.getElementById('json-preview'); if (!p) return; p.classList.remove('animate-update'); // restart
  void p.offsetWidth; p.classList.add('animate-update'); setTimeout(()=> p.classList.remove('animate-update'), 600);
}

// Lightweight recursive editor
function createJsonEditor(container, initialJson, options = {}){
  if (!container || !(container instanceof HTMLElement)) throw new Error('container must be an HTMLElement');
  const opts = Object.assign({ onChange: null, allowAddRemove: true }, options);
  let localState = JSON.parse(JSON.stringify(initialJson));
  function isObject(v){ return v && typeof v === 'object' && !Array.isArray(v); }
  function deepClone(v){ return JSON.parse(JSON.stringify(v)); }

  function makeRow(labelEl, controlEl, actionsEl){
    const row = document.createElement('div');
    row.className = 'form-row';
    row.style.display = 'flex'; row.style.gap = '8px'; row.style.alignItems = 'center'; row.style.marginBottom = '6px';
    if (labelEl) labelEl.style.minWidth = '140px';
    row.appendChild(labelEl || document.createElement('div'));
    row.appendChild(controlEl || document.createElement('div'));
    if (actionsEl) row.appendChild(actionsEl);
    return row;
  }

  function inferType(v){ if (v === null) return 'null'; if (typeof v === 'boolean') return 'boolean'; if (typeof v === 'number' && !Number.isNaN(v)) return 'number'; return 'string'; }
  function coerceValue(raw, type){ if (type === 'null') return null; if (type === 'boolean') return raw === 'true' || raw === true; if (type === 'number'){ const n = Number(raw); return Number.isNaN(n) ? raw : n; } return String(raw); }

  function renderPrimitive(key, value, onUpdate){
    const wrapper = document.createElement('div');
    const input = document.createElement('input'); input.className = 'form-control'; input.style.minWidth = '260px'; input.value = value === null ? '' : String(value);
    const typeSelect = document.createElement('select'); typeSelect.className = 'form-control'; ['string','number','boolean','null'].forEach(t=>{ const o = document.createElement('option'); o.value = t; o.textContent = t; if (t===inferType(value)) o.selected = true; typeSelect.appendChild(o); });
    input.addEventListener('input', ()=> onUpdate(coerceValue(input.value, typeSelect.value)));
    typeSelect.addEventListener('change', ()=> onUpdate(coerceValue(input.value, typeSelect.value)));
    wrapper.appendChild(input); wrapper.appendChild(typeSelect); return wrapper;
  }

  function renderObject(obj, path = []){
    const c = document.createElement('div'); c.style.borderLeft = '2px solid #eee'; c.style.paddingLeft = '8px';
    Object.keys(obj).forEach(key => {
      const value = obj[key]; const label = document.createElement('label'); label.textContent = key;
      const actions = document.createElement('div'); actions.style.display = 'flex'; actions.style.gap = '6px';
      if (isObject(value)){
        const child = renderObject(value, path.concat(key)); const row = makeRow(label, child, opts.allowAddRemove ? actions : null);
        if (opts.allowAddRemove){ const del = document.createElement('button'); del.className = 'btn btn-danger btn-sm'; del.textContent = 'Remove'; del.type = 'button'; del.addEventListener('click', ()=>{ deleteAtPath(path.concat(key)); rerender(); triggerChange(); }); actions.appendChild(del);
          const add = document.createElement('button'); add.className = 'btn btn-secondary btn-sm'; add.textContent = '+'; add.type = 'button'; add.title = 'Add nested key'; add.addEventListener('click', ()=>{ const newKey = prompt('New nested key name:'); if (!newKey) return; value[newKey] = ''; rerender(); triggerChange(); }); actions.appendChild(add); }
        c.appendChild(row);
      } else if (Array.isArray(value)){
        const arrNode = renderArray(value, path.concat(key)); const row = makeRow(label, arrNode, opts.allowAddRemove ? actions : null);
        if (opts.allowAddRemove){ const addItem = document.createElement('button'); addItem.className = 'btn btn-secondary btn-sm'; addItem.textContent = 'Add item'; addItem.type = 'button'; addItem.addEventListener('click', ()=>{ value.push(null); rerender(); triggerChange(); }); actions.appendChild(addItem);
          const del = document.createElement('button'); del.className = 'btn btn-danger btn-sm'; del.textContent = 'Remove'; del.type = 'button'; del.addEventListener('click', ()=>{ deleteAtPath(path.concat(key)); rerender(); triggerChange(); }); actions.appendChild(del); }
        c.appendChild(row);
      } else {
        const prim = renderPrimitive(key, value, newVal => { setAtPath(path.concat(key), newVal); triggerChange(); }); const row = makeRow(label, prim, opts.allowAddRemove ? actions : null);
                  if (opts.allowAddRemove){ const del = document.createElement('button'); del.className = 'btn btn-danger btn-sm'; del.textContent = 'Remove'; del.type = 'button'; del.addEventListener('click', ()=>{ arr.splice(idx,1); rerender(); triggerChange(); }); actions.appendChild(del); }
        c.appendChild(row);
      }
    });
    if (opts.allowAddRemove){ const footer = document.createElement('div'); footer.style.marginTop = '6px'; const k = document.createElement('input'); k.className = 'form-control'; k.placeholder = 'new key'; const v = document.createElement('input'); v.className = 'form-control'; v.placeholder = 'value'; const b = document.createElement('button'); b.className = 'btn btn-secondary btn-sm'; b.type = 'button'; b.textContent = 'Add key'; b.addEventListener('click', ()=>{ const keyName = k.value && k.value.trim(); if (!keyName){ alert('Enter a key name'); return; } if (Object.prototype.hasOwnProperty.call(obj, keyName)){ alert('Key exists'); return; } obj[keyName] = v.value; k.value = ''; v.value = ''; rerender(); triggerChange(); }); footer.appendChild(k); footer.appendChild(v); footer.appendChild(b); c.appendChild(footer); }
    return c;
  }

  function renderArray(arr, path = []){ const container = document.createElement('div'); container.style.display = 'flex'; container.style.flexDirection = 'column'; container.style.gap = '6px'; arr.forEach((item, idx)=>{ const idxLabel = document.createElement('label'); idxLabel.textContent = `[${idx}]`; if (isObject(item)){ const child = renderObject(item, path.concat(idx)); const actions = document.createElement('div'); if (opts.allowAddRemove){ const del = document.createElement('button'); del.className = 'btn btn-danger btn-sm'; del.textContent = 'Remove'; del.type = 'button'; del.addEventListener('click', ()=>{ arr.splice(idx,1); rerender(); triggerChange(); }); actions.appendChild(del); } container.appendChild(makeRow(idxLabel, child, actions)); } else if (Array.isArray(item)){ const nested = renderArray(item, path.concat(idx)); container.appendChild(makeRow(idxLabel, nested, null)); } else { const prim = renderPrimitive(idx, item, newVal => { arr[idx] = newVal; triggerChange(); }); const actions = document.createElement('div'); if (opts.allowAddRemove){ const del = document.createElement('button'); del.className = 'btn btn-danger btn-sm'; del.textContent = 'Remove'; del.type = 'button'; del.addEventListener('click', ()=>{ arr.splice(idx,1); rerender(); triggerChange(); }); actions.appendChild(del); } container.appendChild(makeRow(idxLabel, prim, actions)); } }); return container; }

  function setAtPath(path, value){ let cur = localState; for (let i=0;i<path.length-1;i++) cur = cur[path[i]]; cur[path[path.length-1]] = value; }
  function deleteAtPath(path){ let cur = localState; for (let i=0;i<path.length-1;i++) cur = cur[path[i]]; const last = path[path.length-1]; if (Array.isArray(cur)) cur.splice(last,1); else delete cur[last]; }

  const root = document.createElement('div'); root.style.fontFamily = 'system-ui,Segoe UI,Roboto,Arial'; root.style.fontSize = '13px'; container.innerHTML = ''; container.appendChild(root);

  function rerender(){ root.innerHTML = ''; if (isObject(localState)) root.appendChild(renderObject(localState, [])); else if (Array.isArray(localState)) root.appendChild(renderArray(localState, [])); else { const lab = document.createElement('label'); lab.textContent = 'value'; const prim = renderPrimitive('', localState, newVal => { localState = newVal; triggerChange(); }); root.appendChild(makeRow(lab, prim, null)); } }

  function triggerChange(){ if (typeof opts.onChange === 'function'){ try{ opts.onChange(deepClone(localState)); }catch(e){ console.error(e); } } }

  function getValue(){ return deepClone(localState); }
  function setValue(newv){ localState = deepClone(newv); rerender(); triggerChange(); }
  function destroy(){ container.removeChild(root); }

  setValue(initialJson);
  return { getValue, setValue, destroy, rerender };
}

// End editor

function downloadJSON(){ const blob = new Blob([JSON.stringify(state, null, 2)], {type:'application/json'}); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'QualitySettingsData.json'; document.body.appendChild(a); a.click(); a.remove(); }

function copyToClipboard(){ navigator.clipboard.writeText(JSON.stringify(state, null, 2)); }

function applyPreset(name){
  if (name === 'low'){
    state.l22GraphicQualityLevel.m_modelQualityLevel = 0;
    state.l22GraphicQualityLevel.m_textureQualityLevel = 0;
    state.l22GraphicQualityLevel.m_shadowQualityLevel = 0;
    state.l22SystemQualitySetting.renderScale = 0.9;
    state.l22SystemQualitySetting.frameRateLimit = 60;
  } else if (name === 'medium'){
    state.l22GraphicQualityLevel.m_modelQualityLevel = 1;
    state.l22GraphicQualityLevel.m_textureQualityLevel = 1;
    state.l22GraphicQualityLevel.m_shadowQualityLevel = 1;
    state.l22SystemQualitySetting.renderScale = 1.0;
    state.l22SystemQualitySetting.frameRateLimit = 120;
  } else if (name === 'high'){
    state.l22GraphicQualityLevel.m_modelQualityLevel = 2;
    state.l22GraphicQualityLevel.m_textureQualityLevel = 2;
    state.l22GraphicQualityLevel.m_shadowQualityLevel = 2;
    state.l22SystemQualitySetting.renderScale = 1.25;
    state.l22SystemQualitySetting.frameRateLimit = -1;
  }
  saveState(); if (editorHandle) editorHandle.setValue(state);
  // reflect active preset chip using unified chip system
  const chips = document.querySelectorAll('#preset-chips .chip'); chips.forEach(c=> c.classList.toggle('chip-active', c.dataset.preset===name));
  animatePreview();
}

function handleFileLoad(file){ const r = new FileReader(); r.onload = () => { try{ const parsed = JSON.parse(r.result); state = parsed; saveState(); if (editorHandle) editorHandle.setValue(state); }catch(e){alert('Invalid JSON') } }; r.readAsText(file); }

document.addEventListener('DOMContentLoaded', ()=>{
  renderPreview();
  const container = document.getElementById('editor');
  editorHandle = createJsonEditor(container, state, { onChange: v => { state = v; saveState(); } });

  // create preset chips for quick selection using unified chip system
  const presetChips = document.getElementById('preset-chips');
  if (presetChips){ ['low','medium','high','custom'].forEach(p=>{ const el = document.createElement('div'); el.className='chip chip-clickable'; el.textContent = p.toUpperCase(); el.dataset.preset = p; el.addEventListener('click', ()=>{ if (p==='custom'){ alert('Custom preserves current settings'); return; } applyPreset(p); }); presetChips.appendChild(el); }); }

  $('#btn-reset').addEventListener('click', ()=>{ if(confirm('Reset to default?')) resetToDefault(); });
  $('#btn-download').addEventListener('click', ()=>{ downloadJSON(); });
  $('#btn-copy').addEventListener('click', ()=>{ copyToClipboard(); alert('Copied to clipboard'); });
  $('#btn-load-file').addEventListener('click', ()=> $('#file-input').click());
  $('#file-input').addEventListener('change', (e)=>{ if(e.target.files && e.target.files[0]) handleFileLoad(e.target.files[0]) });
  $('#preset-select').addEventListener('change', (e)=>{ if(e.target.value) applyPreset(e.target.value); });
  // hook state save to animate preview
  const originalSave = saveState; saveState = function(){ originalSave(); animatePreview(); };
});
