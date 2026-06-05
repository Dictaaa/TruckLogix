const { Affiliate } = require('../models');


// Listar todos los patios
exports.list = async (req, res) => {
  try {
    const affiliates = await Affiliate.findAll();
    res.json(affiliates);
  } catch (error) {
    console.error('Error al listar affiliates:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

// Crear un nuevo affiliate
exports.create = async (req, res) => {
  try {
    const affiliate = await Affiliate.create(req.body);
    res.status(201).json(affiliate);
  } catch (error) {
    console.error('Error al crear affiliate:', error);
    res.status(400).json({ error: 'Datos inválidos o incompletos' });
  }
};

// Obtener un affiliate por ID
exports.getOne = async (req, res) => {
  try {
    const affiliate = await Affiliate.findByPk(req.params.id);
    if (!affiliate) return res.status(404).json({ error: 'No encontrado' });
    res.json(affiliate);
  } catch (error) {
    console.error('Error al obtener affiliate:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

// Actualizar un affiliate
exports.update = async (req, res) => {
  try {
    const [rows] = await Affiliate.update(req.body, { where: { id: req.params.id } });
    if (!rows) return res.status(404).json({ error: 'No encontrado' });
    const updated = await Affiliate.findByPk(req.params.id);
    res.json(updated);
  } catch (error) {
    console.error('Error al actualizar affiliate:', error);
    res.status(400).json({ error: 'Datos inválidos' });
  }
};

// Eliminar un affiliate
exports.remove = async (req, res) => {
  try {
    const rows = await Affiliate.destroy({ where: { id: req.params.id } });
    if (!rows) return res.status(404).json({ error: 'No encontrado' });
    res.status(204).end();
  } catch (error) {
    console.error('Error al eliminar affiliate:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

