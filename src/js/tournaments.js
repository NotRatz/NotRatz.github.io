import { animate } from './motion.js';

const fileInput = document.querySelector('[data-file-input]');
const fileButton = document.querySelector('[data-file-label]');
const fileInfo = document.querySelector('[data-file-info]');
const processButton = document.querySelector('[data-process]');
const clearButton = document.querySelector('[data-clear]');
const statusElement = document.querySelector('[data-processing-status]');
const scoreboardContainer = document.getElementById('tournament-scoreboard');
const exportButton = document.querySelector('[data-export]');
const configInputs = document.querySelectorAll('[data-config]');
const metricElements = {
  teams: document.querySelector('[data-metric="teams"]'),
  players: document.querySelector('[data-metric="players"]'),
  kills: document.querySelector('[data-metric="kills"]'),
  score: document.querySelector('[data-metric="score"]')
};

const TEAM_FIELDS = ['TeamID', 'Team', 'TeamName', 'Squad', 'SquadName'];
const PLAYER_FIELDS = ['PlayerName', 'Player', 'Nickname', 'Name'];
const RANK_FIELDS = ['Rank', 'Placement', 'Place', 'RankOrder'];
const KILL_FIELDS = ['KillCount', 'Kills', 'Elims', 'Eliminations'];
const DAMAGE_FIELDS = ['TotalHurt', 'TotalDamage', 'Damage', 'DMG'];

let parsedRecords = [];
let lastResult = null;

fileButton?.addEventListener('click', () => fileInput?.click());
fileInput?.addEventListener('change', handleFileSelection);
processButton?.addEventListener('click', handleProcess);
clearButton?.addEventListener('click', resetState);
configInputs.forEach((input) => {
  input.addEventListener('input', handleConfigChange);
  input.addEventListener('change', handleConfigChange);
});
exportButton?.addEventListener('click', exportStandings);

function handleFileSelection() {
  const count = fileInput?.files?.length || 0;
  if (fileInfo) {
    fileInfo.textContent = count === 0 ? 'No files selected' : `${count} file${count > 1 ? 's' : ''} ready`;
  }
  if (statusElement) {
    statusElement.textContent = count
      ? 'Ready to process selected CSV files.'
      : 'Expecting CSV exports from the Naraka results viewer.';
  }
}

async function handleProcess() {
  if (!fileInput?.files?.length) {
    if (statusElement) {
      statusElement.textContent = 'Select at least one CSV file to generate standings.';
    }
    return;
  }

  setProcessing(true);
  try {
    const files = Array.from(fileInput.files);
    const rows = await readFiles(files);
    parsedRecords = rows;
    const config = getConfig();
    const result = computeScoreboard(rows, config);
    lastResult = { ...result, config };
    if (result.teams.length === 0) {
      renderEmptyState('No teams detected in the uploaded CSV files.');
      updateMetrics(result.stats);
      if (statusElement) {
        statusElement.textContent = 'Files processed, but no teams were detected. Check your column mapping.';
      }
      if (exportButton) {
        exportButton.disabled = true;
      }
      return;
    }
    renderScoreboard(result.teams);
    updateMetrics(result.stats);
    if (statusElement) {
      statusElement.textContent = `Processed ${files.length} file${files.length > 1 ? 's' : ''} · ${rows.length} rows at ${formatTime(
        new Date()
      )}.`;
    }
    if (exportButton) {
      exportButton.disabled = false;
    }
  } catch (error) {
    console.error('[tournaments] failed to process files', error);
    renderEmptyState('Unable to parse CSV files. Please verify the header names and encoding.');
    updateMetrics();
    if (statusElement) {
      statusElement.textContent = 'Failed to process files. Please verify the CSV format and try again.';
    }
    if (exportButton) {
      exportButton.disabled = true;
    }
  } finally {
    setProcessing(false);
  }
}

function handleConfigChange() {
  if (!parsedRecords.length) return;
  const config = getConfig();
  const result = computeScoreboard(parsedRecords, config);
  lastResult = { ...result, config };
  if (!result.teams.length) {
    renderEmptyState('No teams detected with the current configuration.');
    updateMetrics(result.stats);
    if (exportButton) {
      exportButton.disabled = true;
    }
    return;
  }
  renderScoreboard(result.teams);
  updateMetrics(result.stats);
  if (statusElement) {
    statusElement.textContent = 'Scoring template updated. Standings refreshed.';
  }
  if (exportButton) {
    exportButton.disabled = false;
  }
}

