const async = require('async');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const passport = require('passport');
const User = require('../models/User');
const pusher = require('../pusherobj/pusher');
//mealpal stuff
var timeoutlog;
let transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'yunchuwang5@gmail.com',
    pass: 'nininini'
  }
});
/**
* GET /login
* Login page.
*/
exports.getLogin = (req, res) => {
  if (req.user) {
    if(req.user.activated) {
      res.status(200).send({status:"pass"});
    } else {
      res.status(200).send({status:"fail"});
    }
  } else {
    res.status(200).send({status:"fail"});
  }
};

/**
* POST /login
* Sign in using email and password.
*/
exports.postLogin = (req, res, next) => {
  passport.authenticate('local',  (err, user, info) => {
    if (err) {
      console.log(info);
      res.status(200).send({status:"fail",error:info.msg});
      return next(err);
    }
    if (!user) {
      res.status(200).send({status:"fail",error:info.msg});
      return next(err);
    }
    req.logIn(user, (err) => {
      if (err) {
        // console.log("sss");
        res.status(200).send({status:"fail",error:"internal server error"});
        return next(err);
      }
      // res.redirect(req.session.returnTo || '/');
      // console.log("paklsdjaskldjaskljdlasass");
      timeoutlog = setTimeout(()=> {
        pusher.trigger('logout-channel', 'logout-event', {
          "message": "logout"
        }
      )
    },5990000);
    res.status(200).send({status:"pass"});
    return next();
  });
})(req, res, next);
};

/**
* GET /logout
* Log out.
*/
exports.logout = (req, res, next) => {
  req.session.destroy(function (err) {
    return next(err); //Inside a callback… bulletproof!
  });
  clearTimeout(timeoutlog);
  res.status(200).send({status:"pass"});
};

/**
* GET /signup
* Signup page.
*/
// exports.getSignup = (req, res) => {
//   if (req.user) {
//     return res.redirect('/');
//   }
//   res.render('account/signup', {
//     title: 'Create Account'
//   });
// };

/**
* POST /signup
* Create a new local account.
*/
exports.postSignup = (req, res, next) => {
  // req.assert('email', 'Email is not valid').isEmail();
  // req.assert('password', 'Password must be at least 4 characters long').len(4);
  // req.assert('confirmPassword', 'Passwords do not match').equals(req.body.password);
  // req.sanitize('email').normalizeEmail({ remove_dots: false });

  // const errors = req.validationErrors();
  //
  // if (errors) {
  //   req.flash('errors', errors);
  //   // return res.redirect('/signup');
  //   return next(errors);
  // }

  const user = new User({
    email: req.body.email,
    username: req.body.username,
    password: req.body.password

  });

  User.findOne({ email: req.body.email }, (err, existingUser) => {
    if (err) {
      // console.log(err);
      res.status(200).send({status:"fail",error:"internal server error."});
      return next(err);
    }
    if (existingUser) {
      res.status(200).send({status:"fail",error:"Email account exists!"});
      return next(err);
    }
    // console.log(user);
    user.save((err) => {
      if (err) {
        res.status(200).send({status:"fail",error:err.errors.username.message});
        return next(err);
      }

      async.waterfall([
        function createRandomToken(done) {
          crypto.randomBytes(16, (err, buf) => {
            const token = buf.toString('hex');
            done(err, token);
          });
        },
        function setRandomToken(token, done) {
          user.confirmationToken = token;
          user.confirmationExpires = Date.now() + 3600000; // 1 hour
          user.save((err) => {
            done(err, token, user);
          });
        },

        function sendConfirmationEmail(token, user, done) {
          const mailOptions = {
            to: user.email,
            from: 'yunchuwang5@gmail.com',
            subject: 'Meal Pal account activation',
            text: `Click on the link to activate your meal pal account
            http://${req.headers.host}/confirmation/${token}\n\n
            \n`
          };
          transporter.sendMail(mailOptions, (err) => {
            // req.flash('info', { msg: `An e-mail has been sent to ${user.email} with further instructions.` });
            done(err);
          });
        }
      ], (err) => {
        if (err) {
          res.send({status: "fail",error:"Failed to send. Please contact author."});
          return next(err);
        } else {
          res.send({status: "pass",success:`An e-mail has been sent to ${user.email} with further instructions.`});
          return next();
        }

      });


    });
  });
};

