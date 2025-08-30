// Using UMD React loaded by index.html (no imports)
const { useMemo, useState } = React;

/* =========================
   Data: Maps + Characters
   ========================= */
const DEFAULT_MAPS = [
  { name: "Morus Isle", imageUrl: "https://static1.thegamerimages.com/wordpress/wp-content/uploads/2021/08/Naraka-Bladepoint-Beginners-Tips-And-Tricks.jpg" },
  { name: "Holoroth", imageUrl: "https://www.narakathegame.com/pc/zt/20220722165632/img/bg_ab32b039.jpg" },
  { name: "Perdoria", imageUrl: "https://nie.res.netease.com/r/pic/20240702/e22a5db3-18bb-404f-9843-d42fb2d83ad8.png" }
];

const DEFAULT_CHARACTERS = [
  { name: "Viper Ning", avatarUrl: "https://naraka.wiki/icon_hero_select/icon_hero_mangjianke_01.png" },
  { name: "Feria Shen", avatarUrl: "https://naraka.wiki/icon_hero_select/icon_hero_shenmiao_01.png" },
  { name: "Tianhai", avatarUrl: "https://naraka.wiki/icon_hero_select/icon_hero_youseng_01.png" },
  { name: "Ziping Yin", avatarUrl: "https://naraka.wiki/icon_hero_select/icon_hero_yinziping_01.png" },
  { name: "Temulch", avatarUrl: "https://naraka.wiki/icon_hero_select/icon_hero_caoyuan_01.png" },
  { name: "Tarka Ji", avatarUrl: "https://naraka.wiki/icon_hero_select/icon_hero_haoxia_01.png" },
  { name: "Kurumi", avatarUrl: "https://naraka.wiki/icon_hero_select/icon_hero_onmyoji_01.png" },
  { name: "Yoto Hime", avatarUrl: "https://naraka.wiki/icon_hero_select/icon_hero_yaodaoji_01.png" },
  { name: "Valda Cui", avatarUrl: "https://naraka.wiki/icon_hero_select/icon_hero_cuisanniang_01.png" },
  { name: "Yueshan", avatarUrl: "https://naraka.wiki/icon_hero_select/icon_hero_yueshan_01.png" },
  { name: "Wuchen", avatarUrl: "https://naraka.wiki/icon_hero_select/icon_hero_wuchen_01.png" },
  { name: "Justina Gu", avatarUrl: "https://naraka.wiki/icon_hero_select/icon_hero_guqinghan_01.png" },
  { name: "Takeda Nobutada", avatarUrl: "https://naraka.wiki/icon_hero_select/icon_hero_wutian_01.png" },
  { name: "Matari", avatarUrl: "https://naraka.wiki/icon_hero_select/icon_hero_hanhaimomin_01.png" },
  { name: "Akos Hu", avatarUrl: "https://naraka.wiki/icon_hero_select/icon_hero_huwei_01.png" },
  { name: "Zai", avatarUrl: "https://naraka.wiki/icon_hero_select/icon_hero_jiyingying_01.png" },
  { name: "Tessa", avatarUrl: "https://naraka.wiki/icon_hero_select/icon_hero_yulinglong_01.png" },
  { name: "Hadi", avatarUrl: "https://naraka.wiki/icon_hero_select/icon_hero_hadi_01.png" },
  { name: "Shayol Wei", avatarUrl: "https://naraka.wiki/icon_hero_select/icon_hero_weiqing_01.png" },
  { name: "Lyam Liu", avatarUrl: "https://naraka.wiki/icon_hero_select/icon_hero_liulian_01.png" },
  { name: "Kylin Zhang", avatarUrl: "https://naraka.wiki/icon_hero_select/icon_hero_zhangqiling_01.png" },
  { name: "Cyra", avatarUrl: "https://naraka.wiki/icon_hero_select/icon_hero_xila_01.png" },
  { name: "Lannie", avatarUrl: "https://naraka.wiki/icon_hero_select/icon_hero_lanmeng_01.png" },
  { name: "Inor Wan", avatarUrl: "https://naraka.wiki/icon_hero_select/icon_hero_wanjun_01.png" }
];

