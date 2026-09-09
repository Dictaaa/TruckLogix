const { Maintenance, Vehicle, Affiliate, VehicleBrand, MaintenanceType, TrailerPlate } = require('../models');
const { Op } = require('sequelize');

const include = [
    { model: Vehicle,         as: 'vehicle',         attributes: ['id', 'plate'],  required: false },
    { model: Affiliate,       as: 'affiliate',       attributes: ['id', 'name'],   required: false },
    { model: VehicleBrand,    as: 'brand',           attributes: ['id', 'name'],   required: false },
    { model: MaintenanceType, as: 'maintenanceType', attributes: ['id', 'name'],   required: false },
    { model: TrailerPlate,    as: 'trailerPlate',    attributes: ['id', 'plate'],  required: false },
];

// ─── CREAR ────────────────────────────────────────────────────────────────────
exports.createMaintenance = async (req, res) => {
    try {
        const { id: user_id, company_id } = req.user;

        // Auto-completar affiliate_id desde vehicles.company_id
        let { affiliate_id, vehicle_id } = req.body;
        if (vehicle_id && !affiliate_id) {
            const vehicle = await Vehicle.findByPk(vehicle_id, { attributes: ['company_id'] });
            if (vehicle?.company_id) affiliate_id = vehicle.company_id;
        }

        const record = await Maintenance.create({
            ...req.body,
            affiliate_id,
            user_id,
            company_id,
        });

        res.status(201).json(record);
    } catch (error) {
        console.error('Error al crear mantenimiento:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

// ─── LISTAR ───────────────────────────────────────────────────────────────────
exports.getMaintenances = async (req, res) => {
    try {
        const { company_id, role } = req.user;
        const {
            page    = 1,
            limit   = 10,
            search  = '',
            sortBy  = 'entry_date',
            sortDir = 'DESC',
            vehicle_id, affiliate_id, brand_id,
            maintenance_type_id, trailer_plate_id,
            fecha_desde, fecha_hasta,
        } = req.query;

        const offset = (Number(page) - 1) * Number(limit);

        const columnMap = {
            fechaIngreso:  'entry_date',
            fechaSalida:   'exit_date',
            placa:         'vehicle_id',
            afiliado:      'affiliate_id',
            marca:         'brand_id',
            tipoMtto:      'maintenance_type_id',
            placaTrailer:  'trailer_plate_id',
            costoManoObra: 'labor_cost',
            costoRepuesto: 'parts_cost',
            totalCosto:    'total_cost',
        };

        const sortCol = columnMap[sortBy] || 'entry_date';
        const order   = [[sortCol, sortDir === 'asc' ? 'ASC' : 'DESC']];

        const where = { active: true };
        if (role === 3) {
            where.affiliate_id = company_id;
        } else {
            where.company_id = company_id;
        }

        if (vehicle_id)          where.vehicle_id          = vehicle_id;
        if (affiliate_id)        where.affiliate_id        = affiliate_id;
        if (brand_id)            where.brand_id            = brand_id;
        if (maintenance_type_id) where.maintenance_type_id = maintenance_type_id;
        if (trailer_plate_id)    where.trailer_plate_id    = trailer_plate_id;

        if (fecha_desde || fecha_hasta) {
            where.entry_date = {};
            if (fecha_desde) where.entry_date[Op.gte] = fecha_desde;
            if (fecha_hasta) where.entry_date[Op.lte] = fecha_hasta;
        }

        if (search) {
            where[Op.or] = [
                { '$vehicle.plate$':        { [Op.like]: `%${search}%` } },
                { '$affiliate.name$':       { [Op.like]: `%${search}%` } },
                { '$brand.name$':           { [Op.like]: `%${search}%` } },
                { '$maintenanceType.name$': { [Op.like]: `%${search}%` } },
                { '$trailerPlate.plate$':   { [Op.like]: `%${search}%` } },
                { operation_detail:         { [Op.like]: `%${search}%` } },
            ];
        }

        const { count, rows } = await Maintenance.findAndCountAll({
            where,
            include,
            order,
            limit:    Number(limit),
            offset,
            subQuery: false,
            distinct: true,
        });

        res.json({
            data:       rows,
            total:      count,
            page:       Number(page),
            limit:      Number(limit),
            totalPages: Math.ceil(count / Number(limit)),
        });
    } catch (error) {
        console.error('Error al listar mantenimientos:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

// ─── OBTENER UNO ──────────────────────────────────────────────────────────────
exports.getMaintenanceById = async (req, res) => {
    try {
        const { company_id } = req.user;
        const { id } = req.params;

        const record = await Maintenance.findOne({
            where: { id, company_id, active: true },
            include,
        });

        if (!record) return res.status(404).json({ error: 'Registro no encontrado' });
        res.json(record);
    } catch (error) {
        console.error('Error al obtener mantenimiento:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

// ─── ACTUALIZAR ───────────────────────────────────────────────────────────────
exports.updateMaintenance = async (req, res) => {
    try {
        const { company_id } = req.user;
        const { id } = req.params;

        const record = await Maintenance.findOne({ where: { id, company_id, active: true } });
        if (!record) return res.status(404).json({ error: 'Registro no encontrado' });

        // Auto-completar afiliado si cambia el vehículo
        if (req.body.vehicle_id && !req.body.affiliate_id) {
            const vehicle = await Vehicle.findByPk(req.body.vehicle_id, { attributes: ['company_id'] });
            if (vehicle?.company_id) req.body.affiliate_id = vehicle.company_id;
        }

        await record.update(req.body);
        res.json(record);
    } catch (error) {
        console.error('Error al actualizar mantenimiento:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

// ─── ELIMINAR ─────────────────────────────────────────────────────────────────
exports.deleteMaintenance = async (req, res) => {
    try {
        const { company_id } = req.user;
        const { id } = req.params;

        const record = await Maintenance.findOne({ where: { id, company_id, active: true } });
        if (!record) return res.status(404).json({ error: 'Registro no encontrado' });

        await record.update({ active: false });
        res.json({ message: 'Registro eliminado correctamente' });
    } catch (error) {
        console.error('Error al eliminar mantenimiento:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

// ─── MAESTRO: MARCAS ──────────────────────────────────────────────────────────
exports.getBrands = async (req, res) => {
    try {
        const { company_id } = req.user;
        const brands = await VehicleBrand.findAll({
            where: { company_id, active: true },
            order: [['name', 'ASC']],
        });
        res.json(brands);
    } catch (error) {
        res.status(500).json({ error: 'Error del servidor' });
    }
};

exports.createBrand = async (req, res) => {
    try {
        const { company_id } = req.user;
        const brand = await VehicleBrand.create({ ...req.body, company_id });
        res.status(201).json(brand);
    } catch (error) {
        res.status(500).json({ error: 'Error del servidor' });
    }
};

// ─── MAESTRO: TIPOS DE MTTO ───────────────────────────────────────────────────
exports.getMaintenanceTypes = async (req, res) => {
    try {
        const { company_id } = req.user;
        const types = await MaintenanceType.findAll({
            where: { company_id, active: true },
            order: [['name', 'ASC']],
        });
        res.json(types);
    } catch (error) {
        res.status(500).json({ error: 'Error del servidor' });
    }
};

exports.createMaintenanceType = async (req, res) => {
    try {
        const { company_id } = req.user;
        const type = await MaintenanceType.create({ ...req.body, company_id });
        res.status(201).json(type);
    } catch (error) {
        res.status(500).json({ error: 'Error del servidor' });
    }
};

// ─── MAESTRO: PLACAS TRAILER ──────────────────────────────────────────────────
exports.getTrailerPlates = async (req, res) => {
    try {
        const { company_id } = req.user;
        const plates = await TrailerPlate.findAll({
            where: { company_id, active: true },
            order: [['plate', 'ASC']],
        });
        res.json(plates);
    } catch (error) {
        res.status(500).json({ error: 'Error del servidor' });
    }
};

exports.createTrailerPlate = async (req, res) => {
    try {
        const { company_id } = req.user;
        const plate = await TrailerPlate.create({ ...req.body, company_id });
        res.status(201).json(plate);
    } catch (error) {
        res.status(500).json({ error: 'Error del servidor' });
    }
};