const express = require('express');
const Template = require('../models/Template');
const auth = require('../middleware/auth');

const router = express.Router();

// GET /api/templates — list public + user templates
router.get('/', auth, async (req, res) => {
  try {
    const { category, sort } = req.query;
    const filter = {
      $or: [{ public: true }, { createdBy: req.userId }],
    };
    if (category) filter.category = category;

    let sortObj = { usageCount: -1 };
    if (sort === 'newest') sortObj = { createdAt: -1 };
    if (sort === 'rating') sortObj = { rating: -1 };

    const templates = await Template.find(filter).sort(sortObj);
    res.json({ templates });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/templates/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const template = await Template.findById(req.params.id);
    if (!template) return res.status(404).json({ error: 'Template not found' });
    res.json({ template });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/templates — create template
router.post('/', auth, async (req, res) => {
  try {
    const { name, description, category, icon, ruleTemplate, public: isPublic } = req.body;
    if (!name || !ruleTemplate) {
      return res.status(400).json({ error: 'name and ruleTemplate are required' });
    }

    const template = await Template.create({
      name,
      description,
      category: category || 'custom',
      icon: icon || '🔧',
      ruleTemplate,
      public: isPublic !== undefined ? isPublic : true,
      createdBy: req.userId,
    });

    res.status(201).json({ template });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/templates/:id/use — increment usage count
router.post('/:id/use', auth, async (req, res) => {
  try {
    const template = await Template.findByIdAndUpdate(
      req.params.id,
      { $inc: { usageCount: 1 } },
      { new: true }
    );
    if (!template) return res.status(404).json({ error: 'Template not found' });
    res.json({ template });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/templates/:id — owner only
router.delete('/:id', auth, async (req, res) => {
  try {
    const template = await Template.findOneAndDelete({
      _id: req.params.id,
      createdBy: req.userId,
    });
    if (!template) return res.status(404).json({ error: 'Template not found or not authorized' });
    res.json({ message: 'Template deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
