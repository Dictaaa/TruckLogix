const VehicleInspectionItem = require('../models/vehicle_inspection_item.model');
const InspectionItem = require('../models/inspection_item.model');

exports.list = async (req, res) => {
  try {
    const items = await VehicleInspectionItem.findAll({
      include: [InspectionItem]
    });
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching inspection items' });
  }
};

exports.getOne = async (req, res) => {
  try {
    const item = await VehicleInspectionItem.findByPk(req.params.id, {
      include: [InspectionItem]
    });
    if (!item) return res.status(404).json({ error: 'Not found' });
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching item' });
  }
};

exports.create = async (req, res) => {
  try {
    const item = await VehicleInspectionItem.create(req.body);
    res.status(201).json(item);
  } catch (err) {
    res.status(400).json({ error: 'Error creating item' });
  }
};

exports.update = async (req, res) => {
  try {
    const [updated] = await VehicleInspectionItem.update(req.body, {
      where: { id: req.params.id }
    });
    if (!updated) return res.status(404).json({ error: 'Not found' });
    const item = await VehicleInspectionItem.findByPk(req.params.id);
    res.json(item);
  } catch (err) {
    res.status(400).json({ error: 'Error updating item' });
  }
};

exports.remove = async (req, res) => {
  try {
    const deleted = await VehicleInspectionItem.destroy({
      where: { id: req.params.id }
    });
    if (!deleted) return res.status(404).json({ error: 'Not found' });
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: 'Error deleting item' });
  }
};
