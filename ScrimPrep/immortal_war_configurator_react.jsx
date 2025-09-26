// ScrimPrep Character Strategy Planner
// Using UMD React loaded by index.html (no imports)
const { useMemo, useState, useCallback } = React;

/* =========================
   Data: Characters & Maps
   ========================= */
const CHARACTERS = [
  { name: "Viper Ning", avatarUrl: "/assets/icon_hero_mangjianke_01.png", role: "DPS", difficulty: "★★★" },
  { name: "Feria Shen", avatarUrl: "/assets/icon_hero_shenmiao_01.png", role: "Support", difficulty: "★★☆" },
  { name: "Tianhai", avatarUrl: "/assets/icon_hero_youseng_01.png", role: "Tank", difficulty: "★★☆" },
  { name: "Ziping Yin", avatarUrl: "/assets/icon_hero_yinziping_01.png", role: "DPS", difficulty: "★★★" },
  { name: "Temulch", avatarUrl: "/assets/icon_hero_caoyuan_01.png", role: "DPS", difficulty: "★★☆" },
  { name: "Tarka Ji", avatarUrl: "/assets/icon_hero_haoxia_01.png", role: "DPS", difficulty: "★★★" },
  { name: "Kurumi", avatarUrl: "/assets/icon_hero_onmyoji_01.png", role: "Support", difficulty: "★★★" },
  { name: "Yoto Hime", avatarUrl: "/assets/icon_hero_yaodaoji_01.png", role: "DPS", difficulty: "★★☆" },
  { name: "Valda Cui", avatarUrl: "/assets/icon_hero_cuisanniang_01.png", role: "Support", difficulty: "★★☆" },
  { name: "Yueshan", avatarUrl: "/assets/icon_hero_yueshan_01.png", role: "DPS", difficulty: "★★★" },
  { name: "Wuchen", avatarUrl: "/assets/icon_hero_wuchen_01.png", role: "Support", difficulty: "★★☆" },
  { name: "Justina Gu", avatarUrl: "/assets/icon_hero_guqinghan_01.png", role: "DPS", difficulty: "★★★" },
  { name: "Takeda Nobutada", avatarUrl: "/assets/icon_hero_wutian_01.png", role: "Tank", difficulty: "★★☆" },
  { name: "Matari", avatarUrl: "/assets/icon_hero_hanhaimomin_01.png", role: "DPS", difficulty: "★★★" },
  { name: "Akos Hu", avatarUrl: "/assets/icon_hero_huwei_01.png", role: "Tank", difficulty: "★☆☆" },
  { name: "Zai", avatarUrl: "/assets/icon_hero_jiyingying_01.png", role: "Support", difficulty: "★★☆" },
  { name: "Tessa", avatarUrl: "/assets/icon_hero_yulinglong_01.png", role: "Support", difficulty: "★★★" },
  { name: "Hadi", avatarUrl: "/assets/icon_hero_hadi_01.png", role: "DPS", difficulty: "★★☆" },
  { name: "Shayol Wei", avatarUrl: "/assets/icon_hero_weiqing_01.png", role: "DPS", difficulty: "★★★" },
  { name: "Lyam Liu", avatarUrl: "/assets/icon_hero_liulian_01.png", role: "Support", difficulty: "★★☆" },
  { name: "Kylin Zhang", avatarUrl: "/assets/icon_hero_zhangqiling_01.png", role: "DPS", difficulty: "★★★" },
  { name: "Cyra", avatarUrl: "/assets/icon_hero_xila_01.png", role: "DPS", difficulty: "★★☆" },
  { name: "Lannie", avatarUrl: "/assets/icon_hero_lanmeng_01.png", role: "Support", difficulty: "★★☆" },
  { name: "Inor Wan", avatarUrl: "/assets/icon_hero_wanjun_01.png", role: "Tank", difficulty: "★★☆" },
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

/* =========================
   Utility Functions
   ========================= */
const getRoleColor = (role) => {
  switch(role) {
    case "Tank": return "bg-blue-500/20 text-blue-300 border-blue-500/50";
    case "DPS": return "bg-red-500/20 text-red-300 border-red-500/50";
    case "Support": return "bg-green-500/20 text-green-300 border-green-500/50";
    default: return "bg-gray-500/20 text-gray-300 border-gray-500/50";
  }
};

const getMapColor = (mapName) => {
  const map = MAPS.find(m => m.name === mapName);
  return map ? map.color : "#6B7280";
};

/* =========================
   Character Selection Modal
   ========================= */
function CharacterModal({ isOpen, onClose, onSelect, currentCharacters }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
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
          {CHARACTERS.map((char) => {
            const isUsed = currentCharacters.includes(char.name);
            return (
              <div
                key={char.name}
                onClick={() => !isUsed && onSelect(char)}
                className={`
                  relative p-3 rounded-xl border cursor-pointer transition-all
                  ${isUsed 
                    ? 'bg-gray-800/50 border-gray-600 opacity-50 cursor-not-allowed' 
                    : 'bg-gray-800 border-gray-600 hover:border-yellow-500 hover:bg-gray-700'
                  }
                `}
              >
                <img 
                  src={char.avatarUrl} 
                  alt={char.name}
                  className="w-full h-16 object-cover rounded-lg mb-2"
                />
                <h4 className="text-xs font-medium text-white text-center mb-1">{char.name}</h4>
                <div className={`text-xs px-2 py-1 rounded border text-center ${getRoleColor(char.role)}`}>
                  {char.role}
                </div>
                <div className="text-xs text-center mt-1 text-yellow-400">{char.difficulty}</div>
                {isUsed && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-xl">
                    <span className="text-red-400 font-bold">USED</span>
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
function RoundCard({ roundIndex, character, onSelectCharacter, isCompleted }) {
  const config = ROUND_CONFIGS[roundIndex];
  const mapColor = getMapColor(config.map);
  const charData = CHARACTERS.find(c => c.name === character);

  return (
    <div className={`
      relative rounded-2xl border-2 p-6 transition-all duration-300
      ${isCompleted ? 'border-green-500 bg-green-500/10' : 'border-gray-600 bg-gray-800/50'}
      hover:border-yellow-500 hover:bg-gray-700/50
    `}>
      {/* Round Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-yellow-400">R{roundIndex + 1}</span>
            {isCompleted && <span className="text-green-400 text-xl">✓</span>}
          </div>
          <h3 className="text-lg font-semibold text-white">{config.map}</h3>
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
              <div className={`inline-block text-xs px-2 py-1 rounded border ${getRoleColor(charData?.role)}`}>
                {charData?.role} {charData?.difficulty}
              </div>
            </div>
            <span className="text-gray-400">Change</span>
          </div>
        ) : (
          <button
            onClick={onSelectCharacter}
            className="w-full p-4 border-2 border-dashed border-gray-600 rounded-xl text-gray-400 hover:border-yellow-500 hover:text-yellow-400 transition-colors"
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
  const roles = selectedChars.map(name => CHARACTERS.find(c => c.name === name)?.role).filter(Boolean);
  const roleCount = roles.reduce((acc, role) => {
    acc[role] = (acc[role] || 0) + 1;
    return acc;
  }, {});

  if (selectedChars.length === 0) return null;

  return (
    <div className="bg-gray-800/70 border border-gray-600 rounded-2xl p-6 mb-8">
      <h3 className="text-xl font-bold text-yellow-400 mb-4">Team Composition</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-300">{roleCount.Tank || 0}</div>
          <div className="text-sm text-gray-400">Tanks</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-red-300">{roleCount.DPS || 0}</div>
          <div className="text-sm text-gray-400">DPS</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-300">{roleCount.Support || 0}</div>
          <div className="text-sm text-gray-400">Support</div>
        </div>
      </div>
      <div className="text-sm text-gray-300">
        <strong>Selected Characters ({selectedChars.length}/6):</strong> {selectedChars.join(", ")}
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
        map: ROUND_CONFIGS[idx].map,
        time: ROUND_CONFIGS[idx].time,
        special: ROUND_CONFIGS[idx].special,
        character: char || null,
      })),
      teamComposition: currentCharacters.reduce((acc, name) => {
        const char = CHARACTERS.find(c => c.name === name);
        if (char) {
          acc[char.role] = (acc[char.role] || 0) + 1;
        }
        return acc;
      }, {}),
    };

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

  const handleReset = useCallback(() => {
    if (confirm('Are you sure you want to reset all character selections?')) {
      setRoundCharacters(Array(6).fill(""));
    }
  }, []);

  return (
    <div className="max-w-7xl mx-auto">
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
          <div className="flex gap-3">
            <button
              onClick={handleReset}
              disabled={completedRounds === 0}
              className="px-4 py-2 bg-red-500/20 text-red-300 border border-red-500/50 rounded-lg hover:bg-red-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Reset All
            </button>
            <button
              onClick={handleExport}
              disabled={!isComplete}
              className="px-4 py-2 bg-green-500/20 text-green-300 border border-green-500/50 rounded-lg hover:bg-green-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Export Strategy
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
            character={roundCharacters[idx]}
            onSelectCharacter={() => handleRoundSelect(idx)}
            isCompleted={Boolean(roundCharacters[idx])}
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
            className="px-6 py-3 bg-gradient-to-r from-yellow-500 to-yellow-400 text-black font-bold rounded-xl hover:from-yellow-400 hover:to-yellow-300 transition-all"
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