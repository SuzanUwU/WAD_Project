const User = require('../models/user-model');
const bcrypt = require('bcryptjs');

// Email validation for SMU students only (public signup)
const studentEmailRegex = /^[^.]+\.\d{4}@([a-z0-9-]+\.)*smu\.edu\.sg$/i;
const adminEmailRegex = /^[^.]+\.\d{4}@admin\.smu\.edu\.sg$/i;

function isValidStudentEmail(email) {
    return studentEmailRegex.test(email);
}

// Generate sequential userId (S001, S002...)
async function generateStudentId() {
    const count = await User.countDocuments({ role: 'student' });
    return `S${(count + 1).toString().padStart(3, '0')}`;
}

// GET PAGES (unchanged)
const renderSignup = (req, res) => {
    res.render('signup', { error: null });
};

const renderLogin = (req, res) => {
    res.render('login', { error: null });
};

// FIXED SIGNUP
const signup = async (req, res) => {
    try {
        const { username, email, password } = req.body;
        console.log("Raw input:", req.body);
        
        // Trim inputs
        const cleanUsername = username?.trim();
        const cleanEmail = email?.trim().toLowerCase();
        
        // VALIDATE SMU STUDENT EMAIL ONLY
        if (!isValidStudentEmail(cleanEmail)) {
            return res.render('signup', { 
                error: 'Only SMU student emails (@*.smu.edu.sg) can register here. Admins must be created by Super Admin.' 
            });
        }
        
        // Check existing user
        const existingUser = await User.findOne({ 
            $or: [{ username: cleanUsername }, { email: cleanEmail }] 
        });
        
        if (existingUser) {
            return res.render('signup', { 
                error: 'Username or email already exists' 
            });
        }
        
        // GENERATE USER ID + HASH PASSWORD
        const userId = await generateStudentId();
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const newUser = new User({ 
            userId,
            username: cleanUsername,
            email: cleanEmail,
            password: hashedPassword,
            role: 'student'  // Public signup = students only
        });
        
        await newUser.save();
        console.log(`✅ Student created: ${userId} (${cleanEmail})`);
        
        res.render('login', { 
            success: `Account created! Welcome S${userId.slice(1)}. Please login.`,
            error: null 
        });
        
    } catch (error) {
        console.error("Signup ERROR:", error);
        res.render('signup', { error: 'Server error during signup.' });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;  // ✅ Changed from username to email
        console.log('Login attempt:', email);
        
        const user = await User.findOne({ email: email?.trim().toLowerCase() });  // ✅ Find by email
        
        if (!user) {
            return res.render('login', { 
                error: 'Email not found.', 
                success: null 
            });
        }
        
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.render('login', { 
                error: 'Incorrect password.', 
                success: null 
            });
        }
        
        // Session with role
        req.session.user = { 
            id: user._id, 
            userId: user.userId,
            username: user.username,
            email: user.email,
            role: user.role
        };
        
        console.log(`✅ Login: ${user.userId} (${user.role})`);
        res.redirect('/all-events');
        
    } catch (error) {
        console.error("Login ERROR:", error);
        res.render('login', { error: 'Server error during login.', success: null });
    }
};


module.exports = { renderSignup, renderLogin, signup, login };
