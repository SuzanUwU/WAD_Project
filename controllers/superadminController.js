const User = require('../models/user-model');
const bcrypt = require('bcryptjs');

// Generate next admin ID (A001, A002...)
async function generateAdminId() {
  const count = await User.countDocuments({ role: 'admin' });
  return `A${(count + 1).toString().padStart(3, '0')}`;
}

// Super Admin only: Create new admin
exports.createAdmin = async (req, res) => {
  try {
    // SUPER ADMIN CHECK
    if (req.session.user?.role !== 'superadmin') {
      return res.status(403).redirect('/events');
    }
    
    const { username, email, password, scope } = req.body;
    
    // Validate admin email
    const adminEmailRegex = /^[^.]+\.\d{4}@admin\.smu\.edu\.sg$/i;
    if (!adminEmailRegex.test(email)) {
      return res.render('suzan/superadmin/create-admin', { 
        error: 'Admin must use @admin.smu.edu.sg email' 
      });
    }
    
    // Check existing
    const existing = await User.findOne({ 
      $or: [{ username }, { email }] 
    });
    if (existing) {
      return res.render('suzan/superadmin/create-admin', { 
        error: 'Username or email already exists' 
      });
    }
    
    // Generate ID + hash password
    const userId = await generateAdminId();
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const newAdmin = new User({
      userId,
      username: username.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role: 'admin',
      scope  // cca, hackathons, etc.
    });
    
    await newAdmin.save();
    console.log(`✅ Admin created: ${userId} (${scope})`);
    
    res.render('suzan/superadmin/create-admin', { 
      success: `Admin ${userId} created successfully! Scope: ${scope}` 
    });
    
  } catch (error) {
    console.error('Create admin error:', error);
    res.render('suzan/superadmin/create-admin', { 
      error: 'Server error. Try again.' 
    });
  }
};

// EDIT ADMIN AND DELETE ADMIN

exports.listAdmins = async (req, res) => {
  try {
    const admins = await User.find({ role: { $in: ['admin', 'superadmin'] } }).select('userId username email');  // Exclude self or adjust
    if (req.session.user.role === 'superadmin') {
      admins.splice(admins.findIndex(a => a.userId === 'A000'), 1);  // Hide superadmin (A000)
    }
    res.render('suzan/superadmin/admins-settings', { admins, user: req.session?.user || null });
  } catch (err) {
    res.status(500).send('Error fetching admins');
  }
};

// EDIT ADMIN GET - Load form with admin data
exports.editAdminGet = async (req, res) => {
  try {
    // SUPER ADMIN CHECK
    if (req.session.user?.role !== 'superadmin') {
      return res.status(403).redirect('/all-events');
    }

    const admin = await User.findById(req.params.id).select('-password'); // Exclude password
    if (!admin || admin.role !== 'admin' || admin.userId === 'A000') {
      return res.redirect('/superadmin/admins-settings?error=Admin not found');
    }

    res.render('suzan/superadmin/edit-admin', { 
      admin, 
      user: req.session?.user || null 
    });
  } catch (err) {
    console.error('Edit admin get error:', err);
    res.redirect('/superadmin/admins-settings?error=Load failed');
  }
};

// EDIT ADMIN POST - Update admin
exports.editAdminPost = async (req, res) => {
  try {
    // SUPER ADMIN CHECK
    if (req.session.user?.role !== 'superadmin') {
      return res.status(403).redirect('/events');
    }

    const { username, email, admin_type } = req.body; // admin_type from form (your schema field)

    // Basic validation
    if (!username || !email || !admin_type) {
      return res.render('suzan/superadmin/edit-admin', {
        admin: await User.findById(req.params.id).select('-password'),
        error: 'All fields required',
        user: req.session?.user || null
      });
    }

    // Update (Mongoose validates unique fields)
    const updatedAdmin = await User.findByIdAndUpdate(
      req.params.id,
      { 
        username: username.trim(),
        email: email.toLowerCase().trim(),
        admin_type  // Matches your schema enum
      },
      { runValidators: true, new: true } // Validate on update
    );

    if (!updatedAdmin || updatedAdmin.role !== 'admin') {
      throw new Error('Admin not found');
    }

    console.log(`✅ Admin updated: ${updatedAdmin.userId}`);
    res.redirect(`/superadmin/admins-settings/edit/${req.params.id}?success=1`);
  } catch (err) {
    console.error('Edit admin post error:', err);

    // Handle Mongoose validation errors (unique violations)
    let errorMsg = 'Update failed';
    if (err.name === 'ValidationError') {
      errorMsg = Object.values(err.errors).map(e => e.message).join(', ');
    } else if (err.code === 11000) { // MongoDB duplicate key
      errorMsg = 'Username or email already exists';
    }

    const admin = await User.findById(req.params.id).select('-password');
    res.render('suzan/superadmin/edit-admin', {
      admin,
      error: errorMsg,
      user: req.session?.user || null
    });
  }
};

// DELETE ADMIN - AJAX endpoint
exports.deleteAdmin = async (req, res) => {
  try {
    // SUPER ADMIN CHECK (AJAX)
    if (req.session.user?.role !== 'superadmin') {
      return res.json({ success: false, msg: 'Unauthorized' });
    }

    const admin = await User.findById(req.params.id);
    if (!admin || admin.role !== 'admin' || admin.userId === 'A000') {
      return res.json({ success: false, msg: 'Cannot delete this admin' });
    }

    await User.findByIdAndDelete(req.params.id);
    console.log(`✅ Admin deleted: ${admin.userId}`);
    res.json({ success: true, msg: `Admin ${admin.userId} deleted` });
  } catch (err) {
    console.error('Delete admin error:', err);
    res.json({ success: false, msg: 'Delete failed' });
  }
};
