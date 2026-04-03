const User = require('../models/user-model');
const School = require('../models/school-model');

const studentEmailRegex = /^[a-z0-9._-]+\.\d{4}@([a-z0-9-]+\.)*smu\.edu\.sg$/i;

function isValidStudentEmail(email) {
    return studentEmailRegex.test(email);
}

// GET PAGES
const renderSignup = async (req, res) => {
    try {
        const schools = await School.find().sort({ displayName: 1 });
        res.render("signup", { error: null, schools });
    } catch (err) {
        console.error("Error loading schools:", err);
        res.status(500).send("Error loading schools");
    }
};

const renderLogin = (req, res) => {
    res.render('login', { error: null });
};

// POST /signup
const signup = async (req, res) => {
    try {
        const { username, email, password, school, major, cfmpassword } = req.body;
        
        const cleanUsername = username?.trim();
        const cleanEmail = email?.trim().toLowerCase();
        const cleanSchool = school?.trim();
        const cleanMajor = major?.trim();

        const renderError = async (errorMessage) => {
            const schools = await School.find().sort({ displayName: 1 }).catch(() => []);
            return res.render('signup', { error: errorMessage, schools, username, email });
        };

        if (password !== cfmpassword) return renderError('Password does not match, try again.');
        if (!isValidStudentEmail(cleanEmail)) return renderError('Only SMU student emails (@*.smu.edu.sg) can register here.');
        if (!cleanSchool) return renderError('Please select your school.');
        if (!cleanMajor) return renderError('Please select your major.');

        const schoolDoc = await School.findOne({ code: cleanSchool });
        if (!schoolDoc) return renderError('Selected school is invalid.');
        
        const majorExists = schoolDoc.majors.some(m => m.code === cleanMajor);
        if (!majorExists) return renderError('Selected major is invalid for your school.');

        const existingUser = await User.findOne({
            $or: [{ username: cleanUsername }, { email: cleanEmail }]
        });
        if (existingUser) return renderError('Username or email already exists.');

        const userId = await User.generateNextStudentId(); 
        
        const newUser = new User({
            userId,
            username: cleanUsername,
            email: cleanEmail,
            password: password, 
            school: cleanSchool,
            major: cleanMajor,
            role: 'student'
        });

        await newUser.save();
        console.log(`✅ Student created: ${userId} (${cleanEmail})`);
        
        res.render('signupsuccess', { 
            success: `Account created! Welcome ${username}. Please login.`,
            error: null,
            targetUrl: '/login'
        });

    } catch (error) {
        console.error("Signup ERROR:", error);
        const schools = await School.find().sort({ displayName: 1 }).catch(() => []);
        res.render('signup', { error: 'Server error during signup.', schools });
    }
};

// POST /login
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const cleanEmail = email?.trim().toLowerCase();

        const user = await User.authenticateUser(cleanEmail, password);
        
        if (!user) {
            return res.render('login', { 
                error: 'Invalid email or password.', 
                success: null,
                email: cleanEmail
            });
        }

        let schoolName = user.school;
        let majorName  = user.major;

        const schoolDoc = await School.findOne({ code: user.school });
        if (schoolDoc) {
            schoolName = schoolDoc.fullName;
            const majorDoc = schoolDoc.majors.find(m => m.code === user.major);
            if (majorDoc) majorName = majorDoc.name;
        }

        req.session.user = {
            id:         user._id,
            userId:     user.userId,
            username:   user.username,
            email:      user.email,
            role:       user.role,
            school:     user.school,
            major:      user.major,
            schoolName,
            majorName
        };

        console.log(`✅ Login: ${user.userId} (${user.role} - ${schoolName} / ${majorName})`);
        res.redirect('/all-events');

    } catch (error) {
        console.error("Login ERROR:", error);
        res.render('login', { error: 'Server error during login.', success: null });
    }
};

module.exports = { renderSignup, renderLogin, signup, login };