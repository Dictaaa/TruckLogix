const { ShippingLine } = require('../models');


// Listar todos los patios
exports.list = async (req, res) => {
  try {
    const shippingLines = await ShippingLine.findAll();
    res.json(shippingLines);
  } catch (error) {
    console.error('Error al listar shipping lines:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

// Crear un nuevo shipping line
exports.create = async (req, res) => {
  try {
    const shippingLine = await ShippingLine.create(req.body);
    res.status(201).json(shippingLine);
  } catch (error) {
    console.error('Error al crear shipping line:', error);
    res.status(400).json({ error: 'Datos inválidos o incompletos' });
  }
};

// Obtener un shipping line por ID
exports.getOne = async (req, res) => {
  try {
    const shippingLine = await ShippingLine.findByPk(req.params.id);
    if (!shippingLine) return res.status(404).json({ error: 'No encontrado' });
    res.json(shippingLine);
  } catch (error) {
    console.error('Error al obtener shipping line:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

// Actualizar un shipping line
exports.update = async (req, res) => {
  try {
    const [rows] = await ShippingLine.update(req.body, { where: { id: req.params.id } });
    if (!rows) return res.status(404).json({ error: 'No encontrado' });
    const updated = await ShippingLine.findByPk(req.params.id);
    res.json(updated);
  } catch (error) {
    console.error('Error al actualizar shipping line:', error);
    res.status(400).json({ error: 'Datos inválidos' });
  }
};

// Eliminar un shipping line
exports.remove = async (req, res) => {
  try {
    const rows = await ShippingLine.destroy({ where: { id: req.params.id } });
    if (!rows) return res.status(404).json({ error: 'No encontrado' });
    res.status(204).end();
  } catch (error) {
    console.error('Error al eliminar shipping line:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

