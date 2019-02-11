const express = require('express');
const passport = require('passport');
const mongoose = require('mongoose');
const exphbs = require('express-handlebars');
const bodyParser = require('body-parser');
const methodOverride = require('method-override');
const session = require('express-session');
const flash = require('connect-flash');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');

var transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'cdackpb@gmail.com',
    pass: 'qazPLM123.!'
  }
});

const app = express();

const {
  ensureAuthenticated
} = require('./helpers/auth');

app.use(express.static('public'));

const db = require('./config/database');

mongoose.connect(db.mongoURI, {
    useNewUrlParser: true
  })
  .then(() => console.log('MongoDB Connected...'))
  .catch(err => console.log(err));

require('./models/notice');
const notice = mongoose.model('notice');

require('./models/forum');
const forum = mongoose.model('forum');

require('./models/message');
var msg = mongoose.model('message');

require('./models/media');
const media = mongoose.model('media');

require('./models/reso');
const reso = mongoose.model('reso');

require('./models/user');
var usr = mongoose.model('user');

app.engine('handlebars', exphbs({
  defaultLayout: 'main'
}));
app.set('view engine', 'handlebars');

app.use(bodyParser.urlencoded({
  extended: false
}));
app.use(bodyParser.json());

app.use(methodOverride('_method'));

app.use(session({
  secret: 'secret',
  resave: true,
  saveUninitialized: true
}));

app.use(passport.initialize());
app.use(passport.session());

app.use(flash());

app.use(function (req, res, next) {
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.error = req.flash('error');
  res.locals.user = req.user || null;
  next();
});

require('./config/passport')(passport);

app.get('/', (req, res) => {
  res.render('index');
});

app.get('/notice:page', (req, res) => {
  var bool = Boolean(Number(req.params.page));
  var nextpage = Number(req.params.page) + 1;
  notice.find({})
    .sort({
      date: 'desc'
    })
    .skip(20 * Number(req.params.page))
    .limit(20)
    .then(notice => {
      res.render('notice0', {
        notice: notice,
        bool: bool,
        nextpage: nextpage
      });
    });
});

app.get('/discussion:page', (req, res) => {
  var bool = Boolean(Number(req.params.page));
  var nextpage = Number(req.params.page) + 1;
  forum.find({})
    .sort({
      date: 'desc'
    })
    .skip(20 * Number(req.params.page))
    .limit(20)
    .then(forum => {
      res.render('discussion0', {
        forum: forum,
        bool: bool,
        nextpage: nextpage
      });
    });
});

app.get('/forum:page&:forumid', (req, res) => {
  var bool = Boolean(Number(req.params.page));
  var nextpage = Number(req.params.page) + 1;
  msg.find({
      forum_id: req.params.forumid
    })
    .sort({
      date: 'desc'
    })
    .skip(20 * Number(req.params.page))
    .limit(20)
    .then(message => {
      res.render('forum0', {
        message: message,
        bool: bool,
        nextpage: nextpage,
        fid: req.params.forumid
      });
    });
});

app.get('/gallery:page', (req, res) => {
  var bool = Boolean(Number(req.params.page));
  var nextpage = Number(req.params.page) + 1;
  media.find({})
    .sort({
      date: 'desc'
    })
    .skip(10 * Number(req.params.page))
    .limit(10)
    .then(media => {
      res.render('gallery0', {
        media: media,
        bool: bool,
        nextpage: nextpage
      });
    });
});

app.get('/res:page', (req, res) => {
  var bool = Boolean(Number(req.params.page));
  var nextpage = Number(req.params.page) + 1;
  reso.find({})
    .sort({
      date: 'desc'
    })
    .skip(10 * Number(req.params.page))
    .limit(10)
    .then(reso => {
      res.render('res0', {
        reso: reso,
        bool: bool,
        nextpage: nextpage
      });
    });
});

app.get('/login', (req, res) => {
  res.render('login');
});

app.get('/register', (req, res) => {
  res.render('register');
});

app.get('/verify:id', (req, res) => {
  usr.updateOne({
      _id: req.params.id
    }, {
      $set: {
        verified: 1
      }
    })
    .then(notice => {
      req.flash('success_msg', 'User Account Verified, You can now Login!');
      res.redirect('/');
    });
});

app.post('/notice', ensureAuthenticated, (req, res) => {
  let errors = [];

  if (!req.body.link) {
    errors.push({
      output: 'Please add a notice link! you can fill # in case of no link'
    });
  } else if (req.body.link.length > 500) {
    errors.push({
      output: 'Please limit the link to 500 characters!'
    });
  }

  if (!req.body.title) {
    errors.push({
      output: 'Please add a title!'
    });
  } else if (req.body.title.length > 500) {
    errors.push({
      output: 'Please limit the title to 100 characters!'
    });
  }

  if (errors.length > 0) {
    res.render('notice0', {
      errors: errors
    });
  } else {
    const user = {
      title: req.body.title,
      link: req.body.link,
      user: req.user.username
    }
    new notice(user)
      .save()
      .then(notice => {
        req.flash('success_msg', 'Announcement Added!');
        res.redirect('notice0');
      })
  }
});