// Hardcoded round rotation
const ROUND_ROTATION = [
  { map: "Perdoria", mapImage: DEFAULT_MAPS[2].imageUrl, timeOfDay: "Midnight", fireflies: true },
  { map: "Holoroth", mapImage: DEFAULT_MAPS[1].imageUrl, timeOfDay: "Sunny", fireflies: false },
  { map: "Morus Isle", mapImage: DEFAULT_MAPS[0].imageUrl, timeOfDay: "Noon", fireflies: false },
  { map: "Perdoria", mapImage: DEFAULT_MAPS[2].imageUrl, timeOfDay: "Morning Dew", fireflies: false },
  { map: "Holoroth", mapImage: DEFAULT_MAPS[1].imageUrl, timeOfDay: "Dusk", fireflies: true },
  { map: "Morus Isle", mapImage: DEFAULT_MAPS[0].imageUrl, timeOfDay: "Night", fireflies: true },
];

/** @typedef {{round:number,map:string,mapImage:string,timeOfDay:string,character:string}} RoundSelection */

/* =========================
   Helpers
   ========================= */
const normalizeCharacters = (arr) =>
  (arr || []).map((c) => (typeof c === "string" ? { name: c } : { name: c?.name || "", avatarUrl: c?.avatarUrl || "" }));

const findMapByName = (maps, name) => (maps || []).find((m) => m.name === name);
const classNames = (...xs) => xs.filter(Boolean).join(" ");
const characterAvatar = (characters, name) => (characters || []).find((x) => x.name === name)?.avatarUrl || "";

/* =========================
   Round Card
   ========================= */
function RoundCard({ idx, selection, maps, characters, onChange, errors, timeOptions }) {
  const { map, mapImage, timeOfDay, character, fireflies } = selection;
  const avatarUrl = characterAvatar(characters, character);
  const PREVIEW_H = "h-[120px]";
  // Use mapImage from selection, fallback to lookup from maps
  const effectiveMapImage = mapImage || (maps && findMapByName(maps, map)?.imageUrl) || "";

  return (
  <div className="rounded-2xl border border-gray-700/70 bg-black/40 backdrop-blur-sm p-4 shadow-sm flex flex-col justify-between w-full" style={{minHeight:'180px',maxHeight:'180px',maxWidth:'520px',width:'100%'}}>
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-gray-100">Game {idx + 1}</h3>
        <span className="text-xs rounded-full px-2 py-1 border border-gray-700 bg-gray-800 text-gray-200">
          {map} - {timeOfDay}
        </span>
      </div>
  {/* Fireflies overlay on map image */}
  {/* ...existing code... */}
  <div className="mt-3 flex flex-row gap-3 items-center w-full" style={{height:'90px'}}>
    {/* Map preview - 80% width */}
    <div className="relative overflow-hidden rounded-2xl border border-gray-700 shadow-inner" style={{width:'80%',height:'90px'}}>
      {effectiveMapImage ? (
        <img
          src={effectiveMapImage}
          alt={map || "Map"}
          className="w-full h-full object-cover"
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={e => { e.currentTarget.src = "https://via.placeholder.com/960x540?text=Map+Preview"; }}
        />
      ) : (
        <div className="w-full h-full bg-gray-800/70 flex items-center justify-center text-xs text-gray-400">
          No image
        </div>
      )}
      {/* Fireflies overlay - top middle */}
      {fireflies && (
        <div className="absolute top-2 left-1/2 transform -translate-x-1/2 text-xs text-green-400 font-semibold bg-black/60 rounded px-2 py-0.5 shadow">
          Fireflies!
        </div>
      )}
      {/* Chips */}
      <div className="absolute top-2 left-2" style={{top: fireflies ? '26px' : '8px'}}>
        <span className="inline-flex items-center rounded-full bg-black/65 backdrop-blur px-2 py-0.5 text-[11px] text-white">
          {map || "—"}
        </span>
      </div>
      <div className="absolute bottom-2 left-2">
        <span className="inline-flex items-center rounded-full bg-black/65 backdrop-blur px-2 py-0.5 text-[11px] text-white">
          {timeOfDay || "—"}
        </span>
      </div>
    </div>
    {/* Character tile - 20% width */}
    <div className="flex flex-col items-center justify-center h-full" style={{width:'20%',height:'90px'}}>
      <div className="rounded-xl overflow-hidden border border-gray-700 shadow aspect-square w-[70px] h-[70px]">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={character || "Character"}
            className="w-full h-full object-cover"
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={e => { e.currentTarget.src = "https://via.placeholder.com/300x300?text=Avatar"; }}
          />
        ) : (
          <div className="w-full h-full bg-gray-800" />
        )}
      </div>
      <div className="mt-1 text-[11px] text-gray-200 max-w-[80px] truncate">{character || ""}</div>
    </div>
  </div>
      {/* Character select below */}
      <div className="mt-6">
  <label className="block text-sm font-medium mb-1 text-gray-300">Character</label>
  <select
    className={classNames(
      "w-full rounded-lg border px-3 py-2 text-sm bg-gray-900 text-gray-200",
      errors?.character ? "border-red-500" : "border-gray-700"
    )}
    value={character || ""}
    onChange={e => onChange(idx, { character: e.target.value })}
  >
    <option value="">Select a character…</option>
    {characters.map((c) => (
      <option key={c.name} value={c.name}>{c.name}</option>
    ))}
  </select>
  {errors?.character && <p className="mt-1 text-xs text-red-400">{errors.character}</p>}
