# node-shutdown-manager

The node shutdown manager manages a chain of functions to be executed when the application is shutting down.  This manager allows both synchronous and asynchronous functions to be added, and only complete the shutdown process once the functions have finished executing.

This can be extremely helpful if you need to perform a few actions to cleanup your application before exiting.

## Install

```
npm install node-shutdown-manager
```

## API
  
You can create an instance of the shutdown manager by calling the ```createShutdownManager``` method.

```javascript
var shutdownManager = require('node-shutdown-manager').createShutdownManager();
```

Once created, you can add a method to the shutdown action chain by simply calling the ```addShutdownAction``` method.  This method will accept a function.  The function must not require any arguments.


```
manager.addShutdownAction(sampleFunction);
```

### Asynchronous Functions

You can add asynchronous functions to the action chain as long as they return a promise (that conforms to [CommonJS Promises/A](http://wiki.commonjs.org/wiki/Promises/A)).  I would recommend using [Q](https://github.com/kriskowal/q) if you are looking for a library that supports the promise spec.

```javascript
var async1Function = function() {
	var deferred = q.defer();
	setTimeout(function() {
		console.log("Async Action 1 Completed");
		deferred.resolve();
	}, 1000);
	return deferred.promise;
};
manager.addShutdownAction(async1Function);
```

### Customizing Logging

One aspect of customization with the manager is how it handles logging.  You can pass in any object as a custom logger as long as it has a ```log``` function with accepts the log message as an argument.  In addition, you can pass in a custom logging prefix (there is one used by default).

```javascript
var shutdownManager = require('node-shutdown-manager').createShutdownManager({
	logger: customLogger,
	loggingPrefix: "[Custom Logging Prefix]: "
});
```

## Shutdown Process

The manager detects the following situations:

* When your application is shutting down due to the SIGINT signal (for example when you press CTRL+C).
* When your application is shutting down due to the SIGTERM signal (when closed by the operating system or managing process).
* When your application is shutting down due to an uncaught exception.

It is important to know that other situations will cause the manager not to function.  For example, if your application is force closed (by receiving the SIGKILL signal), then the shutdown manager will not be executed.


## License

Copyright 2013 David Tucker  All rights reserved. 

The software is licensed under an MIT License:

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
