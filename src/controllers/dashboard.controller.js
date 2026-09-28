const { Trip, Vehicle, Affiliate, AffiliateBudget, FuelLog, Maintenance, TrailerPlate } = require('../models');
const { Op } = require('sequelize');

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const COL_OFFSET_MS = -5 * 60 * 60000; // Colombia UTC-5

const toColombiaDateStr = (date) =>
    new Date(date.getTime() + COL_OFFSET_MS).toISOString().substring(0, 10);

// Normaliza DATEONLY (string) o DATE (objeto) a 'YYYY-MM-DD'
const toYMD = (v) => {
    if (!v) return null;
    if (v instanceof Date) return toColombiaDateStr(v);
    return String(v).substring(0, 10);
};
const yearOf  = (v) => Number(toYMD(v)?.substring(0, 4)) || null;
const monthOf = (v) => Number(toYMD(v)?.substring(5, 7)) || null;

const emptyMonths = () => {
    const o = {};
    for (let m = 1; m <= 12; m++) o[m] = 0;
    return o;
};
const round    = (n, d = 0) => { const f = 10 ** d; return Math.round(n * f) / f; };
const kmPerGal = (km, gal) => (gal > 0 ? round(km / gal, 1) : 0);

// Filtro base según rol (mismo para viajes, combustible y mantenimiento)
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

