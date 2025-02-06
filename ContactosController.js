require('dotenv').config(); // Load environment variables
const axios = require('axios'); // Import axios
const nodemailer = require('nodemailer'); // Import Nodemailer
const ContactosModel = require('./ContactosModel');

class ContactosController {
    async add(req, res) {
        const { email, name, comment, 'g-recaptcha-response': recaptchaResponse } = req.body;
        const ip = req.ip;
        const date = new Date().toISOString();

        // Validar datos
        if (!email || !name || !comment || !recaptchaResponse) {
            return res.status(400).send('Todos los campos son obligatorios.');
        }

        try {
            // Validar reCAPTCHA
            const secretKey = process.env.RECAPTCHA_SECRET_KEY; // Use environment variable
            const verificationResponse = await axios.post(`https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${recaptchaResponse}`);
            const verificationData = verificationResponse.data;

            if (!verificationData.success) {
                return res.status(400).send('Error de verificación de reCAPTCHA.');
            }

            // Obtener el país del usuario
            const geoResponse = await axios.get(`http://api.ipapi.com/api/${ip}?access_key=${process.env.IPAPI_ACCESS_KEY}`); // Use environment variable
            const country = geoResponse.data.country_name; // Cambia 'country_name' según la respuesta de la API

            const model = new ContactosModel();
            await model.save({ email, name, comment, ip, country, date }); // Almacenar el país

            // Configurar Nodemailer
            const transporter = nodemailer.createTransport({
                service: 'gmail', // Cambia esto según tu proveedor de correo
                auth: {
                    user: process.env.EMAIL_USER, // Use environment variable
                    pass: process.env.EMAIL_PASS // Use environment variable
                }
            });

            // Configurar el correo
            const mailOptions = {
                from: process.env.EMAIL_USER, // Use environment variable
                to: 'programacion2ais@dispostable.com', // Destinatarios
                subject: 'Nuevo formulario de contacto',
                text: `Nombre: ${name}\nCorreo: ${email}\nComentario: ${comment}\nIP: ${ip}\nPaís: ${country}\nFecha: ${date}`
            };

            // Enviar el correo
            await transporter.sendMail(mailOptions);

            res.send('Datos guardados con éxito y notificación enviada.');
        } catch (error) {
            console.error('Error al procesar la solicitud:', error);
            res.status(500).send('Error al procesar la solicitud.');
        }
    }

    async getAll(req, res) {
        const model = new ContactosModel();
        try {
            const contacts = await model.getAll();
            res.render('contactos', { contacts }); // Renderizar la vista con los contactos
        } catch (error) {
            console.error('Error al obtener contactos:', error);
            res.status(500).send('Error al obtener contactos.');
        }
    }
}

module.exports = ContactosController;
