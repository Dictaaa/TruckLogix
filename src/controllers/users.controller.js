const User = require('../models/user.model');

exports.list = async (req, res) => {
  const Users = await User.findAll();
  res.json(Users);
};

exports.create = async (req, res) => {
  const user = await User.create(req.body);
  res.status(201).json(user);
};

exports.getOne = async (req, res) => {
  const user = await User.findByPk(req.params.id);
  if (!user) return res.status(404).json({ error: 'Not found' });
  res.json(user);
};

exports.update = async (req, res) => {
  const [rows] = await User.update(req.body, { where: { id: req.params.id } });
  if (!rows) return res.status(404).json({ error: 'Not found' });
  const updated = await User.findByPk(req.params.id);
  res.json(updated);
};

exports.remove = async (req, res) => {
  const rows = await User.destroy({ where: { id: req.params.id } });
  if (!rows) return res.status(404).json({ error: 'Not found' });
  res.status(204).end();
};
