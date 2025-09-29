// naraka-configurator/app.js
// Recursive JSON editor + presets + import/export for QualitySettingsData.json

const DEFAULT = {
  preset: 'custom',
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
const FIELD_DESCRIPTIONS = {
  'l22GraphicQualityLevel.m_modelQualityLevel': 'Hero and environment mesh detail. Higher values sharpen silhouettes at the cost of GPU time.',
  'l22GraphicQualityLevel.m_tessellationQualityLevel': 'Tessellation density for terrain and architecture. Disable to avoid heavy GPU spikes on older cards.',
  'l22GraphicQualityLevel.m_visualEffectsQualityLevel': 'Particle counts and density for abilities and combat effects.',
  'l22GraphicQualityLevel.m_textureQualityLevel': 'Texture resolution. Set to High only if VRAM usage is below 90%.',
  'l22GraphicQualityLevel.m_shadowQualityLevel': 'Shadows and contact hardening. Lower for consistent competitive visibility.',
  'l22GraphicQualityLevel.m_volumetricLightLevel': 'Volumetric lighting depth. Keep medium for readable arenas without haze.',
  'l22GraphicQualityLevel.m_cloudQualityLevel': 'Skybox and storm cloud fidelity. Minimal impact on gameplay.',
  'l22GraphicQualityLevel.m_aoLevel': 'Ambient occlusion strength. Disabling removes subtle depth but boosts FPS.',
  'l22GraphicQualityLevel.m_SSRLevel': 'Screen space reflections. Disable for clarity in hectic fights.',
  'l22GraphicQualityLevel.m_AALevel': 'Anti-aliasing pass quality for geometry edges.',
  'l22GraphicQualityLevel.m_PostProcessingLevel': 'Lens effects, bloom, and color grading stack.',
  'l22GraphicQualityLevel.m_LightingQualityLevel': 'Dynamic light count and shadow update rate.',
  'l22SystemQualitySetting.renderScale': 'Internal rendering resolution multiplier. Values below 1.0 improve FPS, above 1.0 supersample.',
  'l22SystemQualitySetting.renderScaleStep': 'Increment used when adjusting render scale inside Naraka.',
  'l22SystemQualitySetting.aaMode': 'Primary anti-aliasing algorithm applied after rendering.',
  'l22SystemQualitySetting.checkboardRendering': 'Checkerboard rendering fallback for consoles and mid-range GPUs.',
  'l22SystemQualitySetting.upSamplingType': 'Selects the upscaling technology pipeline (DLSS / XeSS / FSR).',
  'l22SystemQualitySetting.enableDlssDx12': 'Allows DLSS when running DirectX 12 mode.',
  'l22SystemQualitySetting.enableDlssG': 'DLSS-G frame generation toggle for RTX 40 GPUs.',
  'l22SystemQualitySetting.frameBoostDlssG': 'DLSS-G frame boost strength. Higher values feel smoother but add latency.',
  'l22SystemQualitySetting.enableDlssRR': 'DLSS Ray Reconstruction for improved lighting fidelity.',
  'l22SystemQualitySetting.dlssMode': 'DLSS quality preset. Auto follows resolution heuristics.',
  'l22SystemQualitySetting.xessMode': 'Intel XeSS quality preset. Auto chooses the best setting per resolution.',
  'l22SystemQualitySetting.xefgMode': 'Intel XeSS frame generation toggle.',
  'l22SystemQualitySetting.dlssSharpness': 'Extra DLSS sharpening applied after upscaling.',
  'l22SystemQualitySetting.lxFsr2Mode': 'AMD FSR 2 preset for dynamic resolution scaling.',
  'l22SystemQualitySetting.fsr2Sharpness': 'Applies additional edge sharpening when FSR 2 is active.',
  'l22SystemQualitySetting.lxFsr3Mode': 'AMD FSR 3 frame generation preset.',
  'l22SystemQualitySetting.enbaleFSR3FrameInterpolation': 'Enables FSR 3 frame interpolation pipeline.',
  'l22SystemQualitySetting.nisQuality': 'NVIDIA Image Scaling preset for legacy GPUs.',
  'l22SystemQualitySetting.fullScreenMode': 'Display mode preference when launching Naraka.',
  'l22SystemQualitySetting.resolutionWidth': 'Target render resolution width in pixels.',
  'l22SystemQualitySetting.resolutionHeight': 'Target render resolution height in pixels.',
  'l22SystemQualitySetting.frameRateLimit': 'Caps FPS. Use -1 for uncapped, or match display refresh for VRR.',
  'l22SystemQualitySetting.vSyncCount': 'Vertical sync behaviour. Off for lowest latency.',
  'l22SystemQualitySetting.gamma': 'Display gamma curve. Higher brightens shadows.',
  'l22SystemQualitySetting.maxLuma': 'Peak luminance for HDR displays.',
  'l22SystemQualitySetting.minLuma': 'Minimum luminance floor for HDR black levels.',
  'l22SystemQualitySetting.paperWhite': 'Paper white reference nit value in HDR.',
  'l22SystemQualitySetting.mHDRMode': 'Master HDR toggle. Disable on SDR monitors.',
  'l22SystemQualitySetting.reflexMode': 'NVIDIA Reflex low-latency mode.',
  'l22SystemQualitySetting.xellMode': 'AMD Radeon Anti-Lag profile.',
  'l22SystemQualitySetting.antiLag2Enabled': 'AMD Anti-Lag+ toggle for RDNA3 GPUs.',
  'l22SystemQualitySetting.vrsMode': 'Variable rate shading intensity.',
  'l22SystemQualitySetting.colorBlindMode': 'Color blindness preset for interface readability.',
  'l22SystemQualitySetting.colorBlindStrength': 'Strength multiplier applied to the color blind filter.',
  'l22SystemQualitySetting.colorBlindQualityMode': 'Enhances UI clarity for accessibility modes.',
  'l22SystemQualitySetting.nvHighlightsEnabled': 'Enable NVIDIA Highlights clip capture.',
  'l22SystemQualitySetting.styleMode': 'Overall presentation style / tone mapping preset.',
  'l22SystemQualitySetting.motionBlurEnabled': 'Full-screen motion blur. Disable for competitive clarity.',
  'l22SystemQualitySetting.raytracingEnabled': 'Master toggle for ray-traced features.',
  'l22SystemQualitySetting.raytracingAO': 'Ray-traced ambient occlusion quality.',
  'l22SystemQualitySetting.raytracingGI': 'Ray-traced global illumination.',
  'l22SystemQualitySetting.raytracingReflection': 'Ray-traced reflections for water and polished surfaces.',
  'l22SystemQualitySetting.raytracingShadow': 'Ray-traced shadow casting.',
  'l22SystemQualitySetting.raytracingBVHAllInOne': 'Prebuild all ray-tracing acceleration structures. Improves stability but adds load time.',
  'l22SystemQualitySetting.raytracingBVHActorCountMax': 'Max actors included in ray tracing BVH builds.',
  'l22SystemQualitySetting.rtgiResolution': 'Ray-traced GI resolution divisor. 1 = full resolution.',
  'l22SystemQualitySetting.characterAdditionalPhysics1': 'Enable cloth and accessory physics for characters.',
  'l22SystemQualitySetting.xboxQualityOption': 'Console quality profile when syncing settings to Xbox.',
  preset: 'Tracks which preset was last applied ("custom" when you hand-tune values).'
};

const SELECT_OPTIONS = {
  'l22GraphicQualityLevel.m_modelQualityLevel': [
    { value: 0, label: '0 · Low geometry' },
    { value: 1, label: '1 · Balanced' },
    { value: 2, label: '2 · High fidelity' }
  ],
  'l22GraphicQualityLevel.m_textureQualityLevel': [
    { value: 0, label: '0 · 1K textures' },
    { value: 1, label: '1 · 2K textures' },
    { value: 2, label: '2 · 4K textures' }
  ],
  'l22GraphicQualityLevel.m_shadowQualityLevel': [
    { value: 0, label: '0 · Performance' },
    { value: 1, label: '1 · Balanced' },
    { value: 2, label: '2 · Ultra sharp' }
  ],
  'l22SystemQualitySetting.aaMode': [
    { value: 0, label: '0 · Off' },
    { value: 1, label: '1 · FXAA' },
    { value: 2, label: '2 · TAA' }
  ],
  'l22SystemQualitySetting.checkboardRendering': [
    { value: 0, label: '0 · Disabled' },
    { value: 1, label: '1 · Enabled' }
  ],
  'l22SystemQualitySetting.upSamplingType': [
    { value: 0, label: '0 · Auto detect' },
    { value: 1, label: '1 · DLSS' },
    { value: 2, label: '2 · XeSS' },
    { value: 3, label: '3 · FSR' }
  ],
  'l22SystemQualitySetting.dlssMode': [
    { value: -2, label: 'Auto' },
    { value: 0, label: 'Quality' },
    { value: 1, label: 'Balanced' },
    { value: 2, label: 'Performance' },
    { value: 3, label: 'Ultra Performance' }
  ],
  'l22SystemQualitySetting.xessMode': [
    { value: 101, label: 'Auto' },
    { value: 0, label: 'Ultra Quality' },
    { value: 1, label: 'Quality' },
    { value: 2, label: 'Balanced' },
    { value: 3, label: 'Performance' }
  ],
  'l22SystemQualitySetting.lxFsr2Mode': [
    { value: 0, label: 'Auto' },
    { value: 1, label: 'Quality' },
    { value: 2, label: 'Balanced' },
    { value: 3, label: 'Performance' }
  ],
  'l22SystemQualitySetting.lxFsr3Mode': [
    { value: 0, label: 'Off' },
    { value: 1, label: 'Quality' },
    { value: 2, label: 'Balanced' },
    { value: 3, label: 'Performance' }
  ],
  'l22SystemQualitySetting.nisQuality': [
    { value: 0, label: 'Sharpness 0' },
    { value: 1, label: 'Sharpness 1' },
    { value: 2, label: 'Sharpness 2' },
    { value: 3, label: 'Sharpness 3' }
  ],
  'l22SystemQualitySetting.fullScreenMode': [
    { value: 0, label: 'Borderless fullscreen' },
    { value: 1, label: 'Exclusive fullscreen' },
    { value: 2, label: 'Windowed' }
  ],
  'l22SystemQualitySetting.frameRateLimit': [
    { value: -1, label: 'Uncapped' },
    { value: 60, label: '60 FPS' },
    { value: 120, label: '120 FPS' },
    { value: 144, label: '144 FPS' },
    { value: 240, label: '240 FPS' }
  ],
  'l22SystemQualitySetting.vSyncCount': [
    { value: 0, label: 'Off' },
    { value: 1, label: 'On' }
  ],
  'l22SystemQualitySetting.mHDRMode': [
    { value: 0, label: 'SDR' },
    { value: 1, label: 'HDR10' }
  ],
  'l22SystemQualitySetting.reflexMode': [
    { value: 0, label: 'Off' },
    { value: 1, label: 'On' },
    { value: 2, label: 'Boost' }
  ],
  'l22SystemQualitySetting.xellMode': [
    { value: 0, label: 'Off' },
    { value: 1, label: 'On' }
  ],
  'l22SystemQualitySetting.vrsMode': [
    { value: 0, label: 'Off' },
    { value: 1, label: 'Conservative' },
    { value: 2, label: 'Aggressive' }
  ],
  'l22SystemQualitySetting.colorBlindMode': [
    { value: 0, label: 'Off' },
    { value: 1, label: 'Protanopia' },
    { value: 2, label: 'Deuteranopia' },
    { value: 3, label: 'Tritanopia' }
  ],
  'l22SystemQualitySetting.styleMode': [
    { value: 0, label: 'Standard' },
    { value: 1, label: 'Low contrast' },
    { value: 2, label: 'High vibrancy' }
  ],
  'l22SystemQualitySetting.rtgiResolution': [
    { value: 0, label: 'Half resolution' },
    { value: 1, label: 'Full resolution' }
  ],
  'l22SystemQualitySetting.xboxQualityOption': [
    { value: 0, label: 'Performance' },
    { value: 1, label: 'Balanced' },
    { value: 2, label: 'Quality' }
  ]
};

const BOOLEAN_OPTIONS = [
  { value: true, label: 'Enabled' },
  { value: false, label: 'Disabled' }
];

function $(sel){ return document.querySelector(sel); }

let state = loadState() || JSON.parse(JSON.stringify(DEFAULT));
if (state && state.preset === -1) state.preset = 'custom';
let editorHandle = null;
let autosaveBadgeTimer = null;

function loadState(){
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

function flashAutosave(message = 'Saved'){
  const badge = document.getElementById('autosave-status');
  if (!badge) return;
  badge.textContent = message;
  badge.classList.add('is-success');
  clearTimeout(autosaveBadgeTimer);
  autosaveBadgeTimer = setTimeout(()=>{
    badge.textContent = 'Autosaving';
    badge.classList.remove('is-success');
  }, 1600);
}

function saveState(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state, null, 2));
  renderPreview();
  flashAutosave('Saved just now');
}

