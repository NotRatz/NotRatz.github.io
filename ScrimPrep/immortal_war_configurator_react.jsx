// ScrimPrep Character Strategy Planner
// Using UMD React loaded by index.html (no imports)
const { useMemo, useState, useCallback } = React;

/* =========================
   Data: Characters & Maps
   ========================= */
const CHARACTERS = [
  { name: "Viper Ning", avatarUrl: "/assets/icon_hero_mangjianke_01.png", difficulty: "★★★" },
  { name: "Feria Shen", avatarUrl: "/assets/icon_hero_shenmiao_01.png", difficulty: "★★☆" },
  { name: "Tianhai", avatarUrl: "/assets/icon_hero_youseng_01.png", difficulty: "★★☆" },
  { name: "Ziping Yin", avatarUrl: "/assets/icon_hero_yinziping_01.png", difficulty: "★★★" },
  { name: "Temulch", avatarUrl: "/assets/icon_hero_caoyuan_01.png", difficulty: "★★☆" },
  { name: "Tarka Ji", avatarUrl: "/assets/icon_hero_haoxia_01.png", difficulty: "★★★" },
  { name: "Kurumi", avatarUrl: "/assets/icon_hero_onmyoji_01.png", difficulty: "★★★" },
  { name: "Yoto Hime", avatarUrl: "/assets/icon_hero_yaodaoji_01.png", difficulty: "★★☆" },
  { name: "Valda Cui", avatarUrl: "/assets/icon_hero_cuisanniang_01.png", difficulty: "★★☆" },
  { name: "Yueshan", avatarUrl: "/assets/icon_hero_yueshan_01.png", difficulty: "★★★" },
  { name: "Wuchen", avatarUrl: "/assets/icon_hero_wuchen_01.png", difficulty: "★★☆" },
  { name: "Justina Gu", avatarUrl: "/assets/icon_hero_guqinghan_01.png", difficulty: "★★★" },
  { name: "Takeda Nobutada", avatarUrl: "/assets/icon_hero_wutian_01.png", difficulty: "★★☆" },
  { name: "Matari", avatarUrl: "/assets/icon_hero_hanhaimomin_01.png", difficulty: "★★★" },
  { name: "Akos Hu", avatarUrl: "/assets/icon_hero_huwei_01.png", difficulty: "★☆☆" },
  { name: "Zai", avatarUrl: "/assets/icon_hero_jiyingying_01.png", difficulty: "★★☆" },
  { name: "Tessa", avatarUrl: "/assets/icon_hero_yulinglong_01.png", difficulty: "★★★" },
  { name: "Hadi", avatarUrl: "/assets/icon_hero_hadi_01.png", difficulty: "★★☆" },
  { name: "Shayol Wei", avatarUrl: "/assets/icon_hero_weiqing_01.png", difficulty: "★★★" },
  { name: "Lyam Liu", avatarUrl: "/assets/icon_hero_liulian_01.png", difficulty: "★★☆" },
  { name: "Kylin Zhang", avatarUrl: "/assets/icon_hero_zhangqiling_01.png", difficulty: "★★★" },
  { name: "Cyra", avatarUrl: "/assets/icon_hero_xila_01.png", difficulty: "★★☆" },
  { name: "Lannie", avatarUrl: "/assets/icon_hero_lanmeng_01.png", difficulty: "★★☆" },
  { name: "Inor Wan", avatarUrl: "/assets/icon_hero_wanjun_01.png", difficulty: "★★☆" },
];

const MAPS = [
  { name: "Morus Isle", imageUrl: "/assets/morus-isle.png", color: "#3B82F6" },
  { name: "Holoroth", imageUrl: "/assets/holoroth.png", color: "#EF4444" },
  { name: "Perdoria", imageUrl: "/assets/perdoria.png", color: "#10B981" },
];

