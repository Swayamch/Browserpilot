const mongoose = require('mongoose');

const templateSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    category: {
      type: String,
      enum: ['focus', 'productivity', 'night', 'work', 'custom'],
      default: 'custom',
    },
    icon: { type: String, default: '🔧' },
    ruleTemplate: {
      trigger: {
        type: { type: String, enum: ['time', 'url', 'manual', 'startup'] },
        value: { type: String, default: '' },
      },
      conditions: [
        {
          field: String,
          operator: String,
          value: String,
        },
      ],
      actions: [
        {
          type: { type: String },
          params: { type: mongoose.Schema.Types.Mixed, default: {} },
        },
      ],
    },
    public: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    usageCount: { type: Number, default: 0 },
    rating: { type: Number, default: 0, min: 0, max: 5 },
  },
  { timestamps: true }
);

templateSchema.index({ public: 1, category: 1 });
templateSchema.index({ usageCount: -1 });

module.exports = mongoose.model('Template', templateSchema);
