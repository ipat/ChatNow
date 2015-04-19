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
		res.redirect('/groups');
	});

	// PROFILE SECTION =========================
	app.get('/profile', isLoggedIn, function(req, res) {
		var ugroups = [];
		var jgroups = [];
		Group.find({}, function(err, groups) {
			for(var i = 0;  i < req.user.groups.length; i++){
				for(var j = 0; j < groups.length; j++){
					if(req.user.groups[i].groupId.toString() == groups[j].id.toString()){
						req.user.groups[i].unseen = groups[j].messages.length - req.user.groups[i].lastRead;
						break;
					}
				}
			}
			console.log(req.user);
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

							if(group[i].creatorId == req.user.userId)
								jgroups[i] = true;
							else 
								jgroups[i] = false;
							jgroups.push(group[i]);
							break;
						}
					}

					if(contain == false)
						ugroup.push(group[i]);

				}

				if(err) throw err;
				console.log('ooooooooo ' + jgroups)

				res.render('profile.ejs', {
					user : req.user,
					own : jgroups,
					groups: ugroups,
					message: {}
				});			
			});

		});
		
	});



	// LOGOUT ==============================
	app.get('/logout', function(req, res) {
		checkLeaveGroup({"name":req.user.local.email,"url":req.headers.referer});
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
			//console.log(req.flash('loginMessage').toString()+'sssss');
			var msg = req.flash('loginMessage').toString();
			res.render('login.ejs', { message: msg});
			//res.render('login.ejs', { message: 'asdfsadfsad' });

		});

		// process the login form
		app.post('/login', passport.authenticate('local-login', {
			successRedirect : '/groups', // redirect to the secure profile section
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
			successRedirect : '/groups', // redirect to the secure profile section
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
		checkLeaveGroup({"name":req.user.local.email,"url":req.headers.referer});
		var groups = [];
		var unjoined = [];
		var jgroups = [];
		Group.find({}, function(err, groups) {
			for(var i = 0;  i < req.user.groups.length; i++){
				for(var j = 0; j < groups.length; j++){
					if(req.user.groups[i].groupId.toString() == groups[j].id.toString()){
						req.user.groups[i].unseen = groups[j].messages.length - req.user.groups[i].lastRead;
						break;
					}
				}
			}
			console.log(req.user);
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
							console.log('CHECK ' + group[i].creatorId + '-' + req.user._id + ' = ' + (group[i].creatorId == req.user._id));
							if(group[i].creatorId.toString() == req.user._id.toString())
								jgroups[j] = true;
							else 
								jgroups[j] = false;
							// jgroups.push(group[i]);
							break;
						}
					}

					if(contain == false)
						unjoined.push(group[i]);
				}

				if(err) throw err;

				console.log('ooooooooo ' + jgroups)
				console.log('USERRR' + req.user);

				res.render('groups.ejs', {
					user : req.user,
					own : jgroups,
					groups: unjoined,
					message: {}
				});			
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

					res.redirect('/groups');
					
				});
		});
		
	});

	app.get('/delete/:groupId', function(req, res) {
		var groupId = req.params.groupId;
		var user = req.user;

		// Group.findById(groupId, function(err, groupInfo){
		// 	User.findByIdAndUpdate(
		// 		user.id,
		// 		{$push: {"groups": {groupName: groupInfo.name, groupId: groupInfo.id, lastRead: 0}}},
		// 		{safe: true, upsert: true}, function(err, user){

		// 			res.redirect('/groups');
					
		// 		});
		// });
		Group.find({_id: groupId, 'creatorId': user.id}).remove(function(err) {
			
		});

		User.update(
				{},
				{$pull: {"groups": {groupId: groupId}}},
				{safe: true, upsert: true, multi: true}, function(err, user){

					res.redirect('/groups');
					
				});

	});


	app.get('/leave/:groupId', function(req, res) {
		var groupId = req.params.groupId;
		var user = req.user;
		console.log('gid ' + groupId);

		Group.findById(groupId, function(err, groupInfo){
			console.log(groupInfo);
			User.findByIdAndUpdate(
				user.id,
				{$pull: {"groups": {groupId: groupInfo.id}}},
				{safe: true, upsert: true}, function(err, user){

					res.redirect('/groups');
					
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
		checkLeaveGroup({"name":req.user.local.email,"url":req.headers.referer});
		var user = req.user;
		var userGroups = user.groups;
		var inGroup = false;
		var group;
		var lastRead = 0;

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
			// var unreadNum = groupInfo.messages.length - group.lastRead;

			Group.findById(
				groupId,
				function(err, groupInfo){

					res.render('chat.ejs', {
						user : req.user,
						group : groupInfo,
						message: {},
						unread: group.lastRead
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

	  socket.on('create', function(joinVar) {
	  	console.log(joinVar);
	  	socket.join(joinVar.room);
	  	// console.log('Join Rooom ' + room);
	  	msg = {};
	  	msg.joinGroup = true;
	  	msg.message = joinVar.name + " connected to the group";
	  	io.sockets.in(joinVar.room).emit('recieve', msg);
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

	  				//console.log(user);
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
	  			msg.joinGroup = false;
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


function checkLeaveGroup(data) {
	var parts = data.url.split("/");
	if(parts[parts.length - 2] == "chat") {
		msg = {};
	  	msg.joinGroup = true;
	  	msg.message = "<span style='color:red;'>" + data.name + " left the group</span>";
	  	io.sockets.in(parts[parts.length - 1]).emit('recieve', msg);
	}
	console.log(parts[parts.length - 2]);
}


};



// route middleware to ensure user is logged in
function isLoggedIn(req, res, next) {
	if (req.isAuthenticated())
		return next();

	res.redirect('/login');
}