function resetState() {
  parsedRecords = [];
  lastResult = null;
  if (fileInput) fileInput.value = '';
  if (fileInfo) fileInfo.textContent = 'No files selected';
  if (statusElement) statusElement.textContent = 'Expecting CSV exports from the Naraka results viewer.';
  updateMetrics();
  renderEmptyState('Upload your CSV files and press “Generate standings” to populate the tournament leaderboard.');
  if (exportButton) {
    exportButton.disabled = true;
  }
  setProcessing(false);
}

async function readFiles(files) {
  const rows = [];
  for (const file of files) {
    const text = await file.text();
    const parsed = parseCsv(text);
    for (const row of parsed) {
      if (!row || Object.values(row).every((value) => value === '')) continue;
      rows.push(row);
    }
  }
  return rows;
}

function parseCsv(text) {
  if (!text) return [];
  const rows = [];
  let current = [];
  let value = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (char === '"') {
      if (inQuotes && text[i + 1] === '"') {
        value += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      current.push(value);
      value = '';
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && text[i + 1] === '\n') {
        i += 1;
      }
      current.push(value);
      rows.push(current);
      current = [];
      value = '';
    } else {
      value += char;
    }
  }

  if (value !== '' || current.length) {
    current.push(value);
    rows.push(current);
  }

  if (!rows.length) return [];
  const headers = rows.shift().map((header) => header.trim());
  return rows
    .map((row) => {
      const record = {};
      headers.forEach((header, index) => {
        if (!header) return;
        record[header] = (row[index] ?? '').trim();
      });
      return record;
    })
    .filter(Boolean);
}

function getConfig() {
  const values = {};
  configInputs.forEach((input) => {
    const key = input.dataset.config;
    if (!key) return;
    const numberValue = parseFloat(input.value);
    values[key] = Number.isFinite(numberValue) ? numberValue : parseFloat(input.getAttribute('value') || '0');
  });

  const teamSize = clampInt(values.teamSize ?? 3, 1, 6);
  return {
    teamSize,
    killMultipliers: {
      1: toNumber(values.kill1, 1.2),
      2: toNumber(values.kill2, 1.0),
      3: toNumber(values.kill3, 0.8),
      default: toNumber(values.killDefault, 0.6)
    },
    placementPoints: {
      1: toNumber(values.place1, 3),
      2: toNumber(values.place2, 2),
      3: toNumber(values.place3, 1),
      default: toNumber(values.placeDefault, 0)
    }
  };
}

function computeScoreboard(records, config) {
  const teamMap = new Map();
  let totalKills = 0;

  for (const record of records) {
    const teamKey = normaliseTeam(readField(record, TEAM_FIELDS));
    if (!teamKey) continue;
    const displayName = normaliseTeam(readField(record, ['TeamName', 'Team Display', 'DisplayName'])) || teamKey;
    const playerName = normalisePlayer(readField(record, PLAYER_FIELDS));
    const rank = parseInt(readField(record, RANK_FIELDS), 10);
    const kills = toNumber(readField(record, KILL_FIELDS), 0);
    const damage = toNumber(readField(record, DAMAGE_FIELDS), 0);

    totalKills += kills;

    if (!teamMap.has(teamKey)) {
      teamMap.set(teamKey, {
        id: teamKey,
        name: displayName,
        players: [],
        totalKills: 0,
        totalDamage: 0,
        totalScore: 0,
        bestRank: Number.isFinite(rank) ? rank : Infinity
      });
    }

    const team = teamMap.get(teamKey);
    if (displayName && team.name === team.id) {
      team.name = displayName;
    }

    const placementPoints = config.placementPoints[rank] ?? config.placementPoints.default ?? 0;
    const killMultiplier = config.killMultipliers[rank] ?? config.killMultipliers.default ?? 1;
    const contribution = kills * killMultiplier + placementPoints / Math.max(config.teamSize, 1);

    team.players.push({
      name: playerName || 'Unknown',
      kills,
      damage,
      rank: Number.isFinite(rank) ? rank : null,
      contribution
    });
    team.totalKills += kills;
    team.totalDamage += damage;
    team.totalScore += contribution;
    if (Number.isFinite(rank)) {
      team.bestRank = Math.min(team.bestRank, rank);
    }
  }

  const teams = Array.from(teamMap.values()).map((team) => {
    const sortedPlayers = team.players.slice().sort((a, b) => b.contribution - a.contribution);
    return {
      ...team,
      players: sortedPlayers
    };
  });

  teams.sort((a, b) => b.totalScore - a.totalScore);

  const stats = {
    teams: teams.length,
    players: records.length,
    kills: totalKills,
    score: teams.length ? teams[0].totalScore : 0
  };

  return { teams, stats };
}

