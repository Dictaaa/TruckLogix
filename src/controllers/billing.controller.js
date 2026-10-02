// src/controllers/billing.controller.js
const { Trip, Vehicle, Affiliate, Client, Container, BillingTempOrder, TripBillingEvent } = require('../models');
const { sequelize } = require('../config/db');
const { Op, fn, col } = require('sequelize');
const B = require('../services/billing.service');

// Roles que pueden gestionar facturación (1 Administrador, 2 Auxiliar)
const BILLING_ROLES = [1, 2];
// Roles que pueden consultar (el afiliado ve solo sus viajes, sin acciones)
const VIEW_ROLES = [1, 2, 3];

// Campos del viaje que usan las reglas
const BILLING_ATTRS = [
    'id', 'company_id', 'vehicle_id', 'container_id', 'affiliate_id', 'trip_date', 'freight_value',
    'billing_status', 'temp_order_id', 'purchase_order', 'invoice_number',
];

class HttpError extends Error {
    constructor(status, payload) {
        super(payload?.message || 'Error');
        this.status = status;
        this.payload = payload;
    }
}

const canBill = (req) => BILLING_ROLES.includes(Number(req.user?.role));
const canView = (req) => VIEW_ROLES.includes(Number(req.user?.role));
const isAffiliate = (req) => Number(req.user?.role) === 3;

/** Viajes visibles: el afiliado solo los suyos; los demás, los de su empresa */
const tripScope = (req) => isAffiliate(req)
    ? { affiliate_id: req.user.company_id, active: true }
    : { company_id: req.user.company_id, active: true };

const parseIds = (body) =>
    [...new Set((Array.isArray(body?.trip_ids) ? body.trip_ids : [])
        .map(Number).filter(n => Number.isInteger(n) && n > 0))];

// Para comparar OC/factura exactas sin que % o _ actúen como comodines
const escapeLike = (v) => String(v).replace(/[\\%_]/g, (m) => '\\' + m);

const todayCol = () => new Date(Date.now() - 5 * 3600000).toISOString().substring(0, 10);

const handleError = (res, error, label) => {
    if (error instanceof HttpError) return res.status(error.status).json(error.payload);
    console.error(`Error ${label}:`, error);
    return res.status(500).json({ error: 'Error del servidor' });
};

/** Carga y BLOQUEA los viajes seleccionados (evita que dos usuarios los modifiquen a la vez) */
const loadLocked = async (ids, company_id, transaction) => {
    if (!ids.length) throw new HttpError(400, { message: 'Selecciona al menos un viaje.' });
    if (ids.length > 2000) throw new HttpError(400, { message: 'Máximo 2.000 viajes por operación.' });

    const trips = await Trip.findAll({
        where: { id: { [Op.in]: ids }, company_id, active: true },
        attributes: BILLING_ATTRS,
        lock: transaction.LOCK.UPDATE,
        transaction,
    });

    if (trips.length !== ids.length) {
        const found = new Set(trips.map(t => t.id));
        const missing = ids.filter(id => !found.has(id));
        throw new HttpError(404, {
            message: `${missing.length} viaje(s) no existen o no pertenecen a tu empresa.`,
            missing,
        });
    }
    return trips;
};

/** Placas y códigos de OC temporal para mostrar en las alertas */
const buildCtx = async (trips, transaction) => {
    const vIds = [...new Set(trips.map(t => t.vehicle_id).filter(Boolean))];
    const tIds = [...new Set(trips.map(t => t.temp_order_id).filter(Boolean))];
    const cIds = [...new Set(trips.map(t => t.container_id).filter(Boolean))];
    const [vehicles, temps, containers] = await Promise.all([
        vIds.length ? Vehicle.findAll({ where: { id: vIds }, attributes: ['id', 'plate'], raw: true, transaction }) : [],
        tIds.length ? BillingTempOrder.findAll({ where: { id: tIds }, attributes: ['id', 'code'], raw: true, transaction }) : [],
        cIds.length ? Container.findAll({ where: { id: cIds }, attributes: ['id', 'number'], raw: true, transaction }) : [],
    ]);
    return {
        plates: Object.fromEntries(vehicles.map(v => [v.id, v.plate])),
        tempCodes: Object.fromEntries(temps.map(t => [t.id, t.code])),
        containers: Object.fromEntries(containers.map(c => [c.id, c.number])),
    };
};