</div>
    </div>
  );
}

/* =========================
   Main Component (same logic)
   ========================= */
function ImmortalWarConfigurator({
  maps = DEFAULT_MAPS,
  characters = DEFAULT_CHARACTERS
}) {
  const characterOptions = normalizeCharacters(characters);
  // Hardcoded initial rounds
  const initial = useMemo(
    () => ROUND_ROTATION.map((r, i) => ({
      round: i + 1,
      map: r.map,
      mapImage: r.mapImage,
      timeOfDay: r.timeOfDay,
      fireflies: r.fireflies,
      character: ""
    })),
    []
  );

  const [selections, setSelections] = useState(initial);
  const [touched, setTouched] = useState({});
  const [showSummary, setShowSummary] = useState(false);

  const setField = (idx, partial) => {
    setSelections(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], ...partial };
      return next;
    });
    const keys = Object.keys(partial);
    setTouched(prev => ({ ...prev, ...Object.fromEntries(keys.map(k => [[`${idx}-${k}`], true])) }));
    setShowSummary(false);
  };

  // Per-round required-field errors
  const perRoundErrors = useMemo(() =>
    selections.map(sel => {
      const e = {};
      if (!sel.character) e.character = "Pick a character.";
      return e;
    }), [selections]
  );

  // Character usage counts
  const charCounts = useMemo(() => {
    const counts = {};
    for (const sel of selections) {
      const n = (sel.character || "").trim();
      if (!n) continue;
      counts[n] = (counts[n] || 0) + 1;
    }
    return counts;
  }, [selections]);

  // Character constraints
  const characterConstraintError = useMemo(() => {
    const offenders = Object.entries(charCounts).filter(([, c]) => c > 2).map(([n]) => n);
    if (offenders.length) return `No character may be picked more than twice: ${offenders.join(", ")}.`;
    const doubles = Object.values(charCounts).filter(c => c === 2).length;
    if (doubles > 1) return "Only one character may be picked twice.";
    return "";
  }, [charCounts]);

  const allRoundsComplete = useMemo(
    () => perRoundErrors.every((e) => Object.keys(e).length === 0),
    [perRoundErrors]
  );

  const formIsValid = allRoundsComplete && !characterConstraintError;

  const handleReview = (e) => {
    e.preventDefault();
    // mark all fields touched so every missing field shows an error
    const allTouch = {};
    selections.forEach((_, idx) => {
      ["map", "timeOfDay", "character"].forEach((k) => (allTouch[`${idx}-${k}`] = true));
    });
    setTouched(allTouch);

    if (formIsValid) setShowSummary(true);
    else setShowSummary(false);
  };

  const handleReset = () => {
    setSelections(initial);
    setTouched({});
    setShowSummary(false);
  };

  // No time options needed
  const getTimeOptionsFor = () => [];

  // Summary just consumes selections
  const summaryData = selections;

  return (
  <div className="max-w-6xl mx-auto p-4 md:p-8 text-gray-200">
      <header className="mb-4">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-100">Immortal War - 6 Round Configurator</h1>
        <p className="text-sm text-gray-300 mt-1">
          Configure map, time of day, and character for each round. Review is only enabled when all rules are satisfied.
        </p>
      </header>

      {/* Global character constraint error */}
      {!showSummary && characterConstraintError && (
        <div className="mb-4 rounded-xl border border-red-800 bg-red-900/30 text-red-200 p-3 text-sm">
          <strong>Character rule violation:</strong> {characterConstraintError}
        </div>
      )}

      {/* Rounds form */}
      {!showSummary && (
        <form onSubmit={handleReview} className="space-y-4">
          <div className="flex justify-center">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-10 w-full">
              {selections.map((sel, idx) => (
                <div key={sel.round} className="flex h-full min-h-[370px] max-h-[370px] max-w-md w-full mx-auto">
                  <RoundCard
                    idx={idx}
                    selection={sel}
                    characters={characterOptions}
                    onChange={setField}
                    errors={{
                      character: touched[`${idx}-character`] ? perRoundErrors[idx].character : undefined,
                    }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={handleReset}
              className="px-4 py-2 text-sm rounded-lg border border-gray-700 bg-gray-800 hover:bg-gray-700"
            >
              Reset
            </button>

            <button
              type="submit"
              disabled={!formIsValid}
              className={classNames(
                "px-4 py-2 text-sm rounded-lg",
                formIsValid
                  ? "bg-yellow-500 text-gray-900 hover:bg-yellow-400"
                  : "bg-gray-700 text-gray-400 cursor-not-allowed"
              )}
              aria-disabled={!formIsValid}
            >
              Review Summary
            </button>
          </div>
        </form>
      )}

      {/* Summary Panel */}
      {showSummary && (
        <section className="mt-2">
          <div className="summary-panel-export rounded-2xl border border-green-700 bg-green-900/25 p-4">
            <h2 className="text-xl font-semibold text-green-300">
              Summary - All Selections Valid ✅
            </h2>
            <p className="text-sm text-green-200 mb-3">
              Review your six rounds below. Confirm or go back to edit.
            </p>

            <ol className="space-y-3">
              {summaryData.map((sel) => (
                <li key={sel.round} className="flex items-center gap-3 p-3 rounded-xl bg-black/30 border border-gray-700">
                  <div className="relative w-28 h-16 overflow-hidden rounded-lg border border-gray-700">
                    {sel.mapImage ? (
                      <img src={sel.mapImage} alt={sel.map} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gray-800 flex items-center justify-center text-xs text-gray-400">
                        No image
                      </div>
                    )}
                    <div className="absolute bottom-1 left-1 right-1">
                      <span className="inline-flex items-center gap-1 rounded-full bg-black/60 text-white px-2 py-0.5 text-[10px]">
                        {sel.map} • {sel.timeOfDay}
                      </span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-gray-400">Game {sel.round}</div>
                    <div className="font-medium text-gray-100">{sel.map} - {sel.timeOfDay}</div>
                    {sel.fireflies && <div className="text-xs text-green-400 font-semibold">Fireflies!</div>}
                    <div className="text-sm text-gray-200">Character: {sel.character}</div>
                  </div>
                </li>
              ))}
            </ol>

            <div className="mt-4 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setShowSummary(false)}
                className="px-4 py-2 text-sm rounded-lg border border-gray-700 bg-gray-800 hover:bg-gray-700"
              >
                Edit Selections
              </button>

              <button
                type="button"
                className="px-4 py-2 text-sm rounded-lg bg-yellow-500 text-gray-900 hover:bg-yellow-400"
                onClick={async () => {
                  // Export summary panel as PNG
                  const panel = document.querySelector('.summary-panel-export');
                  if (!panel) return alert('Summary panel not found.');
                  // Load html2canvas if not present
                  if (!window.html2canvas) {
                    const script = document.createElement('script');
                    script.src = 'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js';
                    document.body.appendChild(script);
                    await new Promise(res => { script.onload = res; });
                  }
                  window.html2canvas(panel, { backgroundColor: '#1a1a1a', useCORS: true }).then(canvas => {
                    const link = document.createElement('a');
                    link.download = 'immortal-config-summary.png';
                    link.href = canvas.toDataURL('image/png');
                    link.click();
                  });
                }}
              >
                Confirm & Export PNG
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Dev notes */}
      <details className="mt-6 opacity-80">
        <summary className="cursor-pointer text-sm">Dev Notes</summary>
        <ul className="list-disc pl-5 text-sm space-y-1">
          <li>Controlled inputs; validation runs on change and review.</li>
          <li>Character rules: ≤1 character can appear twice; none &gt; 2.</li>
          <li>Summary renders only when all six rounds are valid.</li>
          <li>Swap out DEFAULT_* via props if needed.</li>
        </ul>
      </details>
    </div>
  );
}

// expose globally for inline Babel mount
window.ImmortalWarConfigurator = ImmortalWarConfigurator;
