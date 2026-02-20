const express = require('express');
const auth = require('../middleware/auth');
const aiService = require('../services/aiService');

const router = express.Router();

// POST /api/ai/generate — natural language to rule
router.post('/generate', auth, async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt || !prompt.trim()) {
      return res.status(400).json({ error: 'prompt is required' });
    }

    const result = await aiService.generateRule(prompt.trim());

    if (!result.success) {
      return res.status(500).json({ error: 'Failed to generate rule' });
    }

    res.json({ rule: result.rule, prompt });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
