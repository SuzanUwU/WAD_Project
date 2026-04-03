const User = require('../models/userModel');
const bcrypt = require('bcryptjs');

// --- SMU Email Validation ---
const studentEmailRegex = /^[a-z0-9._-]+\.\d{4}@([a-z0-9-]+\.)*smu\.edu\.sg$/i;

function isValidStudentEmail(email) {
    return studentEmailRegex.test(email);
}

// --- Helper function to ensure user is logged in ---
const checkSession = (req, res) => {
    if (!req.session || !req.session.user) {
        res.redirect('/login');
        return false;
    }
    return true;
};

// --- GET: Render the Settings Page ---
const renderSettings = async (req, res) => {
    if (!checkSession(req, res)) return;

    try {
        const user = await User.findById(req.session.user.id);
        // Updated to render 'usersettings'
        res.render('usersettings', { user, error: null, success: null }); 
    } catch (error) {
        console.error("Error loading settings:", error);
        res.redirect('/all-events');
    }
};

// --- POST: Update Username & Email ---
const updateProfile = async (req, res) => {
    if (!checkSession(req, res)) return;

    try {
        const { username, email } = req.body;
        const userId = req.session.user.id;
        const cleanUsername = username?.trim();
        const cleanEmail = email?.trim().toLowerCase();
        
        const user = await User.findById(userId);

        // 1. REGEX CHECK: Validate SMU student email only
        if (!isValidStudentEmail(cleanEmail)) {
            return res.render('usersettings', { 
                user, // Pass the user back so the form doesn't go blank
                error: 'Only SMU student emails (@*.smu.edu.sg) are allowed.', 
                success: null 
            });
        }

        // 2. Check if the new username/email is already taken by SOMEONE ELSE
        const existingUser = await User.findOne({
            $or: [{ username: cleanUsername }, { email: cleanEmail }],
            _id: { $ne: userId } // Exclude the current user from this check!
        });

        if (existingUser) {
            return res.render('usersettings', { 
                user, 
                error: 'Username or Email is already taken by another user.', 
                success: null 
            });
        }

        // 3. Update the user in the database
        user.username = cleanUsername;
        user.email = cleanEmail;
        await user.save();

        // 4. Update the session so the website remembers their new name
        req.session.user.username = cleanUsername;
        req.session.user.email = cleanEmail;

        res.render('usersettings', { user, success: 'Profile updated successfully!', error: null });

    } catch (error) {
        console.error("Profile Update Error:", error);
        const user = await User.findById(req.session.user.id);
        res.render('usersettings', { user, error: 'Server error updating profile.', success: null });
    }
};

// --- POST: Update Password ---
const updatePassword = async (req, res) => {
    if (!checkSession(req, res)) return;

    try {
        const { currentPassword, newPassword, confirmNewPassword } = req.body;
        const user = await User.findById(req.session.user.id);

        if (newPassword !== confirmNewPassword) {
            return res.render('usersettings', { user, error: 'New passwords do not match.', success: null });
        }

        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
            return res.render('usersettings', { user, error: 'Incorrect current password.', success: null });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        user.password = hashedPassword;
        await user.save();

        res.render('usersettings', { user, success: 'Password updated successfully!', error: null });

    } catch (error) {
        console.error("Password Update Error:", error);
        const user = await User.findById(req.session.user.id);
        res.render('usersettings', { user, error: 'Server error updating password.', success: null });
    }
};

// --- POST: Delete Account ---
const deleteAccount = async (req, res) => {
    if (!checkSession(req, res)) return;

    try {
        const userId = req.session.user.id;
        
        await User.findByIdAndDelete(userId);
        req.session.destroy();
        
        res.redirect('/signup'); 
        
    } catch (error) {
        console.error("Delete Account Error:", error);
        const user = await User.findById(req.session.user.id);
        res.render('usersettings', { user, error: 'Server error deleting account. Please try again later.', success: null });
    }
};

module.exports = { renderSettings, updateProfile, updatePassword, deleteAccount };