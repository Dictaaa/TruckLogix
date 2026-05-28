// src/routes/auth.routes.js
const { Router } = require('express');
const { body } = require('express-validator');
const validate = require('../middlewares/validate.middleware');
const ctrl = require('../controllers/auth.controller');

const router = Router();

router.post(
  '/register',
  validate([
    body('name').notEmpty().withMessage('Nombre requerido'),
    body('email').isEmail().withMessage('Email inválido'),
    body('password').isLength({ min: 6 }).withMessage('Mínimo 6 caracteres'),
  ]),
  ctrl.register
);

router.post(
  '/login',
  validate([
    body('email').isEmail().withMessage('Email inválido'),
    body('password').notEmpty().withMessage('Password requerido'),
  ]),
  ctrl.login
);

module.exports = router;
