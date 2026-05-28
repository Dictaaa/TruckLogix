const VehicleDriverAssignment = require('../models/vehicleDriverAssignment.model');
const Vehicle = require('../models/vehicle.model'); 
const Driver = require('../models/driver.model');
const User = require('../models/user.model');

exports.listAll = async (req, res) => {
  try {
    const assignments = await VehicleDriverAssignment.findAll({
      include: [
        { model: Vehicle, as: 'vehicle' },
        {
          model: Driver,
          as: 'driver',
          include: [{ model: User, as: 'user' }]
        }
      ]
    });
    res.json(assignments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error fetching vehicle-driver assignments' });
  }
};

exports.listByDriver = async (req, res) => {
  try {
    const { driverId } = req.params;
    const assignments = await VehicleDriverAssignment.findAll({
      where: { driver_id: driverId, active: true }, // solo activos
      include: [
        { model: Vehicle, as: 'vehicle' },
        {
          model: Driver,
          as: 'driver',
          include: [{ model: User, as: 'user' }]
        }
      ]
    });
    res.json(assignments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error fetching vehicles for driver' });
  }
};

// Opcional: crear asignación
exports.createOrReactivate = async (req, res) => {
  try {
    const { vehicle_id, driver_id, assigned_from } = req.body;

    const existing = await VehicleDriverAssignment.findOne({
      where: {
        vehicle_id,
        driver_id
      }
    });

    if (existing) {
      if (existing.active) {
        return res.status(400).json({ error: 'Ya existe una asignación activa con este conductor y vehículo.' });
      }

      // Reactivar registro
      existing.active = true;
      existing.assigned_from = assigned_from;
      existing.assigned_to = null;
      await existing.save();

      return res.json({ message: 'Asignación reactivada', assignment: existing });
    }

    // Crear nuevo si no existe ningún registro
    const newAssignment = await VehicleDriverAssignment.create({
      vehicle_id,
      driver_id,
      assigned_from
    });

    res.status(201).json({ message: 'Asignación creada', assignment: newAssignment });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear o reactivar asignación' });
  }
};


exports.deactivate = async (req, res) => {
  try {
    const { id } = req.params;

    const assignment = await VehicleDriverAssignment.findByPk(id);
    if (!assignment) {
      return res.status(404).json({ error: 'Asignación no encontrada' });
    }

    assignment.active = false;
    assignment.assigned_to = new Date(); 
    await assignment.save();

    res.json({ message: 'Asignación desactivada exitosamente', assignment });
  } catch (error) {
    console.error('Error al desactivar asignación:', error);
    res.status(500).json({ error: 'Error al desactivar asignación' });
  }
};

