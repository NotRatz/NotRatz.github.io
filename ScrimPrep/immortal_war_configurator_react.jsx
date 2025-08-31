// Using UMD React loaded by index.html (no imports)
const { useMemo, useState } = React;

/* =========================
   Data: Maps + Characters
   ========================= */
const DEFAULT_MAPS = [
  {
    name: "Morus Isle",
    imageUrl:
      "https://static1.thegamerimages.com/wordpress/wp-content/uploads/2021/08/Naraka-Bladepoint-Beginners-Tips-And-Tricks.jpg",
  },
  {
    name: "Holoroth",
    imageUrl:
      "https://www.narakathegame.com/pc/zt/20220722165632/img/bg_ab32b039.jpg",
  },
  {
    name: "Perdoria",
    imageUrl:
      "https://nie.res.netease.com/r/pic/20240702/e22a5db3-18bb-404f-9843-d42fb2d83ad8.png",
  },
];

const DEFAULT_CHARACTERS = [
  {
    name: "Viper Ning",
  avatarUrl: "/assets/icon_hero_mangjianke_01.png",
  },
  {
    name: "Feria Shen",
  avatarUrl: "/assets/icon_hero_shenmiao_01.png",
  },
  {
    name: "Tianhai",
  avatarUrl: "/assets/icon_hero_youseng_01.png",
  },
  {
    name: "Ziping Yin",
  avatarUrl: "/assets/icon_hero_yinziping_01.png",
  },
  {
    name: "Temulch",
  avatarUrl: "/assets/icon_hero_caoyuan_01.png",
  },
  {
    name: "Tarka Ji",
  avatarUrl: "/assets/icon_hero_haoxia_01.png",
  },
  {
    name: "Kurumi",
  avatarUrl: "/assets/icon_hero_onmyoji_01.png",
  },
  {
    name: "Yoto Hime",
  avatarUrl: "/assets/icon_hero_yaodaoji_01.png",
  },
  {
    name: "Valda Cui",
  avatarUrl: "/assets/icon_hero_cuisanniang_01.png",
  },
  {
    name: "Yueshan",
  avatarUrl: "/assets/icon_hero_yueshan_01.png",
  },
  {
    name: "Wuchen",
  avatarUrl: "/assets/icon_hero_wuchen_01.png",
  },
  {
    name: "Justina Gu",
  avatarUrl: "/assets/icon_hero_guqinghan_01.png",
  },
  {
    name: "Takeda Nobutada",
  avatarUrl: "/assets/icon_hero_wutian_01.png",
  },
  {
    name: "Matari",
  avatarUrl: "/assets/icon_hero_hanhaimomin_01.png",
  },
  {
    name: "Akos Hu",
  avatarUrl: "/assets/icon_hero_huwei_01.png",
  },
  {
    name: "Zai",
  avatarUrl: "/assets/icon_hero_jiyingying_01.png",
  },
  {
    name: "Tessa",
  avatarUrl: "/assets/icon_hero_yulinglong_01.png",
  },
  {
    name: "Hadi",
  avatarUrl: "/assets/icon_hero_hadi_01.png",
  },
  {
    name: "Shayol Wei",
  avatarUrl: "/assets/icon_hero_weiqing_01.png",
  },
  {
    name: "Lyam Liu",
  avatarUrl: "/assets/icon_hero_liulian_01.png",
  },
  {
    name: "Kylin Zhang",
  avatarUrl: "/assets/icon_hero_zhangqiling_01.png",
  },
  {
    name: "Cyra",
  avatarUrl: "/assets/icon_hero_xila_01.png",
  },
  {
    name: "Lannie",
  avatarUrl: "/assets/icon_hero_lanmeng_01.png",
  },
  {
    name: "Inor Wan",
  avatarUrl: "/assets/icon_hero_wanjun_01.png",
  },
];

