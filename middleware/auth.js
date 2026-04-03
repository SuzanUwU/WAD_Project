// middleware/auth.js - Login/Role checks ONLY
const requireLogin = (req, res, next) => {
  if (req.session?.user) return next();
  res.redirect('/');
};

// need to check by admin type
const requireAdmin = (req, res, next) => {
  if (req.session?.user?.role === 'admin' || req.session?.user?.role === 'superadmin') {
    return next();
  }
  res.redirect('/');
};

const requireSuperAdmin = (req, res, next) => {
  if (req.session?.user?.role === 'superadmin') {
    return next();
  }
  res.redirect('/all-events');
};

// Same for others
const requireCcaAdmin = (req, res, next) => {
  const user = req.session?.user;
  if (user?.role === 'superadmin' || user?.admin_type === 'cca-admin') {
    return next();
  }
  res.redirect('/all-events');
};

// middleware/auth.js - FRIENDLY ERROR MESSAGES
const requireHackAdmin = (req, res, next) => {
  const user = req.session?.user;
  if (user?.role === 'superadmin' || user?.admin_type === 'hack-admin') {
    return next();
  }
  res.redirect('/all-events');
};

const requirePtjobAdmin = (req, res, next) => {
  const user = req.session?.user;
  if (user?.role === 'superadmin' || user?.admin_type === 'ptjob-admin') {
    return next();
  }
  res.redirect('/events/part-time-jobs');
};

const requireCareerAdmin = (req, res, next) => {
  const user = req.session?.user;
  if (user?.role === 'superadmin' || user?.admin_type === 'career-admin') {
    return next();
  }
  res.redirect('/all-events');
};

// 🔥 BONUS: Generic admin_type check
const requireAdminType = (allowedTypes) => {
  return (req, res, next) => {
    const user = req.session?.user;
    if (user?.role === 'superadmin' || allowedTypes.includes(user?.admin_type)) {
      return next();
    }
    res.redirect('/all-events');
  };
};

module.exports = { 
  requireLogin, 
  requireAdmin, 
  requireSuperAdmin,
  requireCcaAdmin,
  requireHackAdmin, 
  requirePtjobAdmin,
  requireCareerAdmin,
  requireAdminType  // Flexible: requireAdminType(['cca-admin', 'hack-admin'])
};

// Use like this later in server.js or routes
// // routes/ccaRoutes.js
// router.get('/cca-events', requireCcaAdmin, ccaController.listEvents);

// // routes/hackRoutes.js  
// router.post('/hack/create', requireHackAdmin, hackController.create);

// // Flexible usage
// router.get('/admin-dashboard', 
//   requireAdminType(['cca-admin', 'hack-admin']), 
//   adminController.dashboard
// );
