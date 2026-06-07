const { TransportAssistant } = require('../models');


// Listar todos los patios
exports.list = async (req, res) => {
  try {
    const transportAssistant = await TransportAssistant.findAll();
    res.json(transportAssistant);
  } catch (error) {
    console.error('Error al listar transport assistants:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

// Crear un nuevo transport assistant
exports.create = async (req, res) => {
  try {
    if (req.body.document_number) {
      const existing = await TransportAssistant.findOne({ where: { document_number: req.body.document_number } });
      if (existing) {
        return res.status(409).json({ error: 'Ya existe un auxiliar con este documento' });
      }
    }
    const transportAssistant = await TransportAssistant.create(req.body);
    res.status(201).json(transportAssistant);
  } catch (error) {
    console.error('Error al crear transport assistant:', error);
    res.status(400).json({ error: 'Datos inválidos o incompletos' });
  }
};

exports.update = async (req, res) => {
  try {
    if (req.body.document_number) {
      const existing = await TransportAssistant.findOne({ where: { document_number: req.body.document_number } });
      if (existing && existing.id !== Number(req.params.id)) {
        return res.status(409).json({ error: 'Ya existe un auxiliar con este documento' });
      }
    }
    const [rows] = await TransportAssistant.update(req.body, { where: { id: req.params.id } });
    if (!rows) return res.status(404).json({ error: 'No encontrado' });
    const updated = await TransportAssistant.findByPk(req.params.id);
    res.json(updated);
  } catch (error) {
    console.error('Error al actualizar transport assistant:', error);
    res.status(400).json({ error: 'Datos inválidos' });
  }
};

// Obtener un transport assistant por ID
exports.getOne = async (req, res) => {
  try {
    const transportAssistant = await TransportAssistant.findByPk(req.params.id);
    if (!transportAssistant) return res.status(404).json({ error: 'No encontrado' });
    res.json(transportAssistant);
  } catch (error) {
    console.error('Error al obtener transport assistant:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

// Eliminar un transport assistant
exports.remove = async (req, res) => {
  try {
    const rows = await TransportAssistant.destroy({ where: { id: req.params.id } });
    if (!rows) return res.status(404).json({ error: 'No encontrado' });
    res.status(204).end();
  } catch (error) {
    console.error('Error al eliminar transport assistant:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

