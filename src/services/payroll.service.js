// src/services/payroll.service.js
const { Trip, VehicleDowntime, VehicleDowntimeStatus, PayrollSettings } = require('../models');
const { Op } = require('sequelize');

/** Cuenta los días del rango (inclusive, ambos extremos) */
function daysInRange(start, end) {
    const ms = new Date(end) - new Date(start);
    return Math.round(ms / 86400000) + 1;
}

/** true si la fecha cae en domingo o en la lista de festivos de Colombia que le pases */
function isSundayOrHoliday(dateStr, holidays = []) {
    const d = new Date(dateStr + 'T00:00:00');
    if (d.getDay() === 0) return true; // domingo
    return holidays.includes(dateStr); // festivo exacto (YYYY-MM-DD)
}

/**
 * Calcula (sin guardar nada) la nómina de UN conductor para un rango de
 * fechas — lo que el modal muestra antes de que el usuario ajuste y
 * confirme.
 */
async function computeDriverPayroll({ companyId, driverId, startDate, endDate, holidays = [] }) {
    const [settings] = await PayrollSettings.findOrCreate({
        where: { company_id: companyId },
        defaults: { company_id: companyId },
    });

    const totalDays = daysInRange(startDate, endDate);

    // Días de ausencia que son CULPA DEL CONDUCTOR — se buscan por
    // driver_id DIRECTO, grabado en el propio registro de
    // vehicle_downtime (ya NO se infiere por el vehículo actual del
    // conductor). "Culpa del conductor" = el estado de ese registro
    // tiene is_driver_fault = true (típicamente "Conductor No se
    // presentó") — no se hardcodea ningún id ni nombre de estado,
    // porque el catálogo es por compañía.
    const downtimeRecords = await VehicleDowntime.findAll({
        where: {
            driver_id: driverId,
            downtime_date: { [Op.between]: [startDate, endDate] },
            active: true,
        },
        include: [{ model: VehicleDowntimeStatus, as: 'status', where: { is_driver_fault: true }, attributes: [] }],
        attributes: ['id', 'lost_value'],
        raw: true,
    });

    const noShowDays = downtimeRecords.length;

    // Citas perdidas = la suma de lost_value de esos mismos registros.
    // Único mecanismo — ya no sale de ningún campo en Trip.
    const missedAppointmentsCount = downtimeRecords.length;
    const missedAppointmentsValue = downtimeRecords.reduce((sum, d) => sum + Number(d.lost_value || 0), 0);

    const daysWorked = Math.max(0, totalDays - noShowDays);

    // Viajes del conductor en el rango — de acá salen comisión y
    // domingos/festivos trabajados.
    const trips = await Trip.findAll({
        where: {
            driver_id: driverId,
            company_id: companyId,
            active: true,
            trip_date: { [Op.between]: [startDate, endDate] },
        },
        attributes: ['id', 'trip_date', 'freight_value', 'commission_paid'],
        raw: true,
    });

    const commission = trips.reduce((sum, t) => sum + Number(t.commission_paid || 0), 0);

    // Domingos/festivos trabajados: días únicos con al menos un viaje
    // que caigan en domingo o festivo — un día con 2 viajes solo cuenta 1 vez.
    const workedDates = [...new Set(trips.map(t => t.trip_date))];
    const holidaySundayDays = workedDates.filter(d => isSundayOrHoliday(d, holidays)).length;

    const minWage = Number(settings.min_wage) || 0;
    const healthPensionValue = Number(settings.health_pension_value) || 0; // valor fijo en pesos, NO un %
    const holidayBonusPct = Number(settings.holiday_sunday_bonus_pct) || 0;

    // Cada quincena vale exactamente MEDIO salario mínimo, fijo — sin
    // importar si esa quincena tuvo 15 o 16 días de calendario (el mes
    // comercial colombiano siempre son 30 días). El /30 solo se usa
    // para descontar los días de "No se presentó", no para calcular el
    // período completo.
    const periodBaseSalary = minWage / 2;
    const dailyRate = minWage / 30;
    const proratedSalary = periodBaseSalary - (noShowDays * dailyRate);

    // El bono es un % del salario DIARIO — así un festivo vale lo mismo
    // sin importar cuántos días haya trabajado el conductor en total
    // ese período.
    const holidayBonusUnit = dailyRate * (holidayBonusPct / 100);
    const holidayBonusTotal = holidaySundayDays * holidayBonusUnit;

    // Préstamos NO se calculan acá — los digita el usuario en el modal,
    // arrancan en 0.
    const loans = 0;

    const totalPay = proratedSalary + commission + holidayBonusTotal
        - healthPensionValue - loans - missedAppointmentsValue;

    return {
        totalDaysInPeriod: totalDays,
        daysWorked,
        noShowDays,
        minWage,
        proratedSalary: round2(proratedSalary),
        commission: round2(commission),
        healthPensionValue: round2(healthPensionValue),
        loans,
        missedAppointmentsCount,
        missedAppointmentsValue: round2(missedAppointmentsValue),
        holidaySundayDays,
        holidaySundayBonusPct: holidayBonusPct,
        holidaySundayBonusUnit: round2(holidayBonusUnit),
        holidaySundayBonusTotal: round2(holidayBonusTotal),
        totalPay: round2(totalPay),
    };
}

function round2(n) {
    const num = Number(n);
    return Number.isFinite(num) ? Math.round(num * 100) / 100 : 0;
}

module.exports = { computeDriverPayroll, daysInRange, isSundayOrHoliday };