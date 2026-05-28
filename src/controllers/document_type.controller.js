// src/controllers/document_type.controller.js
const DocumentType = require('../models/document_type.model');

exports.list = async (req, res) => {
  const types = await DocumentType.findAll();
  res.json(types);
};

exports.create = async (req, res) => {
  const type = await DocumentType.create(req.body);
  res.status(201).json(type);
};

exports.getOne = async (req, res) => {
  const type = await DocumentType.findByPk(req.params.id);
  if (!type) return res.status(404).json({ error: 'Not found' });
  res.json(type);
};

exports.update = async (req, res) => {
  const [rows] = await DocumentType.update(req.body, {
    where: { id: req.params.id },
  });
  if (!rows) return res.status(404).json({ error: 'Not found' });
  const updated = await DocumentType.findByPk(req.params.id);
  res.json(updated);
};

exports.remove = async (req, res) => {
  const rows = await DocumentType.destroy({ where: { id: req.params.id } });
  if (!rows) return res.status(404).json({ error: 'Not found' });
  res.status(204).end();
};
