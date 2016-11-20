//loads the packages needed

var express = require('express');
var app = express();
var http = require('http').Server(app);
var favicon = require('serve-favicon');
var passport = require('passport');
var Strategy = require('passport-facebook').Strategy;
var io = require('socket.io')(http);
var mustacheExpress = require('mustache-express');


// Says what port to listen to incoming data on

const PORT=80;


// Setup facebook login strategy

passport.use(new Strategy({
	clientID: process.env.CLIENT_ID,
	clientSecret: process.env.CLIENT_SECRET,
	callbackURL: 'http://edgysketch.ddns.net/login/facebook/return'
	},
	function(accessToken, refreshToken, profile, cb){
		console.log("User logged in - Name: %s Profile id: %s", profile.displayName, profile.id );
		return cb(null, profile);

}));


// Configure Passport authenticated session persistence

passport.serializeUser(function(user, cb) {
	cb(null, user);
});

passport.deserializeUser(function(obj, cb) {
	cb(null, obj);
});


// Use application-level middleware for common functionality, including logging, parsing, and session handling.

app.use(require('morgan')('combined'));
app.use(require('cookie-parser')());
//app.use(require('body-parser').urlencoded({ extended: true }));
app.use(require('express-session')({ secret: 'edgysketch', resave: true, saveUninitialized: true }));

// Initialize Passport and restore authentication state, if any, from the session.

app.use(passport.initialize());
app.use(passport.session());

app.engine('html', mustacheExpress());
app.set('view engine', 'html');
app.set('views', __dirname);

// Uses app to send the request to the file login.html

app.get('/', function(req,res) {
	res.sendFile(__dirname + "\\login.html");
});


// Defining the routes that are taken

app.get('/login/facebook',
	passport.authenticate('facebook'));

app.get('/login/guest',
	function(req, res){
		res.render('game.html', {username: "Guest"} );
		
	});

app.get('/login/facebook/return',
	passport.authenticate('facebook', { failureRedirect: '/' }),
	function(req, res) {
		console.log("Successful login");
		res.render('game.html', {username: req.user.displayName } );
	});



// Takes them to index if there is a successful login

//req.user.displayName <--------- HOW TO GET FACEBOOK NAME


app.get('/game',function(req,res) {
	res.sendFile(__dirname + "\\game.html");
});

app.get('/game.js',function(req,res) {
	res.sendFile(__dirname + "\\game.js");
});

// Enables the page logo

app.use(favicon(__dirname + "\\claypepe.png"));

app.get('/login/brush.cur', function(req, res){
	res.sendFile(__dirname + "\\brush.cur");
});


// When the app listens it logs where it is listening to

io.on('connection', function(socket) {
	console.log("User connected");
	io.emit('chat message', "User connected");
	socket.on('disconnect', function(){
		console.log('User disconnected');
		io.emit('chat message', "User disconnected");
	});
	socket.on('Enter', function(){
		console.log("Enter pressed");
	});
	socket.on('chat message', function(msg) {
		console.log("message: " + msg);
		io.emit('chat message', msg);
	});
	socket.on('draw', function(msg){
		console.log(msg);
		io.emit('draw', msg);
	});
	socket.on('clear', function(){
		console.log("Clearing canvas");
		io.emit('clear');
	});
	socket.on('nickname', function(msg) {
		console.log("Nickname changed to: " + msg);
		io.emit('nickname', msg);
	});
});

http.listen(PORT, function() {
	console.log("Listening on port ", PORT);
});