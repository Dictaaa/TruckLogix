const { Operation } = require('../models');


// Listar todos los patios
exports.list = async (req, res) => {
  try {
    const operations = await Operation.findAll();
    res.json(operations);
  } catch (error) {
    console.error('Error al listar operations:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

// Crear un nuevo operation
exports.create = async (req, res) => {
  try {
    const operation = await Operation.create(req.body);
    res.status(201).json(operation);
  } catch (error) {
    console.error('Error al crear operation:', error);
    res.status(400).json({ error: 'Datos inválidos o incompletos' });
  }
};

// Obtener un operation por ID
exports.getOne = async (req, res) => {
  try {
    const operation = await Operation.findByPk(req.params.id);
    if (!operation) return res.status(404).json({ error: 'No encontrado' });
    res.json(operation);
  } catch (error) {
    console.error('Error al obtener operation:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

// Actualizar un operation
exports.update = async (req, res) => {
  try {
    const [rows] = await Operation.update(req.body, { where: { id: req.params.id } });
    if (!rows) return res.status(404).json({ error: 'No encontrado' });
    const updated = await Operation.findByPk(req.params.id);
    res.json(updated);
  } catch (error) {
    console.error('Error al actualizar operation:', error);
    res.status(400).json({ error: 'Datos inválidos' });
  }
};

// Eliminar un operation
exports.remove = async (req, res) => {
  try {
    const rows = await Operation.destroy({ where: { id: req.params.id } });
    if (!rows) return res.status(404).json({ error: 'No encontrado' });
    res.status(204).end();
  } catch (error) {
    console.error('Error al eliminar operation:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

