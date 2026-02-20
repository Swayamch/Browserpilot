const mongoose = require('mongoose');

const analyticsSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    ruleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Rule',
      required: true,
    },
    ruleName: { type: String, default: '' },
    actionType: { type: String, default: '' },
    executedAt: { type: Date, default: Date.now },
    success: { type: Boolean, default: true },
    errorMessage: { type: String, default: '' },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: false }
);

analyticsSchema.index({ userId: 1, executedAt: -1 });
analyticsSchema.index({ ruleId: 1, executedAt: -1 });

module.exports = mongoose.model('Analytics', analyticsSchema);
