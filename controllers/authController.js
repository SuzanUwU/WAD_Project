const User = require('../models/user-model');
const bcrypt = require('bcryptjs');
const School = require('../models/school-model');

// Email validation for SMU students only (public signup)
const studentEmailRegex = /^[a-z0-9._-]+\.\d{4}@([a-z0-9-]+\.)*smu\.edu\.sg$/i;
const adminEmailRegex = /^[^.]+\.\d{4}@admin\.smu\.edu\.sg$/i;

function isValidStudentEmail(email) {
    return studentEmailRegex.test(email);
}

// Generate sequential userId and fill gaps (S001, S002...)
async function generateStudentId() {
    // 1. Fetch all existing student userIds from the database
    // We use .select() to only grab the ID field to save memory, and .lean() to make it faster
    const students = await User.find({ role: 'student' }).select('userId').lean();

    // 2. Extract the numbers from the IDs and sort them from lowest to highest
    // e.g., ['S003', 'S001'] becomes [1, 3]
    const existingNumbers = students
        .map(user => parseInt(user.userId.replace('S', ''), 10))
        .filter(num => !isNaN(num))
        .sort((a, b) => a - b);

    // 3. Loop through to find the lowest available gap
    let nextIdNumber = 1;
    for (let i = 0; i < existingNumbers.length; i++) {
        if (existingNumbers[i] === nextIdNumber) {
            // The number is taken, move to the next one
            nextIdNumber++;
        } else if (existingNumbers[i] > nextIdNumber) {
            // We found a gap! Break out of the loop early.
            break;
        }
    }

    // 4. Format the number back into the 'S001' string format
    return `S${nextIdNumber.toString().padStart(3, '0')}`;
}

// GET PAGES (unchanged)
const renderSignup = async (req, res) => {
    try {
        const schools = await School.find().sort({ displayName: 1 });
        res.render("signup", { error: null, schools }); // pass schools to EJS
    } catch (err) {
        console.error("Error loading schools:", err);
        res.status(500).send("Error loading schools");
    }
};

const renderLogin = (req, res) => {
    res.render('login', { error: null });
};

// FIXED SIGNUP
const signup = async (req, res) => {
    try {
        const { username, email, password, school, major, cfmpassword} = req.body;
        console.log("Raw input:", req.body);
        
        // Trim inputs
        const cleanUsername = username?.trim();
        const cleanEmail = email?.trim().toLowerCase();
        const cleanSchool = school?.trim();
        const cleanMajor = major?.trim();

        //Password match
        if (password != cfmpassword) {
            return res.render('signup', { error: 'Password does not match, try again.', username, email});
        }
        
        // Validate SMU student email
        if (!isValidStudentEmail(cleanEmail)) {
        const schools = await School.find().sort({ displayName: 1 });
            return res.render('signup', {
                error: 'Only SMU student emails (@*.smu.edu.sg) can register here.',
                schools, 
                username, email 
            });
        }

         // Validate school selected
        if (!cleanSchool) {
            const schools = await School.find().sort({ displayName: 1 });
            return res.render('signup', { error: 'Please select your school.', schools });
        }

        // Validate that school exists in DB and major belongs to it
        const schoolDoc = await School.findOne({ code: cleanSchool });
        if (!schoolDoc) {
            const schools = await School.find().sort({ displayName: 1 });
            return res.render('signup', { error: 'Selected school is invalid.', schools });
        }

        if (!cleanMajor) {
            const schools = await School.find().sort({ displayName: 1 });
            return res.render('signup', { error: 'Please select your major.', schools });
        }

        const majorExists = schoolDoc.majors.some(m => m.code === cleanMajor);
        if (!majorExists) {
            const schools = await School.find().sort({ displayName: 1 });
            return res.render('signup', { error: 'Selected major is invalid for your school.', schools });
        }
        
        // Check existing user
        const existingUser = await User.findOne({ 
            $or: [{ username: cleanUsername }, { email: cleanEmail }] 
        });
        
        if (existingUser) {
            return res.render('signup', { 
                error: 'Username or email already exists', username, email 
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
            school: cleanSchool,
            major: cleanMajor,
            role: 'student'  // Public signup = students only
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
                success: null,
                email
            });
        }
        
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.render('login', { 
                error: 'Incorrect password.', 
                success: null,
                email
            });
        }

        // Resolve display names for school and major from the School collection
        let schoolName = user.school;
        let majorName  = user.major;

        const schoolDoc = await School.findOne({ code: user.school });
        if (schoolDoc) {
            schoolName = schoolDoc.fullName;
            const majorDoc = schoolDoc.majors.find(m => m.code === user.major);
            if (majorDoc) majorName = majorDoc.name;
        }
        
        // Session with role
        req.session.user = { 
            id: user._id, 
            userId: user.userId,
            username: user.username,
            email: user.email,
            role: user.role,
            school: user.school, // e.g. "scis"
            major: user.major, // e.g. "ba"
            schoolName, // full name e.g. "School of Computing & Information Systems"
            majorName   // full name e.g. "Business Analytics"
        };
        
        console.log(`✅ Login: ${user.userId} (${user.role} - ${schoolName} / ${majorName})`);
        res.redirect('/all-events');
        
    } catch (error) {
        console.error("Login ERROR:", error);
        res.render('login', { error: 'Server error during login.', success: null });
    }
};


module.exports = { renderSignup, renderLogin, signup, login };
