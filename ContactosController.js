const ContactosModel = require('./ContactosModel');

class ContactosController {
    add(req, res) {
        const { email, name, comment } = req.body;
        const ip = req.ip;
        const date = new Date().toISOString();

        // Validar datos
        if (!email || !name || !comment) {
            return res.status(400).send('Todos los campos son obligatorios.');
        }

        const model = new ContactosModel();
        model.save({ email, name, comment, ip, date })
            .then(() => {
                res.send('Datos guardados con éxito.');
            })
            .catch(err => {
                console.error(err);
                res.status(500).send('Error al guardar los datos.');
            });
    }
}

module.exports = ContactosController;