app.post('/discussion', ensureAuthenticated, (req, res) => {
  let errors = [];

  if (!req.body.title) {
    errors.push({
      output: 'Please add a title!'
    });
  } else if (req.body.title.length > 500) {
    errors.push({
      output: 'Please limit the title to 500 characters!'
    });
  }

  if (errors.length > 0) {
    res.render('discussion0', {
      errors: errors
    });
  } else {
    const user = {
      title: req.body.title,
      user: req.user.username
    }
    new forum(user)
      .save()
      .then(forum => {
        req.flash('success_msg', 'Discussion Added!');
        res.redirect('discussion0');
      })
  }
});

app.post('/forum:forumid', ensureAuthenticated, (req, res) => {
  let errors = [];

  if (!req.body.chat) {
    errors.push({
      output: 'Please add a message!'
    });
  } else if (req.body.chat.length > 8000) {
    errors.push({
      output: 'Please limit the message to 8000 characters!'
    });
  }

  if (errors.length > 0) {
    res.render('forum0&' + req.params.forumid, {
      errors: errors
    });
  } else {
    const user = {
      chat: req.body.chat,
      user: req.user.username,
      forum_id: req.params.forumid
    }
    new msg(user)
      .save()
      .then(msg => {
        req.flash('success_msg', 'Message Added!');
        res.redirect('forum0&' + req.params.forumid);
      })
  }
});

app.post('/gallery', ensureAuthenticated, (req, res) => {
  let errors = [];

  if (!req.body.thumb) {
    errors.push({
      output: 'Please add a thumbnail link! you can fill - https://i.ibb.co/HBHm0Vr/gallery.png'
    });
  } else if (req.body.thumb.length > 500) {
    errors.push({
      output: 'Please limit the link to 500 characters!'
    });
  }

  if (!req.body.link) {
    errors.push({
      output: 'Please add a media link!'
    });
  } else if (req.body.link.length > 500) {
    errors.push({
      output: 'Please limit the link to 500 characters!'
    });
  }

  if (!req.body.title) {
    errors.push({
      output: 'Please add a title!'
    });
  } else if (req.body.title.length > 100) {
    errors.push({
      output: 'Please limit the title to 100 characters!'
    });
  }

  if (errors.length > 0) {
    res.render('gallery0', {
      errors: errors
    });
  } else {
    const user = {
      title: req.body.title,
      link: req.body.link,
      thumb: req.body.thumb,
      user: req.user.username
    }
    new media(user)
      .save()
      .then(media => {
        req.flash('success_msg', 'Media Added!');
        res.redirect('gallery0');
      })
  }
});

app.post('/res', ensureAuthenticated, (req, res) => {
  let errors = [];

  if (!req.body.thumb) {
    errors.push({
      output: 'Please add a thumbnail link! you can fill - https://i.ibb.co/HBHm0Vr/gallery.png'
    });
  } else if (req.body.thumb.length > 500) {
    errors.push({
      output: 'Please limit the link to 500 characters!'
    });
  }

  if (!req.body.link) {
    errors.push({
      output: 'Please add a media link!'
    });
  } else if (req.body.link.length > 500) {
    errors.push({
      output: 'Please limit the link to 500 characters!'
    });
  }

  if (!req.body.desc) {
    errors.push({
      output: 'Please add a description!'
    });
  } else if (req.body.desc.length > 700) {
    errors.push({
      output: 'Please limit the description to 700 characters!'
    });
  }

  if (!req.body.title) {
    errors.push({
      output: 'Please add a title!'
    });
  } else if (req.body.title.length > 90) {
    errors.push({
      output: 'Please limit the title to 90 characters!'
    });
  }

  if (errors.length > 0) {
    res.render('res0', {
      errors: errors
    });
  } else {
    const user = {
      title: req.body.title,
      desc: req.body.desc,
      link: req.body.link,
      thumb: req.body.thumb,
      user: req.user.username
    }
    new reso(user)
      .save()
      .then(reso => {
        req.flash('success_msg', 'Resource Added!');
        res.redirect('res0');
      })
  }
});

app.post('/login', (req, res, next) => {
  passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login',
    failureFlash: true
  })(req, res, next);
});

app.get('/logout', (req, res) => {
  req.logout();
  req.flash('success_msg', 'You are successfully logged out!');
  res.redirect('/');
});

