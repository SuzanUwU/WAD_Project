// middleware/auth.js - Login/Role checks ONLY
const requireLogin = (req, res, next) => {
  if (req.session?.user) return next();
  res.redirect('/');
};

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


module.exports = { requireLogin, requireAdmin, requireSuperAdmin };
