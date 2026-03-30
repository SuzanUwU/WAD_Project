// server.js
const express = require("express");
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const path = require('path');
const session = require('express-session');

// routes
const alleventRoutes = require('./routes/alleventRoutes');
const authRoutes = require('./routes/authRoutes');
const ccaRoutes = require('./routes/ccaRoutes');
const hackathonRoutes = require('./routes/hackathonRoutes')
superadminRoutes = require('./routes/superadminRoutes')

// middleware
const superadminController = require('./controllers/superadminController');
const { requireSuperAdmin } = require('./middleware/auth');  // Update middleware
const { requireLogin } = require('./middleware/auth');

const server = express();

server.use(express.static(path.join(__dirname, 'public'))); 
server.use(express.urlencoded({ extended: true })); // for form posting
server.use(express.json()); // express.json() is a middleware

// SESSION MUST BE BEFORE ROUTES
server.use(session({
    secret: process.env.SESSION_SECRET || 'keyboard-cat-secret-12345',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        maxAge: 1000 * 60 * 60 * 24,  // 24 hours
        secure: false  // true for HTTPS
    }
}));

server.use((req, res, next) => {
  res.locals.user = req.session?.user || null;
  next();
});

// ROUTES
server.use('/', authRoutes);  // Before eventRoutes
// Public API route — must be before requireLogin middleware so unauthenticated
// pages (e.g. signup) can fetch majors for the dynamic dropdown
server.get('/api/majors', require('./controllers/hackathonController').getMajorsBySchool);
// server.use('/events/hackathons', hackathonRoutes); // Ari
// server.use('/events', ccaRoutes); // Khin
// server.use('/events', eventRoutes);
server.use('/all-events', requireLogin, alleventRoutes);
server.use('/hack-events', requireLogin, hackathonRoutes); // Ari
server.use('/cca-events', requireLogin, ccaRoutes);
server.use('/superadmin', requireSuperAdmin, superadminRoutes);

server.get('/', (req, res) => { res.render('suzan/welcome', { user: req.session?.user || null}); } );

// server.get('/superadmin/create-admin', requireSuperAdmin, (req, res) => {
//   res.render('suzan/create-admin', { user: req.session.user });
// });
server.post('/superadmin/create-admin', requireSuperAdmin, superadminController.createAdmin);

server.set("view engine", "ejs"); // Set EJS as the view engine for rendering dynamic HTML pages
server.set('views', path.join(__dirname, 'views'));

// CONNECT TO MONGODB
dotenv.config({ path: './config.env' });
async function connectDB() {
  try {
    // connecting to Database with our config.env file and DB is constant in config.env
    await mongoose.connect(process.env.DB);
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  }
}

function startServer() {
  const hostname = "localhost";
  const port = 8000;

  // Start the server and listen on the specified hostname and port
  server.listen(port, hostname, () => {
    console.log(`Server running at http://${hostname}:${port}/`);
  });
}

// call connectDB first and when connection is ready we start the web server
connectDB().then(startServer);

