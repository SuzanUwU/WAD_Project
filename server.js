const express = require("express");
const dotenv = require('dotenv');
dotenv.config({ path: './config.env' });

// // sendgrid import
// const sgMail = require("@sendgrid/mail");

// // ================= SENDGRID SETUP =================
// sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const mongoose = require('mongoose');
const path = require('path');
const session = require('express-session');

// routes
const alleventRoutes = require('./routes/alleventRoutes');
const authRoutes = require('./routes/authRoutes');
const ccaRoutes = require('./routes/ccaRoutes');
const hackathonRoutes = require('./routes/hackathonRoutes');
const superadminRoutes = require('./routes/superadminRoutes');

// middleware
const superadminController = require('./controllers/superadminController');
const { requireSuperAdmin, requireLogin } = require('./middleware/auth');

const server = express();


// ================= MIDDLEWARE =================
server.use(express.urlencoded({ extended: true }));
server.use(express.json());
server.use(express.static(path.join(__dirname, 'public')));

// SESSION MUST COME BEFORE ROUTES
server.use(session({
  secret: process.env.SESSION_SECRET || 'keyboard-cat-secret-12345',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24, // 24 hours
    secure: false
  }
}));

// make user available in ALL EJS
server.use((req, res, next) => {
  res.locals.user = req.session?.user || null;
  next();
});


// ================= VIEW ENGINE =================
server.set("view engine", "ejs");
server.set('views', path.join(__dirname, 'views'));


// ================= ROUTES =================
server.use('/', authRoutes);

server.use('/all-events', requireLogin, alleventRoutes);
server.use('/cca-events', requireLogin, ccaRoutes);
server.use('/hack-events', requireLogin, hackathonRoutes);

server.use('/superadmin', requireSuperAdmin, superadminRoutes);

// superadmin action
server.post(
  '/superadmin/create-admin',
  requireSuperAdmin,
  superadminController.createAdmin
);

// homepage
server.get('/', (req, res) => {
  res.render('suzan/welcome', { user: req.session?.user || null });
});

// ================= DATABASE =================
async function connectDB() {
  try {
    await mongoose.connect(process.env.DB);
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  }
}


// ================= START SERVER =================
function startServer() {
  const hostname = "localhost";
  const port = 8000;

  server.listen(port, hostname, () => {
    console.log(`Server running at http://${hostname}:${port}/`);
    console.log(`📱 Test: http://${hostname}:${port}/all-events`);
  });
}

connectDB().then(startServer);