// Hardcoded round rotation
const ROUND_ROTATION = [
  {
    map: "Perdoria",
    mapImage: DEFAULT_MAPS[2].imageUrl,
    timeOfDay: "Midnight",
    fireflies: true,
  },
  {
    map: "Holoroth",
    mapImage: DEFAULT_MAPS[1].imageUrl,
    timeOfDay: "Sunny",
    fireflies: false,
  },
  {
    map: "Morus Isle",
    mapImage: DEFAULT_MAPS[0].imageUrl,
    timeOfDay: "Noon",
    fireflies: false,
  },
  {
    map: "Perdoria",
    mapImage: DEFAULT_MAPS[2].imageUrl,
    timeOfDay: "Morning Dew",
    fireflies: false,
  },
  {
    map: "Holoroth",
    mapImage: DEFAULT_MAPS[1].imageUrl,
    timeOfDay: "Dusk",
    fireflies: true,
  },
  {
    map: "Morus Isle",
    mapImage: DEFAULT_MAPS[0].imageUrl,
    timeOfDay: "Night",
    fireflies: true,
  },
];

/** @typedef {{round:number,map:string,mapImage:string,timeOfDay:string,character:string}} RoundSelection */

/* =========================
   Helpers
   ========================= */
// const normalizeCharacters = (arr) =>
//   (arr || []).map((c) => (typeof c === "string" ? { name: c } : { name: c?.name || "", avatarUrl: c?.avatarUrl || "" }));

const findMapByName = (maps, name) => (maps || []).find((m) => m.name === name);
const classNames = (...xs) => xs.filter(Boolean).join(" ");
const characterAvatar = (characters, name) => {
  if (!name) return "";
  const norm = (str) => String(str).trim().toLowerCase().replace(/\s+/g, " ");
  const target = norm(name);
  const found = (characters || []).find((x) => norm(x.name) === target);
  return found?.avatarUrl || "";
};

/* =========================
   Round Card
   ========================= */
