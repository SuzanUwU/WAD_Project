const User = require('../models/userModel');
const bcrypt = require('bcryptjs');

// Generate next admin ID (A001, A002...)
async function generateAdminId() {
  const count = await User.countDocuments({ role: 'admin' });
  return `A${(count + 1).toString().padStart(3, '0')}`;
}

// khin - added
exports.showCreateAdmin = (req, res) => {
  // SUPER ADMIN CHECK
  if (req.session.user?.role !== 'superadmin') {
    return res.redirect('/all-events');
  }

  res.render('suzan/superadmin/create-admin', {
    user: req.session?.user || null,
    error: null,
    success: null
  });
};

// Super Admin only: Create new admin
exports.createAdmin = async (req, res) => {
  try {
    // SUPER ADMIN CHECK

    console.log(req.body);

    if (req.session.user?.role !== 'superadmin') {
      return res.status(403).redirect('/events');
    }
    
    const { username, email, password, admin_type, scope } = req.body;

    // khin - added
    const finalAdminType = admin_type || (
      scope === "cca" ? "cca-admin" :
      scope === "career" ? "career-admin" :
      scope === "hack" ? "hack-admin" :
      scope === "ptjob" ? "ptjob-admin" :
      null
    );
    
    // Validate admin email
    const adminEmailRegex = /^[^.]+\.\d{4}@admin\.smu\.edu\.sg$/i;
    if (!adminEmailRegex.test(email)) {
      return res.render('suzan/superadmin/create-admin', { 
        error: 'Admin must use @admin.smu.edu.sg email',
        success: null,
        user: req.session?.user || null
});
    }
    
    // Check existing
    const existing = await User.findOne({ 
      $or: [{ username }, { email }] 
    });
    if (existing) {
      return res.render('suzan/superadmin/create-admin', { 
  error: 'Username or email already exists',
  success: null,
  user: req.session?.user || null
});
    }

    // VALIDATE admin_type
    if (!finalAdminType) {
      return res.render('suzan/superadmin/create-admin', {
  error: 'Please select a valid admin type',
  success: null,
  user: req.session?.user || null
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
      admin_type: finalAdminType   // 🔥 FIXED HERE
    });
    
    await newAdmin.save();
    console.log(`✅ Admin created: ${userId} (${finalAdminType})`);
    
    res.render('suzan/superadmin/create-admin', { 
  success: `Admin ${userId} created successfully! Type: ${finalAdminType}`,
  error: null,
  user: req.session?.user || null
});
    
  } catch (error) {
    console.error('Create admin error:', error);
   res.render('suzan/superadmin/create-admin', { 
  error: 'Server error. Try again.',
  success: null,
  user: req.session?.user || null
});
  }
};

// ================= LIST ADMINS =================
exports.listAdmins = async (req, res) => {
  try {
    const admins = await User.find({ role: { $in: ['admin', 'superadmin'] } })
      .select('userId username email admin_type createdAt');

    if (req.session.user.role === 'superadmin') {
      admins.splice(admins.findIndex(a => a.userId === 'A000'), 1);
    }

    res.render('suzan/superadmin/admins-settings', { 
      admins, 
      user: req.session?.user || null 
    });

  } catch (err) {
    res.status(500).send('Error fetching admins');
  }
};

// ================= EDIT ADMIN GET =================
exports.editAdminGet = async (req, res) => {
  try {
    if (req.session.user?.role !== 'superadmin') {
      return res.status(403).redirect('/all-events');
    }

    const admin = await User.findById(req.params.id).select('-password');

    if (!admin || admin.role !== 'admin' || admin.userId === 'A000') {
      return res.redirect('/superadmin/admins-settings?error=Admin not found');
    }

    res.render('suzan/superadmin/edit-admin', { 
      admin,
      user: req.session?.user || null,
      success: req.query.success || null,  
      error: null
    });

  } catch (err) {
    console.error('Edit admin get error:', err);
    res.redirect('/superadmin/admins-settings?error=Load failed');
  }
};

// ================= EDIT ADMIN POST =================
exports.editAdminPost = async (req, res) => {
  try {
    if (req.session.user?.role !== 'superadmin') {
      return res.status(403).redirect('/events');
    }

    const { username, email, admin_type } = req.body;

    if (!username || !email || !admin_type) {
      return res.render('suzan/superadmin/edit-admin', {
        admin: await User.findById(req.params.id).select('-password'),
        error: 'All fields required',
        user: req.session?.user || null
      });
    }

    const updatedAdmin = await User.findByIdAndUpdate(
      req.params.id,
      { 
        username: username.trim(),
        email: email.toLowerCase().trim(),
        admin_type
      },
      { runValidators: true, new: true }
    );

    if (!updatedAdmin || updatedAdmin.role !== 'admin') {
      throw new Error('Admin not found');
    }

    console.log(`✅ Admin updated: ${updatedAdmin.userId}`);
    res.redirect(`/superadmin/admins-settings/edit/${req.params.id}?success=1`);

  } catch (err) {
    console.error('Edit admin post error:', err);

    let errorMsg = 'Update failed';
    if (err.name === 'ValidationError') {
      errorMsg = Object.values(err.errors).map(e => e.message).join(', ');
    } else if (err.code === 11000) {
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

// ================= DELETE ADMIN =================
exports.deleteAdmin = async (req, res) => {
  try {
    if (req.session.user?.role !== 'superadmin') {
      return res.redirect('/all-events');
    }

    const admin = await User.findById(req.params.id);

    if (!admin || admin.role !== 'admin' || admin.userId === 'A000') {
      return res.redirect('/superadmin/admins-settings');
    }

    await User.findByIdAndDelete(req.params.id);
    console.log(`✅ Admin deleted: ${admin.userId}`);

    res.redirect('/superadmin/admins-settings');

  } catch (err) {
    console.error('Delete admin error:', err);
    res.redirect('/superadmin/admins-settings');
  }
};