function resetToDefault(){
  state = JSON.parse(JSON.stringify(DEFAULT));
  saveState();
  if (editorHandle) editorHandle.setValue(state);
}

function renderPreview(){
  const p = $('#json-preview');
  if (p) p.textContent = JSON.stringify(state, null, 2);
}

function animatePreview(){
  const p = document.getElementById('json-preview');
  if (!p) return;
  p.classList.remove('animate-update');
  void p.offsetWidth;
  p.classList.add('animate-update');
  setTimeout(()=> p.classList.remove('animate-update'), 600);
}

function pathToKey(path){
  return path.join('.');
}

// Lightweight recursive editor
function createJsonEditor(container, initialJson, options = {}){
  if (!container || !(container instanceof HTMLElement)) throw new Error('container must be an HTMLElement');
  const opts = Object.assign({ onChange: null, allowAddRemove: true }, options);
  let localState = JSON.parse(JSON.stringify(initialJson));

  function isObject(v){ return v && typeof v === 'object' && !Array.isArray(v); }
  function deepClone(v){ return JSON.parse(JSON.stringify(v)); }

  function makeRow(labelText, controlEl, actionsEl, descriptionText, pathKey){
    const row = document.createElement('div');
    row.className = 'form-row';
    if (pathKey) row.dataset.path = pathKey;

    const label = document.createElement('label');
    label.textContent = labelText;
    row.appendChild(label);

    let controlWrapper = controlEl;
    if (!controlWrapper){
      controlWrapper = document.createElement('div');
      controlWrapper.className = 'control-stack';
    } else if (!controlWrapper.classList.contains('control-stack') && !controlWrapper.classList.contains('nested-group')) {
      const wrap = document.createElement('div');
      wrap.className = 'control-stack';
      wrap.appendChild(controlWrapper);
      controlWrapper = wrap;
    }

    if (actionsEl && actionsEl.childElementCount){
      actionsEl.classList.add('control-actions');
      if (!controlWrapper.classList.contains('control-stack')){
        const stack = document.createElement('div');
        stack.className = 'control-stack';
        stack.appendChild(controlWrapper);
        controlWrapper = stack;
      }
      controlWrapper.appendChild(actionsEl);
    }

    row.appendChild(controlWrapper);

    if (descriptionText){
      const desc = document.createElement('p');
      desc.className = 'field-description';
      desc.textContent = descriptionText;
      row.appendChild(desc);
    }

    return row;
  }

  function inferType(v){
    if (v === null) return 'null';
    if (typeof v === 'boolean') return 'boolean';
    if (typeof v === 'number' && !Number.isNaN(v)) return 'number';
    return 'string';
  }

  function coerceValue(raw, type){
    if (type === 'null') return null;
    if (type === 'boolean') return raw === 'true' || raw === true || raw === 1 || raw === '1';
    if (type === 'number'){
      const n = Number(raw);
      return Number.isNaN(n) ? raw : n;
    }
    return String(raw);
  }

  function createTypeSelect(initialType){
    const typeSelect = document.createElement('select');
    typeSelect.className = 'form-control select-control';
    ['string','number','boolean','null'].forEach(t=>{
      const o = document.createElement('option');
      o.value = t;
      o.textContent = t;
      if (t === initialType) o.selected = true;
      typeSelect.appendChild(o);
    });
    return typeSelect;
  }

  function renderPrimitive(key, value, onUpdate, path){
    const wrapper = document.createElement('div');
    wrapper.className = 'control-stack';
    const currentType = inferType(value);
    const pathKey = pathToKey(path);
    const selectOptions = SELECT_OPTIONS[pathKey] || (currentType === 'boolean' ? BOOLEAN_OPTIONS : null);

    const input = document.createElement('input');
    input.className = 'form-control';
    if (currentType === 'number') input.type = 'number';
    input.step = 'any';
    input.value = value === null ? '' : String(value);

    const typeSelect = createTypeSelect(currentType);

    const dropdown = selectOptions ? document.createElement('select') : null;
    if (dropdown){
      dropdown.className = 'form-control select-control';
      selectOptions.forEach(opt => {
        const option = document.createElement('option');
        option.value = String(opt.value);
        option.textContent = opt.label;
        dropdown.appendChild(option);
      });
      const customOption = document.createElement('option');
      customOption.value = '__custom';
      customOption.textContent = 'Custom value…';
      dropdown.appendChild(customOption);
      const match = selectOptions.find(opt => String(opt.value) === String(value));
      dropdown.value = match ? String(match.value) : '__custom';
      dropdown.addEventListener('change', ()=>{
        if (dropdown.value === '__custom') return;
        input.value = dropdown.value;
        const coerced = coerceValue(dropdown.value, typeSelect.value);
        onUpdate(coerced);
      });
    }

    function syncFromInput(){
      const coerced = coerceValue(input.value, typeSelect.value);
      onUpdate(coerced);
      if (dropdown){
        const match = selectOptions.find(opt => String(opt.value) === String(coerced));
        dropdown.value = match ? String(match.value) : '__custom';
      }
    }

    input.addEventListener('input', syncFromInput);
    typeSelect.addEventListener('change', ()=>{
      if (typeSelect.value === 'number') input.type = 'number';
      else input.type = 'text';
      syncFromInput();
    });

    if (dropdown) wrapper.appendChild(dropdown);
    wrapper.appendChild(input);
    wrapper.appendChild(typeSelect);

    const description = FIELD_DESCRIPTIONS[pathKey];
    return { control: wrapper, description };
  }

  function renderObject(obj, path = []){
    const container = document.createElement('div');
    container.className = path.length ? 'nested-group' : 'root-group';
    Object.keys(obj).forEach(key => {
      const value = obj[key];
      const pathKey = pathToKey(path.concat(key));

      if (isObject(value)){
        const child = renderObject(value, path.concat(key));
        const row = makeRow(key, child, null, FIELD_DESCRIPTIONS[pathKey], pathKey);
        container.appendChild(row);
      } else if (Array.isArray(value)){
        const arrNode = renderArray(value, path.concat(key));
        const row = makeRow(key, arrNode, null, FIELD_DESCRIPTIONS[pathKey], pathKey);
        container.appendChild(row);
      } else {
        const primitive = renderPrimitive(key, value, newVal => {
          setAtPath(path.concat(key), newVal);
          triggerChange();
        }, path.concat(key));
        const row = makeRow(key, primitive.control, null, primitive.description, pathKey);
        container.appendChild(row);
      }
    });
    return container;
  }

  function renderArray(arr, path = []){
    const container = document.createElement('div');
    container.className = 'nested-group';
    arr.forEach((item, idx) => {
      const idxPath = path.concat(idx);
      const pathKey = pathToKey(idxPath);
      let actions = null;
      if (opts.allowAddRemove){
        actions = document.createElement('div');
        const del = document.createElement('button');
        del.className = 'btn btn-danger btn-sm';
        del.textContent = 'Remove';
        del.type = 'button';
        del.addEventListener('click', ()=>{
          arr.splice(idx, 1);
          rerender();
          triggerChange();
        });
        actions.appendChild(del);
      }

      if (isObject(item)){
        const child = renderObject(item, idxPath);
        const row = makeRow(`[${idx}]`, child, opts.allowAddRemove ? actions : null, FIELD_DESCRIPTIONS[pathKey], pathKey);
        container.appendChild(row);
      } else if (Array.isArray(item)){
        const nested = renderArray(item, idxPath);
        const row = makeRow(`[${idx}]`, nested, opts.allowAddRemove ? actions : null, FIELD_DESCRIPTIONS[pathKey], pathKey);
        container.appendChild(row);
      } else {
        const primitive = renderPrimitive(idx, item, newVal => {
          arr[idx] = newVal;
          triggerChange();
        }, idxPath);
        const row = makeRow(`[${idx}]`, primitive.control, opts.allowAddRemove ? actions : null, primitive.description, pathKey);
        container.appendChild(row);
      }
    });

    if (opts.allowAddRemove){
      const addRow = document.createElement('div');
      addRow.className = 'control-actions';
      const addButton = document.createElement('button');
      addButton.className = 'btn btn-secondary btn-sm';
      addButton.textContent = 'Add item';
      addButton.type = 'button';
      addButton.addEventListener('click', ()=>{
        arr.push(null);
        rerender();
        triggerChange();
      });
      addRow.appendChild(addButton);
      container.appendChild(addRow);
    }

    return container;
  }

  function setAtPath(path, value){
    let cur = localState;
    for (let i = 0; i < path.length - 1; i++) cur = cur[path[i]];
    cur[path[path.length - 1]] = value;
  }

  const root = document.createElement('div');
  root.className = 'editor-root';
  container.innerHTML = '';
  container.appendChild(root);

  function rerender(){
    root.innerHTML = '';
    if (isObject(localState)) root.appendChild(renderObject(localState, []));
    else if (Array.isArray(localState)) root.appendChild(renderArray(localState, []));
    else {
      const primitive = renderPrimitive('value', localState, newVal => {
        localState = newVal;
        triggerChange();
      }, ['value']);
      root.appendChild(makeRow('value', primitive.control, null, primitive.description, 'value'));
    }
  }

  function triggerChange(){
    if (typeof opts.onChange === 'function'){
      try {
        opts.onChange(deepClone(localState));
      } catch (e){
        console.error(e);
      }
    }
  }

  function getValue(){ return deepClone(localState); }
  function setValue(newv){ localState = deepClone(newv); rerender(); }
  function destroy(){ container.removeChild(root); }

  rerender();
  return { getValue, setValue, destroy, rerender };
}

