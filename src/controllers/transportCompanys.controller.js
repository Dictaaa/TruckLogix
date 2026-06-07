const { TransportCompany } = require('../models');


// Listar todos los transport companies
exports.list = async (req, res) => {
  try {
    const transportCompanies = await TransportCompany.findAll();
    res.json(transportCompanies);
  } catch (error) {
    console.error('Error al listar transport companies:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

// Crear un nuevo transport company
exports.create = async (req, res) => {
  try {
    if (req.body.nit) {
      const existing = await TransportCompany.findOne({ where: { nit: req.body.nit } });
      if (existing) {
        return res.status(409).json({ error: 'Ya existe una empresa con este NIT' });
      }
    }
    const transportCompany = await TransportCompany.create(req.body);
    res.status(201).json(transportCompany);
  } catch (error) {
    console.error('Error al crear transport company:', error);
    res.status(400).json({ error: 'Datos inválidos o incompletos' });
  }
};

exports.update = async (req, res) => {
  try {
    if (req.body.nit) {
      const existing = await TransportCompany.findOne({ where: { nit: req.body.nit } });
      if (existing && existing.id !== Number(req.params.id)) {
        return res.status(409).json({ error: 'Ya existe una empresa con este NIT' });
      }
    }
    const [rows] = await TransportCompany.update(req.body, { where: { id: req.params.id } });
    if (!rows) return res.status(404).json({ error: 'No encontrado' });
    const updated = await TransportCompany.findByPk(req.params.id);
    res.json(updated);
  } catch (error) {
    console.error('Error al actualizar transport company:', error);
    res.status(400).json({ error: 'Datos inválidos' });
  }
};

// Obtener un transport company por ID
exports.getOne = async (req, res) => {
  try {
    const transportCompany = await TransportCompany.findByPk(req.params.id);
    if (!transportCompany) return res.status(404).json({ error: 'No encontrado' });
    res.json(transportCompany);
  } catch (error) {
    console.error('Error al obtener transport company:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

// Eliminar un transport company
exports.remove = async (req, res) => {
  try {
    const rows = await TransportCompany.destroy({ where: { id: req.params.id } });
    if (!rows) return res.status(404).json({ error: 'No encontrado' });
    res.status(204).end();
  } catch (error) {
    console.error('Error al eliminar transport company:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

