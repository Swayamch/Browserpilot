const express = require('express');
const Rule = require('../models/Rule');
const Analytics = require('../models/Analytics');
const auth = require('../middleware/auth');

const router = express.Router();

// GET /api/rules — list user rules
router.get('/', auth, async (req, res) => {
  try {
    const { enabled, trigger } = req.query;
    const filter = { userId: req.userId };
    if (enabled !== undefined) filter.enabled = enabled === 'true';
    if (trigger) filter['trigger.type'] = trigger;

    const rules = await Rule.find(filter).sort({ updatedAt: -1 });
    res.json({ rules });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/rules/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const rule = await Rule.findOne({ _id: req.params.id, userId: req.userId });
    if (!rule) return res.status(404).json({ error: 'Rule not found' });
    res.json({ rule });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/rules — create rule
router.post('/', auth, async (req, res) => {
  try {
    const { name, description, trigger, conditions, actions, enabled, templateId } = req.body;

    if (!name || !trigger || !actions || !actions.length) {
      return res.status(400).json({ error: 'name, trigger, and at least one action are required' });
    }

    const rule = await Rule.create({
      userId: req.userId,
      name,
      description,
      trigger,
      conditions: conditions || [],
      actions,
      enabled: enabled !== undefined ? enabled : true,
      templateId: templateId || null,
    });

    res.status(201).json({ rule });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/rules/:id — update rule
router.put('/:id', auth, async (req, res) => {
  try {
    const rule = await Rule.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      req.body,
      { new: true, runValidators: true }
    );
    if (!rule) return res.status(404).json({ error: 'Rule not found' });
    res.json({ rule });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/rules/:id/toggle — toggle enabled/disabled
router.patch('/:id/toggle', auth, async (req, res) => {
  try {
    const rule = await Rule.findOne({ _id: req.params.id, userId: req.userId });
    if (!rule) return res.status(404).json({ error: 'Rule not found' });

    rule.enabled = !rule.enabled;
    await rule.save();
    res.json({ rule });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/rules/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const rule = await Rule.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!rule) return res.status(404).json({ error: 'Rule not found' });
    res.json({ message: 'Rule deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/rules/:id/execute — record execution
router.post('/:id/execute', auth, async (req, res) => {
  try {
    const rule = await Rule.findOne({ _id: req.params.id, userId: req.userId });
    if (!rule) return res.status(404).json({ error: 'Rule not found' });

    const { success, errorMessage, actionType, metadata } = req.body;

    rule.lastExecuted = new Date();
    rule.executionCount += 1;
    await rule.save();

    await Analytics.create({
      userId: req.userId,
      ruleId: rule._id,
      ruleName: rule.name,
      actionType: actionType || rule.actions[0]?.type || '',
      success: success !== undefined ? success : true,
      errorMessage: errorMessage || '',
      metadata: metadata || {},
    });

    res.json({ message: 'Execution recorded', rule });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