app.post('/register', (req, res) => {
  let errors = [];

  if (!req.body.fname) {
    errors.push({
      output: 'Please add a First Name!'
    });
  } else if (req.body.fname.length > 50) {
    errors.push({
      output: 'First Name should be at most 50 characters long!'
    });
  }

  if (!req.body.lname) {
    errors.push({
      output: 'Please add a Last Name!'
    });
  } else if (req.body.lname.length > 50) {
    errors.push({
      output: 'Last Name should be at most 50 characters long!'
    });
  }

  if (!req.body.email) {
    errors.push({
      output: 'Please add an Email!'
    });
  } else if (req.body.email.length > 50) {
    errors.push({
      output: 'Email should be at most 50 characters long!'
    });
  } else if (!(req.body.email.indexOf('@') > -1)) {
    errors.push({
      output: 'Please enter a valid email!'
    });
  }

  if (!req.body.username) {
    errors.push({
      output: 'Please add an unique Username!'
    });
  } else if (req.body.username.length > 50) {
    errors.push({
      output: 'Username should be at most 50 characters long!'
    });
  }

  if (req.body.passwd.length < 4) {
    errors.push({
      output: 'Password should be of atleast 4 characters long!'
    });
  } else if (req.body.passwd.length > 100) {
    errors.push({
      output: 'Password should be of at most 100 characters long!'
    });
  } else if (!(/\d/.test(req.body.passwd))) {
    errors.push({
      output: 'Password should consist of numbers also!'
    });
  } else if (!(/[a-z]/i.test(req.body.passwd))) {
    errors.push({
      output: 'Password should consist of alphabets also!'
    });
  }

  if (req.body.passwd != req.body.passwd1) {
    errors.push({
      output: 'Passwords does not match!'
    });
  }

  if (errors.length > 0) {
    res.render('register', {
      errors: errors,
      fname: req.body.fname,
      lname: req.body.lname,
      email: req.body.email,
      username: req.body.username,
      passwd: req.body.passwd,
      passwd1: req.body.passwd1
    });
  } else {
    usr.findOne({
        email: req.body.email
      })
      .then(user => {
        if (user) {
          req.flash('error_msg', 'Email already Registered!');
          res.redirect('/register')
        } else {

          usr.findOne({
              username: req.body.username
            })
            .then(user => {
              if (user) {
                req.flash('error_msg', 'Username already Registered!');
                res.redirect('/register')
              } else {
                const user = {
                  fname: req.body.fname,
                  lname: req.body.lname,
                  email: req.body.email,
                  username: req.body.username,
                  passwd: req.body.passwd
                }


                bcrypt.genSalt(10, (err, salt) => {
                  bcrypt.hash(user.passwd, salt, (err, hash) => {
                    if (err) throw err;
                    user.passwd = hash;
                    new usr(user)
                      .save()
                      .then(usr => {
                        req.flash('success_msg', 'User Registered, A verification link has been emailed to you!');
                        res.redirect('login');

                        usr = mongoose.model('user');

                        usr.findOne({
                          username: req.body.username
                        }, function (err, obj) {

                          var verlink = 'https://rocky-brook-46201.herokuapp.com/verify' + obj._id;

                          var mailOptions = {
                            from: 'cdackpb@gmail.com',
                            to: req.body.email,
                            subject: 'Verification mail from CDAC KP Student Portal',
                            html: '<br /><br /><h1><a style="text-align: center;" href="' + verlink + '">Click this link to verify your account</a></h1><br /><br />'
                          };

                          transporter.sendMail(mailOptions, function (error, info) {
                            if (error) {
                              req.flash('error', error);
                            } else {
                              req.flash('success_msg', 'Verification Link Sent to' + info.response + '!');
                            }
                          });
                        });

                      })
                      .catch(err => {
                        console.log(err);
                        return;
                      });
                  });
                });
              }
            });
        }
      });
  }
});

app.delete('/notice/:id', ensureAuthenticated, (req, res) => {
  notice.deleteOne({
      _id: req.params.id,
      user: req.user.username
    })
    .then(() => {
      req.flash('success_msg', 'Announcement Deleted!');
      res.redirect(req.get('referer'));
    });
});


app.delete('/discussion/:id', ensureAuthenticated, (req, res) => {
  forum.deleteOne({
      _id: req.params.id,
      user: req.user.username
    })
    .then(() => {
      req.flash('success_msg', 'Discussion Deleted!');
      res.redirect(req.get('referer'));
    });
});

app.delete('/forum/:id', ensureAuthenticated, (req, res) => {
  msg.deleteOne({
      _id: req.params.id,
      user: req.user.username
    })
    .then(() => {
      req.flash('success_msg', 'Message Deleted!');
      res.redirect(req.get('referer'));
    });
});

app.delete('/gallery/:id', ensureAuthenticated, (req, res) => {
  media.deleteOne({
      _id: req.params.id,
      user: req.user.username
    })
    .then(() => {
      req.flash('success_msg', 'Media Deleted!');
      res.redirect(req.get('referer'));
    });
});

app.delete('/res/:id', ensureAuthenticated, (req, res) => {
  reso.deleteOne({
      _id: req.params.id,
      user: req.user.username
    })
    .then(() => {
      req.flash('success_msg', 'Resource Deleted!');
      res.redirect(req.get('referer'));
    });
});

app.use((req, res) => {
  res.status(404).send('404');
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Server started on port ${port}...`);
});