/**
* GET /activation
* Profile page.
*/
// exports.getActivation = (req, res) => {
//
// };

/**
* GET /confirmation/:token
*
*/
exports.getConfirmation = (req,res) => {
  User
  .findOne({ confirmationToken: req.params.token })
  .where('confirmationExpires').gt(Date.now())
  .exec((err, user) => {
    if (err) { return next(err); }
    if (!user) {
      res.status(200).send({status:"fail"});
    } else {
      user.activated = true;
      user.save((err,next) => {
        if(err) {
          return next(err);
        } else {
          res.status(200).send({status:"pass", message:"account activated"});
        }
      });
    }


  });
}



/**
* POST /account/profile
* Update profile information.
*/
exports.postUpdateProfile = (req, res, next) => {
  req.assert('email', 'Please enter a valid email address.').isEmail();
  req.sanitize('email').normalizeEmail({ remove_dots: false });

  const errors = req.validationErrors();

  if (errors) {
    req.flash('errors', errors);
    return res.redirect('/account');
  }

  User.findById(req.user.id, (err, user) => {
    if (err) { return next(err); }
    user.email = req.body.email || '';
    user.profile.name = req.body.name || '';
    user.profile.gender = req.body.gender || '';
    user.profile.location = req.body.location || '';
    user.profile.website = req.body.website || '';
    user.save((err) => {
      if (err) {
        if (err.code === 11000) {
          req.flash('errors', { msg: 'The email address you have entered is already associated with an account.' });
          return res.redirect('/account');
        }
        return next(err);
      }
      req.flash('success', { msg: 'Profile information has been updated.' });
      res.redirect('/account');
    });
  });
};

/**
* POST /account/password
* Update current password.
*/
exports.postUpdatePassword = (req, res, next) => {
  req.assert('password', 'Password must be at least 4 characters long').len(4);
  req.assert('confirmPassword', 'Passwords do not match').equals(req.body.password);

  const errors = req.validationErrors();

  if (errors) {
    req.flash('errors', errors);
    return res.redirect('/account');
  }

  User.findById(req.user.id, (err, user) => {
    if (err) { return next(err); }
    user.password = req.body.password;
    user.save((err) => {
      if (err) { return next(err); }
      req.flash('success', { msg: 'Password has been changed.' });
      res.redirect('/account');
    });
  });
};

/**
* POST /account/delete
* Delete user account.
*/
exports.postDeleteAccount = (req, res, next) => {
  User.remove({ _id: req.user.id }, (err) => {
    if (err) { return next(err); }
    req.logout();
    req.flash('info', { msg: 'Your account has been deleted.' });
    res.redirect('/');
  });
};

/**
* GET /account/unlink/:provider
* Unlink OAuth provider.
*/
exports.getOauthUnlink = (req, res, next) => {
  const provider = req.params.provider;
  User.findById(req.user.id, (err, user) => {
    if (err) { return next(err); }
    user[provider] = undefined;
    user.tokens = user.tokens.filter(token => token.kind !== provider);
    user.save((err) => {
      if (err) { return next(err); }
      req.flash('info', { msg: `${provider} account has been unlinked.` });
      res.redirect('/account');
    });
  });
};

/**
* GET /reset/:token
* Reset Password page.
*/
exports.getReset = (req, res, next) => {
  User
  .findOne({ passwordResetToken: req.params.token })
  .where('passwordResetExpires').gt(Date.now())
  .exec((err, user) => {
    if (err) { return next(err); }
    if (!user) {
      return res.send({status:"fail",error:'Password reset token is invalid or has expired.'})
    }
    res.render('account/reset', {
      title: 'Password Reset'
    });
  });
};

