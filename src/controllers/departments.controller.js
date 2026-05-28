// src/controllers/departments.controller.js
const Department = require('../models/department.model');

exports.list = async (req, res) => {
  const departments = await Department.findAll();
  res.json(departments);
};

exports.create = async (req, res) => {
  const department = await Department.create(req.body);
  res.status(201).json(department);
};

exports.getOne = async (req, res) => {
  const department = await Department.findByPk(req.params.id);
  if (!department) return res.status(404).json({ error: 'Not found' });
  res.json(department);
};

exports.update = async (req, res) => {
  const [rows] = await Department.update(req.body, { where: { id: req.params.id } });
  if (!rows) return res.status(404).json({ error: 'Not found' });
  const updated = await Department.findByPk(req.params.id);
  res.json(updated);
};

exports.remove = async (req, res) => {
  const rows = await Department.destroy({ where: { id: req.params.id } });
  if (!rows) return res.status(404).json({ error: 'Not found' });
  res.status(204).end();
};
