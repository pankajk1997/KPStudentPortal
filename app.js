const express = require('express');
const exphbs  = require('express-handlebars');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const app = express();

app.use(express.static('public'));

mongoose.connect('mongodb://admin:password@localhost/cdackp?authSource=admin&w=1',{
  useNewUrlParser: true
})
  .then(() => console.log('MongoDB Connected...'))
  .catch(err => console.log(err));

require('./models/message');
const msg = mongoose.model('message');

require('./models/media');
const media = mongoose.model('media');

app.engine('handlebars', exphbs({
    defaultLayout: 'main'
  }));
  app.set('view engine', 'handlebars');

app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json());

app.get('/', (req, res) => {
    res.render('index');
});

app.get('/res:page', (req, res) => {
  res.render('res'+req.params.page);
});

app.get('/gallery', (req, res) => {
  media.find({})
    .sort({date:'desc'})
    .then(media => {
      res.render('gallery',{
        media: media
      });
    });
});

app.get('/forum', (req, res) => {
  msg.find({})
    .sort({date:'desc'})
    .then(message => {
      res.render('forum',{
        message: message
      });
    });
});

app.post('/gallery',(req,res) => {
  let errors =[];
  
  if(!req.body.thumb){
    errors.push({output: 'Please add a thumbnail link! you can fill - https://i.ibb.co/HBHm0Vr/gallery.png'});
  }
  else if (req.body.thumb.length > 500) {
    errors.push({output: 'Please limit the link to 500 characters!'});
  }

  if(!req.body.link){
    errors.push({output: 'Please add a media link!'});
  }
  else if (req.body.link.length > 500) {
    errors.push({output: 'Please limit the link to 500 characters!'});
  }

  if(!req.body.title){
    errors.push({output: 'Please add a title!'});
  }
  else if (req.body.title.length > 100) {
    errors.push({output: 'Please limit the title to 100 characters!'});
  }

  if(errors.length > 0){
    res.render('gallery',{
      errors: errors
    });
  }
  else {
    const user = {
      title: req.body.title,
      link: req.body.link,
      thumb: req.body.thumb
    }
    new media(user)
      .save()
      .then(media => {
        res.redirect('gallery');
      })
  }
});

app.post('/forum',(req,res) => {
  let errors =[];

  if(!req.body.chat){
    errors.push({output: 'Please add a message!'});
  }
  else if (req.body.chat.length > 10000) {
    errors.push({output: 'Please limit the message to 10000 characters!'});
  }
  
  if(errors.length > 0){
    res.render('forum',{
      errors: errors
    });
  }
  else {
    const user = {
      chat: req.body.chat
    }
    new msg(user)
      .save()
      .then(msg => {
        res.redirect('forum');
      })
  }
});

app.use((req,res)=>{
  res.status(404).send('404');
});

const port = 3000;

app.listen(port, () =>{
  console.log(`Server started on port ${port}...`);
});