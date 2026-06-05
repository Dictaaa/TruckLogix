const {
  Trip,
  Driver,
  Vehicle,
  Company,
  Container,
  Client,
  TransportCompany,
  Affiliate,
  TransportAssistant,
  ShippingLine,
  Patio,
  Operation,
  User
} = require('../models');

exports.createTrip = async (req, res) => {
  try {
    const { id: userId, company_id } = req.user; // Suponiendo que viene del JWT

    const newTrip = await Trip.create({
      ...req.body,
      user_id: userId,
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
  { model: Driver, as: 'driver' },
  { model: Vehicle, as: 'vehicle' },
  { model: Company, as: 'company' },
  { model: Container, as: 'container' },
  { model: TransportCompany, as: 'transportCompany' },
  { model: Client, as: 'client' },
  { model: Affiliate, as: 'affiliate' },
  { model: TransportAssistant, as: 'transportAssistant' },
  { model: ShippingLine, as: 'shippingLine' },
  { model: Patio, as: 'origin' },
    { model: Patio, as: 'destination' },
  { model: Operation, as: 'operation' }
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
  { model: Driver, as: 'driver' },
  { model: Vehicle, as: 'vehicle' },
  { model: Company, as: 'company' },
  { model: Container, as: 'container' },
  { model: Client, as: 'client' },
  { model: TransportCompany, as: 'transportCompany' },
  { model: Affiliate, as: 'affiliate' },
  { model: TransportAssistant, as: 'transportAssistant' },
  { model: ShippingLine, as: 'shippingLine' },
  { model: Patio, as: 'origin' },
  { model: Patio, as: 'destination' },
  { model: Operation, as: 'operation' }
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


