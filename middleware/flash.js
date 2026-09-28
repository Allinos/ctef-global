// Minimal session-based one-shot flash message, avoids pulling in connect-flash.
module.exports = function flash(req, res, next) {
  res.locals.flash = req.session.flash || null;
  delete req.session.flash;
  req.flash = (type, message) => {
    req.session.flash = { type, message };
  };
  next();
};
