const express = require('express');
const bodyParser = require('body-parser');
const ContactosController = require('./ContactosController');

const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

app.post('/contact', (req, res) => {
    const controller = new ContactosController();
    controller.add(req, res);
});

app.listen(port, () => {
    console.log(`Servidor escuchando en http://localhost:${port}`);
});