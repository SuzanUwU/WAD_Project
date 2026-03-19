// server.js
const express = require("express");
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const path = require('path'); // ← ADD for views path
const multer = require('multer');

// routes
const eventRoutes = require('./routes/eventRoutes');
const authRoutes = require('./routes/authRoutes');

// Import Event model for quick test (optional, remove after testing)
const Event = require('./models/Event'); // ← ADD (assumes models/events.js exists)

const server = express();

server.use('/', authRoutes);  // Before eventRoutes
server.use('/events', eventRoutes);
server.use(express.static(path.join(__dirname, 'public'))); 
server.use(multer({ storage: multer.memoryStorage() }).any()); // image uploads
server.use(express.urlencoded({ extended: true })); // for form posting
server.use(express.json()); // express.json() is a middleware
server.use(express.static(path.join(__dirname, 'public')));
server.set("view engine", "ejs"); // Set EJS as the view engine for rendering dynamic HTML pages
server.set('views', path.join(__dirname, 'views')); // ← ADD: explicit views path

// root routes
server.use('/', eventRoutes);

// Specify the path to the environment variablef file 'config.env'
dotenv.config({ path: './config.env' });

// async function to connect to DB
async function connectDB() {
  try {
    // connecting to Database with our config.env file and DB is constant in config.env
    await mongoose.connect(process.env.DB);
    console.log("MongoDB connected successfully");

    // 🧪 QUICK TEST: Check if events data exists (remove after confirming)
    const testEvents = await Event.find();
    console.log(`📊 Found ${testEvents.length} events in DB`);
    if (testEvents.length > 0) {
      console.log('✅ First event:', testEvents[0]);
    } else {
      console.log('⚠️  No events – add some data to "events" collection');
    }

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
    console.log(`📱 Test: http://${hostname}:${port}/events`); // ← Better log
  });
}

// call connectDB first and when connection is ready we start the web server
connectDB().then(startServer);

// 🗑️ DELETE ALL BELOW HERE (old code):
// wait right here //
// Route to display main events page
// server.get("/events", async (req, res) => { ... });
// const hostname = "localhost";
// const port = 8000;
// server.listen(port, hostname, () => { ... });