function renderScoreboard(teams) {
  if (!scoreboardContainer) return;
  scoreboardContainer.classList.remove('scoreboard-empty');
  scoreboardContainer.classList.add('scoreboard-grid');
  scoreboardContainer.innerHTML = teams
    .map((team, index) => renderTeamCard(team, index))
    .join('');
  const cards = scoreboardContainer.querySelectorAll('.scoreboard-card');
  animate(cards, { opacity: [0, 1], transform: ['translateY(24px)', 'translateY(0)'] }, {
    duration: 0.5,
    easing: 'cubic-bezier(.2,.8,.2,1)',
    delay: 0.04,
    stagger: 0.06
  });
}

function renderTeamCard(team, index) {
  const rank = index + 1;
  const meta = `${team.totalKills} kills · ${team.totalDamage} dmg`;
  const players = team.players
    .map(
      (player) => `
        <li class="scoreboard-card__player">
          <strong>${escapeHtml(player.name)}</strong>
          <span>${player.rank ? `Rank ${player.rank}` : 'Rank --'} · ${player.kills} K · ${player.damage} DMG</span>
          <em>${player.contribution >= 0 ? '+' : ''}${player.contribution.toFixed(2)}</em>
        </li>
      `
    )
    .join('');

  return `
    <article class="scoreboard-card" data-rank="${rank}">
      <header class="scoreboard-card__header">
        <div class="scoreboard-card__rank">#${rank}</div>
        <div class="scoreboard-card__team">
          <h3>${escapeHtml(team.name)}</h3>
          <p>${meta}</p>
        </div>
        <div class="scoreboard-card__score">
          <span>${team.totalScore.toFixed(2)}</span>
          <small>points</small>
        </div>
      </header>
      <ul class="scoreboard-card__players">
        ${players}
      </ul>
    </article>
  `;
}

function renderEmptyState(message) {
  if (!scoreboardContainer) return;
  scoreboardContainer.classList.remove('scoreboard-grid');
  scoreboardContainer.classList.add('scoreboard-empty');
  scoreboardContainer.innerHTML = `<p>${escapeHtml(message || 'Upload your CSV files and press “Generate standings” to populate the tournament leaderboard.')}</p>`;
}

function updateMetrics(stats = {}) {
  if (metricElements.teams) metricElements.teams.textContent = stats.teams != null ? String(stats.teams) : '--';
  if (metricElements.players) metricElements.players.textContent = stats.players != null ? String(stats.players) : '--';
  if (metricElements.kills) metricElements.kills.textContent = stats.kills != null ? String(stats.kills) : '--';
  if (metricElements.score) metricElements.score.textContent = stats.score != null ? stats.score.toFixed(2) : '--';
}

function exportStandings() {
  if (!lastResult?.teams?.length) return;
  const lines = ['Rank,Team,Points,Kills,Damage'];
  lastResult.teams.forEach((team, index) => {
    lines.push(
      [index + 1, escapeCsv(team.name), team.totalScore.toFixed(2), team.totalKills, team.totalDamage].join(',')
    );
  });
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `strive-standings-${Date.now()}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function setProcessing(state) {
  if (!processButton) return;
  processButton.disabled = state;
  processButton.textContent = state ? 'Processing…' : 'Generate standings';
}

function readField(record, fields) {
  for (const field of fields) {
    if (record[field] != null && record[field] !== '') {
      return record[field];
    }
  }
  return '';
}

function normaliseTeam(value) {
  if (value == null) return '';
  return String(value).trim();
}

function normalisePlayer(value) {
  if (value == null) return '';
  return String(value).trim();
}

function toNumber(value, fallback = 0) {
  const num = typeof value === 'number' ? value : parseFloat(value);
  return Number.isFinite(num) ? num : fallback;
}

function clampInt(value, min, max) {
  const intValue = Math.round(toNumber(value, min));
  return Math.max(min, Math.min(max, intValue));
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeCsv(value) {
  const safe = String(value ?? '').replace(/"/g, '""');
  return `"${safe}"`;
}

function formatTime(date) {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Initialise default state
resetState();
