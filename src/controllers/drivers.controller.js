const { Driver, User, VehicleDriverAssignment, Vehicle } = require('../models');


// Listar todos los conductores con información del usuario
exports.list = async (req, res) => {
  try {
    const drivers = await Driver.findAll();
    res.json(drivers);
  } catch (error) {
    console.error('Error al listar conductores:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

// Crear un nuevo conductor
exports.create = async (req, res) => {
  try {
    if (req.body.document) {
      const existing = await Driver.findOne({ where: { document: req.body.document } });
      if (existing) {
        return res.status(409).json({ error: 'Ya existe un conductor con este documento' });
      }
    }
    const driver = await Driver.create(req.body);
    res.status(201).json(driver);
  } catch (error) {
    console.error('Error al crear conductor:', error);
    res.status(400).json({ error: 'Datos inválidos o incompletos' });
  }
};

exports.update = async (req, res) => {
  try {
    if (req.body.document) {
      const existing = await Driver.findOne({ where: { document: req.body.document } });
      if (existing && existing.id !== Number(req.params.id)) {
        return res.status(409).json({ error: 'Ya existe un conductor con este documento' });
      }
    }
    const [rows] = await Driver.update(req.body, { where: { id: req.params.id } });
    if (!rows) return res.status(404).json({ error: 'No encontrado' });
    const updated = await Driver.findByPk(req.params.id);
    res.json(updated);
  } catch (error) {
    console.error('Error al actualizar conductor:', error);
    res.status(400).json({ error: 'Datos inválidos' });
  }
};

// Obtener un conductor por ID
exports.getOne = async (req, res) => {
  try {
    const driver = await Driver.findByPk(req.params.id);
    if (!driver) return res.status(404).json({ error: 'No encontrado' });
    res.json(driver);
  } catch (error) {
    console.error('Error al obtener conductor:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

// Eliminar un conductor
exports.remove = async (req, res) => {
  try {
    const rows = await Driver.destroy({ where: { id: req.params.id } });
    if (!rows) return res.status(404).json({ error: 'No encontrado' });
    res.status(204).end();
  } catch (error) {
    console.error('Error al eliminar conductor:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

// Listar conductores por compañía
exports.listByCompany = async (req, res) => {
  try {
    const { companyId } = req.params;
    const drivers = await Driver.findAll();
    res.json(drivers);
  } catch (error) {
    console.error('Error al listar conductores por compañía:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

// Listar conductores por compañía con su vehiculo
exports.listDriverWithVehiclesByCompany = async (req, res) => {
  try {
    const { companyId } = req.params;
    const { driver_id } = req.query;

    const whereDriver = {};
    if (driver_id) {
      whereDriver.id = driver_id;
    }

    const drivers = await Driver.findAll({
      where: whereDriver,
      include: [
        {
          model: VehicleDriverAssignment,
          as: 'assignments',
          where: { active: true },
          required: false, 
          include: [
            {
              model: Vehicle,
              as: 'vehicle',
              attributes: ['id', 'license_plate', 'model', 'brand']
            }
          ]
        }
      ]
    });
    res.json(drivers);
  } catch (error) {
    console.error('Error al listar conductores por compañía:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
};
