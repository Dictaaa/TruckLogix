const { VehicleDowntime, VehicleDowntimeStatus, Vehicle, Affiliate, Maintenance, Trip } = require('../models');
const { Op } = require('sequelize');

const include = [
    { model: Vehicle,               as: 'vehicle',     attributes: ['id', 'plate'],  required: false },
    { model: Affiliate,             as: 'affiliate',   attributes: ['id', 'name'],   required: false },
    { model: VehicleDowntimeStatus, as: 'status',      attributes: ['id', 'name'],   required: false },
    { model: Maintenance,           as: 'maintenance', attributes: ['id', 'entry_date', 'exit_date', 'operation_detail'], required: false },
];

// ─── HELPER: fechas colombianas ───────────────────────────────────────────────
const toColombiaDateStr = (date) => {
    const offset = -5 * 60;
    const local  = new Date(date.getTime() + offset * 60000);
    return local.toISOString().substring(0, 10);
};

// Genera array de fechas entre dos fechas inclusive
const dateRange = (from, to) => {
    const dates = [];
    const cur   = new Date(from + 'T12:00:00');
    const end   = new Date(to   + 'T12:00:00');
    while (cur <= end) {
        dates.push(cur.toISOString().substring(0, 10));
        cur.setDate(cur.getDate() + 1);
    }
    return dates;
};

