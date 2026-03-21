const express = require('express');
const User = require('../models/User');
const authController = require('../controllers/authController'); // added by John 21 March
const router = express.Router();

// John's section

// Expecting POST requests because we are sending sensitive form data
router.post('/signup', authController.signup);
router.post('/login', authController.login);

// GET requests to display the EJS pages
router.get('/signup', authController.renderSignup);
router.get('/login', authController.renderLogin);

// John end + comment out the rest

// // Signup GET
// router.get('/signup', (req, res) => {
//   res.render('signup', { error: null });
// });

// // Signup POST
// router.post('/signup', async (req, res) => {
//   try {
//     const { username, email, password } = req.body;
    
//     // Check if user exists
//     const existingUser = await User.findOne({ 
//       $or: [{ username }, { email }] 
//     });
    
//     if (existingUser) {
//       return res.render('signup', { 
//         error: 'Username or email already exists' 
//       });
//     }
    
//     // Create user
//     const user = new User({ username, email, password });
//     await user.save();
    
//     req.session.user = { id: user._id, username: user.username };
//     res.redirect('/events');
//   } catch (err) {
//     res.render('signup', { error: 'Signup failed' });
//   }
// });

// // Login GET
// router.get('/login', (req, res) => {
//   res.render('login', { error: null });
// });

// // Login POST
// router.post('/login', async (req, res) => {
//   try {
//     const { username, password } = req.body;
//     const user = await User.findOne({ username });
    
//     if (!user || !(await user.comparePassword(password))) {
//       return res.render('login', { error: 'Invalid credentials' });
//     }
    
//     req.session.user = { id: user._id, username: user.username };
//     res.redirect('/events');
//   } catch (err) {
//     res.render('login', { error: 'Login failed' });
//   }
// });

// // Logout
// router.get('/logout', (req, res) => {
//   req.session.destroy();
//   res.redirect('/events');
// });

module.exports = router;