exports.getDashboard = async (req, res) => {
    try {
        const { company_id, role } = req.user;
        const { affiliate_id } = req.query;

        // ─── FECHAS ───────────────────────────────────────────────────────────
        const now          = new Date();
        const yesterdayStr = toColombiaDateStr(new Date(now.getTime() - 86400000));
        const nowColombia  = new Date(now.getTime() + COL_OFFSET_MS);
        const currentYear  = nowColombia.getUTCFullYear();
        const thisMonth    = nowColombia.getUTCMonth() + 1;
        const year         = Number(req.query.year) || currentYear; // ahora respeta el año seleccionado
        const daysInMonth  = new Date(currentYear, thisMonth, 0).getDate();
        const dayOfMonth   = nowColombia.getUTCDate();
        const daysRemaining = daysInMonth - dayOfMonth;

        // Rango del año (sirve para DATEONLY y DATETIME)
        const yearRange = { [Op.gte]: `${year}-01-01`, [Op.lt]: `${year + 1}-01-01` };

        // ─── PRESUPUESTOS ─────────────────────────────────────────────────────
        const budgets = await AffiliateBudget.findAll({
            where: role === 3 ? { year, affiliate_id: company_id } : { year, company_id },
        });

        const budgetMap = {};
        budgets.forEach(b => {
            if (!budgetMap[b.affiliate_id]) budgetMap[b.affiliate_id] = {};
            budgetMap[b.affiliate_id][b.month] = Number(b.budget);
        });

        // ─── PRODUCCIÓN ───────────────────────────────────────────────────────
        const trips = await Trip.findAll({
            where: { ...buildScope(role, company_id, affiliate_id), trip_date: yearRange },
            include: [
                { model: Vehicle,   as: 'vehicle',   attributes: ['id', 'plate', 'soat_expiration', 'rtm_expiration'], required: false },
                { model: Affiliate, as: 'affiliate', attributes: ['id', 'name'], required: false },
            ],
            attributes: ['id', 'trip_date', 'freight_value', 'vehicle_id', 'affiliate_id'],
        });

        const yearTrips = trips.filter(t => yearOf(t.trip_date) === year);

        const affiliateMap = {};
        yearTrips.forEach(trip => {
            const affId  = trip.affiliate_id ?? 0;
            const plate  = trip.vehicle?.plate ?? 'Sin placa';
            const month  = monthOf(trip.trip_date);
            const value  = Number(trip.freight_value || 0);

            if (!affiliateMap[affId]) {
                affiliateMap[affId] = { id: affId, name: trip.affiliate?.name ?? 'Sin afiliado', plates: {} };
            }
            if (!affiliateMap[affId].plates[plate]) {
                affiliateMap[affId].plates[plate] = {
                    plate,
                    vehicleId: trip.vehicle_id,
                    soat_expiration: trip.vehicle?.soat_expiration ?? null,
                    rtm_expiration:  trip.vehicle?.rtm_expiration ?? null,
                    months: {},
                    totalTrips: 0,
                    monthTrips: 0,
                    monthValue: 0,
                    yesterdayTrips: 0,
                };
            }

            const p = affiliateMap[affId].plates[plate];
            p.months[month] = (p.months[month] || 0) + value;
            p.totalTrips++;
            if (month === thisMonth) {
                p.monthTrips++;
                p.monthValue += value;
            }
            if (toYMD(trip.trip_date) === yesterdayStr) p.yesterdayTrips++;
        });

        const activeMonths = [...new Set(yearTrips.map(t => monthOf(t.trip_date)))].sort((a, b) => a - b);

        const result = Object.values(affiliateMap).map((aff) => {
            const affBudgets = budgetMap[aff.id] ?? {};
            const plates = Object.values(aff.plates).map((p) => {
                const dailyAvg   = dayOfMonth > 0 ? p.monthValue / dayOfMonth : 0;
                const proyeccion = p.monthValue + (dailyAvg * daysRemaining);

                const docAlerts = [];
                ['soat_expiration', 'rtm_expiration'].forEach(field => {
                    const date = p[field];
                    if (!date) return;
                    const daysLeft = Math.ceil((new Date(date) - now) / 86400000);
                    if (daysLeft <= 30) {
                        docAlerts.push({
                            type: field === 'soat_expiration' ? 'SOAT' : 'RTM',
                            expiration: toYMD(date),
                            daysLeft,
                            status: daysLeft < 0 ? 'expired' : daysLeft <= 15 ? 'critical' : 'warning',
                        });
                    }
                });

                return {
                    plate: p.plate,
                    vehicleId: p.vehicleId,
                    months: p.months,
                    totalYear: Object.values(p.months).reduce((s, v) => s + v, 0),
                    monthValue: p.monthValue,
                    monthTrips: p.monthTrips,
                    totalTrips: p.totalTrips,
                    yesterdayTrips: p.yesterdayTrips,
                    proyeccion: Math.round(proyeccion),
                    docAlerts,
                };
            });

            const affMonthTotal  = plates.reduce((s, p) => s + p.monthValue, 0);
            const affYearTotal   = plates.reduce((s, p) => s + p.totalYear, 0);
            const affMonthBudget = affBudgets[thisMonth] ?? 0;

            const monthlyCompliance = {};
            activeMonths.forEach(m => {
                const monthTotal  = plates.reduce((s, p) => s + (p.months[m] || 0), 0);
                const monthBudget = affBudgets[m] ?? 0;
                monthlyCompliance[m] = monthBudget > 0 ? Math.round((monthTotal / monthBudget) * 100) : null;
            });

            return {
                id: aff.id,
                name: aff.name,
                plates,
                monthTotal: affMonthTotal,
                yearTotal: affYearTotal,
                proyeccion: plates.reduce((s, p) => s + p.proyeccion, 0),
                budgets: affBudgets,
                cumplimiento: affMonthBudget > 0 ? Math.round((affMonthTotal / affMonthBudget) * 100) : null,
                monthlyCompliance,
            };
        });

        const monthlyBilling = emptyMonths();
        yearTrips.forEach(t => { monthlyBilling[monthOf(t.trip_date)] += Number(t.freight_value || 0); });

        const thisMonthTotal = monthlyBilling[thisMonth] || 0;
        const thisMonthTrips = yearTrips.filter(t => monthOf(t.trip_date) === thisMonth).length;
        const yesterdayTrips = yearTrips.filter(t => toYMD(t.trip_date) === yesterdayStr);

        // ─── COMBUSTIBLE (todo el año, mes a mes) ─────────────────────────────
        const fuelLogs = await FuelLog.findAll({
            where: { ...buildScope(role, company_id, affiliate_id), fuel_date: yearRange },
            include: [
                { model: Vehicle,   as: 'vehicle',   attributes: ['id', 'plate'], required: false },
                { model: Affiliate, as: 'affiliate', attributes: ['id', 'name'],  required: false },
            ],
            attributes: ['id', 'fuel_date', 'vehicle_id', 'affiliate_id',
                         'km_initial', 'km_final', 'km_driven',
                         'gallons', 'price_per_gallon', 'total_value'],
        });

        const fuelMonthTotals = {};
        for (let m = 1; m <= 12; m++) fuelMonthTotals[m] = { gallons: 0, value: 0, kmDriven: 0 };
        const fuelPlateMap = {};

        fuelLogs.forEach(f => {
            const m = monthOf(f.fuel_date);
            if (!m || yearOf(f.fuel_date) !== year) return;

            const gal = Number(f.gallons     || 0);
            const val = Number(f.total_value || 0);
            const km  = Number(f.km_driven   || 0);

            fuelMonthTotals[m].gallons  += gal;
            fuelMonthTotals[m].value    += val;
            fuelMonthTotals[m].kmDriven += km;

            const plate = f.vehicle?.plate ?? 'Sin placa';
            if (!fuelPlateMap[plate]) {
                fuelPlateMap[plate] = {
                    plate,
                    affiliate: f.affiliate?.name ?? '',
                    months: {},
                    gallons: 0, value: 0, kmDriven: 0,
                };
            }
            const p = fuelPlateMap[plate];
            if (!p.months[m]) p.months[m] = { gallons: 0, value: 0, kmDriven: 0 };
            p.months[m].gallons  += gal;
            p.months[m].value    += val;
            p.months[m].kmDriven += km;
            p.gallons  += gal;
            p.value    += val;
            p.kmDriven += km;
        });

        const fuelPlates = Object.values(fuelPlateMap);

        // Totales por mes con km/galón
        const fuelMonthlyTotals = {};
        Object.entries(fuelMonthTotals).forEach(([m, t]) => {
            fuelMonthlyTotals[m] = {
                gallons: round(t.gallons, 2),
                value: t.value,
                kmDriven: t.kmDriven,
                kmPerGallon: kmPerGal(t.kmDriven, t.gallons),
            };
        });

        // Detalle por placa, todos los meses
        const fuelMonthlyByPlate = fuelPlates.map(p => {
            const months = {};
            Object.entries(p.months).forEach(([m, d]) => {
                months[m] = {
                    gallons: round(d.gallons, 2),
                    value: d.value,
                    kmDriven: d.kmDriven,
                    kmPerGallon: kmPerGal(d.kmDriven, d.gallons),
                };
            });
            return {
                plate: p.plate,
                affiliate: p.affiliate,
                months,
                gallons: round(p.gallons, 2),
                value: p.value,
                kmDriven: p.kmDriven,
                kmPerGallon: kmPerGal(p.kmDriven, p.gallons),
            };
        }).sort((a, b) => b.value - a.value);

        // Detalle del mes actual (lo que ya tenías)
        const fuelByPlateResult = fuelPlates
            .filter(p => p.months[thisMonth])
            .map(p => {
                const d = p.months[thisMonth];
                return {
                    plate: p.plate,
                    affiliate: p.affiliate,
                    gallons: round(d.gallons, 2),
                    value: d.value,
                    kmDriven: d.kmDriven,
                    kmPerGallon: kmPerGal(d.kmDriven, d.gallons),
                };
            })
            .sort((a, b) => b.value - a.value);

        const cm = fuelMonthTotals[thisMonth];
        const fuelKpis = {
            totalGallons:   round(cm.gallons, 2),
            totalValue:     cm.value,
            totalKmDriven:  cm.kmDriven,
            avgKmPerGallon: kmPerGal(cm.kmDriven, cm.gallons),
        };

        const fuelYearGallons = fuelPlates.reduce((s, p) => s + p.gallons, 0);
        const fuelYearKm      = fuelPlates.reduce((s, p) => s + p.kmDriven, 0);
        const fuelYearTotals = {
            gallons: round(fuelYearGallons, 2),
            value: fuelPlates.reduce((s, p) => s + p.value, 0),
            kmDriven: fuelYearKm,
            kmPerGallon: kmPerGal(fuelYearKm, fuelYearGallons),
        };

        // ─── MANTENIMIENTO (todo el año, mes a mes) ───────────────────────────
        const maintenances = await Maintenance.findAll({
            where: { ...buildScope(role, company_id, affiliate_id), entry_date: yearRange },
            include: [
                { model: Vehicle,      as: 'vehicle',      attributes: ['id', 'plate'], required: false },
                { model: Affiliate,    as: 'affiliate',    attributes: ['id', 'name'],  required: false },
                { model: TrailerPlate, as: 'trailerPlate', attributes: ['id', 'plate'], required: false },
            ],
            attributes: ['id', 'entry_date', 'vehicle_id', 'affiliate_id', 'trailer_plate_id',
                         'labor_cost', 'parts_cost', 'total_cost'],
        });

        const mttoMonthlyTotals = emptyMonths();
        const mttoAffMap = {};
        let mttoMonthCount = 0, mttoMonthLabor = 0, mttoMonthParts = 0;

        maintenances.forEach(r => {
            const m = monthOf(r.entry_date);
            if (!m || yearOf(r.entry_date) !== year) return;

            const labor = Number(r.labor_cost || 0);
            const parts = Number(r.parts_cost || 0);
            const total = r.total_cost != null ? Number(r.total_cost) : labor + parts;

            mttoMonthlyTotals[m] += total;
            if (m === thisMonth) {
                mttoMonthCount++;
                mttoMonthLabor += labor;
                mttoMonthParts += parts;
            }

            const affId = r.affiliate_id ?? 0;
            if (!mttoAffMap[affId]) {
                mttoAffMap[affId] = { id: affId, name: r.affiliate?.name ?? 'Sin afiliado', plates: {} };
            }

            const plate = r.vehicle?.plate
                ?? (r.trailerPlate?.plate ? `${r.trailerPlate.plate} (tráiler)` : 'Sin placa');

            const plates = mttoAffMap[affId].plates;
            if (!plates[plate]) {
                plates[plate] = { plate, months: {}, totalYear: 0, labor: 0, parts: 0, count: 0, monthCount: 0 };
            }
            const p = plates[plate];
            p.months[m] = (p.months[m] || 0) + total;
            p.totalYear += total;
            p.labor     += labor;
            p.parts     += parts;
            p.count++;
            if (m === thisMonth) p.monthCount++;
        });

        const mttoAffiliates = Object.values(mttoAffMap).map(a => {
            const plates = Object.values(a.plates).sort((x, y) => y.totalYear - x.totalYear);
            const monthTotals = emptyMonths();
            plates.forEach(p => Object.entries(p.months).forEach(([m, v]) => { monthTotals[m] += v; }));
            return {
                id: a.id,
                name: a.name,
                plates,
                monthTotals,
                monthTotal: monthTotals[thisMonth],
                yearTotal: plates.reduce((s, p) => s + p.totalYear, 0),
                labor: plates.reduce((s, p) => s + p.labor, 0),
                parts: plates.reduce((s, p) => s + p.parts, 0),
                count: plates.reduce((s, p) => s + p.count, 0),
                monthCount: plates.reduce((s, p) => s + p.monthCount, 0),
            };
        }).sort((a, b) => b.yearTotal - a.yearTotal);

        const maintenance = {
            kpis: {
                thisMonthTotal: mttoMonthlyTotals[thisMonth],
                thisMonthCount: mttoMonthCount,
                thisMonthLabor: mttoMonthLabor,
                thisMonthParts: mttoMonthParts,
                yearTotal: Object.values(mttoMonthlyTotals).reduce((s, v) => s + v, 0),
                yearCount: mttoAffiliates.reduce((s, a) => s + a.count, 0),
            },
            monthlyTotals: mttoMonthlyTotals,
            affiliates: mttoAffiliates,
        };

        // ─── RESPUESTA ────────────────────────────────────────────────────────
        res.json({
            year,
            affiliates: result,
            activeMonths,
            thisMonth,
            daysInMonth,
            dayOfMonth,
            daysRemaining,
            kpis: {
                yesterdayTrips:   yesterdayTrips.length,
                yesterdayBilling: yesterdayTrips.reduce((s, t) => s + Number(t.freight_value || 0), 0),
                thisMonthTotal,
                thisMonthTrips,
                monthlyBilling,
            },
            fuel: {
                kpis:    fuelKpis,
                byPlate: fuelByPlateResult,
                monthly: {
                    totals:     fuelMonthlyTotals,
                    byPlate:    fuelMonthlyByPlate,
                    yearTotals: fuelYearTotals,
                },
            },
            maintenance,
        });

    } catch (error) {
        console.error('Error dashboard:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};