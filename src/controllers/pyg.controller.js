const { PygParameter, Vehicle } = require('../models');
const { buildPyg, resolveParams, loadParams, FIELDS } = require('../services/pyg.service');

const todayCol = () => new Date(Date.now() - 5 * 3600000).toISOString().substring(0, 10);

// ─── GET /dashboard/pyg?year=2026&month=3&affiliate_id= ──────────────────────
exports.getPyg = async (req, res) => {
    try {
        const { company_id, role } = req.user;
        if (role === 4) return res.status(403).json({ error: 'Sin permiso' });

        const now   = new Date(Date.now() - 5 * 3600000);
        const year  = Number(req.query.year)  || now.getUTCFullYear();
        const month = Number(req.query.month) || now.getUTCMonth() + 1;
        if (month < 1 || month > 12) return res.status(400).json({ error: 'Mes inválido' });

        const data = await buildPyg({
            role,
            company_id,
            affiliate_id: role === 3 ? null : req.query.affiliate_id,
            year,
            month,
        });
        res.json(data);
    } catch (error) {
        console.error('Error PYG:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

// ─── PARÁMETROS (maestro, solo administrador) ────────────────────────────────
const onlyAdmin = (req, res) => {
    if (req.user.role !== 1) {
        res.status(403).json({ error: 'Solo el administrador puede gestionar los parámetros del PYG' });
        return false;
    }
    return true;
};

/** Toma del body solo los campos del PYG. Vacío → NULL (hereda). */
const pickValues = (body) => {
    const values = {};
    FIELDS.forEach(f => {
        const v = body[f];
        let n = v === '' || v === null || v === undefined ? null : Number(v);
        if (n !== null && (isNaN(n) || n < 0)) n = null;
        values[f] = n;
    });
    return values;
};

const validate = async (body, values) => {
    if (!body.valid_from) return 'La fecha de vigencia es obligatoria';
    if (!Object.values(values).some(v => v !== null)) return 'Ingresa al menos un valor';
    if (values.commission_pct !== null && values.commission_pct > 100) return 'La comisión no puede ser mayor a 100%';
    if (body.vehicle_id) {
        const vehicle = await Vehicle.findByPk(body.vehicle_id, { attributes: ['id'] });
        if (!vehicle) return 'Vehículo no encontrado';
    }
    return null;
};

// GET /pyg-parameters  → todas las versiones de la empresa
exports.listParameters = async (req, res) => {
    try {
        if (!onlyAdmin(req, res)) return;
        const where = { company_id: req.user.company_id, active: true };
        if (req.query.vehicle_id === 'general') where.vehicle_id = null;
        else if (req.query.vehicle_id) where.vehicle_id = req.query.vehicle_id;

        const rows = await PygParameter.findAll({
            where,
            include: [{ model: Vehicle, as: 'vehicle', attributes: ['id', 'plate'], required: false }],
            order: [['valid_from', 'DESC'], ['id', 'DESC']],
        });
        res.json(rows);
    } catch (error) {
        console.error('Error parámetros PYG:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

// GET /pyg-parameters/resolved?vehicle_id=&date=  → valores que aplican a esa fecha
exports.getResolved = async (req, res) => {
    try {
        if (!onlyAdmin(req, res)) return;
        const { company_id } = req.user;
        const date = req.query.date || todayCol();
        const vehicleId = req.query.vehicle_id ? Number(req.query.vehicle_id) : null;

        const params = await loadParams([company_id], date);
        res.json({ date, ...resolveParams(params, company_id, vehicleId) });
    } catch (error) {
        console.error('Error parámetros PYG:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

// POST /pyg-parameters  → nueva versión
exports.createParameters = async (req, res) => {
    try {
        if (!onlyAdmin(req, res)) return;
        const { id: user_id, company_id } = req.user;
        const values = pickValues(req.body);
        const err = await validate(req.body, values);
        if (err) return res.status(400).json({ error: err });

        const record = await PygParameter.create({
            company_id,
            vehicle_id: req.body.vehicle_id || null,
            valid_from: req.body.valid_from,
            notes: req.body.notes || null,
            user_id,
            ...values,
        });
        res.status(201).json(record);
    } catch (error) {
        console.error('Error creando parámetros PYG:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

// PUT /pyg-parameters/:id  → corregir una versión (ojo: recalcula los meses donde aplica)
exports.updateParameters = async (req, res) => {
    try {
        if (!onlyAdmin(req, res)) return;
        const record = await PygParameter.findOne({
            where: { id: req.params.id, company_id: req.user.company_id, active: true },
        });
        if (!record) return res.status(404).json({ error: 'Registro no encontrado' });

        const values = pickValues(req.body);
        const err = await validate(req.body, values);
        if (err) return res.status(400).json({ error: err });

        await record.update({
            vehicle_id: req.body.vehicle_id || null,
            valid_from: req.body.valid_from,
            notes: req.body.notes || null,
            user_id: req.user.id,
            ...values,
        });
        res.json(record);
    } catch (error) {
        console.error('Error actualizando parámetros PYG:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

// DELETE /pyg-parameters/:id  → desactiva la versión
exports.deleteParameters = async (req, res) => {
    try {
        if (!onlyAdmin(req, res)) return;
        const record = await PygParameter.findOne({
            where: { id: req.params.id, company_id: req.user.company_id, active: true },
        });
        if (!record) return res.status(404).json({ error: 'Registro no encontrado' });
        await record.update({ active: false });
        res.json({ message: 'Versión eliminada' });
    } catch (error) {
        console.error('Error eliminando parámetros PYG:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};