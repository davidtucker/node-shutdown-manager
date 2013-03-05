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
var ShutdownManager = require('./shutdownManager');

/**
 * This method will create a shutdown manager instance.  It takes a parameters object.
 * 
 * @param params [Object]
 *     * +logger+ - (<tt>Object</tt>) You can pass in a custom logger.  If a custom logger
 *		is not passed in, the console will be used.
 *     * +loggingPrefix+ - (<tt>String</tt>) The classes uses a default prefix for all log
 *		messages.  You can pass in your own prefix instead of the default.
 */
exports.createShutdownManager = function(params) {
	var manager = new ShutdownManager(params);
	return  manager;
};
