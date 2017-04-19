/**
 * Copyright 2013 - David Tucker (http://www.davidtucker.net)
 *
 * Released under an MIT License (MIT)
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software
 * and associated documentation files (the "Software"), to deal in the Software without restriction,
 * including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial
 * portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT
 * LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
 * NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
 * SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
var q = require('q');
var util = require('util');
var EventEmitter = require('events').EventEmitter;

// DEFAULTS
var DEFAULT_LOGGING_PREFIX = "[ShutdownManager]: ";
var DEFAULT_SHUTDOWN_ON_UNCAUGHT_EXCEPTION = true;

/**
 * The manager class which handles detecting the shutdown process as well as managing
 * a chain of actions to be performed when the shutdown process has been detected.
 *
 * @param params [Object]
 *     * +logger+ - (<tt>Object</tt>) You can pass in a custom logger.  If a custom logger
 *		is not passed in, the console will be used.
 *     * +loggingPrefix+ - (<tt>String</tt>) The classes uses a default prefix for all log
 *		messages.  You can pass in your own prefix instead of the default.
 *     * +timeout+ - (<tt>Integer</tt>) If set, the timeout (in milliseconds)
 *              for waiting for the action promises to complete.  Default is none (infinite wait)
 */
function ShutdownManager (params) {
        // Set State
	var that = this;
	this.isShuttingDown = false;
	this.actionChain = [];
	this.finalActionChain = [];

	// Set Parameters
	this.logger = (params && params.hasOwnProperty("logger")) ? params.logger : null;
	this.loggingPrefix = (params && params.hasOwnProperty("loggingPrefix")) ?
		params.loggingPrefix : DEFAULT_LOGGING_PREFIX;

	// Add Process Handlers
	process.on('SIGINT', function() {
                if (!that.emit('preShutdown', 'SIGINT')) {
    		    that._log("Received SIGINT, Beginning Shutdown Process");
                }
		that._shutdown(128+2, params.timeout);
	});

	process.on('SIGTERM', function() {
                if (!that.emit('preShutdown', 'SIGTERM')) {
		    that._log("Received SIGTERM, Beginning Shutdown Process");
                }
		that._shutdown(128+15, params.timeout);
	});

	process.on('uncaughtException', function (err) {
                if (!that.emit('preShutdown', 'uncaughtException', err)) {
                    that._log('Uncaught Exception Received, Beginning Shutdown Process');
                    that._log('Exception: '+err);
                }
 	        that._shutdown(255, params.timeout);
	});

        process.on('unhandledRejection', function (err) {
                if (!that.emit('preShutdown', 'unhandledRejection', err)) {
                    that._log('Unhandled Rejected Promise Received, Beginning Shutdown Process');
                    that._log('Rejection: '+err);
                }
                that._shutdown(255, params.timeout);
        });

	process.on('exit', function() {
		// Just in case we are getting to exit without previous conditions being met
		// Not sure if this happens - will test.
		if(!that.isShuttingDown) {
                    that.emit('preShutdown', 'exit');
                    that._log("Application Exiting for Undefined Reason, Beginning Shutdown Process");
                    that._shutdown(null, params.timeout);
		}
	});
        EventEmitter.call(this);
}
util.inherits(ShutdownManager, EventEmitter);

module.exports = ShutdownManager;

/**
 * Adds a function to be performed when a shutdown is detected.  This
 * can be either a synchronous function or an asynchronous function
 * which returns a promise (CommonJS Promises/A).
 *
 * @param [Function] The function to be added to the shutdown chain
 */
ShutdownManager.prototype.addShutdownAction = function(func) {
	this.actionChain.push(func);
};

/**
 * Adds a function to be performed when a shutdown is detected.  This
 * can be either a synchronous function or an asynchronous function
 * which returns a promise (CommonJS Promises/A).
 *
 * Actions registered with addFinalShutdownAction are executed after 
 * all the actions registered with addShutdownAction are complete.
 *
 * @param [Function] The function to be added to the shutdown chain
 */
ShutdownManager.prototype.addFinalShutdownAction = function(func) {
	this.finalActionChain.push(func);
};

/**
 * @api private
 */
ShutdownManager.prototype._executeActions = function(_actionChain) {
	var that = this;
	var promises = [];
	_actionChain.forEach(function(chainFunc) {
            try {
                var result = chainFunc.apply(this);
                if(that._isPromise(result)) {
                    promises.push(result);
                }
            } catch (err) {
                if (!that.emit('shutdownActionException', err, chainFunc)) {
                    that._log("Ignoring Exception Caught from Callback: "+err);
                }
            }
	});
        return promises;
}

/**
 * @api private
 */
ShutdownManager.prototype._shutdown = function(exitCode, timeout) {
    var that = this;
    if(this.isShuttingDown) {
        return;
    }
    this.isShuttingDown = true;

    var promises = that._executeActions(this.actionChain);

    var rv = q.allResolved(promises);
    if (timeout > 0) {
        rv = rv.timeout(timeout);
    }
    rv.then(function() {
        promises = that._executeActions(that.finalActionChain);

        var rv = q.allResolved(promises);
        if (timeout > 0) {
            rv = rv.timeout(timeout);
        }
        rv.then(function() {
            that._exit(exitCode);
        }, function(error) {
            that._exit(255, error);
        });
    }, function(error) {
        that._exit(255, error);
    });
};

/**
 * @api private
 */
ShutdownManager.prototype._exit = function(exitCode, errors) {
    if (!this.emit('shutdownComplete', errors, exitCode)) {
        if (errors) {
            this._log("Exiting with Error(s): " + errors);
            process.exit(exitCode);
        } else {
            this._log("Exiting without errors");
            process.exit(exitCode);
        }
    }
};

/**
 * @api private
 */
ShutdownManager.prototype._log = function(msg) {
	var formattedMsg = this.loggingPrefix + msg;
	if(this.logger) {
		this.logger.log(formattedMsg);
	} else {
		console.log(formattedMsg);
	}
};

/**
 * @api private
 */
ShutdownManager.prototype._isPromise = function(value) {
	return (value && (typeof value.then === 'function')) ? true : false;
};
