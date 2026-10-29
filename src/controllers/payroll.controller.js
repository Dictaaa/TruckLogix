// src/controllers/payroll.controller.js
const { Trip, Vehicle, Driver, VehicleDowntime, VehicleDowntimeStatus, PayrollSettings, PayrollPeriod, PayrollEntry } = require('../models');
const { sequelize } = require('../config/db');
const { Op } = require('sequelize');
const { computeDriverPayroll, daysInRange } = require('../services/payroll.service');

const PAYROLL_ROLES = [1, 2];
const canManage = (req) => PAYROLL_ROLES.includes(Number(req.user?.role));

class HttpError extends Error {
    constructor(status, payload) {
        super(payload?.message || 'Error');
        this.status = status;
        this.payload = payload;
    }
}

const handleError = (res, error, label) => {
    if (error instanceof HttpError) return res.status(error.status).json(error.payload);
    console.error(`Error ${label}:`, error);
    return res.status(500).json({ error: 'Error del servidor' });
};

/** 1 = del 1 al 15, 2 = del 16 al último día del mes */
function fortnightRange(year, month, fortnight) {
    year = Number(year);
    month = Number(month);
    fortnight = Number(fortnight);
    if (fortnight === 1) {
        return { start: `${year}-${String(month).padStart(2, '0')}-01`, end: `${year}-${String(month).padStart(2, '0')}-15` };
    }
    const lastDay = new Date(year, month, 0).getDate();
    return {
        start: `${year}-${String(month).padStart(2, '0')}-16`,
        end: `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`,
    };
}

exports.getSettings = async (req, res) => {
    try {
        if (!canManage(req)) return res.status(403).json({ error: 'Sin permiso' });
        const [settings] = await PayrollSettings.findOrCreate({
            where: { company_id: req.user.company_id },
            defaults: { company_id: req.user.company_id },
        });
        res.json(settings);
    } catch (error) {
        handleError(res, error, 'obteniendo configuración de nómina');
    }
};

exports.updateSettings = async (req, res) => {
    try {
        if (!canManage(req)) return res.status(403).json({ error: 'Sin permiso' });
        const { min_wage, health_pension_value, holiday_sunday_bonus_pct } = req.body;

        const [settings] = await PayrollSettings.findOrCreate({
            where: { company_id: req.user.company_id },
            defaults: { company_id: req.user.company_id },
        });

        await settings.update({
            ...(min_wage !== undefined && { min_wage }),
            ...(health_pension_value !== undefined && { health_pension_value }),
            ...(holiday_sunday_bonus_pct !== undefined && { holiday_sunday_bonus_pct }),
        });

        res.json(settings);
    } catch (error) {
        handleError(res, error, 'actualizando configuración de nómina');
    }
};

exports.listPeriods = async (req, res) => {
    try {
        if (!canManage(req)) return res.status(403).json({ error: 'Sin permiso' });
        const where = { company_id: req.user.company_id };
        if (req.query.year) where.year = req.query.year;

        const periods = await PayrollPeriod.findAll({
            where,
            order: [['year', 'DESC'], ['month', 'DESC'], ['fortnight', 'DESC']],
        });
        res.json(periods);
    } catch (error) {
        handleError(res, error, 'listando períodos de nómina');
    }
};

async function findOrCreatePeriod(companyId, year, month, fortnight, transaction) {
    const { start, end } = fortnightRange(year, month, fortnight);
    const [period] = await PayrollPeriod.findOrCreate({
        where: { company_id: companyId, year, month, fortnight },
        defaults: { company_id: companyId, year, month, fortnight, start_date: start, end_date: end, status: 'abierto' },
        transaction,
    });
    return period;
}

exports.previewDriverPayroll = async (req, res) => {
    try {
        if (!canManage(req)) return res.status(403).json({ error: 'Sin permiso' });
        const { driver_id, year, month, fortnight } = req.query;
        if (!driver_id || !year || !month || !fortnight) {
            throw new HttpError(400, { message: 'driver_id, year, month y fortnight son obligatorios.' });
        }

        const { start, end } = fortnightRange(year, month, fortnight);
        const result = await computeDriverPayroll({
            companyId: req.user.company_id,
            driverId: Number(driver_id),
            startDate: start,
            endDate: end,
        });

        res.json({ period: { year: Number(year), month: Number(month), fortnight: Number(fortnight), start, end }, ...result });
    } catch (error) {
        handleError(res, error, 'calculando vista previa de nómina');
    }
};

exports.saveDriverEntry = async (req, res) => {
    try {
        if (!canManage(req)) return res.status(403).json({ error: 'Sin permiso' });
        const { id: user_id, company_id } = req.user;
        const { driver_id, year, month, fortnight, ...values } = req.body;
        if (!driver_id || !year || !month || !fortnight) {
            throw new HttpError(400, { message: 'driver_id, year, month y fortnight son obligatorios.' });
        }

        const result = await sequelize.transaction(async (transaction) => {
            const period = await findOrCreatePeriod(company_id, year, month, fortnight, transaction);

            if (period.status === 'pagado') {
                throw new HttpError(422, { message: 'Este período ya fue pagado — no se puede modificar. Revierte el pago primero si necesitas corregir algo.' });
            }

            const [entry, created] = await PayrollEntry.findOrCreate({
                where: { payroll_period_id: period.id, driver_id },
                defaults: { payroll_period_id: period.id, driver_id, company_id, ...values },
                transaction,
            });

            if (!created) await entry.update(values, { transaction });

            return entry;
        });

        res.status(201).json(result);
    } catch (error) {
        handleError(res, error, 'guardando nómina del conductor');
    }
};

exports.listPeriodEntries = async (req, res) => {
    try {
        if (!canManage(req)) return res.status(403).json({ error: 'Sin permiso' });
        const period = await PayrollPeriod.findOne({ where: { id: req.params.id, company_id: req.user.company_id } });
        if (!period) return res.status(404).json({ error: 'Período no encontrado' });

        const entries = await PayrollEntry.findAll({
            where: { payroll_period_id: period.id },
            include: [{ model: Driver, as: 'driver', attributes: ['id', 'name'] }],
            order: [['id', 'ASC']],
        });

        res.json({ period, entries });
    } catch (error) {
        handleError(res, error, 'listando nóminas del período');
    }
};

exports.payPeriod = async (req, res) => {
    try {
        if (!canManage(req)) return res.status(403).json({ error: 'Sin permiso' });
        const { id: user_id, company_id } = req.user;

        const period = await PayrollPeriod.findOne({ where: { id: req.params.id, company_id } });
        if (!period) return res.status(404).json({ error: 'Período no encontrado' });
        if (period.status === 'pagado') throw new HttpError(422, { message: 'Este período ya estaba pagado.' });

        const entryCount = await PayrollEntry.count({ where: { payroll_period_id: period.id } });
        if (!entryCount) throw new HttpError(422, { message: 'No hay ninguna nómina guardada en este período todavía.' });

        await period.update({ status: 'pagado', paid_at: new Date(), paid_by: user_id });

        res.json({ ...period.toJSON(), message: `Período pagado — ${entryCount} conductor(es).` });
    } catch (error) {
        handleError(res, error, 'confirmando pago de nómina');
    }
};