/** Errores → 422 (no se puede). Advertencias sin confirmar → 409 (preguntar al usuario). */
const checkAnalysis = (analysis, confirm) => {
    if (analysis.errors.length) {
        throw new HttpError(422, {
            message: 'No se puede continuar. Revisa los viajes seleccionados.',
            errors: analysis.errors,
            warnings: analysis.warnings,
        });
    }
    if (analysis.warnings.length && !confirm) {
        throw new HttpError(409, {
            requiresConfirmation: true,
            message: 'Hay advertencias. ¿Deseas continuar?',
            warnings: analysis.warnings,
            target: analysis.target ?? null,
        });
    }
};

const warningDetail = (analysis) =>
    analysis.warnings.length ? `Confirmado con advertencias: ${analysis.warnings.map(w => w.code).join(', ')}` : null;

const logEvents = (trips, data, transaction) =>
    TripBillingEvent.bulkCreate(trips.map(t => ({
        trip_id: t.id,
        company_id: t.company_id,
        from_status: t.billing_status,
        ...data,
    })), { transaction });

// ═══════════════════════════════════════════════════════════════════════════
// LISTADO
// ═══════════════════════════════════════════════════════════════════════════

// GET /billing/trips
//   ?status=pendiente_oc_temporal,pendiente_oc   (uno o varios separados por coma)
//   &temp_order_id= &purchase_order= &invoice_number=
//   &fecha_desde= &fecha_hasta= &affiliate_id= &client_id= &vehicle_id= &container_id=
//   &search= &page= &limit= &sortBy= &sortDir=
//   &ids_only=1   → devuelve solo los ids que cumplen el filtro (para "seleccionar todos")
exports.getTrips = async (req, res) => {
    try {
        if (!canView(req)) return res.status(403).json({ error: 'Sin permiso' });
        const {
            page = 1, limit = 20, search = '', column = '', sortBy = 'fecha', sortDir = 'desc',
            status, temp_order_id, purchase_order, invoice_number,
            fecha_desde, fecha_hasta, affiliate_id, client_id, vehicle_id, container_id, ids_only,
        } = req.query;

        const where = tripScope(req);

        if (status) {
            const list = String(status).split(',').map(s => s.trim()).filter(s => B.STATUS_LABELS[s]);
            if (list.length) where.billing_status = { [Op.in]: list };
        }
        if (temp_order_id) where.temp_order_id = temp_order_id;
        if (purchase_order) where.purchase_order = { [Op.iLike]: `%${purchase_order}%` };
        if (invoice_number) where.invoice_number = { [Op.iLike]: `%${invoice_number}%` };
        if (affiliate_id && !isAffiliate(req)) where.affiliate_id = affiliate_id;
        if (client_id) where.client_id = client_id;
        if (vehicle_id) where.vehicle_id = vehicle_id;
        if (container_id) where.container_id = container_id;

        if (fecha_desde || fecha_hasta) {
            where.trip_date = {};
            if (fecha_desde) where.trip_date[Op.gte] = fecha_desde;
            if (fecha_hasta) where.trip_date[Op.lte] = fecha_hasta;
        }

        // Búsqueda: en una columna específica o en todas
        const SEARCH_COLUMNS = {
            placa: '$vehicle.plate$',
            contenedor: '$container.number$',
            afiliado: '$affiliate.name$',
            cliente: '$client.name$',
            ocTemporal: '$tempOrder.code$',
            ordenCompra: 'purchase_order',
            factura: 'invoice_number',
        };

        if (search) {
            const q = `%${search}%`;
            if (SEARCH_COLUMNS[column]) {
                where[SEARCH_COLUMNS[column]] = { [Op.iLike]: q };
            } else {
                where[Op.or] = Object.values(SEARCH_COLUMNS).map(path => ({ [path]: { [Op.iLike]: q } }));
            }
        }

        const include = [
            { model: Vehicle, as: 'vehicle', attributes: ['id', 'plate'], required: false },
            { model: Affiliate, as: 'affiliate', attributes: ['id', 'name'], required: false },
            { model: Client, as: 'client', attributes: ['id', 'name'], required: false },
            { model: Container, as: 'container', attributes: ['id', 'number'], required: false },
            { model: BillingTempOrder, as: 'tempOrder', attributes: ['id', 'code'], required: false },
        ];

        if (ids_only) {
            if (!canBill(req)) return res.status(403).json({ error: 'Sin permiso' });
            const rows = await Trip.findAll({
                where, include, attributes: ['id', 'freight_value'], subQuery: false, limit: 5000, raw: true,
            });
            return res.json({
                ids: rows.map(r => r.id),
                items: rows.map(r => ({ id: r.id, freight_value: Number(r.freight_value || 0) })),
                total: rows.length,
            });
        }

        const sortMap = {
            fecha: 'trip_date', flete: 'freight_value', estado: 'billing_status',
            ordenCompra: 'purchase_order', factura: 'invoice_number',
        };
        const order = [[sortMap[sortBy] || 'trip_date', String(sortDir).toLowerCase() === 'asc' ? 'ASC' : 'DESC'], ['id', 'DESC']];

        const { count, rows } = await Trip.findAndCountAll({
            where, include, order,
            limit: Number(limit),
            offset: (Number(page) - 1) * Number(limit),
            subQuery: false,
            distinct: true,
        });

        res.json({
            data: rows.map(t => ({
                ...t.toJSON(),
                billing_status_label: B.STATUS_LABELS[t.billing_status] ?? t.billing_status,
                temp_order_code: t.tempOrder?.code ?? null,
            })),
            total: count,
            page: Number(page),
            limit: Number(limit),
            totalPages: Math.ceil(count / Number(limit)),
        });
    } catch (error) {
        handleError(res, error, 'listando facturación');
    }
};

