var Group       = require('../app/models/group');
var User       = require('../app/models/user');

// var app = require('express')();

if (!Date.now) {
    Date.now = function() { return new Date().getTime(); }
}


module.exports = function(app, passport, server) {

var http = require('http');
var io = require('socket.io').listen(server);
// normal routes ===============================================================

	// show the home page (will also have our login links)
	app.get('/', function(req, res) {
		res.render('index.ejs');
	});

	// PROFILE SECTION =========================
	app.get('/profile', isLoggedIn, function(req, res) {

		res.render('profile.ejs', {
			user : req.user,
			message: {}
		});
	});



	// LOGOUT ==============================
	app.get('/logout', function(req, res) {
		req.logout();
		res.redirect('/');
	});

// =============================================================================
// AUTHENTICATE (FIRST LOGIN) ==================================================
// =============================================================================

	// locally --------------------------------
		// LOGIN ===============================
		// show the login form
		app.get('/login', function(req, res) {
			res.render('login.ejs', { message: req.flash('loginMessage') });
		});

		// process the login form
		app.post('/login', passport.authenticate('local-login', {
			successRedirect : '/profile', // redirect to the secure profile section
			failureRedirect : '/login', // redirect back to the signup page if there is an error
			failureFlash : true // allow flash messages
		}));

		// SIGNUP =================================
		// show the signup form
		app.get('/signup', function(req, res) {
			res.render('signup.ejs', { message: req.flash('loginMessage') });
		});

		// process the signup form
		app.post('/signup', passport.authenticate('local-signup', {
			successRedirect : '/profile', // redirect to the secure profile section
			failureRedirect : '/signup', // redirect back to the signup page if there is an error
			failureFlash : true // allow flash messages
		}));

	// facebook -------------------------------

		// send to facebook to do the authentication
		app.get('/auth/facebook', passport.authenticate('facebook', { scope : 'email' }));

		// handle the callback after facebook has authenticated the user
		app.get('/auth/facebook/callback',
			passport.authenticate('facebook', {
				successRedirect : '/profile',
				failureRedirect : '/'
			}));

	// twitter --------------------------------

		// send to twitter to do the authentication
		app.get('/auth/twitter', passport.authenticate('twitter', { scope : 'email' }));

		// handle the callback after twitter has authenticated the user
		app.get('/auth/twitter/callback',
			passport.authenticate('twitter', {
				successRedirect : '/profile',
				failureRedirect : '/'
			}));


	// google ---------------------------------

		// send to google to do the authentication
		app.get('/auth/google', passport.authenticate('google', { scope : ['profile', 'email'] }));

		// the callback after google has authenticated the user
		app.get('/auth/google/callback',
			passport.authenticate('google', {
				successRedirect : '/profile',
				failureRedirect : '/'
			}));

// =============================================================================
// AUTHORIZE (ALREADY LOGGED IN / CONNECTING OTHER SOCIAL ACCOUNT) =============
// =============================================================================

	// locally --------------------------------
		app.get('/connect/local', function(req, res) {
			res.render('connect-local.ejs', { message: req.flash('loginMessage') });
		});
		app.post('/connect/local', passport.authenticate('local-signup', {
			successRedirect : '/profile', // redirect to the secure profile section
			failureRedirect : '/connect/local', // redirect back to the signup page if there is an error
			failureFlash : true // allow flash messages
		}));

	// facebook -------------------------------

		// send to facebook to do the authentication
		app.get('/connect/facebook', passport.authorize('facebook', { scope : 'email' }));

		// handle the callback after facebook has authorized the user
		app.get('/connect/facebook/callback',
			passport.authorize('facebook', {
				successRedirect : '/profile',
				failureRedirect : '/'
			}));

	// twitter --------------------------------

		// send to twitter to do the authentication
		app.get('/connect/twitter', passport.authorize('twitter', { scope : 'email' }));

		// handle the callback after twitter has authorized the user
		app.get('/connect/twitter/callback',
			passport.authorize('twitter', {
				successRedirect : '/profile',
				failureRedirect : '/'
			}));


	// google ---------------------------------

		// send to google to do the authentication
		app.get('/connect/google', passport.authorize('google', { scope : ['profile', 'email'] }));

		// the callback after google has authorized the user
		app.get('/connect/google/callback',
			passport.authorize('google', {
				successRedirect : '/profile',
				failureRedirect : '/'
			}));

// =============================================================================
// UNLINK ACCOUNTS =============================================================
// =============================================================================
// used to unlink accounts. for social accounts, just remove the token
// for local account, remove email and password
// user account will stay active in case they want to reconnect in the future

	// local -----------------------------------
	app.get('/unlink/local', function(req, res) {
		var user            = req.user;
		user.local.email    = undefined;
		user.local.password = undefined;
		user.save(function(err) {
			res.redirect('/profile');
		});
	});

	// facebook -------------------------------
	app.get('/unlink/facebook', function(req, res) {
		var user            = req.user;
		user.facebook.token = undefined;
		user.save(function(err) {
			res.redirect('/profile');
		});
	});

	// twitter --------------------------------
	app.get('/unlink/twitter', function(req, res) {
		var user           = req.user;
		user.twitter.token = undefined;
		user.save(function(err) {
			res.redirect('/profile');
		});
	});

	// google ---------------------------------
	app.get('/unlink/google', function(req, res) {
		var user          = req.user;
		user.google.token = undefined;
		user.save(function(err) {
			res.redirect('/profile');
		});
	});

// =============================================================================
// CHAT ROOMS MANAGEMENT =======================================================
// =============================================================================


	// GROUPS SECTION =========================
	app.get('/groups', isLoggedIn, function(req, res) {
		var groups = [];

		Group.find({}, function(err, group) {
			// console.log(group);
			for(var i = 0; i < group.length; i++){
				var contain = false;
				for(var j = 0; j < req.user.groups.length; j++){
					console.log(group[i].id + " - " + req.user.groups[j].groupId);
					if(group[i].id.toString() == req.user.groups[j].groupId.toString())
					{
						console.log("Delete");
						contain = true;
						break;
					}
				}

				if(contain == false)
					groups.push(group[i]);

			}

			if(err) throw err;

			res.render('groups.ejs', {
				user : req.user,
				groups: groups
			});			
		});
	});

	app.get('/join/:groupId', function(req, res) {
		var groupId = req.params.groupId;
		var user = req.user;

		Group.findById(groupId, function(err, groupInfo){
			User.findByIdAndUpdate(
				user.id,
				{$push: {"groups": {groupName: groupInfo.name, groupId: groupInfo.id, lastRead: 0}}},
				{safe: true, upsert: true}, function(err, user){

					res.redirect('/profile');
					
				});
		});
		
	});

	app.post('/addGroup', function(req, res){
		// res.render("hello");
		// return "Hello";
		var user = req.user;
		// console.log(user);

		var newGroup = Group({
			name: req.body.groupName,
			// messages: [{messageOwnerId: user.id, messageOwnerName: user.email, message: "First Message by " + user.local.email, time:new Date()}],
			creatorId: user.id,
			created_at: new Date(),
			updated_at: new Date()
		});

		newGroup.save(function(err, group) {
			if(err) throw err;

			User.findByIdAndUpdate(
				user.id,
				{$push: {"groups": {groupName: group.name, groupId: group.id, lastRead: 0}}},
				{safe: true, upsert: true}, function(err, user){

					res.redirect('/groups');
					
				});
		});
	});

	app.get('/chat/:groupId', function(req, res){
		var groupId = req.params.groupId;

		var user = req.user;
		var userGroups = user.groups;
		var inGroup = false;
		var group;

		for(var i = 0; i < userGroups.length; i++){
			if(userGroups[i].groupId == groupId){
				inGroup = true;
				group = userGroups[i];
				break;
			}
		}

		if(!inGroup) {
			res.redirect('/profile');
			// console.log("failed");
		} else {

			Group.findById(
				groupId,
				function(err, groupInfo){

					res.render('chat.ejs', {
						user : req.user,
						group : groupInfo,
						message: {}
					});
					// io.on('connection', function(socket){
					// 	socket.join(groupId);
					// 	// console.log(groupInfo);

					// });
				});
			// console.log(group);
		}
	});

	io.on('connection', function(socket){
	  socket.on('chat message', function(msg){
	    console.log('message: ' + msg);
	  });

	  socket.on('create', function(room) {
	  	socket.join(room);
	  	console.log('Join Rooom ' + room);
	  });

	  socket.on('read', function(info) {
	  	// console.log('Join Rooom ' + room);
	  	// User.findById(info.userId,
	  	// 	function(err, user){
	  			User.update(
	  				{'_id': info.userId, 'groups.groupId': info.room}
	  				, {'$set': {'groups.$.lastRead': info.lastMsgIndex}}
	  				, function(err, user){
	  				if(err) throw err;

	  				console.log(user);
	  			});
	  		// });
	  });

	  socket.on('sendMessage', function(msg) {
	  	// console.log('my message ');
	  	// console.log(msg.room);
	  	saveMsg = {};
	  	saveMsg.messageOwnerId = msg.messageOwnerId;
	  	saveMsg.messageOwnerName = msg.messageOwnerName;
	  	saveMsg.message = msg.message;
	  	saveMsg.time = new Date();
	  	Group.findByIdAndUpdate(
	  		msg.room, 
	  		{$push: {messages:saveMsg}},
	  		function(err, groupInfo){
	  			msg.lastMsgIndex = groupInfo.messages.length;
	  			io.sockets.in(msg.room).emit('recieve', msg);
	  		});

	  	
	  	// console.log(socket.room);
	  });
	});

	app.post('/chat/:groupId', function(req, res){
		var groupId = req.params.groupId;

		var user = req.user;
		var userGroups = user.groups;
		var inGroup = false;

		// console.log("Test " + user.id + " " + groupId);
		io.emit('chat message', {messageOwnerName: user.name, messageOwnerId: user.id, time: new Date(), message: req.body.message});
		// var temp = usr + ' : ' + $('#m').val();
		// io.on('connection', function(socket){
		//   socket.on(groupId, function(msg){
		//     io.emit(groupId, {messageOwnerName: user.name, messageOwnerId: user.id, time: new Date(), message: req.body.message});
		//     console.log("Hello");
		//     return;
		//   });
		// });
        // socket.emit(groupId, {messageOwnerName: user.name, messageOwnerId: user.id, time: new Date(), message: req.body.message});
        
		
	});


};

// route middleware to ensure user is logged in
function isLoggedIn(req, res, next) {
	if (req.isAuthenticated())
		return next();

	res.redirect('/');
}