// End editor

function downloadJSON(){ const blob = new Blob([JSON.stringify(state, null, 2)], {type:'application/json'}); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'QualitySettingsData.json'; document.body.appendChild(a); a.click(); a.remove(); }

function copyToClipboard(){ navigator.clipboard.writeText(JSON.stringify(state, null, 2)); flashAutosave('Copied to clipboard'); }

function updatePresetUI(activeName){
  const normalized = !activeName || activeName === -1 ? 'custom' : activeName;
  const chips = document.querySelectorAll('#preset-chips .chip');
  chips.forEach(c => c.classList.toggle('chip-active', c.dataset.preset === normalized));
  const select = document.getElementById('preset-select');
  if (select){
    const hasOption = Array.from(select.options).some(opt => opt.value === normalized);
    select.value = hasOption ? normalized : '';
  }
}

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
  state.preset = name;
  saveState();
  if (editorHandle) editorHandle.setValue(state);
  updatePresetUI(name);
}

function handleFileLoad(file){ const r = new FileReader(); r.onload = () => { try{ const parsed = JSON.parse(r.result); state = parsed; state.preset = 'custom'; saveState(); if (editorHandle) editorHandle.setValue(state); updatePresetUI('custom'); flashAutosave('Imported settings'); }catch(e){alert('Invalid JSON') } }; r.readAsText(file); }

