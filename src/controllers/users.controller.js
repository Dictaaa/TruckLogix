const User = require('../models/user.model');
const bcrypt = require('bcryptjs');
const { Affiliate } = require('../models'); // si está en models/index

exports.list = async (req, res) => {
  try {
    const users = await User.findAll();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Error del servidor' });
  }
};

exports.create = async (req, res) => {
  try {
    // Email único
    if (req.body.email) {
      const existing = await User.findOne({ where: { email: req.body.email } });
      if (existing) return res.status(409).json({ error: 'Ya existe un usuario con este email' });
    }
    // Documento único
    if (req.body.document_number) {
      const existing = await User.findOne({ where: { document_number: req.body.document_number } });
      if (existing) return res.status(409).json({ error: 'Ya existe un usuario con este documento' });
    }
    // Si no viene clave, usar documento como password
    if (!req.body.password) {
      req.body.password = req.body.document_number;
    }
    const user = await User.create(req.body);
    res.status(201).json(user);
  } catch (error) {
    console.error('Error al crear usuario:', error);
    res.status(400).json({ error: 'Datos inválidos o incompletos' });
  }
};

exports.update = async (req, res) => {
  try {
    if (req.body.email) {
      const existing = await User.findOne({ where: { email: req.body.email } });
      if (existing && existing.id != Number(req.params.id)) {
        return res.status(409).json({ error: 'Ya existe un usuario con este email' });
      }
    }
    if (req.body.document_number) {
      const existing = await User.findOne({ where: { document_number: req.body.document_number } });
      if (existing && existing.id != Number(req.params.id)) {
        return res.status(409).json({ error: 'Ya existe un usuario con este documento' });
      }
    }
    // Si viene password vacío, no actualizar
    if (req.body.password == '' || req.body.password == null) {
      delete req.body.password;
    }
    const [rows] = await User.update(req.body, { where: { id: req.params.id } });
    if (!rows) return res.status(404).json({ error: 'Not found' });
    const updated = await User.findByPk(req.params.id);
    res.json(updated);
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    res.status(400).json({ error: 'Datos inválidos' });
  }
};

exports.remove = async (req, res) => {
  try {
    const rows = await User.destroy({ where: { id: req.params.id } });
    if (!rows) return res.status(404).json({ error: 'Not found' });
    res.status(204).end();
  } catch (error) {
    res.status(500).json({ error: 'Error del servidor' });
  }
};