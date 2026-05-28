const { Driver, User, Vehicle, Trip } = require('../models');

exports.createTrip = async (req, res) => {
  try {
    const { id: userId, company_id } = req.user; // Suponiendo que viene del JWT

    const newTrip = await Trip.create({
      ...req.body,
      creator_user_id: userId,
      company_id, // Asegura que la compañía del usuario quede ligada al viaje
    });

    res.status(201).json(newTrip);
  } catch (error) {
    console.error('Error al crear el viaje:', error);
    res.status(500).json({ error: 'Error al crear el viaje' });
  }
};

exports.getTripById = async (req, res) => {
  try {
    const { company_id } = req.user; // Viene del token
    const { id } = req.params;

    const trip = await Trip.findOne({
      where: { id, company_id, active: true },
      include: [
        {
          model: Driver,
          as: 'driver',
          include: [{ model: User, as: 'user' }],
        },
        {
          model: Vehicle,
          as: 'vehicle',
        }
      ],
    });

    if (!trip) {
      return res.status(404).json({ error: 'Viaje no encontrado' });
    }

    res.json(trip);
  } catch (error) {
    console.error('Error al obtener el viaje:', error);
    res.status(500).json({ error: 'Error al obtener el viaje' });
  }
};


exports.getTripsByCompany = async (req, res) => {
  try {
    const { company_id } = req.user; // Viene del token

    const trips = await Trip.findAll({ where: { company_id, active: true }, 
      include: [
    {
      model: Driver,
      as: 'driver',
      include: [{ model: User, as: 'user' }],
    },
    {
      model: Vehicle,
      as: 'vehicle',
    }
  ],
      order: [['created_at', 'DESC']] });

    res.json(trips);
  } catch (error) {
    console.error('Error al obtener los viajes:', error);
    res.status(500).json({ error: 'Error al obtener los viajes' });
  }
};

exports.updateTripById = async (req, res) => {
  try {
    const { company_id } = req.user;
    const { id } = req.params;

    const trip = await Trip.findOne({ where: { id, company_id } });

    if (!trip) {
      return res.status(404).json({ error: 'Viaje no encontrado' });
    }

    await trip.update(req.body);

    res.status(200).json(trip);
  } catch (error) {
    console.error('Error al actualizar el viaje:', error);
    res.status(500).json({ error: 'Error al actualizar el viaje' });
  }
};

exports.deleteTripById = async (req, res) => {
  try {
    const { company_id } = req.user;
    const { id } = req.params;

    const trip = await Trip.findOne({ where: { id, company_id } });

    if (!trip) {
      return res.status(404).json({ error: 'Viaje no encontrado' });
    }

    await trip.update({ active: 0 });

    res.json({ message: 'Viaje inactivado correctamente' });
  } catch (error) {
    console.error('Error al inactivar el viaje:', error);
    res.status(500).json({ error: 'Error al inactivar el viaje' });
  }
};


