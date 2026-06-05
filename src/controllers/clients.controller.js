const { Client } = require('../models');


// Listar todos los patios
exports.list = async (req, res) => {
  try {
    const clients = await Client.findAll();
    res.json(clients);
  } catch (error) {
    console.error('Error al listar clients:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

// Crear un nuevo client
exports.create = async (req, res) => {
  try {
    const client = await Client.create(req.body);
    res.status(201).json(client);
  } catch (error) {
    console.error('Error al crear client:', error);
    res.status(400).json({ error: 'Datos inválidos o incompletos' });
  }
};

// Obtener un client por ID
exports.getOne = async (req, res) => {
  try {
    const client = await Client.findByPk(req.params.id);
    if (!client) return res.status(404).json({ error: 'No encontrado' });
    res.json(client);
  } catch (error) {
    console.error('Error al obtener client:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

// Actualizar un client
exports.update = async (req, res) => {
  try {
    const [rows] = await Client.update(req.body, { where: { id: req.params.id } });
    if (!rows) return res.status(404).json({ error: 'No encontrado' });
    const updated = await Client.findByPk(req.params.id);
    res.json(updated);
  } catch (error) {
    console.error('Error al actualizar client:', error);
    res.status(400).json({ error: 'Datos inválidos' });
  }
};

// Eliminar un client
exports.remove = async (req, res) => {
  try {
    const rows = await Client.destroy({ where: { id: req.params.id } });
    if (!rows) return res.status(404).json({ error: 'No encontrado' });
    res.status(204).end();
  } catch (error) {
    console.error('Error al eliminar client:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

