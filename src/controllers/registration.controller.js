const Company = require('../models/company.model');
const User = require('../models/user.model');

exports.register = async (req, res) => {
  let  {
    company,  // objeto con datos de la empresa (puede ser null si es solo usuario)
    user,     // objeto con datos del usuario
  } = req.body;

  try {
    let companyCreated = null;

    if (!company) {
      company = {
        name: `${user.first_name} ${user.last_name}`,
        nit: user.document_number,
        email_id: 1,
        locations_id: user.city || null, // Asegúrate de que 'city' esté disponible en user
        status: 1
      };
    }

    // Si envían datos de company, creamos la empresa primero
    if (company) {
      companyCreated = await Company.create(company);
    }

    // Creamos el usuario, asignando company_id si se creó company
    if (companyCreated) {
      user.company_id = companyCreated.id;
    }

    const userCreated = await User.create(user);

    // Excluir password en respuesta (por default está excluido con defaultScope)
    res.status(201).json({ company: companyCreated, user: userCreated });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error en el registro' });
  }
};
