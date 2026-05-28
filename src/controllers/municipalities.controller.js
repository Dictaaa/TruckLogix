// src/controllers/municipalities.controller.js
const Municipality = require('../models/municipality.model');
const Department = require('../models/department.model');

exports.list = async (req, res) => {
  const municipalities = await Municipality.findAll({ include: Department });
  res.json(municipalities);
};

exports.getByDepartment = async (req, res) => {
  const { department_id } = req.params;

  const municipalities = await Municipality.findAll({
    where: { department_id },
  });

  res.json(municipalities);
};


exports.create = async (req, res) => {
  const municipality = await Municipality.create(req.body);
  res.status(201).json(municipality);
};

exports.getOne = async (req, res) => {
  const municipality = await Municipality.findByPk(req.params.id, { include: Department });
  if (!municipality) return res.status(404).json({ error: 'Not found' });
  res.json(municipality);
};

exports.update = async (req, res) => {
  const [rows] = await Municipality.update(req.body, { where: { id: req.params.id } });
  if (!rows) return res.status(404).json({ error: 'Not found' });
  const updated = await Municipality.findByPk(req.params.id, { include: Department });
  res.json(updated);
};

exports.remove = async (req, res) => {
  const rows = await Municipality.destroy({ where: { id: req.params.id } });
  if (!rows) return res.status(404).json({ error: 'Not found' });
  res.status(204).end();
};
