const { Trip, Vehicle, Driver, Affiliate, Company } = require('../models');
const { Op } = require('sequelize');

exports.getDashboard = async (req, res) => {
  try {
    const { company_id, role } = req.user;
    const now       = new Date();
    const thisYear  = now.getFullYear();
    const thisMonth = now.getMonth() + 1;
    const today     = now;

    // Días transcurridos y restantes del mes
    const daysInMonth   = new Date(thisYear, thisMonth, 0).getDate();
    const dayOfMonth    = now.getDate();
    const daysRemaining = daysInMonth - dayOfMonth;

    // Filtro base según rol
    const tripWhere = { active: true };
    if (role === 3) {
      tripWhere.affiliate_id = company_id;
    } else {
      tripWhere.company_id = company_id;
    }

    // Todos los viajes del año en curso
    const trips = await Trip.findAll({
      where: tripWhere,
      include: [
        { model: Vehicle,   as: 'vehicle',   attributes: ['id', 'plate', 'soat_expiration', 'rtm_expiration'], required: false },
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
      const affName  = trip.affiliate?.name ?? 'Sin afiliado';
      const affId    = trip.affiliate_id    ?? 0;
      const plate    = trip.vehicle?.plate  ?? 'Sin placa';
      const month    = new Date(trip.trip_date).getMonth() + 1;
      const value    = Number(trip.freight_value || 0);
      const soat     = trip.vehicle?.soat_expiration ?? null;
      const rtm      = trip.vehicle?.rtm_expiration  ?? null;
      const vehicleId = trip.vehicle_id;

      if (!affiliateMap[affId]) {
        affiliateMap[affId] = { id: affId, name: affName, plates: {} };
      }

      if (!affiliateMap[affId].plates[plate]) {
        affiliateMap[affId].plates[plate] = {
          plate,
          vehicleId,
          soat_expiration: soat,
          rtm_expiration:  rtm,
          months: {},        // facturación por mes
          totalTrips: 0,     // total viajes del año
          monthTrips: 0,     // viajes mes actual
          monthValue: 0,     // valor mes actual
        };
      }

      const p = affiliateMap[affId].plates[plate];
      p.months[month] = (p.months[month] || 0) + value;
      p.totalTrips++;
      if (month === thisMonth) {
        p.monthTrips++;
        p.monthValue += value;
      }
    });

    // Calcula proyección y documentos por vencer
    const result = Object.values(affiliateMap).map((aff) => {
      const plates = Object.values(aff.plates).map((p) => {
        // Proyección: valor diario promedio × días restantes + acumulado
        const dailyAvg    = dayOfMonth > 0 ? p.monthValue / dayOfMonth : 0;
        const proyeccion  = p.monthValue + (dailyAvg * daysRemaining);

        // Documentos
        const docAlerts = [];
        ['soat_expiration', 'rtm_expiration'].forEach(field => {
          const date = p[field];
          if (!date) return;
          const daysLeft = Math.ceil((new Date(date) - today) / 86400000);
          if (daysLeft <= 60) {
            docAlerts.push({
              type:      field === 'soat_expiration' ? 'SOAT' : 'RTM',
              expiration: date.toString().substring(0, 10),
              daysLeft,
              status:    daysLeft < 0 ? 'expired' : daysLeft <= 15 ? 'critical' : daysLeft <= 30 ? 'warning' : 'ok',
            });
          }
        });

        return {
          plate:       p.plate,
          vehicleId:   p.vehicleId,
          months:      p.months,
          totalYear:   Object.values(p.months).reduce((s, v) => s + v, 0),
          monthValue:  p.monthValue,
          monthTrips:  p.monthTrips,
          totalTrips:  p.totalTrips,
          proyeccion:  Math.round(proyeccion),
          docAlerts,
        };
      });

      const affMonthTotal = plates.reduce((s, p) => s + p.monthValue, 0);
      const affYearTotal  = plates.reduce((s, p) => s + p.totalYear,  0);

      return {
        id:           aff.id,
        name:         aff.name,
        plates,
        monthTotal:   affMonthTotal,
        yearTotal:    affYearTotal,
        proyeccion:   plates.reduce((s, p) => s + p.proyeccion, 0),
      };
    });

    // Meses activos (para las columnas)
    const activeMonths = [...new Set(
      yearTrips.map(t => new Date(t.trip_date).getMonth() + 1)
    )].sort((a, b) => a - b);

    // Agrega esto antes del res.json() final

const yesterday = new Date(today);
yesterday.setDate(yesterday.getDate() - 1);
const yesterdayStr = yesterday.toISOString().substring(0, 10);

// Viajes de ayer
const yesterdayTrips = yearTrips.filter(t =>
  t.trip_date && t.trip_date.toString().substring(0, 10) === yesterdayStr
);

// Facturación por mes del año
const monthlyBilling = {};
for (let m = 1; m <= 12; m++) monthlyBilling[m] = 0;
yearTrips.forEach(t => {
  const m = new Date(t.trip_date).getMonth() + 1;
  monthlyBilling[m] = (monthlyBilling[m] || 0) + Number(t.freight_value || 0);
});

// Facturación del mes actual
const thisMonthTotal = monthlyBilling[thisMonth] || 0;

// Total viajes del mes
const thisMonthTrips = yearTrips.filter(t =>
  new Date(t.trip_date).getMonth() + 1 === thisMonth
).length;

res.json({
  affiliates: result,
  activeMonths,
  thisMonth,
  daysInMonth,
  dayOfMonth,
  daysRemaining,
  kpis: {
    yesterdayTrips:  yesterdayTrips.length,
    yesterdayBilling: yesterdayTrips.reduce((s, t) => s + Number(t.freight_value || 0), 0),
    thisMonthTotal,
    thisMonthTrips,
    monthlyBilling,   // objeto mes→valor para la gráfica
  }
});

  } catch (error) {
    console.error('Error dashboard:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
};