const { Trip, Vehicle, Driver, Affiliate, Company, AffiliateBudget, FuelLog  } = require('../models');
const { Op } = require('sequelize');

exports.getDashboard = async (req, res) => {
    try {
        const { company_id, role } = req.user;
        const { affiliate_id } = req.query;
        // Fecha actual en Colombia (UTC-5)
        const toColombiaDateStr = (date) => {
            const offset = -5 * 60; // UTC-5 en minutos
            const local = new Date(date.getTime() + offset * 60000);
            return local.toISOString().substring(0, 10);
        };

        const now = new Date();
        const todayStr = toColombiaDateStr(now);

        const yesterdayUTC = new Date(now);
        yesterdayUTC.setDate(yesterdayUTC.getDate() - 1);
        const yesterdayStr = toColombiaDateStr(yesterdayUTC);

        // Hora colombiana para cálculos de mes/día
        const nowColombia = new Date(now.getTime() + (-5 * 60) * 60000);
        const thisYear = nowColombia.getUTCFullYear();
        const thisMonth = nowColombia.getUTCMonth() + 1;
        const daysInMonth = new Date(thisYear, thisMonth, 0).getDate();
        const dayOfMonth = nowColombia.getUTCDate();
        const daysRemaining = daysInMonth - dayOfMonth;

        const budgetWhere = role === 3
    ? { year: thisYear, affiliate_id: company_id }
    : { year: thisYear, company_id };

const budgets = await AffiliateBudget.findAll({ where: budgetWhere });

        // Crea un mapa affiliateId→mes→presupuesto
        const budgetMap = {};
        budgets.forEach(b => {
            if (!budgetMap[b.affiliate_id]) budgetMap[b.affiliate_id] = {};
            budgetMap[b.affiliate_id][b.month] = Number(b.budget);
        });

        // Filtro base según rol
        const tripWhere = { active: true };
        if (role === 3) {
            tripWhere.affiliate_id = company_id;
        } else {
            tripWhere.company_id = company_id;
            if (affiliate_id) tripWhere.affiliate_id = affiliate_id;
        }

        // Todos los viajes del año en curso
        const trips = await Trip.findAll({
            where: tripWhere,
            include: [
                { model: Vehicle, as: 'vehicle', attributes: ['id', 'plate', 'soat_expiration', 'rtm_expiration'], required: false },
                { model: Affiliate, as: 'affiliate', attributes: ['id', 'name'], required: false },
            ],
            attributes: ['id', 'trip_date', 'freight_value', 'vehicle_id', 'affiliate_id'],
        });

        // Filtra solo viajes del año actual
        const yearTrips = trips.filter(t => {
            if (!t.trip_date) return false;
            return new Date(t.trip_date).getFullYear() === thisYear;
        });

        // Agrupa por afiliado → placa
        const affiliateMap = {};

        yearTrips.forEach(trip => {
            const tripDateCol = new Date(trip.trip_date.toString().substring(0, 10) + 'T12:00:00');
            const affName = trip.affiliate?.name ?? 'Sin afiliado';
            const affId = trip.affiliate_id ?? 0;
            const plate = trip.vehicle?.plate ?? 'Sin placa';
            const month = tripDateCol.getMonth() + 1;
            const value = Number(trip.freight_value || 0);
            const soat = trip.vehicle?.soat_expiration ?? null;
            const rtm = trip.vehicle?.rtm_expiration ?? null;
            const vehicleId = trip.vehicle_id;

            if (!affiliateMap[affId]) {
                affiliateMap[affId] = { id: affId, name: affName, plates: {} };
            }

            if (!affiliateMap[affId].plates[plate]) {
                affiliateMap[affId].plates[plate] = {
                    plate,
                    vehicleId,
                    soat_expiration: soat,
                    rtm_expiration: rtm,
                    months: {},        // facturación por mes
                    totalTrips: 0,     // total viajes del año
                    monthTrips: 0,     // viajes mes actual
                    monthValue: 0,     // valor mes actual
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

            if (trip.trip_date && trip.trip_date.toString().substring(0, 10) === yesterdayStr) {
                p.yesterdayTrips++;  // ← agrega esto
            }
        });

        // Meses activos (para las columnas)
        const activeMonths = [...new Set(
            yearTrips.map(t => new Date(t.trip_date).getMonth() + 1)
        )].sort((a, b) => a - b);

        // Calcula proyección y documentos por vencer
        const result = Object.values(affiliateMap).map((aff) => {
            const affBudgets = budgetMap[aff.id] ?? {};
            const plates = Object.values(aff.plates).map((p) => {
                // Proyección: valor diario promedio × días restantes + acumulado
                const dailyAvg = dayOfMonth > 0 ? p.monthValue / dayOfMonth : 0;
                const proyeccion = p.monthValue + (dailyAvg * daysRemaining);

                // Documentos
                const docAlerts = [];
                ['soat_expiration', 'rtm_expiration'].forEach(field => {
                    const date = p[field];
                    if (!date) return;
                    const daysLeft = Math.ceil((new Date(date) - now) / 86400000);
                    if (daysLeft <= 30) {
                        docAlerts.push({
                            type: field === 'soat_expiration' ? 'SOAT' : 'RTM',
                            expiration: date.toString().substring(0, 10),
                            daysLeft,
                            status: daysLeft < 0 ? 'expired' : daysLeft <= 15 ? 'critical' : daysLeft <= 30 ? 'warning' : 'ok',
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

            const affMonthTotal = plates.reduce((s, p) => s + p.monthValue, 0);
            const affYearTotal = plates.reduce((s, p) => s + p.totalYear, 0);
            const affMonthBudget = affBudgets[thisMonth] ?? 0;
            const cumplimiento = affMonthBudget > 0
                ? Math.round((affMonthTotal / affMonthBudget) * 100)
                : null;

            // Cumplimiento por mes (para la tabla)
            const monthlyCompliance = {};
            activeMonths.forEach(m => {
                const monthTotal = plates.reduce((s, p) => s + (p.months[m] || 0), 0);
                const monthBudget = affBudgets[m] ?? 0;
                monthlyCompliance[m] = monthBudget > 0
                    ? Math.round((monthTotal / monthBudget) * 100)
                    : null;
            });

            return {
                id: aff.id,
                name: aff.name,
                plates,
                monthTotal: affMonthTotal,
                yearTotal: affYearTotal,
                proyeccion: plates.reduce((s, p) => s + p.proyeccion, 0),
                budgets: affBudgets,       // presupuesto por mes
                cumplimiento,                        // % mes actual
                monthlyCompliance,                   // % por mes
            };
        });

        // Función helper para extraer mes correctamente
const getMonthFromTrip = (trip) => {
  const dateStr = trip.trip_date.toString().substring(0, 10);
  return new Date(dateStr + 'T12:00:00').getMonth() + 1;
};

// Facturación por mes — usando la misma lógica que affiliateMap
const monthlyBilling = {};
for (let m = 1; m <= 12; m++) monthlyBilling[m] = 0;
yearTrips.forEach(t => {
  const m = getMonthFromTrip(t);
  monthlyBilling[m] = (monthlyBilling[m] || 0) + Number(t.freight_value || 0);
});

// thisMonthTotal — suma directa del mes actual
const thisMonthTotal = monthlyBilling[thisMonth] || 0;

// thisMonthTrips — usando helper
const thisMonthTrips = yearTrips.filter(t => getMonthFromTrip(t) === thisMonth).length;

// yesterdayTrips — ya está bien con substring
const yesterdayTrips = yearTrips.filter(t =>
  t.trip_date && t.trip_date.toString().substring(0, 10) === yesterdayStr
);

// ─── COMBUSTIBLE ──────────────────────────────────────────────────────────────
const fuelWhere = { active: true };
if (role === 3) {
    fuelWhere.affiliate_id = company_id;
} else {
    fuelWhere.company_id = company_id;
    if (affiliate_id) fuelWhere.affiliate_id = affiliate_id;
}

const fuelLogs = await FuelLog.findAll({
    where: fuelWhere,
    include: [
        { model: Vehicle,   as: 'vehicle',   attributes: ['id', 'plate'], required: false },
        { model: Affiliate, as: 'affiliate', attributes: ['id', 'name'],  required: false },
    ],
    attributes: ['id', 'fuel_date', 'vehicle_id', 'affiliate_id',
                 'km_initial', 'km_final', 'km_driven',
                 'gallons', 'price_per_gallon', 'total_value'],
});

// Solo registros del mes actual
const monthFuelLogs = fuelLogs.filter(f => {
    if (!f.fuel_date) return false;
    const d = new Date(f.fuel_date.toString().substring(0, 10) + 'T12:00:00');
    return d.getFullYear() === thisYear && d.getMonth() + 1 === thisMonth;
});

// KPIs generales de combustible del mes
const fuelKpis = {
    totalGallons:    monthFuelLogs.reduce((s, f) => s + Number(f.gallons     || 0), 0),
    totalValue:      monthFuelLogs.reduce((s, f) => s + Number(f.total_value || 0), 0),
    totalKmDriven:   monthFuelLogs.reduce((s, f) => s + Number(f.km_driven   || 0), 0),
    get avgKmPerGallon() {
        return this.totalGallons > 0
            ? Math.round((this.totalKmDriven / this.totalGallons) * 10) / 10
            : 0;
    }
};

// Detalle por placa
const fuelByPlate = {};
monthFuelLogs.forEach(f => {
    const plate = f.vehicle?.plate ?? 'Sin placa';
    const affName = f.affiliate?.name ?? '';
    if (!fuelByPlate[plate]) {
        fuelByPlate[plate] = {
            plate,
            affilate: affName,
            gallons:   0,
            value:     0,
            kmDriven:  0,
        };
    }
    fuelByPlate[plate].gallons  += Number(f.gallons     || 0);
    fuelByPlate[plate].value    += Number(f.total_value || 0);
    fuelByPlate[plate].kmDriven += Number(f.km_driven   || 0);
});

// Agrega km/galón por placa
const fuelByPlateResult = Object.values(fuelByPlate).map(p => ({
    ...p,
    gallons:      Math.round(p.gallons * 100) / 100,
    kmPerGallon:  p.gallons > 0 ? Math.round((p.kmDriven / p.gallons) * 10) / 10 : 0,
})).sort((a, b) => b.value - a.value); // ordena por mayor gasto

res.json({
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
},
});

    } catch (error) {
        console.error('Error dashboard:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};