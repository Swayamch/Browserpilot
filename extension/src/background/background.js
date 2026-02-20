/* ==========================================================
   BrowserPilot — Background Service Worker (Manifest V3)
   Handles: alarms (time triggers), tab events (URL triggers),
   rule execution, blocking via declarativeNetRequest, sync.
   ========================================================== */

const API_BASE = 'http://localhost:5000/api';

// ---------- helpers ----------

async function getToken() {
  const { token } = await chrome.storage.local.get('token');
  return token || null;
}

async function apiGet(path) {
  const token = await getToken();
  if (!token) return null;
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

async function apiPost(path, body) {
  const token = await getToken();
  if (!token) return null;
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

// ---------- rule storage ----------

async function loadRules() {
  const data = await chrome.storage.local.get('rules');
  return data.rules || [];
}

async function saveRules(rules) {
  await chrome.storage.local.set({ rules });
}

// ---------- sync from backend ----------

async function syncRules() {
  const data = await apiGet('/rules?enabled=true');
  if (data && data.rules) {
    await saveRules(data.rules);
    await setupAlarms(data.rules);
    await setupBlockRules(data.rules);
    console.log('[BrowserPilot] Synced', data.rules.length, 'rules');
  }
}

// ---------- alarms for time-based triggers ----------

function parseCron(cron) {
  // Simple cron → next-run-in-minutes calculator
  // Format: min hour dom month dow
  const parts = cron.split(' ');
  if (parts.length < 5) return 30; // fallback 30 min

  const min = parts[0];
  if (min.startsWith('*/')) {
    return parseInt(min.slice(2), 10) || 30;
  }
  // For specific times, run every 60 minutes (will check actual time in handler)
  return 60;
}

async function setupAlarms(rules) {
  // Clear old alarms
  await chrome.alarms.clearAll();

  const timeRules = rules.filter((r) => r.trigger && r.trigger.type === 'time' && r.enabled);
  for (const rule of timeRules) {
    const periodInMinutes = parseCron(rule.trigger.value);
    chrome.alarms.create(`rule_${rule._id}`, { periodInMinutes });
  }
}

// ---------- declarativeNetRequest for blocking ----------

async function setupBlockRules(rules) {
  // Gather block_site actions
  const blockActions = [];
  for (const rule of rules) {
    if (!rule.enabled) continue;
    for (const action of rule.actions || []) {
      if (action.type === 'block_site' && action.params?.url) {
        blockActions.push(action.params.url);
      }
    }
  }

  // Remove existing dynamic rules
  const existing = await chrome.declarativeNetRequest.getDynamicRules();
  const removeIds = existing.map((r) => r.id);

  // Build new rules
  const addRules = blockActions.map((url, i) => ({
    id: i + 1,
    priority: 1,
    action: { type: 'block' },
    condition: {
      urlFilter: `*${url}*`,
      resourceTypes: ['main_frame'],
    },
  }));

  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: removeIds,
    addRules,
  });
}

// ---------- action executors ----------

async function executeAction(action) {
  const { type, params } = action;

  switch (type) {
    case 'open_tab':
      if (params?.url) {
        await chrome.tabs.create({ url: params.url });
      }
      break;

    case 'close_tab':
    case 'close_tabs_matching': {
      const pattern = params?.match || params?.pattern || '';
      if (pattern) {
        const tabs = await chrome.tabs.query({});
        for (const tab of tabs) {
          if (tab.url && tab.url.includes(pattern.replace(/\*/g, ''))) {
            await chrome.tabs.remove(tab.id);
          }
        }
      }
      break;
    }

    case 'mute_tab': {
      const match = params?.match || '*';
      const tabs = await chrome.tabs.query({});
      for (const tab of tabs) {
        if (match === '*' || (tab.url && tab.url.includes(match.replace(/\*/g, '')))) {
          await chrome.tabs.update(tab.id, { muted: true });
        }
      }
      break;
    }

    case 'unmute_tab': {
      const match = params?.match || '*';
      const tabs = await chrome.tabs.query({});
      for (const tab of tabs) {
        if (match === '*' || (tab.url && tab.url.includes(match.replace(/\*/g, '')))) {
          await chrome.tabs.update(tab.id, { muted: false });
        }
      }
      break;
    }

    case 'send_notification':
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon128.png',
        title: params?.title || 'BrowserPilot',
        message: params?.message || '',
      });
      break;

    case 'redirect': {
      if (params?.from && params?.to) {
        const tabs = await chrome.tabs.query({});
        for (const tab of tabs) {
          if (tab.url && tab.url.includes(params.from)) {
            await chrome.tabs.update(tab.id, { url: params.to });
          }
        }
      }
      break;
    }

    case 'block_site':
      // Handled via declarativeNetRequest, no runtime action needed
      break;

    default:
      console.warn('[BrowserPilot] Unknown action type:', type);
  }
}

async function executeRule(rule) {
  try {
    for (const action of rule.actions || []) {
      await executeAction(action);
    }
    // Report execution to backend
    await apiPost(`/rules/${rule._id}/execute`, {
      success: true,
      actionType: rule.actions[0]?.type || '',
    });
  } catch (err) {
    console.error('[BrowserPilot] Rule execution error:', err);
    await apiPost(`/rules/${rule._id}/execute`, {
      success: false,
      errorMessage: err.message,
      actionType: rule.actions[0]?.type || '',
    });
  }
}

// ---------- event listeners ----------

// Alarm handler (time triggers)
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (!alarm.name.startsWith('rule_')) return;
  const ruleId = alarm.name.replace('rule_', '');
  const rules = await loadRules();
  const rule = rules.find((r) => r._id === ruleId);
  if (rule && rule.enabled) {
    await executeRule(rule);
  }
});

// Tab update handler (URL triggers)
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status !== 'complete' || !tab.url) return;

  const rules = await loadRules();
  const urlRules = rules.filter(
    (r) => r.trigger && r.trigger.type === 'url' && r.enabled
  );

  for (const rule of urlRules) {
    const pattern = rule.trigger.value.replace(/\*/g, '.*');
    try {
      if (new RegExp(pattern).test(tab.url)) {
        await executeRule(rule);
      }
    } catch {
      // Invalid regex, skip
    }
  }
});

// Startup handler
chrome.runtime.onStartup.addListener(async () => {
  await syncRules();
  const rules = await loadRules();
  const startupRules = rules.filter(
    (r) => r.trigger && r.trigger.type === 'startup' && r.enabled
  );
  for (const rule of startupRules) {
    await executeRule(rule);
  }
});

// Install handler
chrome.runtime.onInstalled.addListener(async () => {
  await syncRules();
});

// ---------- message handling from popup ----------

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'SYNC_RULES') {
    syncRules().then(() => sendResponse({ success: true }));
    return true; // async response
  }

  if (message.type === 'EXECUTE_RULE') {
    const rule = message.rule;
    if (rule) {
      executeRule(rule).then(() => sendResponse({ success: true }));
    } else {
      sendResponse({ success: false, error: 'No rule provided' });
    }
    return true;
  }

  if (message.type === 'GET_RULES') {
    loadRules().then((rules) => sendResponse({ rules }));
    return true;
  }
});
