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

const { Op } = require('sequelize');

exports.getTripsByCompany = async (req, res) => {
  try {
    const { company_id, role } = req.user;
    const {
      page = 1, limit = 10, search = '', column = '',
      fecha_desde, fecha_hasta, estado,
      afiliado, linea, conductor, placa,
      empresa_transporte, auxiliar, contenedor,
      origen, destino, cliente, operacion,
    } = req.query;

    const offset = (Number(page) - 1) * Number(limit);

    // Filtro base por rol
    let where = { active: true };
    if (role === 3) {
      where.affiliate_id = company_id;
    } else {
      where.company_id = company_id;
    }

    // Búsqueda global — filtra en columnas del trip
    // (búsqueda en relaciones se hace post-query en el frontend
    //  o con subconsultas — aquí filtramos las columnas directas)
    if (search) {
      const searchOp = { [Op.like]: `%${search}%` };
      if (column) {
        // Filtro por columna específica si viene
        where[column] = searchOp;
      } else {
        // Búsqueda global en columnas directas del trip
        where[Op.or] = [
          { '$container.number$': { [Op.like]: `%${search}%` } },
          { '$vehicle.plate$': { [Op.like]: `%${search}%` } },
          { '$driver.name$': { [Op.like]: `%${search}%` } },
          { '$affiliate.name$': { [Op.like]: `%${search}%` } },
          { '$transportCompany.name$': { [Op.like]: `%${search}%` } },
          { '$shippingLine.name$': { [Op.like]: `%${search}%` } },
          { '$client.name$': { [Op.like]: `%${search}%` } },
          { '$operation.name$': { [Op.like]: `%${search}%` } },
          { client_status: { [Op.like]: `%${search}%` } },
          { work_status: { [Op.like]: `%${search}%` } },
          { observations: { [Op.like]: `%${search}%` } },
        ];
      }
    }

    // Filtros por ID (vienen del panel)
    if (afiliado) where.affiliate_id = afiliado;
    if (conductor) where.driver_id = conductor;
    if (empresa_transporte) where.transport_company_id = empresa_transporte;
    if (auxiliar) where.transport_assistant_id = auxiliar;
    if (cliente) where.client_id = cliente;
    if (operacion) where.operation_id = operacion;
    if (origen) where.origin_id = origen;
    if (destino) where.destination_id = destino;
    if (linea) where.shipping_line_id = linea;
    if (placa) where.vehicle_id = placa;
    if (contenedor) where.container_id = contenedor;

    if (fecha_desde || fecha_hasta) {
      where.trip_date = {};
      if (fecha_desde) where.trip_date[Op.gte] = fecha_desde;
      if (fecha_hasta) where.trip_date[Op.lte] = fecha_hasta;
    }

    if (estado) where.client_status = estado;

    const include = [
      { model: Driver, as: 'driver', required: false },
      { model: Vehicle, as: 'vehicle', required: false },
      { model: Company, as: 'company', required: false },
      { model: Container, as: 'container', required: false },
      { model: Client, as: 'client', required: false },
      { model: TransportCompany, as: 'transportCompany', required: false },
      { model: Affiliate, as: 'affiliate', required: false },
      { model: TransportAssistant, as: 'transportAssistant', required: false },
      { model: ShippingLine, as: 'shippingLine', required: false },
      { model: Patio, as: 'origin', required: false },
      { model: Patio, as: 'destination', required: false },
      { model: Operation, as: 'operation', required: false },
    ];

    const columnMap = {
      fecha: 'trip_date',
      empresaTransporte: 'transport_company_id',
      placa: 'vehicle_id',
      contenedor: 'container_id',
      cliente: 'client_id',
      linea: 'shipping_line_id',
      origen: 'origin_id',
      destino: 'destination_id',
      operacion: 'operation_id',
      conductor: 'driver_id',
      estado: 'client_status',
      flete: 'freight_value',
      afiliado: 'affiliate_id',
      auxiliarTransporte: 'transport_assistant_id',
      transporteComida: 'transport_food_value',
      observacion: 'observations',
    };

    const sortDir = req.query.sortDir === 'asc' ? 'ASC' : 'DESC';
    const sortCol = columnMap[req.query.sortBy] || 'trip_date';
    const order = [[sortCol, sortDir]];

    const { count, rows } = await Trip.findAndCountAll({
      where,
      include,
      order,
      limit: Number(limit),
      offset,
      subQuery: false, // necesario para búsquedas en relaciones con limit
      distinct: true,
    });

    res.json({
      data: rows,
      total: count,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(count / Number(limit)),
    });
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

exports.getProductionByAffiliate = async (req, res) => {
  try {
    const { company_id, role } = req.user;
    const { year = new Date().getFullYear(), affiliate_id } = req.query;

    let where = { active: true };

    if (role === 3) {
      // Afiliado: siempre ve solo lo suyo
      where.affiliate_id = company_id;
    } else {
      // Admin: filtra por company_id de la empresa
      where.company_id = company_id;
      // Si admin seleccionó un afiliado específico
      if (affiliate_id) where.affiliate_id = affiliate_id;
    }

    const trips = await Trip.findAll({
      where,
      include: [
        { model: Vehicle, as: 'vehicle', attributes: ['plate'] },
        { model: Affiliate, as: 'affiliate', attributes: ['id', 'name'] },
      ],
      attributes: ['id', 'trip_date', 'freight_value', 'affiliate_id', 'vehicle_id'],
    });

    const filtered = trips.filter(t => {
      if (!t.trip_date) return false;
      return new Date(t.trip_date).getFullYear() === Number(year);
    });

    const result = {};

    filtered.forEach((trip) => {
      const affiliateName = trip.affiliate?.name ?? 'Sin afiliado';
      const plate = trip.vehicle?.plate ?? 'Sin placa';
      const month = new Date(trip.trip_date).getMonth() + 1;
      const value = Number(trip.freight_value || 0);

      if (!result[affiliateName]) result[affiliateName] = {};
      if (!result[affiliateName][plate]) {
        result[affiliateName][plate] = { months: {}, total: 0 };
      }

      result[affiliateName][plate].months[month] =
        (result[affiliateName][plate].months[month] || 0) + value;
      result[affiliateName][plate].total += value;
    });

    res.json(result);
  } catch (error) {
    console.error('Error producción afiliados:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
};