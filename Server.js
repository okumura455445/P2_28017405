require('dotenv').config(); // Load environment variables

const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session'); // For session management
const MongoStore = require('connect-mongo'); // MongoDB session store
const passport = require('passport'); // For authentication
const bcrypt = require('bcrypt'); // For password hashing
const ContactosController = require('./ContactosController');
const GoogleStrategy = require('passport-google-oauth20').Strategy; // Google OAuth strategy

const ContactosModel = require('./ContactosModel');

const app = express();
const port = 3000;

const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = "mongodb+srv://Xang:64TClZp3H8Mc71cq@cluster0.ooi0f.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    await client.close();
  }
}
run().catch(console.dir);

// Set EJS as the view engine
app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// Set up session management
app.use(session({
    secret: 'loqsea', // Change this to a secure key
    resave: false,
    saveUninitialized: true,
    cookie: { 
        httpOnly: true,
        sameSite: 'strict',
        secure: process.env.NODE_ENV === 'production', // Set to true if using HTTPS
        maxAge: 15 * 60 * 1000 // 15 minutes expiration
    }
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

// Logout route
app.get('/logout', (req, res) => {
    req.logout((err) => {
        if (err) {
            return res.status(500).send('Error logging out.');
        }
        res.redirect('/login'); // Redirect to login after logout
    });
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

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/auth/google/callback"
}, async (accessToken, refreshToken, profile, done) => {
    const model = new ContactosModel();
    const user = await model.findUserByUsername(profile.id);
    if (user) {
        return done(null, user);
    } else {
        const newUser = {
            username: profile.displayName,
            password_hash: profile.id // Use Google ID as password_hash for simplicity
        };
        await model.registerUser(newUser.username, newUser.password_hash);
        return done(null, newUser);
    }
}));

app.get('/auth/google', passport.authenticate('google', {
    scope: ['profile', 'email']
}));

app.get('/auth/google/callback', 
    passport.authenticate('google', { failureRedirect: '/login' }),
    (req, res) => {
        res.redirect('/contactos'); // Successful authentication, redirect to contactos.
    });

app.listen(port, () => {
    console.log(`Servidor escuchando en http://localhost:${port}`);
});
