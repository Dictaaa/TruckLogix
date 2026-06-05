const { Freight } = require('../models');


// Listar todos los freights
exports.list = async (req, res) => {
  try {
    const freights = await Freight.findAll();
    res.json(freights);
  } catch (error) {
    console.error('Error al listar freights:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

// Crear un nuevo freight
exports.create = async (req, res) => {
  try {
    const freight = await Freight.create(req.body);
    res.status(201).json(freight);
  } catch (error) {
    console.error('Error al crear freight:', error);
    res.status(400).json({ error: 'Datos inválidos o incompletos' });
  }
};

// Obtener un freight por ID
exports.getOne = async (req, res) => {
  try {
    const freight = await Freight.findByPk(req.params.id);
    if (!freight) return res.status(404).json({ error: 'No encontrado' });
    res.json(freight);
  } catch (error) {
    console.error('Error al obtener freight:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

// Actualizar un freight
exports.update = async (req, res) => {
  try {
    const [rows] = await Freight.update(req.body, { where: { id: req.params.id } });
    if (!rows) return res.status(404).json({ error: 'No encontrado' });
    const updated = await Freight.findByPk(req.params.id);
    res.json(updated);
  } catch (error) {
    console.error('Error al actualizar freight:', error);
    res.status(400).json({ error: 'Datos inválidos' });
  }
};

// Eliminar un freight
exports.remove = async (req, res) => {
  try {
    const rows = await Freight.destroy({ where: { id: req.params.id } });
    if (!rows) return res.status(404).json({ error: 'No encontrado' });
    res.status(204).end();
  } catch (error) {
    console.error('Error al eliminar freight:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