function RoundCard({ idx, selection, maps, characters, onChange, errors }) {
  const { map, mapImage, timeOfDay, character, fireflies } = selection;
  const avatarUrl = characterAvatar(characters, (character || '').trim());
  // Use mapImage from selection, fallback to lookup from maps
  const effectiveMapImage =
    mapImage || (maps && findMapByName(maps, map)?.imageUrl) || "";

  return (
    <div
      className="rounded-2xl border border-gray-700/70 bg-black/40 backdrop-blur-sm p-4 shadow-sm flex flex-col justify-between w-full group"
      style={{
        minHeight: "180px",
        maxHeight: "180px",
        maxWidth: "520px",
        width: "100%",
      }}
    >
      <div className="flex flex-col w-full" style={{position:'relative'}}>
        {/* Map and hero row */}
        <div className="flex flex-row items-center w-full" style={{height:'90px', position:'relative'}}>
          {/* Map preview - full rectangular */}
          <div className="relative border border-gray-700 shadow-inner flex-shrink-0" style={{width:'100%', height:'90px', borderRadius:0, overflow:'hidden'}}>
            {effectiveMapImage ? (
              <img
                src={effectiveMapImage}
                alt={map || "Map"}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full bg-gray-800/70 flex items-center justify-center text-xs text-gray-400">No image</div>
            )}
            {/* Fireflies overlay - top middle */}
            {fireflies && (
              <div className="absolute top-2 left-1/2 transform -translate-x-1/2 text-xs text-green-400 font-semibold bg-black/60 rounded px-2 py-0.5 shadow">Fireflies!</div>
            )}
            {/* Map & time of day bottom left */}
            <div className="absolute bottom-2 left-2 flex flex-col items-start">
              <span className="inline-flex items-center rounded-full bg-black/65 backdrop-blur px-2 py-0.5 text-[11px] text-white mb-1">{map || "—"} • {timeOfDay || "—"}</span>
              <span className="inline-flex items-center rounded-full bg-black/65 backdrop-blur px-2 py-0.5 text-xs text-white">Game {idx + 1}</span>
            </div>
          </div>
        </div>
        {/* Diagonal band overlay across card, avatar animates in when selected */}
        {avatarUrl && (
          <div style={{
            position: 'absolute',
            left: 'calc(100% - 182px)',
            top: '0',
            width: '120px',
            height: '90px',
            background: '#880018',
            transform: 'skew(-25deg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10,
            boxShadow: '0 0 16px 0 #88001888',
            overflow: 'hidden',
          }}>
            <img
              src={avatarUrl}
              alt={character || "Character"}
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                objectFit: 'cover',
                border: '3px solid #fff',
                boxShadow: '0 2px 8px #0008',
                transform: 'translate(-40px, 40px) scale(0.7)',
                opacity: 0,
                animation: 'avatar-swipe-in 0.5s cubic-bezier(.7,1.5,.5,1) forwards',
              }}
              loading="lazy"
              crossOrigin="anonymous"
              referrerPolicy="no-referrer"
              onError={e => { e.currentTarget.src = "https://via.placeholder.com/56x56?text=Avatar"; }}
            />
            <style>{`
              @keyframes avatar-swipe-in {
                0% { transform: translate(-40px, 40px) scale(0.7); opacity: 0; }
                60% { transform: translate(10px, -10px) scale(1.1); opacity: 1; }
                100% { transform: translate(0,0) scale(1); opacity: 1; }
              }
            `}</style>
          </div>
        )}
        {/* Character select below each card, inside box and visually contained */}
        <div
          className="mt-2 w-full"
          style={{ paddingLeft: 0, paddingRight: 0, boxSizing: "border-box" }}
        >
          <label className="block text-sm font-medium mb-0.5 text-gray-300">
            Character
          </label>
          <select
            className={classNames(
              "w-full rounded-lg border px-3 py-2 text-sm bg-gray-900 text-gray-200",
              errors?.character ? "border-red-500" : "border-gray-700"
            )}
            style={{ paddingTop: "2px", paddingBottom: "2px" }}
            value={character || ""}
            onChange={(e) => onChange(idx, { character: e.target.value.trim() })}
          >
            <option value="">Select a character…</option>
            {characters.map((c) => (
              <option key={c.name} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
          {errors?.character && (
            <p className="mt-1 text-xs text-red-400">{errors.character}</p>
          )}
        </div>
      </div>
    </div>
  );
}

/* =========================
   Main Component (same logic)
   ========================= */
function ImmortalWarConfigurator() {
  const characterOptions = DEFAULT_CHARACTERS;
  // Hardcoded initial rounds
  const initial = useMemo(
    () =>
      ROUND_ROTATION.map((r, i) => ({
        round: i + 1,
        map: r.map,
        mapImage: r.mapImage,
        timeOfDay: r.timeOfDay,
        fireflies: r.fireflies,
        character: "",
      })),
    [],
  );

  const [selections, setSelections] = useState(initial);
  const [touched, setTouched] = useState({});
  const [showSummary, setShowSummary] = useState(false);

  const setField = (idx, partial) => {
    setSelections((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], ...partial };
      return next;
    });
    const keys = Object.keys(partial);
    setTouched((prev) => ({
      ...prev,
      ...Object.fromEntries(keys.map((k) => [[`${idx}-${k}`], true])),
    }));
    setShowSummary(false);
  };

  // Per-round required-field errors
  const perRoundErrors = useMemo(
    () =>
      selections.map((sel) => {
        const e = {};
        if (!sel.character) e.character = "Pick a character.";
        return e;
      }),
    [selections],
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
    const offenders = Object.entries(charCounts)
      .filter(([, c]) => c > 2)
      .map(([n]) => n);
    if (offenders.length)
      return `No character may be picked more than twice: ${offenders.join(", ")}.`;
    const doubles = Object.values(charCounts).filter((c) => c === 2).length;
    if (doubles > 1) return "Only one character may be picked twice.";
    return "";
  }, [charCounts]);

  const allRoundsComplete = useMemo(
    () => perRoundErrors.every((e) => Object.keys(e).length === 0),
    [perRoundErrors],
  );

  const formIsValid = allRoundsComplete && !characterConstraintError;

  const handleReview = (e) => {
    e.preventDefault();
    // mark all fields touched so every missing field shows an error
    const allTouch = {};
    selections.forEach((_, idx) => {
      ["map", "timeOfDay", "character"].forEach(
        (k) => (allTouch[`${idx}-${k}`] = true),
      );
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
  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 text-gray-200">
      <header className="mb-4">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-100">
          Immortal War - 6 Round Configurator
        </h1>
        <p className="text-sm text-gray-300 mt-1">
          Configure map, time of day, and character for each round. Review is
          only enabled when all rules are satisfied.
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-2 gap-y-2 w-full">
              {selections.map((sel, idx) => (
                <div
                  key={sel.round}
                  className="flex h-full min-h-[180px] max-h-[180px] max-w-xl w-full mx-auto"
                >
                  <RoundCard
                    idx={idx}
                    selection={sel}
                    characters={characterOptions}
                    onChange={setField}
                    errors={{
                      character: touched[`${idx}-character`]
                        ? perRoundErrors[idx].character
                        : undefined,
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
              className={classNames(
                "px-4 py-2 text-sm rounded-lg bg-yellow-500 text-gray-900 hover:bg-yellow-400",
                !formIsValid && "opacity-60 cursor-not-allowed",
              )}
              disabled={!formIsValid}
            >
              Review & Confirm
            </button>
          </div>
        </form>
      )}

      {/* Summary panel */}
      {showSummary && (
        <div className="summary-panel-export rounded-2xl border border-gray-700/70 bg-black/40 backdrop-blur-sm p-4 shadow-sm mt-6">
          <h2 className="text-xl font-bold mb-2 text-gray-100">Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-2 gap-y-2">
            {selections.map((sel, idx) => (
              <RoundCard
                key={sel.round}
                idx={idx}
                selection={sel}
                characters={characterOptions}
                errors={{}}
              />
            ))}
          </div>
          <div className="flex justify-end mt-4">
            <button
              type="button"
              className="px-4 py-2 text-sm rounded-lg bg-yellow-500 text-gray-900 hover:bg-yellow-400"
              onClick={async () => {
                // Export summary panel as PNG
                const panel = document.querySelector(".summary-panel-export");
                if (!panel) return alert("Summary panel not found.");
                // Load html-to-image if not present
                if (!window.htmlToImage) {
                  const script = document.createElement("script");
                  script.src =
                    "https://cdn.jsdelivr.net/npm/html-to-image@1.11.11/dist/html-to-image.js";
                  document.body.appendChild(script);
                  await new Promise((res) => {
                    script.onload = res;
                  });
                }
                const scale = 1280 / panel.offsetWidth;
                const pngData = await window.htmlToImage.toPng(panel, {
                  backgroundColor: "#1a1a1a",
                  width: 1280,
                  height: Math.floor(panel.offsetHeight * scale),
                  style: {
                    transform: `scale(${scale})`,
                    transformOrigin: "top left",
                  },
                  cacheBust: true,
                });
                const img = new Image();
                img.src = pngData;
                await new Promise((res) => {
                  img.onload = res;
                });
                const canvas = document.createElement("canvas");
                canvas.width = 1280;
                canvas.height = 720;
                const ctx = canvas.getContext("2d");
                const imgHeight = Math.floor(panel.offsetHeight * scale);
                const yOffset = Math.max(0, (720 - imgHeight) / 2);
                ctx.fillStyle = "#1a1a1a";
                ctx.fillRect(0, 0, 1280, 720);
                ctx.drawImage(img, 0, yOffset, 1280, imgHeight);
                const link = document.createElement("a");
                link.download = "immortal-config-summary.png";
                link.href = canvas.toDataURL("image/png");
                link.click();
              }}
            >
              Confirm & Export PNG
            </button>
          </div>
        </div>
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
// AvatarBand component for fade-out/fade-in animation
function AvatarBand({ avatarUrl, character }) {
  const [visible, setVisible] = React.useState(false);
  React.useEffect(() => {
    setVisible(false);
    const timeout = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(timeout);
  }, [avatarUrl]);
  if (!avatarUrl) return null;
  return (
    <div style={{
      position: 'absolute',
      left: 'calc(100% - 182px)',
      top: '0',
      width: '120px',
      height: '90px',
      background: '#880018',
      transform: 'skew(-25deg)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10,
      boxShadow: '0 0 16px 0 #88001888',
      overflow: 'hidden',
    }}>
      <img
        src={avatarUrl}
        alt={character || "Character"}
        style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          objectFit: 'cover',
          border: '3px solid #fff',
          boxShadow: '0 2px 8px #0008',
          opacity: visible ? 1 : 0,
          transition: 'opacity 0.4s',
        }}
        loading="lazy"
      />
    </div>
  );
}
window.ImmortalWarConfigurator = ImmortalWarConfigurator;
