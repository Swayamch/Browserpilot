const express = require('express');
const mongoose = require('mongoose');
const Analytics = require('../models/Analytics');
const Rule = require('../models/Rule');
const auth = require('../middleware/auth');

const router = express.Router();

// GET /api/analytics — summary dashboard data
router.get('/', auth, async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const since = new Date();
    since.setDate(since.getDate() - Number(days));

    const userId = new mongoose.Types.ObjectId(req.userId);

    // Total executions
    const totalExecs = await Analytics.countDocuments({
      userId,
      executedAt: { $gte: since },
    });

    // Success / failure counts
    const successFail = await Analytics.aggregate([
      { $match: { userId, executedAt: { $gte: since } } },
      { $group: { _id: '$success', count: { $sum: 1 } } },
    ]);

    const successCount = successFail.find((s) => s._id === true)?.count || 0;
    const failCount = successFail.find((s) => s._id === false)?.count || 0;

    // Executions per day
    const perDay = await Analytics.aggregate([
      { $match: { userId, executedAt: { $gte: since } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$executedAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Top rules by execution
    const topRules = await Analytics.aggregate([
      { $match: { userId, executedAt: { $gte: since } } },
      {
        $group: {
          _id: '$ruleId',
          ruleName: { $first: '$ruleName' },
          count: { $sum: 1 },
          lastExecuted: { $max: '$executedAt' },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    // Action type distribution
    const actionDist = await Analytics.aggregate([
      { $match: { userId, executedAt: { $gte: since } } },
      { $group: { _id: '$actionType', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // Active rules count
    const activeRules = await Rule.countDocuments({ userId, enabled: true });
    const totalRules = await Rule.countDocuments({ userId });

    res.json({
      summary: {
        totalExecutions: totalExecs,
        successCount,
        failCount,
        successRate: totalExecs ? Math.round((successCount / totalExecs) * 100) : 0,
        activeRules,
        totalRules,
      },
      perDay,
      topRules,
      actionDistribution: actionDist,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/analytics/recent — recent executions
router.get('/recent', auth, async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    const records = await Analytics.find({ userId: req.userId })
      .sort({ executedAt: -1 })
      .limit(Number(limit));
    res.json({ records });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
