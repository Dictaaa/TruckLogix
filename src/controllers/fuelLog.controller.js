// src/controllers/fuelLog.controller.js
const { FuelLog, Vehicle, Affiliate } = require('../models');
const { Op } = require('sequelize');

const include = [
    { model: Vehicle,   as: 'vehicle',   attributes: ['id', 'plate'], required: false },
    { model: Affiliate, as: 'affiliate', attributes: ['id', 'name'],  required: false },
];

// ─── CREAR ────────────────────────────────────────────────────────────────────
exports.createFuelLog = async (req, res) => {
    try {
        const { id: user_id, company_id } = req.user;

        // Validar km_final > km_initial
        if (Number(req.body.km_final) <= Number(req.body.km_initial)) {
            return res.status(400).json({ error: 'km_final debe ser mayor que km_initial' });
        }

        const log = await FuelLog.create({
            ...req.body,
            user_id,
            company_id,
        });

        res.status(201).json(log);
    } catch (error) {
        console.error('Error al crear registro de combustible:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

// ─── LISTAR (paginado + búsqueda) ─────────────────────────────────────────────
exports.getFuelLogs = async (req, res) => {
    try {
        const { company_id, role } = req.user;
        const {
            page   = 1,
            limit  = 10,
            search = '',
            sortBy = 'fuel_date',
            sortDir = 'DESC',
        } = req.query;

        const offset = (Number(page) - 1) * Number(limit);

        const columnMap = {
            fecha:           'fuel_date',
            kmInicial:       'km_initial',
            kmFinal:         'km_final',
            kmRecorrido:     'km_driven',
            galones:         'gallons',
            precioPorGalon:  'price_per_gallon',
            totalValor:      'total_value',
            afiliado:        'affiliate_id',
            placa:           'vehicle_id',
        };

        const sortCol = columnMap[sortBy] || 'fuel_date';
        const order   = [[sortCol, sortDir === 'asc' ? 'ASC' : 'DESC']];

        const where = { active: true };
        if (role === 3) {
            where.affiliate_id = company_id;
        } else {
            where.company_id = company_id;
        }

        if (search) {
            where[Op.or] = [
                { '$vehicle.plate$':    { [Op.like]: `%${search}%` } },
                { '$affiliate.name$':   { [Op.like]: `%${search}%` } },
                { observations:         { [Op.like]: `%${search}%` } },
            ];
        }

        const { count, rows } = await FuelLog.findAndCountAll({
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
        console.error('Error al listar combustible:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

// ─── OBTENER UNO ──────────────────────────────────────────────────────────────
exports.getFuelLogById = async (req, res) => {
    try {
        const { company_id } = req.user;
        const { id } = req.params;

        const log = await FuelLog.findOne({
            where: { id, company_id, active: true },
            include,
        });

        if (!log) return res.status(404).json({ error: 'Registro no encontrado' });

        res.json(log);
    } catch (error) {
        console.error('Error al obtener registro:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

// ─── ACTUALIZAR ───────────────────────────────────────────────────────────────
exports.updateFuelLog = async (req, res) => {
    try {
        const { company_id } = req.user;
        const { id } = req.params;

        if (req.body.km_final && req.body.km_initial) {
            if (Number(req.body.km_final) <= Number(req.body.km_initial)) {
                return res.status(400).json({ error: 'km_final debe ser mayor que km_initial' });
            }
        }

        const log = await FuelLog.findOne({ where: { id, company_id, active: true } });
        if (!log) return res.status(404).json({ error: 'Registro no encontrado' });

        await log.update(req.body);
        res.json(log);
    } catch (error) {
        console.error('Error al actualizar registro:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

// ─── ELIMINAR (soft delete) ───────────────────────────────────────────────────
exports.deleteFuelLog = async (req, res) => {
    try {
        const { company_id } = req.user;
        const { id } = req.params;

        const log = await FuelLog.findOne({ where: { id, company_id, active: true } });
        if (!log) return res.status(404).json({ error: 'Registro no encontrado' });

        await log.update({ active: false });
        res.json({ message: 'Registro eliminado correctamente' });
    } catch (error) {
        console.error('Error al eliminar registro:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};