const ROUND_CONFIGS = [
  { map: "Morus Isle", time: "Day", special: "Standard Start" },
  { map: "Holoroth", time: "Dusk", special: "Storm Warning" },
  { map: "Perdoria", time: "Night", special: "Fog of War" },
  { map: "Morus Isle", time: "Dawn", special: "High Tide" },
  { map: "Holoroth", time: "Noon", special: "Clear Skies" },
  { map: "Perdoria", time: "Evening", special: "Final Zone" },
];

const TIME_OPTIONS = ["Day", "Dawn", "Noon", "Dusk", "Evening", "Night"];

/* =========================
   Utility Functions
   ========================= */
// Roles removed — UI no longer shows Tank/DPS/Support distinctions

const getMapColor = (mapName) => {
  const map = MAPS.find(m => m.name === mapName);
  return map ? map.color : "#6B7280";
};

/* =========================
   Character Selection Modal
   ========================= */
function CharacterModal({ isOpen, onClose, onSelect, currentCharacters }) {
  if (!isOpen) return null;
  // compute usage counts so we can allow exactly one duplicate hero across the 6 selections
  const counts = currentCharacters.reduce((acc, n) => {
    if (!n) return acc;
    acc[n] = (acc[n] || 0) + 1;
    return acc;
  }, {});
  const duplicateUsed = Object.values(counts).some(c => c >= 2);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in" role="dialog" aria-modal="true">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 max-w-4xl w-full max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-yellow-400">Select Character</h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl"
          >
            ✕
          </button>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {CHARACTERS.map((char, idx) => {
            const usedCount = currentCharacters.filter(n => n === char.name).length;
            const isSelectedOnce = usedCount >= 1;
            const canSelectAgain = isSelectedOnce && !duplicateUsed && usedCount < 2;
            const disabled = usedCount >= 2;
            return (
              <div
                key={char.name}
                onClick={() => { if (!disabled && (!isSelectedOnce || canSelectAgain)) onSelect(char); }}
                style={{ animationDelay: `${idx * 40}ms` }}
                className={`
                  relative p-3 rounded-xl border cursor-pointer transition-all animate-fade-in
                  ${disabled ? 'bg-gray-800/50 border-gray-600 opacity-50 cursor-not-allowed' : isSelectedOnce ? 'bg-gray-800 border-gray-600 ring-1 ring-yellow-500/20' : 'bg-gray-800 border-gray-600 hover:border-yellow-500 hover:bg-gray-700'}
                `}
              >
                <img 
                  src={char.avatarUrl} 
                  alt={char.name}
                  className="w-full h-16 object-cover rounded-lg mb-2"
                />
                <h4 className="text-xs font-medium text-white text-center mb-1">{char.name}</h4>
                <div className="text-xs text-center mt-1 text-yellow-400">{char.difficulty}</div>
                {usedCount > 0 && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-xl">
                    <span className="text-yellow-300 font-bold">SELECTED{usedCount > 1 ? ` ×${usedCount}` : ''}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* =========================
   Round Card Component
   ========================= */
function RoundCard({ roundIndex, config, character, onSelectCharacter, isCompleted, onConfigChange }) {
  const mapColor = getMapColor(config.map);
  const charData = CHARACTERS.find(c => c.name === character);

  return (
    <div
      className={`relative rounded-2xl border-2 p-6 transition-all duration-300 ${isCompleted ? 'border-green-500 bg-green-500/10' : 'border-gray-600 bg-gray-800/50'} hover:border-yellow-500 hover:bg-gray-700/50 animate-fade-in`}
      style={{ animationDelay: `${roundIndex * 80}ms` }}
    >
      {/* Round Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-yellow-400">R{roundIndex + 1}</span>
            {isCompleted && <span className="text-green-400 text-xl">✓</span>}
          </div>
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold text-white">{config.map}</h3>
            <select
              value={config.map}
              onChange={(e) => onConfigChange(roundIndex, { map: e.target.value })}
              className="form-control"
              style={{ width: 'auto', minWidth: '120px' }}
            >
              {MAPS.map(m => <option key={m.name} value={m.name}>{m.name}</option>)}
            </select>
            <select
              value={config.time}
              onChange={(e) => onConfigChange(roundIndex, { time: e.target.value })}
              className="form-control"
              style={{ width: 'auto', minWidth: '100px' }}
            >
              {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <p className="text-sm text-gray-400">{config.time} • {config.special}</p>
        </div>
        <div 
          className="w-16 h-12 rounded-lg bg-cover bg-center border-2"
          style={{ 
            backgroundImage: `url(${MAPS.find(m => m.name === config.map)?.imageUrl})`,
            borderColor: mapColor 
          }}
        />
      </div>

      {/* Character Selection */}
      <div className="mt-4">
        {character ? (
          <div 
            onClick={onSelectCharacter}
            className="flex items-center gap-3 p-3 bg-gray-700/50 rounded-xl border border-gray-600 cursor-pointer hover:border-yellow-500 transition-colors"
          >
            <img 
              src={charData?.avatarUrl} 
              alt={character}
              className="w-12 h-12 rounded-lg object-cover"
            />
            <div className="flex-1">
              <h4 className="font-medium text-white">{character}</h4>
              <div className="inline-block text-xs px-2 py-1 rounded border text-yellow-300">
                {charData?.difficulty}
              </div>
            </div>
            <span className="text-gray-400">Change</span>
          </div>
        ) : (
          <button
            onClick={onSelectCharacter}
            className="btn btn-ghost w-full"
            style={{ borderStyle: 'dashed' }}
          >
            + Select Character
          </button>
        )}
      </div>
    </div>
  );
}

/* =========================
   Team Composition Summary
   ========================= */
function TeamSummary({ characters }) {
  const selectedChars = characters.filter(Boolean);
  if (selectedChars.length === 0) return null;

  return (
    <div className="bg-gray-800/70 border border-gray-600 rounded-2xl p-6 mb-8">
      <h3 className="text-xl font-bold text-yellow-400 mb-4">Team Composition</h3>
      <div className="mb-4">
        <div className="text-sm text-gray-300">
          <strong>Selected Characters ({selectedChars.length}/6):</strong>
        </div>
        <div className="mt-3 flex flex-wrap gap-3">
          {selectedChars.map((name) => (
            <div key={name} className="px-3 py-1 bg-gray-700/50 border border-gray-600 rounded-lg text-sm text-white">{name}</div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* =========================
   Main Component
   ========================= */
function ImmortalWarConfigurator() {
  const [roundCharacters, setRoundCharacters] = useState(Array(6).fill(""));
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRound, setSelectedRound] = useState(null);
  // new: move per-round configs into state so edits persist and are included in exports
  const [roundConfigs, setRoundConfigs] = useState(() => ROUND_CONFIGS.map(c => ({ ...c })));

  const currentCharacters = roundCharacters.filter(Boolean);
  const completedRounds = roundCharacters.filter(Boolean).length;
  const isComplete = completedRounds === 6;

  const handleCharacterSelect = useCallback((character) => {
    if (selectedRound !== null) {
      const newCharacters = [...roundCharacters];
      newCharacters[selectedRound] = character.name;
      setRoundCharacters(newCharacters);
    }
    setModalOpen(false);
    setSelectedRound(null);
  }, [selectedRound, roundCharacters]);

  const handleRoundSelect = useCallback((roundIndex) => {
    setSelectedRound(roundIndex);
    setModalOpen(true);
  }, []);

  const handleExport = useCallback(() => {
    const exportData = {
      timestamp: new Date().toISOString(),
      strategy: roundCharacters.map((char, idx) => ({
        round: idx + 1,
        map: roundConfigs[idx].map,
        time: roundConfigs[idx].time,
        special: roundConfigs[idx].special,
        character: char || null,
      })),
      teamComposition: currentCharacters.reduce((acc, name) => {
        if (!name) return acc;
        acc[name] = (acc[name] || 0) + 1;
        return acc;
      }, {}),
    };

    // Default: download JSON
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `scrim-prep-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [roundCharacters, currentCharacters]);

  // New: Export planner as a 1920x1080 canvas PNG with six horizontal map strips
  const exportPNG = useCallback(async () => {
    const W = 1920; const H = 1080;
    const stripH = Math.floor(H / 6);
    try {
      const canvas = document.createElement('canvas');
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext('2d');
      // background
      ctx.fillStyle = '#05060a';
      ctx.fillRect(0, 0, W, H);

      // load all map images (ensure same-origin)
      const loadImage = (src) => new Promise((res, rej) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => res(img);
        img.onerror = rej;
        img.src = src;
      });

      // preload map images used by rounds
      const usedMapUrls = [...new Set(roundConfigs.map(rc => MAPS.find(m => m.name === rc.map)?.imageUrl))];
      const images = {};
      await Promise.all(usedMapUrls.map(async (url) => {
        if (!url) return;
        images[url] = await loadImage(url).catch(() => null);
      }));

      // draw each strip
      for (let i = 0; i < 6; i++) {
        const rc = roundConfigs[i];
        const y = i * stripH;
        // draw map image scaled to cover horizontally
        const mapObj = MAPS.find(m => m.name === rc.map);
        const img = mapObj ? images[mapObj.imageUrl] : null;
        if (img) {
          // compute cover scaling to W x stripH
          const scale = Math.max(W / img.width, stripH / img.height);
          const iw = img.width * scale;
          const ih = img.height * scale;
          const ix = (W - iw) / 2;
          const iy = y + (stripH - ih) / 2;
          ctx.drawImage(img, ix, iy, iw, ih);
        } else {
          // fallback fill
          ctx.fillStyle = getMapColor(rc.map);
          ctx.fillRect(0, y, W, stripH);
        }

        // dark overlay for time of day tint
        if (rc.time && /Night|Dusk|Evening/i.test(rc.time)) {
          ctx.fillStyle = 'rgba(0,0,30,0.35)';
          ctx.fillRect(0, y, W, stripH);
        } else if (rc.time && /Dawn|Day|Noon/i.test(rc.time)) {
          // slight warm/dawn tint
          ctx.fillStyle = rc.time === 'Dawn' ? 'rgba(255,160,60,0.06)' : 'rgba(255,255,255,0.02)';
          ctx.fillRect(0, y, W, stripH);
        }

        // round label
        ctx.fillStyle = 'rgba(0,0,0,0.45)';
        ctx.fillRect(16, y + 16, 260, 64);
        ctx.fillStyle = '#FFD54D';
        ctx.font = '28px system-ui, Inter, sans-serif';
        ctx.fillText(`R${i+1} · ${rc.map} · ${rc.time}`, 28, y + 56);

        // draw character chip at right side
        const charName = roundCharacters[i];
        if (charName) {
          const char = CHARACTERS.find(c => c.name === charName);
          const chipW = 420; const chipH = 84;
          const chipX = W - chipW - 40;
          const chipY = y + (stripH - chipH) / 2;
          // chip background
          ctx.fillStyle = 'rgba(0,0,0,0.55)';
          roundRect(ctx, chipX, chipY, chipW, chipH, 14);
          ctx.fill();
          // avatar
          if (char && char.avatarUrl) {
            try {
              const avatar = await loadImage(char.avatarUrl).catch(() => null);
              if (avatar) {
                const avSize = 64;
                ctx.drawImage(avatar, chipX + 12, chipY + (chipH - avSize) / 2, avSize, avSize);
              }
            } catch (e) { /* ignore avatar */ }
          }
          // text
          ctx.fillStyle = '#FFFFFF';
          ctx.font = '20px system-ui, Inter, sans-serif';
          ctx.fillText(charName || 'Unknown', chipX + 92, chipY + 40);
        }
      }

      // helper: rounded rect path
      function roundRect(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + w, y, x + w, y + h, r);
        ctx.arcTo(x + w, y + h, x, y + h, r);
        ctx.arcTo(x, y + h, x, y, r);
        ctx.arcTo(x, y, x + w, y, r);
        ctx.closePath();
      }

      // download
      const url = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = `scrim-prep-${new Date().toISOString().split('T')[0]}-1920x1080.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      console.error('Canvas PNG export failed', err);
      alert('PNG export failed — falling back to JSON export.');
      handleExport();
    }
  }, [roundConfigs, roundCharacters, handleExport]);

  const handleReset = useCallback(() => {
    if (confirm('Are you sure you want to reset all character selections?')) {
      setRoundCharacters(Array(6).fill(""));
      setRoundConfigs(ROUND_CONFIGS.map(c=> ({...c}))); // reset configs too
    }
  }, []);

  // handler to update per-round config in state
  const handleConfigChange = useCallback((roundIndex, partial) => {
    setRoundConfigs(prev => {
      const copy = prev.map(r => ({ ...r }));
      copy[roundIndex] = { ...copy[roundIndex], ...partial };
      return copy;
    });
  }, []);

  return (
    <div className="max-w-7xl mx-auto" id="scrim-planner-root">
      {/* Progress Header */}
      <div className="bg-gray-800/70 border border-gray-600 rounded-2xl p-6 mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Strategy Progress</h2>
            <div className="flex items-center gap-4">
              <span className="text-lg text-gray-300">{completedRounds}/6 Rounds Planned</span>
              <div className="flex-1 bg-gray-700 rounded-full h-3 min-w-[200px]">
                <div 
                  className="bg-gradient-to-r from-yellow-500 to-yellow-400 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${(completedRounds / 6) * 100}%` }}
                />
              </div>
            </div>
          </div>
          <div className="flex gap-3 items-center">
            <div className="flex items-center gap-3">
              <label className="text-sm text-gray-300">Map:</label>
              <select id="global-map-select" className="form-control" style={{ width: 'auto', minWidth: '120px' }}>
                {MAPS.map(m => <option key={m.name} value={m.name}>{m.name}</option>)}
              </select>
              <label className="text-sm" style={{ color: 'var(--site-muted)' }}>Time:</label>
              <select id="global-time-select" className="form-control" style={{ width: 'auto', minWidth: '100px' }}>
                {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <button
              onClick={handleReset}
              disabled={completedRounds === 0}
              className="btn btn-danger btn-sm"
            >
              Reset All
            </button>
            <button
              onClick={handleExport}
              disabled={!isComplete}
              className="btn btn-success btn-sm"
            >
              Export JSON
            </button>
            <button
              onClick={exportPNG}
              disabled={!isComplete}
              className="btn btn-primary btn-sm"
            >
              Export PNG
            </button>
          </div>
        </div>
      </div>

      {/* Team Composition Summary */}
      <TeamSummary characters={currentCharacters} />

      {/* Round Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {Array.from({ length: 6 }, (_, idx) => (
          <RoundCard
            key={idx}
            roundIndex={idx}
            config={roundConfigs[idx]}
            character={roundCharacters[idx]}
            onSelectCharacter={() => handleRoundSelect(idx)}
            isCompleted={Boolean(roundCharacters[idx])}
            onConfigChange={handleConfigChange}
          />
        ))}
      </div>

      {/* Completion Message */}
      {isComplete && (
        <div className="bg-gradient-to-r from-green-500/20 to-blue-500/20 border border-green-500/50 rounded-2xl p-8 text-center">
          <div className="text-4xl mb-4">🎉</div>
          <h3 className="text-2xl font-bold text-green-400 mb-2">Strategy Complete!</h3>
          <p className="text-gray-300 mb-4">
            Your 6-round character strategy is ready. Export your plan to share with your team.
          </p>
          <button
            onClick={handleExport}
            className="btn btn-primary btn-lg"
          >
            Download Strategy Plan
          </button>
        </div>
      )}

      {/* Character Selection Modal */}
      <CharacterModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSelect={handleCharacterSelect}
        currentCharacters={currentCharacters}
      />
    </div>
  );
}

// Export to global scope for mounting
window.ImmortalWarConfigurator = ImmortalWarConfigurator;