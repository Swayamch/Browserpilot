const mongoose = require('mongoose');

const ruleSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    trigger: {
      type: {
        type: String,
        enum: ['time', 'url', 'manual', 'startup'],
        required: true,
      },
      value: { type: String, default: '' }, // cron for time, pattern for url
    },
    conditions: [
      {
        field: { type: String },
        operator: { type: String, enum: ['equals', 'contains', 'regex', 'gt', 'lt'] },
        value: { type: String },
      },
    ],
    actions: [
      {
        type: {
          type: String,
          enum: [
            'block_site',
            'open_tab',
            'close_tab',
            'mute_tab',
            'unmute_tab',
            'send_notification',
            'redirect',
            'close_tabs_matching',
          ],
          required: true,
        },
        params: { type: mongoose.Schema.Types.Mixed, default: {} },
      },
    ],
    enabled: { type: Boolean, default: true },
    templateId: { type: mongoose.Schema.Types.ObjectId, ref: 'Template', default: null },
    lastExecuted: { type: Date, default: null },
    executionCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

ruleSchema.index({ userId: 1, enabled: 1 });

module.exports = mongoose.model('Rule', ruleSchema);
