const LocalStrategy = require('passport-local').Strategy;
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const usr = mongoose.model('user');

module.exports = function (passport) {
    passport.use(new LocalStrategy({
        usernameField: 'email',
        passwordField: 'passwd'
    }, (email, passwd, done) => {
        usr.findOne({
            email: email,
            verified: 1
        }).then(user => {
            if (!user) {
                return done(null, false, {
                    message: 'User Not Verified or Not Registered!'
                });
            }

            bcrypt.compare(passwd, user.passwd, (err, isMatch) => {
                if (err) throw err;
                if (isMatch) {
                    return done(null, user);
                } else {
                    return done(null, false, {
                        message: 'Password Incorrect!'
                    });
                }
            });
        });
    }));

    passport.serializeUser(function (user, done) {
        done(null, user.id);
    });

    passport.deserializeUser(function (id, done) {
        usr.findById(id, function (err, user) {
            done(err, user);
        });
    });
}