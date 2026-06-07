const { Container } = require('../models');


// Listar todos los containers
exports.list = async (req, res) => {
  try {
    const containers = await Container.findAll();
    res.json(containers);
  } catch (error) {
    console.error('Error al listar containers:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

// Crear un nuevo container
exports.create = async (req, res) => {
  try {
    if (req.body.number) {
      const existing = await Container.findOne({ 
        where: { number: req.body.number.trim().toUpperCase() } 
      });
      if (existing) {
        return res.status(409).json({ error: 'Ya existe un contenedor con este número' });
      }
    }
    const container = await Container.create({
      ...req.body,
      number: req.body.number?.trim().toUpperCase()
    });
    res.status(201).json(container);
  } catch (error) {
    console.error('Error al crear container:', error);
    res.status(400).json({ error: 'Datos inválidos o incompletos' });
  }
};

exports.update = async (req, res) => {
  try {
    if (req.body.number) {
      const existing = await Container.findOne({ 
        where: { number: req.body.number.trim().toUpperCase() } 
      });
      if (existing && existing.id != Number(req.params.id)) {
        return res.status(409).json({ error: 'Ya existe un contenedor con este número' });
      }
    }
    const [rows] = await Container.update({
      ...req.body,
      number: req.body.number?.trim().toUpperCase()
    }, { where: { id: req.params.id } });
    if (!rows) return res.status(404).json({ error: 'No encontrado' });
    const updated = await Container.findByPk(req.params.id);
    res.json(updated);
  } catch (error) {
    console.error('Error al actualizar container:', error);
    res.status(400).json({ error: 'Datos inválidos' });
  }
};

exports.findOrCreate = async (req, res) => {
  try {
    const { number, container_size_id, user_id } = req.body;

    const [container, created] = await Container.findOrCreate({
      where: { number: number.trim().toUpperCase() },
      defaults: {
        number: number.trim().toUpperCase(),
        container_size_id: container_size_id || null,
        user_id: user_id || null,
        active: true
      }
    });

    res.status(created ? 201 : 200).json({ container, created });
  } catch (error) {
    console.error('Error en findOrCreate container:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

// Obtener un container por ID
exports.getOne = async (req, res) => {
  try {
    const container = await Container.findByPk(req.params.id);
    if (!container) return res.status(404).json({ error: 'No encontrado' });
    res.json(container);
  } catch (error) {
    console.error('Error al obtener container:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

// Eliminar un container
exports.remove = async (req, res) => {
  try {
    const rows = await Container.destroy({ where: { id: req.params.id } });
    if (!rows) return res.status(404).json({ error: 'No encontrado' });
    res.status(204).end();
  } catch (error) {
    console.error('Error al eliminar container:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

