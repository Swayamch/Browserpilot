const { GoogleGenerativeAI } = require('@google/generative-ai');
const config = require('../config');

const SYSTEM_PROMPT = `You are BrowserPilot AI, an assistant that converts natural language requests into browser automation rules.

You MUST respond with valid JSON only (no markdown, no explanation). The JSON must have this schema:
{
  "name": "string — short rule name",
  "description": "string — what the rule does",
  "trigger": {
    "type": "time | url | manual | startup",
    "value": "string — cron expression for time, URL pattern for url, empty for manual/startup"
  },
  "conditions": [
    { "field": "string", "operator": "equals|contains|regex|gt|lt", "value": "string" }
  ],
  "actions": [
    {
      "type": "block_site | open_tab | close_tab | mute_tab | unmute_tab | send_notification | redirect | close_tabs_matching",
      "params": { }
    }
  ]
}

Action params examples:
- block_site: { "url": "facebook.com" }
- open_tab: { "url": "https://example.com" }
- close_tab: { "match": "youtube.com" }
- close_tabs_matching: { "pattern": "*.reddit.com*" }
- mute_tab: { "match": "twitch.tv" }
- send_notification: { "title": "Reminder", "message": "Take a break!" }
- redirect: { "from": "reddit.com", "to": "https://focus.app" }

Trigger value examples:
- time: "0 9 * * 1-5" (9AM weekdays), "*/30 * * * *" (every 30 min)
- url: "*://*.facebook.com/*"
- manual: ""
- startup: ""

Generate sensible defaults when details are missing. Always return valid JSON.`;

class AIService {
  constructor() {
    if (config.geminiApiKey) {
      this.genAI = new GoogleGenerativeAI(config.geminiApiKey);
      this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    } else {
      this.model = null;
    }
  }

  async generateRule(prompt) {
    if (!this.model) {
      return this._fallbackGenerate(prompt);
    }

    try {
      const result = await this.model.generateContent([
        { text: SYSTEM_PROMPT },
        { text: `User request: "${prompt}"\n\nRespond with the JSON rule:` },
      ]);

      const text = result.response.text().trim();
      // Strip markdown code fences if present
      const cleaned = text.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim();
      const rule = JSON.parse(cleaned);
      return { success: true, rule };
    } catch (err) {
      console.error('Gemini AI error:', err.message);
      return this._fallbackGenerate(prompt);
    }
  }

  _fallbackGenerate(prompt) {
    const lower = prompt.toLowerCase();

    // Block site patterns
    if (lower.includes('block') && (lower.includes('site') || lower.includes('website'))) {
      const urlMatch = prompt.match(/(?:block\s+)?([\w.-]+\.\w+)/i);
      const site = urlMatch ? urlMatch[1] : 'example.com';
      return {
        success: true,
        rule: {
          name: `Block ${site}`,
          description: `Blocks access to ${site}`,
          trigger: { type: 'url', value: `*://*.${site}/*` },
          conditions: [],
          actions: [{ type: 'block_site', params: { url: site } }],
        },
      };
    }

    // Focus mode
    if (lower.includes('focus') || lower.includes('distract')) {
      return {
        success: true,
        rule: {
          name: 'Focus Mode',
          description: 'Blocks distracting sites during focus time',
          trigger: { type: 'manual', value: '' },
          conditions: [],
          actions: [
            { type: 'block_site', params: { url: 'facebook.com' } },
            { type: 'block_site', params: { url: 'twitter.com' } },
            { type: 'block_site', params: { url: 'reddit.com' } },
            { type: 'block_site', params: { url: 'youtube.com' } },
            { type: 'send_notification', params: { title: 'Focus Mode', message: 'Focus mode activated! Distracting sites are blocked.' } },
          ],
        },
      };
    }

    // Reminder / notification
    if (lower.includes('remind') || lower.includes('notification') || lower.includes('break')) {
      return {
        success: true,
        rule: {
          name: 'Break Reminder',
          description: 'Sends a reminder notification periodically',
          trigger: { type: 'time', value: '*/30 * * * *' },
          conditions: [],
          actions: [
            { type: 'send_notification', params: { title: 'Break Time', message: 'Time to take a short break!' } },
          ],
        },
      };
    }

    // Close tabs
    if (lower.includes('close') && lower.includes('tab')) {
      const urlMatch = prompt.match(/([\w.-]+\.\w+)/i);
      const site = urlMatch ? urlMatch[1] : 'example.com';
      return {
        success: true,
        rule: {
          name: `Close ${site} tabs`,
          description: `Closes all tabs matching ${site}`,
          trigger: { type: 'manual', value: '' },
          conditions: [],
          actions: [{ type: 'close_tabs_matching', params: { pattern: `*${site}*` } }],
        },
      };
    }

    // Default: generic manual rule
    return {
      success: true,
      rule: {
        name: 'Custom Rule',
        description: prompt,
        trigger: { type: 'manual', value: '' },
        conditions: [],
        actions: [
          { type: 'send_notification', params: { title: 'BrowserPilot', message: prompt } },
        ],
      },
    };
  }
}

module.exports = new AIService();
