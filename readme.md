# Easy Cli
A quick and easy way of creating cli for your npm package.

## Quick Start

### Create a script e.g. `test-cli.js`

```javascript
const Program = require('@auttam/easycli').Program

// Program class for cli
class HelloWorld extends Program {

    //
    // Main method: This method is called when program commands are
    // disabled. Parameters defined in the main method (or the command methods 
    // when program commands are enabled) are treated as the program's (or command's) parameters. 
    // $params and $options are special method parameters that contains 
    // the parameters and options supplied from command line 
    main(message, $options) {
        message = message || 'Hello World!'
        // checking whether any of the following options 
        // are supplied with truthy values
        if ($options.isSet('u', 'U')) {
            message = message.toUpperCase()
        }
        // printing message
        console.log(message)
    }
}


// Runs the program
Program.run(new HelloWorld())

```

### Run script

Run script without passing command line arguments:

```
node ./test-cli 

output:
Hello World!
```

Run script with single parameter:

```
node ./test-cli "Hello EasyCli"

output:
Hello EasyCli!
```

Run script with `-U` or `-u` option:

```
node ./test-cli -U

output:
HELLO WORLD!
```

Run script with `-h`, or `--help` option:
```
node ./test-cli --help

output:
Hello World v1.0.0

Usage: hello-world <message>

Parameters:

   message

Other usage:

   hello-world --help, -h      To view help
   hello-world --version, -v   To view help
```

### Configure Program

Update above script with the following content -

```javascript
// configuration object
var config = {
    name: 'Test Cli',
    binaryName: 'test-cli',
    help: 'This is a test cli',
    params: [
        {
            name: 'message',
            help: 'message to print',
            required: true
        }
    ],
    options: [{
        name: 'U',
        aliases: 'u',
        help: 'prints message in uppercase'
    }]
}


// Program class for cli
class HelloWorld extends Program {

    //
    // Main method
    main(message, $options) {

        // Message is configured to be a required parameter
        // thus expected to have a value always 

        if ($options.$isSet('u', 'U')) {
            message = message.toUpperCase()
        }

        // printing message
        console.log(message)
    }
}


// Runs the program with configuration
Program.run(new HelloWorld(config))
```

Running the script now without supplying any argument will trigger help as `message` is required.

```
node ./test-cli 

output:
Test Cli v1.0.0

This is a test cli

Usage: test-cli <message> [options ...]

Parameters:

   message      message to print (required)

Options:

   --U          prints message in uppercase
                Other Names:

Other usage:

   test-cli --help, -h      To view help
   test-cli --version, -v   To view help
```

Showing help by default on invalid parameter can be disabled by setting global setting `showHelpOnInvalidParams` to `false`. When help is disabled, runtime errors can be handled in `onExit()` method or in catch method of `Program.run()` method e.g. `Program.run(new HelloWorld(config)).catch(err=>{})`

```javascript

// disable help on invalid params
Program.settings({
    showHelpOnInvalidParams: false
})

var config = {
    name: 'Test Cli',
    binaryName: 'test-cli',
    help: 'This is a test cli',
    params: [
        {
            name: 'message',
            help: 'message to print',
            required: true
        }
    ],
    options: [{
        name: 'U',
        aliases: 'u',
        help: 'prints message in uppercase'
    }]
}


// Program class for cli
class HelloWorld extends Program {

    //
    // Main method
    main(message, $options) {

        // Message is configured to be a required parameter
        // thus expected to have a value always 

        if ($options.$isSet('u', 'U')) {
            message = message.toUpperCase()
        }

        // printing message
        console.log(message)
    }

    // method called before program ends
    onExit(error, execResult, exitCode) {
        console.error(error.message)
    }
}


// Runs the program with configuration
Program.run(new HelloWorld(config))

// If 'onExit()` is not implemented errors can also be handled as:
// Program.run(new HelloWorld(config)).catch(err=>console.error(error.message))

```
