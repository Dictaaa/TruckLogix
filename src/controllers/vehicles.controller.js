const Vehicle = require('../models/vehicle.model');
const { Op, Sequelize } = require('sequelize');

exports.list = async (req, res) => {
  const vehicles = await Vehicle.findAll();
  res.json(vehicles);
};

exports.listByCompany = async (req, res) => {
  try {
    const { companyId } = req.params;

    const vehicles = await Vehicle.findAll({
      where: {
        company_id: companyId,
        active: true
      }
    });

    res.json(vehicles);
  } catch (error) {
    console.error('Error fetching vehicles by company:', error);
    res.status(500).json({ error: 'Error fetching vehicles' });
  }
};

exports.listUnassignedVehiclesByCompanyAndUser = async (req, res) => {
  try {
    const { companyId, userId } = req.params;

    const vehicles = await Vehicle.findAll({
      where: {
        company_id: companyId,
        active: true,
        id: {
          [Op.notIn]: Sequelize.literal(`(
            SELECT vehicle_id
            FROM vehicle_driver_assignments
            WHERE driver_id = ${userId}
              AND active = 1
          )`)
        }
      }
    });

    res.json(vehicles);
  } catch (error) {
    console.error('Error fetching unassigned vehicles:', error);
    res.status(500).json({ error: 'Error fetching unassigned vehicles' });
  }
};

exports.create = async (req, res) => {
  try {
    if (req.body.plate) {
      const existing = await Vehicle.findOne({ 
        where: { plate: req.body.plate.trim().toUpperCase() } 
      });
      if (existing) {
        return res.status(409).json({ error: 'Ya existe un vehículo con esta placa' });
      }
    }
    const vehicle = await Vehicle.create({
      ...req.body,
      plate: req.body.plate?.trim().toUpperCase()
    });
    res.status(201).json(vehicle);
  } catch (error) {
    console.error('Error al crear vehículo:', error);
    res.status(400).json({ error: 'Datos inválidos o incompletos' });
  }
};

exports.update = async (req, res) => {
  try {
    if (req.body.plate) {
      const existing = await Vehicle.findOne({ 
        where: { plate: req.body.plate.trim().toUpperCase() } 
      });
      if (existing && existing.id !== Number(req.params.id)) {
        return res.status(409).json({ error: 'Ya existe un vehículo con esta placa' });
      }
    }
    const [rows] = await Vehicle.update({
      ...req.body,
      plate: req.body.plate?.trim().toUpperCase()
    }, { where: { id: req.params.id } });
    if (!rows) return res.status(404).json({ error: 'Not found' });
    const updated = await Vehicle.findByPk(req.params.id);
    res.json(updated);
  } catch (error) {
    console.error('Error al actualizar vehículo:', error);
    res.status(400).json({ error: 'Datos inválidos' });
  }
};

exports.getOne = async (req, res) => {
  const vehicle = await Vehicle.findByPk(req.params.id);
  if (!vehicle) return res.status(404).json({ error: 'Not found' });
  res.json(vehicle);
};

exports.remove = async (req, res) => {
  const rows = await Vehicle.destroy({ where: { id: req.params.id } });
  if (!rows) return res.status(404).json({ error: 'Not found' });
  res.status(204).end();
};
