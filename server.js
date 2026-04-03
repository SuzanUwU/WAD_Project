const express = require("express");
const dotenv = require('dotenv');
dotenv.config({ path: './config.env' });

const mongoose = require('mongoose');
const path = require('path');
const session = require('express-session');

// routes
const alleventRoutes = require('./routes/alleventRoutes');
const authRoutes = require('./routes/authRoutes');
const ccaRoutes = require('./routes/ccaRoutes');
const hackathonRoutes = require('./routes/hackathonRoutes');
const superadminRoutes = require('./routes/superadminRoutes');
const profileRoutes = require('./routes/profileRoutes')
const careerRoutes = require('./routes/careerRoutes')

// part-time jobs routes
const JobRoutes=require('./routes/jobRoutes')
const ApplicationRoutes = require('./routes/applicationRoutes')

// middleware
const superadminController = require('./controllers/superadminController');
const { requireSuperAdmin, requireLogin } = require('./middleware/auth');

const server = express();

// ================= MIDDLEWARE =================
server.use(express.static(path.join(__dirname, 'public')));
server.use(express.urlencoded({ extended: true }));
server.use(express.json());

// SESSION
server.use(session({
  secret: process.env.SESSION_SECRET || 'keyboard-cat-secret-12345',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24,
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

<<<<<<< HEAD
// for index.html to be the home page
server.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

=======
>>>>>>> origin/friday-latest-khin-yujia
// hackathon API (IMPORTANT: before login)
server.get('/api/majors', require('./controllers/hackathonController').getMajorsBySchool);

// protected routes
server.use('/all-events', alleventRoutes);//landing page
server.use('/hack-events', requireLogin, hackathonRoutes);
server.use('/cca-events', requireLogin, ccaRoutes);
server.use('/dashboard',requireLogin,profileRoutes);
server.use('/career-events', requireLogin, careerRoutes);

// part-time jobs
server.use('/events', requireLogin,JobRoutes);
server.use('/events',requireLogin,ApplicationRoutes);

// superadmin
server.use('/superadmin', requireSuperAdmin, superadminRoutes);
server.post('/superadmin/create-admin', requireSuperAdmin, superadminController.createAdmin);

// homepage
server.get('/', (req, res) => {
  res.render('welcome', { user: req.session?.user || null });
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
  });
}

connectDB().then(startServer);