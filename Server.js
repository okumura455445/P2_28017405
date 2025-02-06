const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session'); // For session management
const passport = require('passport'); // For authentication
const bcrypt = require('bcrypt'); // For password hashing
const ContactosController = require('./ContactosController');
const ContactosModel = require('./ContactosModel');

const app = express();
const port = 3000;

// Set EJS as the view engine
app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// Set up session management
app.use(session({
    secret: 'your_secret_key', // Change this to a secure key
    resave: false,
    saveUninitialized: true
}));

// Initialize passport for authentication
app.use(passport.initialize());
app.use(passport.session());

// Define authentication middleware
function isAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/login'); // Redirect to login if not authenticated
}

// Login route
app.get('/login', (req, res) => {
    res.render('index', { title: 'Login' }); // Render the index.ejs for login
});

// Handle login
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const model = new ContactosModel();
    const user = await model.findUserByUsername(username);
    
    if (user && await bcrypt.compare(password, user.password_hash)) {
        req.login(user, (err) => {
            if (err) {
                return res.status(500).send('Error logging in.');
            }
            return res.redirect('/contactos');
        });
    } else {
        res.status(401).send('Invalid credentials.');
    }
});

// Registration route
app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    const model = new ContactosModel();
    const passwordHash = await bcrypt.hash(password, 10);
    
    try {
        await model.registerUser(username, passwordHash);
        res.redirect('/login');
    } catch (error) {
        res.status(500).send('Error registering user.');
    }
});

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

app.post('/contact', (req, res) => {
    const controller = new ContactosController();
    controller.add(req, res);
});

// New route for protected contacts view
app.get('/contactos', isAuthenticated, (req, res) => {
    const controller = new ContactosController();
    controller.getAll(req, res);
});

app.listen(port, () => {
    console.log(`Servidor escuchando en http://localhost:${port}`);
});
