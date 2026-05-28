const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
//const Driver = require('../models/driver.model');
const { JWT_SECRET } = require('../config/envs');

function signToken(id) {
  return jwt.sign({ id }, JWT_SECRET, { expiresIn: '183d' });
}

exports.register = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const user = await User.create({ name, email, password });
    const token = signToken(user.id);

    res.status(201).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error('Error en el registro:', error);
    res.status(500).json({ error: 'Error al registrar el usuario' });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.scope('withPassword').findOne({
      where: { email },
      // include: [
      //   {
      //     model: Driver,
      //     as: 'driver',
      //     attributes: ['id'], 
      //   },
      // ],
    });

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const token = signToken(user.id);

    res.json({
      token,
      user: {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        role: user.role,
        company_id: user.company_id,
        //driver_id: user.driver?.id || null, 
      },
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
};
