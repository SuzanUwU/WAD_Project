const User = require('../models/User');

// GET PAGES (Display the forms)
const renderSignup = (req, res) => {
    res.render('signup'); 
};

const renderLogin = (req, res) => {
    res.render('login');
};

// Form Handling
const signup = async (req, res) => {
    try {
        // console.log("ENTIRE REQUEST BODY:", req.body);
        const { userName, email, password } = req.body;
    
        const newUser = new User({ userName, email, password });
        await newUser.save();
        
        res.render('signup', { success: 'User created successfully! You can now log in.' });
    } catch (error) {
        console.error("Signup Error:", error);
        res.render('signup', { error: 'Error creating user. Username or Email might already exist.' });
    }
};

const login = async (req, res) => {
    try {
        // console.log("ENTIRE REQUEST BODY:", req.body);
        const { userName, password } = req.body;
        const user = await User.findOne({ userName });
        
        if (!user) {
            return res.render('login', { error: 'User not found.' });
        }

        // FIX 2: Use the built-in method from your User.js model
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.render('login', { error: 'Incorrect password.' });
        }

        res.send('Login successful!');
        res.redirect('/events');
    } catch (error) {
        console.error("Login Error:", error);
        res.render('login', { error: 'Server error during login.' });
    }
};

module.exports = { renderSignup, renderLogin, signup, login };