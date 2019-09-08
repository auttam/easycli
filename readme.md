# Easy Cli
A quick and easy way of creating command line tool for your npm package.

## Quick Start

### Installation

```
npm install @auttam/easycli
```

#### Building a command line tool 
Building a command line tool for npm package requires following -

1. A npm package
2. A script that serves as a program for the command line tool. These scripts contains _hashbang for Node.js scripts_ and are normally kept in `bin` folder of npm package.
3. An entry in `bin` key of `package.json` that maps a command to the program script

##### Writing hello-world program
1. Initialize new npm package if not already exists
2. Install easycli package (see installation above)
3. Create `bin/hello-world.js` file with following content -

```javascript
#!/usr/bin/env node
const Program = require('@auttam/easycli').Program

// Program Class
class HelloWorld extends Program {

    // entry point 
    main(message) {
        message = message || 'Hello World!'
        console.log(message)
    }
}


// Runs the program
Program.run(new HelloWorld())
```

##### Running hello-world script

The program created for command line can be tested locally as 

```
node ./bin/hello-world [arguments]
```

where _arguments_ is the list of the arguments program accepts.

To install the tool globally update the `bin` field in package.json as following -

```
{
    "bin":{
        "hello-world" : "bin/hello-world"
    }
}
```

Try following commands (assuming package is installed globally) -

`hello-world`

output:
```
Hello World!
```

`hello-world "good morning!"`

output:
```
good morning!
```

`hello-world --help`

output:
```
Hello World v1.0.0

Usage: hello-world <message>

Parameters:

   message

Other usage:

   hello-world --help, -h      To view help
   hello-world --version, -v   To view help
```

##### Configuring the program
EasyCli generates a configuration dynamically for running program and generating help. For more complex uses, the configuration can be customized and extended by passing a configuration object to the constructor.

Following code shows a simple example of adding configuration for the  `hello-world` program-

```javascript
#!/usr/bin/env node
const Program = require('@auttam/easycli').Program

// configuration object
var config = {
    help: 'This is a demo command line tool',
    params: [
        {
            name: 'message',
            help: 'message to print'
        }
    ]
}

// Program Class
class HelloWorld extends Program {

    // entry point 
    main(message) {
        message = message || 'Hello World!'
        console.log(message)
    }
}


// Runs the program with configuration
Program.run(new HelloWorld(config))
```
The configuration shown above just adds a help text to the program and its `message` parameter, but configuration can be added for several other things. For example more parameters, options with aliases, declaring different reference names for parameters and options, specifying default values or predefined list of accepted values, aliases for options, changing program info etc.  
