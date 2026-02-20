const Template = require('../models/Template');

const defaultTemplates = [
  {
    name: 'Focus Mode',
    description: 'Block distracting websites to help you concentrate on work.',
    category: 'focus',
    icon: '🎯',
    ruleTemplate: {
      trigger: { type: 'manual', value: '' },
      conditions: [],
      actions: [
        { type: 'block_site', params: { url: 'facebook.com' } },
        { type: 'block_site', params: { url: 'twitter.com' } },
        { type: 'block_site', params: { url: 'reddit.com' } },
        { type: 'block_site', params: { url: 'instagram.com' } },
        { type: 'block_site', params: { url: 'tiktok.com' } },
        { type: 'send_notification', params: { title: 'Focus Mode', message: 'Focus mode is now active. Stay productive!' } },
      ],
    },
    public: true,
    usageCount: 150,
  },
  {
    name: 'Night Mode',
    description: 'Automatically mute tabs and limit browsing after 10 PM.',
    category: 'night',
    icon: '🌙',
    ruleTemplate: {
      trigger: { type: 'time', value: '0 22 * * *' },
      conditions: [],
      actions: [
        { type: 'mute_tab', params: { match: '*' } },
        { type: 'block_site', params: { url: 'youtube.com' } },
        { type: 'block_site', params: { url: 'twitch.tv' } },
        { type: 'send_notification', params: { title: 'Night Mode', message: 'It\'s past 10 PM. Time to wind down!' } },
      ],
    },
    public: true,
    usageCount: 120,
  },
  {
    name: 'Work Mode',
    description: 'Open work-related tabs and block entertainment during work hours.',
    category: 'work',
    icon: '💼',
    ruleTemplate: {
      trigger: { type: 'time', value: '0 9 * * 1-5' },
      conditions: [],
      actions: [
        { type: 'open_tab', params: { url: 'https://mail.google.com' } },
        { type: 'open_tab', params: { url: 'https://calendar.google.com' } },
        { type: 'block_site', params: { url: 'youtube.com' } },
        { type: 'block_site', params: { url: 'reddit.com' } },
        { type: 'send_notification', params: { title: 'Work Mode', message: 'Work mode activated. Let\'s get things done!' } },
      ],
    },
    public: true,
    usageCount: 200,
  },
  {
    name: 'Break Reminder',
    description: 'Get a notification every 30 minutes to take a short break.',
    category: 'productivity',
    icon: '⏰',
    ruleTemplate: {
      trigger: { type: 'time', value: '*/30 * * * *' },
      conditions: [],
      actions: [
        { type: 'send_notification', params: { title: 'Break Time!', message: 'Stand up, stretch, and rest your eyes for a moment.' } },
      ],
    },
    public: true,
    usageCount: 95,
  },
  {
    name: 'Social Media Blocker',
    description: 'Block all major social media platforms.',
    category: 'focus',
    icon: '🚫',
    ruleTemplate: {
      trigger: { type: 'url', value: '*://*.facebook.com/*' },
      conditions: [],
      actions: [
        { type: 'block_site', params: { url: 'facebook.com' } },
        { type: 'block_site', params: { url: 'twitter.com' } },
        { type: 'block_site', params: { url: 'instagram.com' } },
        { type: 'block_site', params: { url: 'tiktok.com' } },
        { type: 'block_site', params: { url: 'snapchat.com' } },
      ],
    },
    public: true,
    usageCount: 180,
  },
];

async function seedTemplates() {
  try {
    const count = await Template.countDocuments({ public: true, createdBy: null });
    if (count === 0) {
      await Template.insertMany(defaultTemplates);
      console.log('Default templates seeded');
    }
  } catch (err) {
    console.error('Template seeding error:', err.message);
  }
}

module.exports = seedTemplates;
