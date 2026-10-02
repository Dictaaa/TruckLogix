const { Trip, Vehicle, Affiliate, FuelLog, Maintenance, MaintenanceType, PygParameter, Operation } = require('../models');
const { Op } = require('sequelize');

// ─── PARÁMETROS ───────────────────────────────────────────────────────────────
const FIELDS = [
    'salary', 'commission_pct', 'social_security', 'satellite', 'insurance', 'affiliation', 'parking',
    'soat', 'tecnomecanica', 'dotacion', 'dotacion_times', 'annual_maintenance',
];

// Si no hay ningún parámetro cargado
const DEFAULTS = {
    salary: 0, commission_pct: 10, social_security: 0, satellite: 0, insurance: 0, affiliation: 0, parking: 0,
    soat: 0, tecnomecanica: 0, dotacion: 0, dotacion_times: 3, annual_maintenance: 0,
};

// Líneas de costo en el orden del PYG
const COST_LINES = [
    { key: 'laborales',        label: 'Laborales operativos' },
    { key: 'satelital',        label: 'Satelital' },
    { key: 'seguridad_social', label: 'Seguridad social' },
    { key: 'mantenimiento',    label: 'Mantenimiento y reparaciones' },
    { key: 'seguro',           label: 'Seguro todo riesgo' },
    { key: 'afiliacion',       label: 'Afiliación' },
    { key: 'lavado',           label: 'Lavado y engrase' },
    { key: 'combustible',      label: 'Combustibles' },
    { key: 'llantas',          label: 'Llantas' },
    { key: 'movilizacion',     label: 'Movilización (transporte y comida)' },
    { key: 'parqueadero',      label: 'Parqueadero' },
];

const pad = (n) => String(n).padStart(2, '0');
const monthStart = (y, m) => `${y}-${pad(m)}-01`;
const nextMonthStart = (y, m) => (m === 12 ? `${y + 1}-01-01` : `${y}-${pad(m + 1)}-01`);
const monthLastDay = (y, m) => new Date(Date.UTC(y, m, 0)).toISOString().substring(0, 10);
const num = (v) => Number(v || 0);
const pct = (part, whole) => (whole > 0 ? Math.round((part / whole) * 1000) / 10 : null);

const normalize = (s) => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();

/** Viajes regionales: al conductor se le paga directo, no llevan el % de comisión */
const isRegionalTrip = (trip) => normalize(trip.operation?.name).includes('REGIONAL');

const buildScope = (role, company_id, affiliate_id) => {
    const where = { active: true };
    if (role === 3) {
        where.affiliate_id = company_id;
    } else {
        where.company_id = company_id;
        if (affiliate_id) where.affiliate_id = affiliate_id;
    }
    return where;
};

/**
 * Resuelve los parámetros vigentes campo por campo.
 * `params` debe venir ordenado por valid_from DESC, id DESC y ya filtrado a valid_from <= fecha.
 * Prioridad: valor propio de la placa → valor general → default.
 */
const resolveParams = (params, companyId, vehicleId) => {
    // Normaliza tipos: el token puede traer ids como texto y PostgreSQL los devuelve como número
    const cid = Number(companyId);
    const vid = vehicleId ? Number(vehicleId) : null;
    const values = {};
    const source = {};
    for (const f of FIELDS) {
        let hit = null;
        let src = 'default';
        if (vid) {
            hit = params.find(p => Number(p.company_id) === cid && Number(p.vehicle_id) === vid && p[f] != null);
            if (hit) src = 'vehicle';
        }
        if (!hit) {
            hit = params.find(p => Number(p.company_id) === cid && p.vehicle_id == null && p[f] != null);
            if (hit) src = 'general';
        }
        values[f] = hit ? Number(hit[f]) : DEFAULTS[f];
        source[f] = src;
    }
    return { values, source };
};

