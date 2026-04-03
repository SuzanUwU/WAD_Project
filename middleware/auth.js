// middleware/auth.js - Login/Role checks ONLY
const requireLogin = (req, res, next) => {
    // 1. Check if the user's session exists
    if (req.session && req.session.user) {
        return next();
    } else { return res.redirect('/login');}
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