/**
* POST /reset/:token
* Process the reset password request.
*/
exports.postReset = (req, res, next) => {
  req.assert('password', 'Password must be between 4-15 characters long.').len(4,15);
  req.assert('confirm', 'Passwords must match.').equals(req.body.password);

  const errors = req.validationErrors();

  if (errors) {
    req.flash('errors', errors);
    return res.redirect('back');
  }

  async.waterfall([
    function resetPassword(done) {
      User
      .findOne({ passwordResetToken: req.params.token })
      .where('passwordResetExpires').gt(Date.now())
      .exec((err, user) => {
        if (err) { done(err); }
        if (!user) {
          req.flash('errors', { msg: 'Password reset token is invalid or has expired.' });
          return res.redirect('back');
        }
        user.password = req.body.password;
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        user.save((err) => {
          if (err) { return done(err); };
        });
      });
    },
    function sendResetPasswordEmail(user, done) {
      const mailOptions = {
        to: user.email,
        from: 'yunchuwang5@gmail.com',
        subject: 'Your Meal Pal password has been changed',
        text: `Hello,\n\nThis is a confirmation that the password for your account ${user.email} has just been changed.\n`
      };
      console.log("pass");
      transporter.sendMail(mailOptions, (err) => {
        req.flash('success', { msg: 'Success! Your password has been changed.' });
        done(err);
      });
    }
  ], (err) => {
    if (err) { return next(err); };
  });
  res.send({status:"Success! Your password has been changed."});
  next();
};

/**
* GET /forgot
* Forgot Password page.
*/
exports.getForgot = (req, res) => {
  if (req.isAuthenticated()) {
    return res.redirect('/');
  }
  res.render('account/forgot', {
    title: 'Forgot Password'
  });
};

/**
* POST /forgot
* Create a random token, then the send user an email with a reset link.
*/
exports.postForgot = (req, res, next) => {
  // req.assert('email', 'Please enter a valid email address.').isEmail();
  // req.sanitize('email').normalizeEmail({ remove_dots: false });
  //
  // const errors = req.validationErrors();
  //
  // if (errors) {
  //   req.flash('errors', errors);
  //   return res.redirect('/forgot');
  // }

  async.waterfall([
    function createRandomToken(done) {
      crypto.randomBytes(16, (err, buf) => {
        const token = buf.toString('hex');
        done(err, token);
      });
    },
    function setRandomToken(token, done) {
      User.findOne({ email: req.body.email }, (err, user) => {
        if (err) { return done(err); }
        if (!user) {
          res.status(200).send({status:"fail",error:'Account with that email address does not exist.'});
          return next();
        }
        user.passwordResetToken = token;
        user.passwordResetExpires = Date.now() + 3600000; // 1 hour
        user.save((err) => {
          done(err, token, user);
        });
      });
    },
    function sendForgotPasswordEmail(token, user, done) {
      const mailOptions = {
        to: user.email,
        from: 'yunchuwang5@gmail.com',
        subject: 'Reset your password on Meal Pal',
        text: `You are receiving this email because you (or someone else) have requested the reset of the password for your account.\n\n
        Please click on the following link, or paste this into your browser to complete the process:\n\n
        http://${req.headers.host}/reset/${token}\n\n
        If you did not request this, please ignore this email and your password will remain unchanged.\n`
      };
      transporter.sendMail(mailOptions, (err) => {
        done(err,user);
      });
    }
  ], (err,user) => {
    if (err) {
      res.send({status: "fail",error:"Failed to send. Please contact author."});
      return next(err);
    } else {
      res.send({status:"pass",success:`A reset password e-mail has been sent to ${user.email} with further instructions.`});
      return next();
    }
  });

};

exports.getUsers = (req,res,next) => {
  User.find({},function(err, users) {
    if (err) return next(err);
    // console.log(users);
    res.send(users);
  })
}
