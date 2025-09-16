export const KEY = 'ai-clicker-save-v1';
const SNAP_KEY = 'ai-clicker-snapshots-v1';
const VERSION = 1;

export function saveState(state) {
  try {
    const copy = { ...state, lastSavedAt: Date.now(), _version: VERSION };
    // Avoid circular: convert Set to array
    copy.upgrades = Array.from(copy.upgrades || []);
    copy.achievements = Array.from(copy.achievements || []);
    copy.questsClaimed = Array.from(copy.questsClaimed || []);
    copy.paramUpgrades = copy.paramUpgrades || {};
    // conceptCards as id->count map
    copy.conceptCards = copy.conceptCards || {};
    copy.conceptXP = copy.conceptXP || 0;
    copy.conceptTickets = copy.conceptTickets || 0;
    copy.conceptShards = copy.conceptShards || 0;
    localStorage.setItem(KEY, JSON.stringify(copy));
    try {
      // lightweight debug log
      // eslint-disable-next-line no-console
      console.log('[saveState]', new Date(copy.lastSavedAt).toISOString(), {
        params: Math.round(copy.params),
        compute: Math.round(copy.compute),
        totalParams: Math.round(copy.totalParams),
        eraId: copy.eraId,
        insights: copy.insights,
      });
    } catch {}
  } catch {}
}

export function loadState() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    parsed._version = parsed._version || 1;
    parsed.upgrades = new Set(parsed.upgrades || []);
    parsed.achievements = new Set(parsed.achievements || []);
    parsed.questsClaimed = new Set(parsed.questsClaimed || []);
    parsed.paramUpgrades = parsed.paramUpgrades || {};
    if (parsed.conceptCards instanceof Array) {
      const obj = {}; for (const id of parsed.conceptCards) obj[id]=(obj[id]||0)+1; parsed.conceptCards = obj;
    }
    if (parsed.conceptCards instanceof Set) {
      const obj = {}; parsed.conceptCards.forEach(id=> obj[id]=(obj[id]||0)+1); parsed.conceptCards = obj;
    }
    parsed.conceptCards = parsed.conceptCards || {};
    parsed.conceptXP = parsed.conceptXP || 0;
    parsed.conceptTickets = parsed.conceptTickets || 0;
    parsed.conceptShards = parsed.conceptShards || 0;
    return parsed;
  } catch {
    return null;
  }
}

export function exportSave() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw || '';
  } catch { return ''; }
}

export function importSave(raw) {
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    parsed.upgrades = new Set(parsed.upgrades || []);
    parsed.achievements = new Set(parsed.achievements || []);
    parsed.questsClaimed = new Set(parsed.questsClaimed || []);
    parsed.paramUpgrades = parsed.paramUpgrades || {};
    parsed.conceptCards = new Set(parsed.conceptCards || []);
    parsed.conceptXP = parsed.conceptXP || 0;
    return parsed;
  } catch {
    return null;
  }
}

export function clearState() {
  try { localStorage.removeItem(KEY); } catch {}
}

// ------- Snapshots (manual backups) -------
export function createSnapshot() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const list = snapshotListRaw();
    const id = Date.now().toString();
    const item = { id, ts: Date.now(), data: raw };
    const next = [item, ...list].slice(0, 8); // keep last 8
    localStorage.setItem(SNAP_KEY, JSON.stringify(next));
    return { id: item.id, ts: item.ts, size: item.data.length };
  } catch { return null; }
}

export function snapshotList() {
  return snapshotListRaw().map(({ id, ts, data }) => ({ id, ts, size: (data||'').length }));
}

export function snapshotRestore(id) {
  const list = snapshotListRaw();
  const item = list.find(x => x.id === id);
  if (!item) return false;
  try {
    localStorage.setItem(KEY, item.data);
    return true;
  } catch { return false; }
}

export function snapshotDelete(id) {
  const list = snapshotListRaw();
  const next = list.filter(x => x.id !== id);
  try { localStorage.setItem(SNAP_KEY, JSON.stringify(next)); } catch {}
}

function snapshotListRaw() {
  try {
    const raw = localStorage.getItem(SNAP_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}