// GET /billing/summary?fecha_desde=&fecha_hasta=&affiliate_id=  → viajes y valor por estado
exports.getSummary = async (req, res) => {
    try {
        if (!canView(req)) return res.status(403).json({ error: 'Sin permiso' });
        const { fecha_desde, fecha_hasta, affiliate_id } = req.query;

        const where = tripScope(req);
        if (affiliate_id && !isAffiliate(req)) where.affiliate_id = affiliate_id;
        if (fecha_desde || fecha_hasta) {
            where.trip_date = {};
            if (fecha_desde) where.trip_date[Op.gte] = fecha_desde;
            if (fecha_hasta) where.trip_date[Op.lte] = fecha_hasta;
        }

        const rows = await Trip.findAll({
            where,
            attributes: ['billing_status', [fn('COUNT', col('id')), 'trips'], [fn('SUM', col('freight_value')), 'value']],
            group: ['billing_status'],
            raw: true,
        });

        const byStatus = Object.keys(B.STATUS_LABELS).map(s => {
            const r = rows.find(x => x.billing_status === s);
            return { status: s, label: B.STATUS_LABELS[s], trips: Number(r?.trips || 0), value: Number(r?.value || 0) };
        });

        res.json({ byStatus });
    } catch (error) {
        handleError(res, error, 'resumen facturación');
    }
};

