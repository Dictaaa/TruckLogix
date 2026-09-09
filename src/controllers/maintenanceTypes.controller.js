// src/controllers/maintenanceMasters.controller.js
const { MaintenanceType, TrailerPlate, Vehicle } = require('../models');
const { Op } = require('sequelize');

// ═══════════════════════════════════════════════════════════════
// TIPOS DE MANTENIMIENTO
// ═══════════════════════════════════════════════════════════════

exports.getMaintenanceTypes = async (req, res) => {
    try {
        const { company_id } = req.user;
        const { search = '' } = req.query;

        const where = { company_id, active: true };
        if (search) where.name = { [Op.like]: `%${search}%` };

        const types = await MaintenanceType.findAll({
            where,
            order: [['name', 'ASC']],
        });
        res.json(types);
    } catch (error) {
        console.error('Error al listar tipos:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

exports.createMaintenanceType = async (req, res) => {
    try {
        const { company_id } = req.user;
        if (!req.body.name?.trim()) {
            return res.status(400).json({ error: 'El nombre es obligatorio' });
        }
        const type = await MaintenanceType.create({
            name: req.body.name.trim(),
            company_id,
        });
        res.status(201).json(type);
    } catch (error) {
        console.error('Error al crear tipo:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

exports.updateMaintenanceType = async (req, res) => {
    try {
        const { company_id } = req.user;
        const { id } = req.params;

        const type = await MaintenanceType.findOne({ where: { id, company_id, active: true } });
        if (!type) return res.status(404).json({ error: 'Tipo no encontrado' });

        await type.update({ name: req.body.name?.trim() || type.name });
        res.json(type);
    } catch (error) {
        console.error('Error al actualizar tipo:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

exports.deleteMaintenanceType = async (req, res) => {
    try {
        const { company_id } = req.user;
        const { id } = req.params;

        const type = await MaintenanceType.findOne({ where: { id, company_id, active: true } });
        if (!type) return res.status(404).json({ error: 'Tipo no encontrado' });

        await type.update({ active: false });
        res.json({ message: 'Tipo eliminado correctamente' });
    } catch (error) {
        console.error('Error al eliminar tipo:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

// ═══════════════════════════════════════════════════════════════
// PLACAS TRAILER
// ═══════════════════════════════════════════════════════════════

exports.getTrailerPlates = async (req, res) => {
    try {
        const { company_id } = req.user;
        const { search = '', vehicle_id } = req.query;

        const where = { company_id, active: true };
        if (search)    where.plate      = { [Op.like]: `%${search}%` };
        if (vehicle_id) where.vehicle_id = vehicle_id;

        const plates = await TrailerPlate.findAll({
            where,
            include: [
                { model: Vehicle, as: 'vehicle', attributes: ['id', 'plate'], required: false }
            ],
            order: [['plate', 'ASC']],
        });
        res.json(plates);
    } catch (error) {
        console.error('Error al listar trailers:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

exports.createTrailerPlate = async (req, res) => {
    try {
        const { company_id } = req.user;
        if (!req.body.plate?.trim()) {
            return res.status(400).json({ error: 'La placa es obligatoria' });
        }
        const plate = await TrailerPlate.create({
            plate:      req.body.plate.trim().toUpperCase(),
            vehicle_id: req.body.vehicle_id || null,
            company_id,
        });
        // Retorna con el vehículo incluido
        const result = await TrailerPlate.findByPk(plate.id, {
            include: [{ model: Vehicle, as: 'vehicle', attributes: ['id', 'plate'], required: false }]
        });
        res.status(201).json(result);
    } catch (error) {
        console.error('Error al crear trailer:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

exports.updateTrailerPlate = async (req, res) => {
    try {
        const { company_id } = req.user;
        const { id } = req.params;

        const trailer = await TrailerPlate.findOne({ where: { id, company_id, active: true } });
        if (!trailer) return res.status(404).json({ error: 'Trailer no encontrado' });

        await trailer.update({
            plate:      req.body.plate?.trim().toUpperCase() || trailer.plate,
            vehicle_id: req.body.vehicle_id ?? trailer.vehicle_id,
        });

        const result = await TrailerPlate.findByPk(id, {
            include: [{ model: Vehicle, as: 'vehicle', attributes: ['id', 'plate'], required: false }]
        });
        res.json(result);
    } catch (error) {
        console.error('Error al actualizar trailer:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

exports.deleteTrailerPlate = async (req, res) => {
    try {
        const { company_id } = req.user;
        const { id } = req.params;

        const trailer = await TrailerPlate.findOne({ where: { id, company_id, active: true } });
        if (!trailer) return res.status(404).json({ error: 'Trailer no encontrado' });

        await trailer.update({ active: false });
        res.json({ message: 'Trailer eliminado correctamente' });
    } catch (error) {
        console.error('Error al eliminar trailer:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};