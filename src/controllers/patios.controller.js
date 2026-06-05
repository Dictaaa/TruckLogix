const { Patio } = require('../models');


// Listar todos los patios
exports.list = async (req, res) => {
  try {
    const patios = await Patio.findAll();
    res.json(patios);
  } catch (error) {
    console.error('Error al listar patios:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

// Crear un nuevo patio
exports.create = async (req, res) => {
  try {
    const patio = await Patio.create(req.body);
    res.status(201).json(patio);
  } catch (error) {
    console.error('Error al crear patio:', error);
    res.status(400).json({ error: 'Datos inválidos o incompletos' });
  }
};

// Obtener un patio por ID
exports.getOne = async (req, res) => {
  try {
    const patio = await Patio.findByPk(req.params.id);
    if (!patio) return res.status(404).json({ error: 'No encontrado' });
    res.json(patio);
  } catch (error) {
    console.error('Error al obtener patio:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

// Actualizar un patio
exports.update = async (req, res) => {
  try {
    const [rows] = await Patio.update(req.body, { where: { id: req.params.id } });
    if (!rows) return res.status(404).json({ error: 'No encontrado' });
    const updated = await Patio.findByPk(req.params.id);
    res.json(updated);
  } catch (error) {
    console.error('Error al actualizar patio:', error);
    res.status(400).json({ error: 'Datos inválidos' });
  }
};

// Eliminar un patio
exports.remove = async (req, res) => {
  try {
    const rows = await Patio.destroy({ where: { id: req.params.id } });
    if (!rows) return res.status(404).json({ error: 'No encontrado' });
    res.status(204).end();
  } catch (error) {
    console.error('Error al eliminar patio:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