// GET /billing/temp-orders?pending=1  → OC temporales con # viajes, valor y OCs asignadas
exports.getTempOrders = async (req, res) => {
    try {
        if (!canView(req)) return res.status(403).json({ error: 'Sin permiso' });
        const scope = tripScope(req);

        // El afiliado solo ve las OC temporales que contienen viajes suyos
        const tempWhere = { active: true };
        if (isAffiliate(req)) {
            const used = await Trip.findAll({
                where: { ...scope, temp_order_id: { [Op.ne]: null } },
                attributes: ['temp_order_id'], group: ['temp_order_id'], raw: true,
            });
            tempWhere.id = { [Op.in]: used.map(u => u.temp_order_id) };
        } else {
            tempWhere.company_id = req.user.company_id;
        }

        const temps = await BillingTempOrder.findAll({
            where: tempWhere,
            order: [['id', 'DESC']],
            limit: 500,
            raw: true,
        });
        if (!temps.length) return res.json([]);

        const stats = await Trip.findAll({
            where: { ...scope, temp_order_id: { [Op.in]: temps.map(t => t.id) } },
            attributes: [
                'temp_order_id', 'billing_status',
                [fn('COUNT', col('id')), 'trips'],
                [fn('SUM', col('freight_value')), 'value'],
            ],
            group: ['temp_order_id', 'billing_status'],
            raw: true,
        });

        const pos = await Trip.findAll({
            where: { ...scope, temp_order_id: { [Op.in]: temps.map(t => t.id) }, purchase_order: { [Op.ne]: null } },
            attributes: ['temp_order_id', 'purchase_order'],
            group: ['temp_order_id', 'purchase_order'],
            raw: true,
        });

        let result = temps.map(t => {
            const s = stats.filter(x => x.temp_order_id === t.id);
            const byStatus = Object.fromEntries(s.map(x => [x.billing_status, Number(x.trips)]));
            return {
                ...t,
                trips: s.reduce((a, x) => a + Number(x.trips), 0),
                value: s.reduce((a, x) => a + Number(x.value || 0), 0),
                pending_oc: byStatus[B.STATUS.PEND_OC] || 0,
                by_status: byStatus,
                purchase_orders: pos.filter(p => p.temp_order_id === t.id).map(p => p.purchase_order),
            };
        }).filter(t => t.trips > 0);

        if (req.query.pending) result = result.filter(t => t.pending_oc > 0);

        res.json(result);
    } catch (error) {
        handleError(res, error, 'listando OC temporales');
    }
};

// GET /billing/trips/:id/history
exports.getTripHistory = async (req, res) => {
    try {
        if (!canView(req)) return res.status(403).json({ error: 'Sin permiso' });
        // Verifica que el viaje sea visible para este usuario
        const trip = await Trip.findOne({ where: { id: req.params.id, ...tripScope(req) }, attributes: ['id'] });
        if (!trip) return res.status(404).json({ error: 'Viaje no encontrado' });

        const events = await TripBillingEvent.findAll({
            where: { trip_id: trip.id },
            include: [{ model: BillingTempOrder, as: 'tempOrder', attributes: ['id', 'code'], required: false }],
            order: [['created_at', 'DESC'], ['id', 'DESC']],
        });
        res.json(events.map(e => ({
            ...e.toJSON(),
            from_label: B.STATUS_LABELS[e.from_status] ?? e.from_status,
            to_label: B.STATUS_LABELS[e.to_status] ?? e.to_status,
        })));
    } catch (error) {
        handleError(res, error, 'historial facturación');
    }
};

// ═══════════════════════════════════════════════════════════════════════════
// ACCIONES
// Body común: { trip_ids: number[], confirm?: boolean }
// Respuestas: 200 ok | 409 { requiresConfirmation, warnings } | 422 { errors } | 404 | 403
// ═══════════════════════════════════════════════════════════════════════════