const loadParams = (companyIds, untilDate) =>
    PygParameter.findAll({
        where: { company_id: { [Op.in]: companyIds.map(Number) }, active: true, valid_from: { [Op.lte]: untilDate } },
        order: [['valid_from', 'DESC'], ['id', 'DESC']],
        raw: true,
    });

// ─── PYG DEL MES ──────────────────────────────────────────────────────────────
const buildPyg = async ({ role, company_id, affiliate_id, year, month }) => {
    const range = { [Op.gte]: monthStart(year, month), [Op.lt]: nextMonthStart(year, month) };
    const scope = buildScope(role, company_id, affiliate_id);

    const vehicleInc   = { model: Vehicle,   as: 'vehicle',   attributes: ['id', 'plate'], required: false };
    const affiliateInc = { model: Affiliate, as: 'affiliate', attributes: ['id', 'name'],  required: false };

    const [trips, fuels, mttos] = await Promise.all([
        Trip.findAll({
            where: { ...scope, trip_date: range },
            attributes: ['id', 'company_id', 'vehicle_id', 'affiliate_id', 'freight_value', 'transport_food_value'],
            include: [
                vehicleInc, affiliateInc,
                { model: Operation, as: 'operation', attributes: ['id', 'name'], required: false },
            ],
        }),
        FuelLog.findAll({
            where: { ...scope, fuel_date: range },
            attributes: ['id', 'company_id', 'vehicle_id', 'affiliate_id', 'total_value'],
            include: [vehicleInc, affiliateInc],
        }),
        Maintenance.findAll({
            where: { ...scope, entry_date: range },
            attributes: ['id', 'company_id', 'vehicle_id', 'affiliate_id', 'labor_cost', 'parts_cost', 'total_cost'],
            include: [
                vehicleInc, affiliateInc,
                { model: MaintenanceType, as: 'maintenanceType', attributes: ['id', 'name'], required: false },
            ],
        }),
    ]);

    // Una fila por placa con actividad en el mes
    const rows = {};
    const rowFor = (r) => {
        const vid = r.vehicle_id ?? 0;
        if (!rows[vid]) {
            rows[vid] = {
                vehicleId: vid,
                plate: r.vehicle?.plate ?? 'Sin placa',
                companyId: r.company_id,
                affiliateId: r.affiliate_id ?? 0,
                affiliateName: r.affiliate?.name ?? 'Sin afiliado',
                trips: 0,
                facturacion: 0,
                facturacionComisionable: 0,   // facturación de viajes NO regionales
                regionalTrips: 0,
                regionalBilling: 0,
                movilizacion: 0,
                combustible: 0,
                mantenimiento: 0,
                llantas: 0,
                lavado: 0,
            };
        }
        return rows[vid];
    };

    trips.forEach(t => {
        const r = rowFor(t);
        const flete = num(t.freight_value);
        r.trips++;
        r.facturacion += flete;
        if (isRegionalTrip(t)) {
            r.regionalTrips++;
            r.regionalBilling += flete;
        } else {
            r.facturacionComisionable += flete;
        }
        r.movilizacion += num(t.transport_food_value);
    });

    fuels.forEach(f => { rowFor(f).combustible += num(f.total_value); });

    mttos.forEach(m => {
        const r = rowFor(m);
        const cost = m.total_cost != null ? num(m.total_cost) : num(m.labor_cost) + num(m.parts_cost);
        const type = normalize(m.maintenanceType?.name);
        if (type.includes('LLANTA')) r.llantas += cost;
        else if (type.includes('LAVADO') || type.includes('ENGRASE')) r.lavado += cost;
        else r.mantenimiento += cost;
    });

    const rowList = Object.values(rows);
    const companyIds = [...new Set(rowList.map(r => r.companyId).filter(Boolean))];
    const params = companyIds.length ? await loadParams(companyIds, monthLastDay(year, month)) : [];

    // Calcula cada placa
    const vehicles = rowList.map(r => {
        const hasVehicle = r.vehicleId !== 0; // "Sin placa" no lleva costos fijos
        const { values: p, source } = hasVehicle
            ? resolveParams(params, r.companyId, r.vehicleId)
            : { values: { ...DEFAULTS, commission_pct: 0, dotacion_times: 0 }, source: {} };

        // La comisión solo aplica a viajes no regionales
        const commission = hasVehicle ? r.facturacionComisionable * (p.commission_pct / 100) : 0;

        const lines = {
            laborales:        hasVehicle ? p.salary + commission : 0,
            satelital:        hasVehicle ? p.satellite : 0,
            seguridad_social: hasVehicle ? p.social_security : 0,
            mantenimiento:    r.mantenimiento,
            seguro:           hasVehicle ? p.insurance : 0,
            afiliacion:       hasVehicle ? p.affiliation : 0,
            lavado:           r.lavado,
            combustible:      r.combustible,
            llantas:          r.llantas,
            movilizacion:     r.movilizacion,
            parqueadero:      hasVehicle ? p.parking : 0,
        };

        const totalCostos   = Object.values(lines).reduce((s, v) => s + v, 0);
        const utilidadBruta = r.facturacion - totalCostos;
        const provisiones   = hasVehicle
            ? (p.soat + p.tecnomecanica + p.annual_maintenance + p.dotacion * p.dotacion_times) / 12
            : 0;
        const utilidadNeta  = utilidadBruta - provisiones;

        return {
            vehicleId: r.vehicleId,
            plate: r.plate,
            affiliateId: r.affiliateId,
            affiliateName: r.affiliateName,
            trips: r.trips,
            facturacion: r.facturacion,
            lines,
            totalCostos,
            utilidadBruta,
            margenBruto: pct(utilidadBruta, r.facturacion),
            provisiones: Math.round(provisiones),
            utilidadNeta: Math.round(utilidadNeta),
            margenNeto: pct(utilidadNeta, r.facturacion),
            detail: {
                salary: p.salary,
                commission: Math.round(commission),
                commission_pct: p.commission_pct,
                regionalTrips: r.regionalTrips,
                regionalBilling: r.regionalBilling,
                soat: p.soat,
                tecnomecanica: p.tecnomecanica,
                annual_maintenance: p.annual_maintenance,
                dotacion: p.dotacion,
                dotacion_times: p.dotacion_times,
                ownValues: Object.values(source).includes('vehicle'),
            },
        };
    }).sort((a, b) => a.affiliateName.localeCompare(b.affiliateName) || a.plate.localeCompare(b.plate));

    // Totales
    const sumBlock = (list) => {
        const lines = {};
        COST_LINES.forEach(l => { lines[l.key] = list.reduce((s, v) => s + v.lines[l.key], 0); });
        const facturacion   = list.reduce((s, v) => s + v.facturacion, 0);
        const totalCostos   = list.reduce((s, v) => s + v.totalCostos, 0);
        const utilidadBruta = facturacion - totalCostos;
        const provisiones   = list.reduce((s, v) => s + v.provisiones, 0);
        const utilidadNeta  = utilidadBruta - provisiones;
        return {
            trips: list.reduce((s, v) => s + v.trips, 0),
            facturacion, lines, totalCostos, utilidadBruta,
            margenBruto: pct(utilidadBruta, facturacion),
            provisiones, utilidadNeta,
            margenNeto: pct(utilidadNeta, facturacion),
        };
    };

    const affMap = {};
    vehicles.forEach(v => {
        if (!affMap[v.affiliateId]) affMap[v.affiliateId] = { id: v.affiliateId, name: v.affiliateName, vehicles: [] };
        affMap[v.affiliateId].vehicles.push(v);
    });
    const affiliates = Object.values(affMap).map(a => ({ ...a, totals: sumBlock(a.vehicles) }));

    return {
        year,
        month,
        costLines: COST_LINES,
        affiliates,
        totals: sumBlock(vehicles),
    };
};

module.exports = { buildPyg, resolveParams, loadParams, FIELDS, DEFAULTS };