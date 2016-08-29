var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var mongoose = require('mongoose');
var passport = require('passport');
var async = require('async');
var moment = require('moment');

var MongoStore = require('connect-mongo')(session);

var polls = require('./routes/polls');
var users = require('./routes/users');

require('./server/passport')(passport);

var app = express();

if (app.get('env') !== 'production') {

  // expose node_modules to client app
  app.use(express.static(__dirname + "/node_modules"));
}

// uncomment after placing your favicon in /public
// app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'app')));

mongoose.connect('mongodb://admin:admin@ds139705.mlab.com:39705/fcc-polling-app'); // Connect to MongoDB database for polling app.  

// Make sure mongod is running! If not, log an error and exit. 

mongoose.connection.on('error', function() {
  console.log('MongoDB Connection Error. Please make sure that MongoDB is running.');
  process.exit(1);
});
  
app.use(session({ 
  secret: 'my_precious_l@3', 
  cookie: { maxAge: 500000 }, // Session set to 5 hours, enough for a round of golf
  saveUninitialized: false, // don't create session until something stored 
  resave: true, //don't save session if unmodified     
  rolling: true,
  name: 'twitter-polling',
  store: new MongoStore({ mongooseConnection: mongoose.connection })
}));  

app.use(passport.initialize());
app.use(passport.session());   
  
app.get('/auth/twitter',
  passport.authenticate('twitter'));

app.get('/auth/twitter/callback', 
  passport.authenticate('twitter', { failureRedirect: '/' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/');
  });  

app.use('/api/user', users);
app.use('/api/polls', polls);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers
// development error handler
// will print stacktrace
if (app.get('env') === 'development') {

  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.json({
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.json({
    message: err.message,
    error: {}
  });
});


module.exports = app;