// POST /billing/temp-orders  { trip_ids, notes?, confirm? }
exports.createTempOrder = async (req, res) => {
    try {
        if (!canBill(req)) return res.status(403).json({ error: 'Sin permiso' });
        const { id: user_id, company_id } = req.user;
        const ids = parseIds(req.body);

        const result = await sequelize.transaction(async (transaction) => {
            const trips = await loadLocked(ids, company_id, transaction);
            const ctx = await buildCtx(trips, transaction);
            const analysis = B.analyzeTempOrder(trips, ctx);
            checkAnalysis(analysis, !!req.body.confirm);

            const temp = await BillingTempOrder.create(
                { company_id, user_id, notes: B.clean(req.body.notes) || null },
                { transaction }
            );
            const code = B.tempCode(temp.id);
            await temp.update({ code }, { transaction });

            const now = new Date();
            await Trip.update(
                { temp_order_id: temp.id, temp_order_at: now, billing_status: B.STATUS.PEND_OC },
                { where: { id: { [Op.in]: ids } }, transaction }
            );

            await logEvents(trips, {
                action: 'temp_order',
                to_status: B.STATUS.PEND_OC,
                temp_order_id: temp.id,
                detail: warningDetail(analysis),
                user_id,
            }, transaction);

            return { temp_order_id: temp.id, code, trips: ids.length };
        });

        res.status(201).json({ ...result, message: `Se generó ${result.code} con ${result.trips} viaje(s).` });
    } catch (error) {
        handleError(res, error, 'generando OC temporal');
    }
};

// POST /billing/purchase-orders  { trip_ids, purchase_order, temp_order_id?, confirm? }
exports.assignPurchaseOrder = async (req, res) => {
    try {
        if (!canBill(req)) return res.status(403).json({ error: 'Sin permiso' });
        const { id: user_id, company_id } = req.user;
        const ids = parseIds(req.body);
        const po = B.clean(req.body.purchase_order);
        const chosenTemp = req.body.temp_order_id ? Number(req.body.temp_order_id) : null;

        const result = await sequelize.transaction(async (transaction) => {
            const trips = await loadLocked(ids, company_id, transaction);
            const ctx = await buildCtx(trips, transaction);

            let tempOrderExists = false;
            if (chosenTemp) {
                const temp = await BillingTempOrder.findOne({
                    where: { id: chosenTemp, company_id, active: true }, attributes: ['id', 'code'], transaction, raw: true,
                });
                tempOrderExists = !!temp;
                if (temp) ctx.tempCodes[temp.id] = temp.code;
            }

            const duplicateCount = po ? await Trip.count({
                where: {
                    company_id, active: true,
                    id: { [Op.notIn]: ids },
                    purchase_order: { [Op.iLike]: escapeLike(po) },
                },
                transaction,
            }) : 0;

            const analysis = B.analyzePurchaseOrder(trips, po, { tempOrderId: chosenTemp, tempOrderExists, duplicateCount }, ctx);
            checkAnalysis(analysis, !!req.body.confirm);

            const now = new Date();
            let targetTempId = analysis.target.temp_order_id;
            let targetCode = analysis.target.temp_order_code;

            // Ninguno tenía OC temporal → se genera una para el grupo
            if (analysis.target.create_temp_order) {
                const temp = await BillingTempOrder.create(
                    { company_id, user_id, notes: `Generada al asignar OC ${po}` },
                    { transaction }
                );
                targetCode = B.tempCode(temp.id);
                await temp.update({ code: targetCode }, { transaction });
                targetTempId = temp.id;
            }

            // Unifica la OC temporal de los que no la tenían o la tenían diferente
            const toRetemp = trips.filter(t => Number(t.temp_order_id) !== Number(targetTempId)).map(t => t.id);
            if (toRetemp.length) {
                await Trip.update(
                    { temp_order_id: targetTempId, temp_order_at: now },
                    { where: { id: { [Op.in]: toRetemp } }, transaction }
                );
            }

            await Trip.update(
                { purchase_order: po, purchase_order_at: now, billing_status: B.STATUS.PEND_FACT },
                { where: { id: { [Op.in]: ids } }, transaction }
            );

            await logEvents(trips, {
                action: 'purchase_order',
                to_status: B.STATUS.PEND_FACT,
                temp_order_id: targetTempId,
                purchase_order: po,
                detail: warningDetail(analysis),
                user_id,
            }, transaction);

            return { purchase_order: po, temp_order_id: targetTempId, temp_order_code: targetCode, trips: ids.length, retemp: toRetemp.length };
        });

        res.json({
            ...result,
            message: `Orden de compra ${result.purchase_order} asignada a ${result.trips} viaje(s)` +
                (result.retemp ? ` (${result.retemp} quedaron con ${result.temp_order_code}).` : '.'),
        });
    } catch (error) {
        handleError(res, error, 'asignando orden de compra');
    }
};