// ─── LISTAR REGISTROS GUARDADOS ───────────────────────────────────────────────
exports.getDowntimes = async (req, res) => {
    try {
        const { company_id, role } = req.user;
        const {
            page    = 1,
            limit   = 20,
            search  = '',
            sortBy  = 'downtime_date',
            sortDir = 'DESC',
            vehicle_id, affiliate_id, status_id,
            fecha_desde, fecha_hasta,
        } = req.query;

        const offset = (Number(page) - 1) * Number(limit);

        const columnMap = {
            fecha:     'downtime_date',
            placa:     'vehicle_id',
            afiliado:  'affiliate_id',
            estado:    'status_id',
        };
        const sortCol = columnMap[sortBy] || 'downtime_date';
        const order   = [[sortCol, sortDir === 'asc' ? 'ASC' : 'DESC']];

        const where = { active: true };
        if (role === 3) {
            where.affiliate_id = company_id;
        } else {
            where.company_id = company_id;
        }

        if (vehicle_id)   where.vehicle_id   = vehicle_id;
        if (affiliate_id) where.affiliate_id = affiliate_id;
        if (status_id)    where.status_id    = status_id;

        if (fecha_desde || fecha_hasta) {
            where.downtime_date = {};
            if (fecha_desde) where.downtime_date[Op.gte] = fecha_desde;
            if (fecha_hasta) where.downtime_date[Op.lte] = fecha_hasta;
        }

        if (search) {
            where[Op.or] = [
                { '$vehicle.plate$':   { [Op.like]: `%${search}%` } },
                { '$affiliate.name$':  { [Op.like]: `%${search}%` } },
                { '$status.name$':     { [Op.like]: `%${search}%` } },
                { observations:        { [Op.like]: `%${search}%` } },
            ];
        }

        const { count, rows } = await VehicleDowntime.findAndCountAll({
            where, include, order,
            limit: Number(limit), offset,
            subQuery: false, distinct: true,
        });

        res.json({
            data:       rows,
            total:      count,
            page:       Number(page),
            limit:      Number(limit),
            totalPages: Math.ceil(count / Number(limit)),
        });
    } catch (error) {
        console.error('Error al listar downtime:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

// ─── DETECTAR DÍAS SIN VIAJES (sugerencias) ───────────────────────────────────
exports.getSuggestions = async (req, res) => {
    try {
        const { company_id, role } = req.user;
        const { fecha_desde, fecha_hasta } = req.query;

        if (!fecha_desde || !fecha_hasta) {
            return res.status(400).json({ error: 'Se requiere fecha_desde y fecha_hasta' });
        }

        // 1. Todos los vehículos activos de la empresa
        const vehicleWhere = { active: true };
        if (role === 3) vehicleWhere.company_id = company_id; // afiliado ve sus placas
        else            vehicleWhere.company_id = company_id; // admin ve todas

        const vehicles = await Vehicle.findAll({
            where: vehicleWhere,
            include: [{ model: Affiliate, as: 'affiliate', attributes: ['id', 'name'], required: false }],
            attributes: ['id', 'plate', 'company_id'],
        });

        // 2. Todos los viajes en el rango
        const tripWhere = {
            active:    true,
            trip_date: { [Op.between]: [fecha_desde, fecha_hasta] },
        };
        if (role === 3) tripWhere.affiliate_id = company_id;
        else            tripWhere.company_id   = company_id;

        const trips = await Trip.findAll({
            where:      tripWhere,
            attributes: ['vehicle_id', 'trip_date'],
        });

        // Set de "vehicle_id|fecha" con viajes
        const workedDays = new Set(
            trips.map(t => `${t.vehicle_id}|${t.trip_date.toString().substring(0, 10)}`)
        );

        // 3. Registros de downtime ya guardados en ese rango
        const savedWhere = {
            company_id,
            active:        true,
            downtime_date: { [Op.between]: [fecha_desde, fecha_hasta] },
        };
        const saved = await VehicleDowntime.findAll({
            where:      savedWhere,
            attributes: ['vehicle_id', 'downtime_date'],
        });
        const savedDays = new Set(
            saved.map(s => `${s.vehicle_id}|${s.downtime_date.toString().substring(0, 10)}`)
        );

        // 4. Mantenimientos en el rango para auto-sugerir estado taller
        const maintenances = await Maintenance.findAll({
            where: {
                company_id,
                active:      true,
                entry_date:  { [Op.lte]: fecha_hasta },
                [Op.or]: [
                    { exit_date: null },
                    { exit_date: { [Op.gte]: fecha_desde } },
                ],
            },
            attributes: ['id', 'vehicle_id', 'entry_date', 'exit_date'],
        });

        // Map vehicle_id → mantenimientos
        const maintenanceMap = {};
        maintenances.forEach(m => {
            if (!maintenanceMap[m.vehicle_id]) maintenanceMap[m.vehicle_id] = [];
            maintenanceMap[m.vehicle_id].push(m);
        });

        // 5. Generar sugerencias
        const allDates = dateRange(fecha_desde, fecha_hasta);
        const suggestions = [];

        vehicles.forEach(v => {
            allDates.forEach(date => {
                const key = `${v.id}|${date}`;
                // Solo días sin viaje y sin registro guardado
                if (!workedDays.has(key) && !savedDays.has(key)) {
                    // ¿Estaba en taller?
                    const mtto = (maintenanceMap[v.id] || []).find(m => {
                        const entry = m.entry_date.toString().substring(0, 10);
                        const exit  = m.exit_date  ? m.exit_date.toString().substring(0, 10) : fecha_hasta;
                        return date >= entry && date <= exit;
                    });

                    suggestions.push({
                        vehicle_id:     v.id,
                        plate:          v.plate,
                        affiliate_id:   v.company_id,
                        affiliate_name: v.affiliate?.name || '',
                        downtime_date:  date,
                        maintenance_id: mtto?.id || null,
                        suggested_status: mtto ? 'taller' : null, // hint para el front
                    });
                }
            });
        });

        // Ordenar por fecha asc, luego placa
        suggestions.sort((a, b) =>
            a.downtime_date.localeCompare(b.downtime_date) ||
            a.plate.localeCompare(b.plate)
        );

        res.json({ suggestions, total: suggestions.length });
    } catch (error) {
        console.error('Error al obtener sugerencias:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

// ─── CREAR (soporta rango → genera N registros) ───────────────────────────────
exports.createDowntime = async (req, res) => {
    try {
        const { id: user_id, company_id } = req.user;
        const { vehicle_id, status_id, observations, maintenance_id,
                date_from, date_to, affiliate_id } = req.body;

        if (!vehicle_id || !date_from || !status_id) {
            return res.status(400).json({ error: 'vehicle_id, date_from y status_id son obligatorios' });
        }

        const dates  = dateRange(date_from, date_to || date_from);
        const created = [];
        const skipped = [];

        for (const date of dates) {
            try {
                const record = await VehicleDowntime.create({
                    company_id,
                    vehicle_id,
                    affiliate_id:   affiliate_id || null,
                    status_id,
                    maintenance_id: maintenance_id || null,
                    downtime_date:  date,
                    observations:   observations || null,
                    user_id,
                });
                created.push(record);
            } catch (e) {
                // Si viola el UNIQUE(vehicle_id, downtime_date) lo saltamos
                if (e.name === 'SequelizeUniqueConstraintError') {
                    skipped.push(date);
                } else {
                    throw e;
                }
            }
        }

        res.status(201).json({
            created: created.length,
            skipped: skipped.length,
            skippedDates: skipped,
            message: skipped.length
                ? `${created.length} registros creados. ${skipped.length} fechas ya existían y fueron omitidas.`
                : `${created.length} registros creados correctamente.`,
        });
    } catch (error) {
        console.error('Error al crear downtime:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

// ─── CREAR DESDE SUGERENCIA (un solo registro) ────────────────────────────────
exports.createFromSuggestion = async (req, res) => {
    try {
        const { id: user_id, company_id } = req.user;
        const { vehicle_id, affiliate_id, downtime_date,
                status_id, maintenance_id, observations } = req.body;

        if (!vehicle_id || !downtime_date || !status_id) {
            return res.status(400).json({ error: 'vehicle_id, downtime_date y status_id son obligatorios' });
        }

        const record = await VehicleDowntime.create({
            company_id,
            vehicle_id,
            affiliate_id:   affiliate_id || null,
            status_id,
            maintenance_id: maintenance_id || null,
            downtime_date,
            observations:   observations || null,
            user_id,
        });

        res.status(201).json(record);
    } catch (error) {
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(409).json({ error: 'Ya existe un registro para esa placa y fecha' });
        }
        console.error('Error al crear desde sugerencia:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

// ─── ACTUALIZAR ───────────────────────────────────────────────────────────────
exports.updateDowntime = async (req, res) => {
    try {
        const { company_id } = req.user;
        const { id } = req.params;

        const record = await VehicleDowntime.findOne({ where: { id, company_id, active: true } });
        if (!record) return res.status(404).json({ error: 'Registro no encontrado' });

        await record.update({
            status_id:      req.body.status_id      ?? record.status_id,
            observations:   req.body.observations   ?? record.observations,
            maintenance_id: req.body.maintenance_id ?? record.maintenance_id,
        });

        res.json(record);
    } catch (error) {
        console.error('Error al actualizar downtime:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

// ─── ELIMINAR ─────────────────────────────────────────────────────────────────
exports.deleteDowntime = async (req, res) => {
    try {
        const { company_id } = req.user;
        const { id } = req.params;

        const record = await VehicleDowntime.findOne({ where: { id, company_id, active: true } });
        if (!record) return res.status(404).json({ error: 'Registro no encontrado' });

        await record.update({ active: false });
        res.json({ message: 'Registro eliminado correctamente' });
    } catch (error) {
        console.error('Error al eliminar downtime:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

// ─── MAESTRO: ESTADOS ─────────────────────────────────────────────────────────
exports.getStatuses = async (req, res) => {
    try {
        const { company_id } = req.user;
        const statuses = await VehicleDowntimeStatus.findAll({
            where: { company_id, active: true },
            order: [['name', 'ASC']],
        });
        res.json(statuses);
    } catch (error) {
        res.status(500).json({ error: 'Error del servidor' });
    }
};

exports.createStatus = async (req, res) => {
    try {
        const { company_id } = req.user;
        if (!req.body.name?.trim()) {
            return res.status(400).json({ error: 'El nombre es obligatorio' });
        }
        const status = await VehicleDowntimeStatus.create({
            name: req.body.name.trim(),
            company_id,
        });
        res.status(201).json(status);
    } catch (error) {
        res.status(500).json({ error: 'Error del servidor' });
    }
};

exports.updateStatus = async (req, res) => {
    try {
        const { company_id } = req.user;
        const { id } = req.params;
        const status = await VehicleDowntimeStatus.findOne({ where: { id, company_id, active: true } });
        if (!status) return res.status(404).json({ error: 'Estado no encontrado' });
        await status.update({ name: req.body.name?.trim() || status.name });
        res.json(status);
    } catch (error) {
        res.status(500).json({ error: 'Error del servidor' });
    }
};

exports.deleteStatus = async (req, res) => {
    try {
        const { company_id } = req.user;
        const { id } = req.params;
        const status = await VehicleDowntimeStatus.findOne({ where: { id, company_id, active: true } });
        if (!status) return res.status(404).json({ error: 'Estado no encontrado' });
        await status.update({ active: false });
        res.json({ message: 'Estado eliminado' });
    } catch (error) {
        res.status(500).json({ error: 'Error del servidor' });
    }
};