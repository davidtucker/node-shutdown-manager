var shutdownManager = require('../lib/index.js');
var q = require('q');

// Creating a Custom Logger
// This could be integrated with any other logging
// frameworks such as Winston
var customLogger = {
	log: function(msg) {
			console.log("CUSTOM LOGGER: " + msg);
	}
};

// Creating the Shutdown Manager
// You can optionally include a custom logger and logging
// prefix (as seen below)
var manager = shutdownManager.createShutdownManager({
	logger: customLogger,
	loggingPrefix: "[Custom Logging Prefix]: "
});

// Adding Async Named Function
var async1Function = function() {
	var deferred = q.defer();
	setTimeout(function() {
		console.log("Async Action 1 Completed");
		deferred.resolve();
	}, 1000);
	return deferred.promise;
};

manager.addShutdownAction(async1Function);

// Adding Async Anonymous Function
manager.addShutdownAction(function() {
	var deferred = q.defer();
	setTimeout(function() {
		console.log("Async Action 2 Completed");
		deferred.resolve();
	}, 3000);
	return deferred.promise;
});

// Adding Synchronous Anonymous Function
manager.addShutdownAction(function() {
	console.log("Synchronous Action Completed");
});

// This will call a function which doesn't exist.  This
// will trigger the shutdown process because we didn't
// tell the manager to not shutdown on uncaught exceptions.
setTimeout(function() {
	callSomethingThatDoesntExist();
}, 5000);
