// controllers/authController.js - REWRITTEN FOR PROPER MVC PATTERN

const User = require('../models/userModel');  // [web:7][web:8] - Model handles business logic
const School = require('../models/school-model');  // Minimal use - only for rendering

// Pure render functions - NO business logic [MVC: Controller → View]
const renderSignup = async (req, res) => {
    try {
        const schools = await School.find().sort({ displayName: 1 });
        res.render("signup", { error: null, schools });  // IMPACT: Same as before
    } catch (err) {
        console.error("Error loading schools:", err);
        res.status(500).send("Error loading schools");
    }
};

const renderLogin = (req, res) => {
    res.render('login', { error: null });  // No change
};

// POST /signup - THINNER: Delegate to model [web:8][web:12]
const signup = async (req, res) => {
    try {
        const { username, email, password, confirmPassword, school, major } = req.body;  // Fixed: cfmpassword → confirmPassword
        console.log("Raw input:", req.body);

        // Minimal input cleaning (controller responsibility)
        const cleanData = {
            username: username?.trim(),
            email: email?.trim().toLowerCase(),
            password,
            school: school?.trim(),
            major: major?.trim()
        };

        const newUser = await User.createStudentUser(cleanData);  // *** NEW MODEL METHOD ***

        console.log(`✅ Student created: ${newUser.userId} (${newUser.email})`);
        
        // Same success render
        res.render('signupsuccess', { 
            success: `Account created! Welcome ${cleanData.username}. Please login.`,
            error: null,
            targetUrl: '/login'
        });

    } catch (error) {
        console.error("Signup ERROR:", error.message);  // More specific now
        
        // CHANGE: If model error specifies "load schools", fetch them
        let schools = [];
        if (error.message.includes('schools') || error.message.includes('major')) {
            schools = await School.find().sort({ displayName: 1 });
        }
        
        res.render('signup', { 
            error: error.message,  // Model provides user-friendly message
            schools,
            username: req.body.username,
            email: req.body.email 
        });
    }
};

// POST /login - Slightly simplified [No major changes needed]
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log('Login attempt:', email);

        const user = await User.findOne({ email: email?.trim().toLowerCase() });
        if (!user) {
            return res.render('login', { 
                error: 'Email not found.', 
                email 
            });
        }
        
        const isMatch = await user.comparePassword(password);  // Model method - unchanged
        if (!isMatch) {
            return res.render('login', { 
                error: 'Incorrect password.', 
                email 
            });
        }

        // SIMPLIFIED: Let model provide formatted profile data
        const profile = await user.getProfileInfo();  // *** NEW MODEL METHOD *** 
        // Returns: { schoolName, majorName, admin_type (derived from scope) }

        // Session population - controller responsibility
        req.session.user = {
            id: user._id,
            userId: user.userId,
            username: user.username,
            email: user.email,
            role: user.role,
            school: user.school,
            major: user.major,
            schoolName: profile.schoolName,
            majorName: profile.majorName,
            admin_type: profile.admin_type  // From model logic
        };

        console.log(`✅ Login: ${user.userId} (${user.role} - ${profile.schoolName} / ${profile.majorName})`);
        res.redirect('/all-events');  // IMPACT: Same redirect

    } catch (error) {
        console.error("Login ERROR:", error);
        res.render('login', { error: 'Server error during login.' });
    }
};

// controllers/authController.js - ADD THIS METHOD
const logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
      return res.status(500).send('Logout failed');
    }
    console.log('✅ Session destroyed');
    res.redirect('/all-events');  // Or '/index.html'
  });
};

module.exports = { renderSignup, renderLogin, signup, login, logout };  // Unchanged exports [web:7]