document.addEventListener('DOMContentLoaded', ()=>{
  renderPreview();
  document.body.classList.add('js-ready');

  const container = document.getElementById('editor');
  editorHandle = createJsonEditor(container, state, {
    onChange: v => {
      state = v;
      if (state.preset !== 'custom'){
        state.preset = 'custom';
        updatePresetUI('custom');
      }
      saveState();
    }
  });

  const presetChips = document.getElementById('preset-chips');
  if (presetChips){
    ['low','medium','high','custom'].forEach(p=>{
      const el = document.createElement('button');
      el.type = 'button';
      el.className = 'chip chip-clickable';
      el.textContent = p.toUpperCase();
      el.dataset.preset = p;
      el.setAttribute('role', 'listitem');
      el.addEventListener('click', ()=>{
        if (p === 'custom'){
          state.preset = 'custom';
          updatePresetUI('custom');
          saveState();
          return;
        }
        applyPreset(p);
      });
      presetChips.appendChild(el);
    });
  }

  updatePresetUI(state && state.preset ? state.preset : 'custom');

  $('#btn-reset').addEventListener('click', ()=>{ if(confirm('Reset to default?')){ resetToDefault(); updatePresetUI('custom'); }});
  $('#btn-download').addEventListener('click', ()=>{ downloadJSON(); flashAutosave('Downloaded preset'); });
  $('#btn-copy').addEventListener('click', ()=>{ copyToClipboard(); });
  $('#btn-load-file').addEventListener('click', ()=> $('#file-input').click());
  $('#file-input').addEventListener('change', (e)=>{ if(e.target.files && e.target.files[0]) handleFileLoad(e.target.files[0]) });
  $('#preset-select').addEventListener('change', (e)=>{ if(e.target.value) applyPreset(e.target.value); });

  document.querySelectorAll('[data-scroll-to]').forEach(btn => {
    btn.addEventListener('click', ()=>{
      const target = btn.getAttribute('data-scroll-to');
      const node = target ? document.querySelector(target) : null;
      if (node) node.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) entry.target.classList.add('is-visible');
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.panel, .info-card').forEach(el => observer.observe(el));

  // hook state save to animate preview
  const originalSave = saveState; saveState = function(){ originalSave(); animatePreview(); };
});
