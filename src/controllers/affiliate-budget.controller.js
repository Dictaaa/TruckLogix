const { AffiliateBudget, Affiliate } = require('../models');

exports.list = async (req, res) => {
  try {
    const { company_id } = req.user;
    const { affiliate_id, year } = req.query;

    const where = { company_id };
    if (affiliate_id) where.affiliate_id = affiliate_id;
    if (year)         where.year         = year;

    const budgets = await AffiliateBudget.findAll({
      where,
      include: [
        { model: Affiliate, as: 'affiliate', attributes: ['id', 'name'], required: false }
      ],
      order: [['year', 'DESC'], ['month', 'ASC']],
    });

    res.json(budgets);
  } catch (error) {
    console.error('Error al listar presupuestos:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

exports.upsert = async (req, res) => {
  try {
    const { company_id } = req.user;
    const { affiliate_id, year, month, budget } = req.body;

    if (!affiliate_id || !year || !month || budget === undefined) {
      return res.status(400).json({ error: 'Faltan campos requeridos' });
    }

    const existing = await AffiliateBudget.findOne({
      where: { affiliate_id, year, month, company_id }
    });

    if (existing) {
      await existing.update({ budget });
      return res.json(existing);
    }

    const record = await AffiliateBudget.create({
      affiliate_id, year, month, budget, company_id
    });

    res.status(201).json(record);
  } catch (error) {
    console.error('Error al guardar presupuesto:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

exports.upsertMany = async (req, res) => {
  try {
    const { company_id } = req.user;
    const { affiliate_id, year, budgets } = req.body;

    if (!affiliate_id || !year || !Array.isArray(budgets)) {
      return res.status(400).json({ error: 'Faltan campos requeridos' });
    }

    const results = await Promise.all(
      budgets.map(async ({ month, budget }) => {
        const existing = await AffiliateBudget.findOne({
          where: { affiliate_id, year, month, company_id }
        });

        if (existing) {
          await existing.update({ budget });
          return existing;
        }

        return AffiliateBudget.create({
          affiliate_id, year, month, budget, company_id
        });
      })
    );

    res.json({ saved: results.length });
  } catch (error) {
    console.error('Error al guardar presupuestos:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

exports.getOne = async (req, res) => {
  try {
    const { company_id } = req.user;
    const budget = await AffiliateBudget.findOne({
      where: { id: req.params.id, company_id }
    });
    if (!budget) return res.status(404).json({ error: 'No encontrado' });
    res.json(budget);
  } catch (error) {
    console.error('Error al obtener presupuesto:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

exports.remove = async (req, res) => {
  try {
    const { company_id } = req.user;
    const rows = await AffiliateBudget.destroy({
      where: { id: req.params.id, company_id }
    });
    if (!rows) return res.status(404).json({ error: 'No encontrado' });
    res.status(204).end();
  } catch (error) {
    console.error('Error al eliminar presupuesto:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
};