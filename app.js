const express = require('express');
const mongoose = require('mongoose');
const exphbs = require('express-handlebars');
const bodyParser = require('body-parser');
const methodOverride = require('method-override');
const session = require('express-session');
const flash = require('connect-flash');
const bcrypt = require('bcryptjs');
const passport = require('passport');
const {
  ensureAuthenticated
} = require('./helpers/auth');

const app = express();

app.use(express.static('public'));

mongoose.connect('mongodb://admin:password@localhost/cdackp?authSource=admin&w=1', {
    useNewUrlParser: true
  })
  .then(() => console.log('MongoDB Connected...'))
  .catch(err => console.log(err));

require('./models/message');
const msg = mongoose.model('message');

require('./models/media');
const media = mongoose.model('media');

require('./models/user');
const usr = mongoose.model('user');

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

app.get('/res:page', (req, res) => {
  res.render('res' + req.params.page);
});

app.get('/gallery', (req, res) => {
  media.find({})
    .sort({
      date: 'desc'
    })
    .then(media => {
      res.render('gallery', {
        media: media
      });
    });
});

app.get('/forum', (req, res) => {
  msg.find({})
    .sort({
      date: 'desc'
    })
    .then(message => {
      res.render('forum', {
        message: message
      });
    });
});

app.get('/login', (req, res) => {
  res.render('login');
});

app.get('/register', (req, res) => {
  res.render('register');
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
    res.render('gallery', {
      errors: errors
    });
  } else {
    const user = {
      title: req.body.title,
      link: req.body.link,
      thumb: req.body.thumb,
      user: req.user.id
    }
    new media(user)
      .save()
      .then(media => {
        req.flash('success_msg', 'Media Added');
        res.redirect('gallery');
      })
  }
});

app.post('/forum', ensureAuthenticated, (req, res) => {
  let errors = [];

  if (!req.body.chat) {
    errors.push({
      output: 'Please add a message!'
    });
  } else if (req.body.chat.length > 10000) {
    errors.push({
      output: 'Please limit the message to 10000 characters!'
    });
  }

  if (errors.length > 0) {
    res.render('forum', {
      errors: errors
    });
  } else {
    const user = {
      chat: req.body.chat,
      user: req.user.id
    }
    new msg(user)
      .save()
      .then(msg => {
        req.flash('success_msg', 'Message Added');
        res.redirect('forum');
      })
  }
});

app.post('/login', (req, res, next) => {
  passport.authenticate('local', {
    successRedirect: '/forum',
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
      output: 'Please Enter a valid email!'
    });
  }

  if (req.body.passwd.length < 4) {
    errors.push({
      output: 'The Password should be of atleast 4 characters long!'
    });
  } else if (req.body.passwd.length > 100) {
    errors.push({
      output: 'Password should be at most 100 characters long!'
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
      output: 'The Passwords does not match!'
    });
  }

  if (errors.length > 0) {
    res.render('register', {
      errors: errors,
      fname: req.body.fname,
      lname: req.body.lname,
      email: req.body.email,
      passwd: req.body.passwd,
      passwd1: req.body.passwd1
    });
  } else {
    usr.findOne({
        email: req.body.email
      })
      .then(user => {
        if (user) {
          req.flash('error_msg', 'User already Registered!');
          res.redirect('/register')
        } else {
          const user = {
            fname: req.body.fname,
            lname: req.body.lname,
            email: req.body.email,
            passwd: req.body.passwd
          }

          bcrypt.genSalt(10, (err, salt) => {
            bcrypt.hash(user.passwd, salt, (err, hash) => {
              if (err) throw err;
              user.passwd = hash;
              new usr(user)
                .save()
                .then(usr => {
                  req.flash('success_msg', 'User Registered Please Activate your Account');
                  res.redirect('login');
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

app.delete('/gallery/:id', ensureAuthenticated, (req, res) => {
  media.deleteOne({
      _id: req.params.id,
      user: req.user.id
    })
    .then(() => {
      req.flash('success_msg', 'Media Deleted');
      res.redirect('/gallery');
    });
});

app.delete('/forum/:id', ensureAuthenticated, (req, res) => {
  msg.deleteOne({
      _id: req.params.id,
      user: req.user.id
    })
    .then(() => {
      req.flash('success_msg', 'Message Deleted');
      res.redirect('/forum');
    });
});

app.use((req, res) => {
  res.status(404).send('404');
});

const port = 3000;

app.listen(port, () => {
  console.log(`Server started on port ${port}...`);
});