// POST /billing/invoices  { trip_ids, invoice_number, invoice_date?, confirm? }
exports.assignInvoice = async (req, res) => {
    try {
        if (!canBill(req)) return res.status(403).json({ error: 'Sin permiso' });
        const { id: user_id, company_id } = req.user;
        const ids = parseIds(req.body);
        const inv = B.clean(req.body.invoice_number);
        const invoiceDate = /^\d{4}-\d{2}-\d{2}$/.test(String(req.body.invoice_date || '')) ? req.body.invoice_date : todayCol();

        const result = await sequelize.transaction(async (transaction) => {
            const trips = await loadLocked(ids, company_id, transaction);
            const ctx = await buildCtx(trips, transaction);

            const duplicateCount = inv ? await Trip.count({
                where: {
                    company_id, active: true,
                    id: { [Op.notIn]: ids },
                    invoice_number: { [Op.iLike]: escapeLike(inv) },
                },
                transaction,
            }) : 0;

            const analysis = B.analyzeInvoice(trips, inv, { duplicateCount }, ctx);
            checkAnalysis(analysis, !!req.body.confirm);

            await Trip.update(
                { invoice_number: inv, invoice_date: invoiceDate, invoice_at: new Date(), billing_status: B.STATUS.FACTURADO },
                { where: { id: { [Op.in]: ids } }, transaction }
            );

            await logEvents(trips, {
                action: 'invoice',
                to_status: B.STATUS.FACTURADO,
                invoice_number: inv,
                detail: warningDetail(analysis),
                user_id,
            }, transaction);

            return { invoice_number: inv, invoice_date: invoiceDate, trips: ids.length };
        });

        res.json({ ...result, message: `Factura ${result.invoice_number} asignada a ${result.trips} viaje(s).` });
    } catch (error) {
        handleError(res, error, 'asignando factura');
    }
};

// POST /billing/revert  { trip_ids, step: 'invoice' | 'purchase_order' | 'temp_order', reason }
// Solo administrador. Quita un paso para corregir errores (queda en el historial).
exports.revert = async (req, res) => {
    try {
        if (Number(req.user.role) !== 1) return res.status(403).json({ error: 'Solo el administrador puede revertir' });
        const { id: user_id, company_id } = req.user;
        const ids = parseIds(req.body);
        const step = req.body.step;
        const reason = B.clean(req.body.reason);
        if (!reason) return res.status(400).json({ message: 'Indica el motivo de la reversión.' });

        const result = await sequelize.transaction(async (transaction) => {
            const trips = await loadLocked(ids, company_id, transaction);
            const ctx = await buildCtx(trips, transaction);
            const analysis = B.analyzeRevert(trips, step, ctx);
            checkAnalysis(analysis, true);

            const cfg = B.REVERT_STEPS[step];
            for (const t of trips) {
                const next = { ...t.get({ plain: true }), ...cfg.fields };
                const to = B.computeStatus(next);
                await Trip.update({ ...cfg.fields, billing_status: to }, { where: { id: t.id }, transaction });
                await TripBillingEvent.create({
                    trip_id: t.id,
                    company_id: t.company_id,
                    action: `revert_${step}`,
                    from_status: t.billing_status,
                    to_status: to,
                    temp_order_id: t.temp_order_id,
                    purchase_order: t.purchase_order,
                    invoice_number: t.invoice_number,
                    detail: reason.substring(0, 255),
                    user_id,
                }, { transaction });
            }
            return { trips: trips.length };
        });

        res.json({ ...result, message: `Se revirtió el paso en ${result.trips} viaje(s).` });
    } catch (error) {
        handleError(res, error, 'revirtiendo facturación');
    }
};