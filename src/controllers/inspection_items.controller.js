const InspectionItem = require('../models/inspection_item.model');

exports.list = async (req, res) => {
  try {
    const items = await InspectionItem.findAll();
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching inspection items' });
  }
};

exports.getOne = async (req, res) => {
  try {
    const item = await InspectionItem.findByPk(req.params.id);
    if (!item) return res.status(404).json({ error: 'Not found' });
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching inspection item' });
  }
};

exports.create = async (req, res) => {
  try {
    const item = await InspectionItem.create(req.body);
    res.status(201).json(item);
  } catch (err) {
    res.status(400).json({ error: 'Error creating inspection item' });
  }
};

exports.update = async (req, res) => {
  try {
    const [updated] = await InspectionItem.update(req.body, {
      where: { id: req.params.id }
    });
    if (!updated) return res.status(404).json({ error: 'Not found' });
    const item = await InspectionItem.findByPk(req.params.id);
    res.json(item);
  } catch (err) {
    res.status(400).json({ error: 'Error updating inspection item' });
  }
};

exports.remove = async (req, res) => {
  try {
    const deleted = await InspectionItem.destroy({ where: { id: req.params.id } });
    if (!deleted) return res.status(404).json({ error: 'Not found' });
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: 'Error deleting inspection item' });
  }
};
