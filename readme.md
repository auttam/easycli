# Easy Cli
A quick and easy way of creating command line tool for your npm package.

## Quick Start

### Installation

```
npm install @auttam/easycli
```

#### Building a command line tool 
Building a command line tool for a npm package requires following -

1. A npm package
2. A script that serves as a program for the command line tool. These type of scripts contain _hashbang for Node.js scripts_ and are normally kept in `bin` folder of npm package.
3. An entry in the `bin` key of a `package.json` that maps a command name to the program script. This entry specifies by what command the program will be invoked from the command line.

#### Building a command line tool with EasyCli
EasyCli provides features required to create a cli program. Creating a program is as easy as declaring a class and implementing method(s) that are invoked from the command line.

```javascript
#!/usr/bin/env node
const Program = require('@auttam/easycli').Program

// declares program
class MyCli extends Program {

    // entry point 
    main() { }
}

// runs program
Program.run(new MyCli())
```
The `main()` method will be called automatically when above program is invoked.

EasyCli also supports program commands (not enabled by default) where the first _non-option_ argument is treated as the command of the cli program. 

When commands are enabled, easy-cli will treat _read_ as the `read` command in the following example -

```
my-cli read ./my_spec.js
```

 
#### Building hello-world program
Following is a quick tutorial on how to create a simple program that accepts an argument as a parameter from command line and displays it back to the console.

##### Writing the program
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

##### Running the program

The program can be tested locally by running the following command -

```
node ./bin/hello-world [arguments]
```

where _arguments_ is the list of arguments the program accepts.

To test globally, update the `bin` field of package.json as shown below and install the package globally. See [npm docs](https://docs.npmjs.com/cli/install) for more information.

`package.json`
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
Though the configuration shown above just adds the help texts to the program and to its `message` parameter, several other things can be configured. See **Cli Configuration** for information.

## Cli Configuration
Though easy-cli generates the configuration initially, it allows adding more and/or replace the existing configuration before running the program. Almost any configuration can be changed except `methodName` of the auto-generated commands and `propName` of the auto-generated parameters 

Following are the details of configurations for Program, Command, Params and Options. 

### Program Configuration

```javascript
{
    /** all fields are optional */

    /** name of the cli tool e.g. Http Server */
    "name": "string",

    /** name to match "bin" key of package.json */
    "binaryName": "string", 

    /** help text for the command line tool */
    "help": "string",

    /** version number to match package.json */
    "version": "string",

    /** array of program parameters, see param config */
    "params": [],

    /** array of program options, see option config */
    "options": [],

    /** array of program commands */
    "commands": []
}
```

### Command Configuration

```javascript
{
    /** name of the command */
    "name": "string"

    /** name of the class method mapped with the command */
    "method": "string"

    /** help text for the command */
    "help": "string",

    /** array of command parameters, see param config */
    "params": [],

    /** array of command options, see option config */
    "options": [],
}
```

### Param Configuration

```javascript
{    
    /** name of the parameter */
    /** required field */
    "name": "string",

    /** help text for the parameter */
    "help": "string",

    /** name of the property for code reference */
    /** not: changing this field when parameter is already 
        auto-generated from method signature will throw a 
        configuration error */ 
    "propName": "string",
    
    /** specifies whether parameter accepts a single (default) 
        value or a list of values e.g. arg1 arg2 arg3 ...*/
    "type": "single | list",

    /** if set to true, make sure value is supplied for the 
        parameter */
    "required": true|false, 

    /** string array specifies list of accepted values for the 
        parameter, throws error different value is supplied. 
        To prevent error default value must be provided to 
        the "value" field */
    "acceptOnly": ["string"],
 
    /** default value, must be one of accepted values */
    "value": "string"
}
```

### Option Configuration

```javascript
{    
    /** name of the option */
    /** required field */
    "name": "string",
 
    /** help text for the option */
    "help": "string",
    
    /** name of the property for code reference */
    "propName": "string",
    
    /** string array specifying other possible names for the 
        option, can contain single characters or words */
    "aliases": [ "string" ]

    /** string array specifies list of accepted values for the 
        option, same as parameters */
    "acceptOnly": ["string"],
 
    /** default value, must be one of accepted values */
    "value": "string"
}
```

## Program Setting
EasyCli also provides couple of settings that controls the program execution. These setting must be set before calling `constructor` of the `Program` class. 

Following is how to update the settings -

```javascript
#!/usr/bin/env node
const Program = require('@auttam/easycli').Program

// updating program settings
Program.settings({
    mainMethod: "init",
    useColors: false
})

class HelloWorld extends Program {
    init() {
        console.log("init() is main now, & help won't have colors")
    }
}

Program.run(new HelloWorld())

```

### Available Settings with default values

```javascript
{
    /** name of the main method to call when program is running in no-command mode */
    mainMethod: "main",
    
    /** global rejection handler for 'unhandledRejection' event of the process */
    rejectionHandler: (reason, promise) => { console.error(reason) },
    
    /** index from where minimist should start parsing command line arguments */
    processArgvStartIndex: 2,
    
    /** options for minimist arguments parser, see minimist package for more help  */
    minimistOptions: null,
    
    /** flag to enable program commands */
    /** note: when commands are enabled, mainMethod is not called */
    enableCommands: false,
    
    /** flag to enable global help command  */
    enableHelpCommand: true,

    /** flag to enable global version option --version, -v or --Ver */
    enableVersionOption: true,

    /** flag to enable global help option --help or -h */
    enableHelpOption: true,

    /** flag to show help when no command argument is supplied to the program */
    showHelpOnNoCommand: true,
    
    /** flag to show help on invalid options i.e when value provided is not allowed */
    showHelpOnInvalidOptions: true,
    
    /** flag to prioritize program options, i.e. call 'onProgramOption' even when command has options */
    prioritizeProgramOptions: false,
    
    /** flag to show help on invalid parameter, like required param missing, value provided is not allowed etc. */
    showHelpOnInvalidParams: true,
    
    /** flag to use colors while printing text to console */
    useColors: true,

    /** list of method names to ignore as command methods */
    nonCmdMethods: ['onInvalidCommand', 'onExit', 'onProgramOption'],
    
    /** name of the method that is called when command name not supplied */
    defaultCommandMethod: "defaultCommand",
    
}
```

## Sample Program

### figlet-demo

In this example-
1. Configuration is in a separate file
2. Main method is executed asynchronously 
3. `async/await` is used
4. `acceptOnly` field of options configuration is set dynamically 

Program configuration file: `bin/config.json`

```json
{
    "help": "Figlet demo created with EasyCli",
    "params": [
        {
            "name": "text",
            "help": "text to generate asci art",
            "required": true
        }
    ],
    "options": [
        {
            "name": "help",
            "aliases": [
                "f"
            ],
            "help": "font to use for drawing asci art"
        },
        {
            "name": "horizontal-layout",
            "aliases": [
                "hl"
            ],
            "value": "default",
            "help": "value that indicates the horizontal layout to use",
            "acceptOnly": [
                "default",
                "full",
                "fitted",
                "controlled smushing",
                "universal smushing"
            ]
        },
        {
            "name": "vertical-layout",
            "aliases": [
                "vl"
            ],
            "value": "default",
            "help": "value that indicates the vertical layout to use",
            "acceptOnly": [
                "default",
                "full",
                "fitted",
                "controlled smushing",
                "universal smushing"
            ]
        }
    ]
}
```

Program script file: `bin/figlet-demo.js`

```javascript
#!/usr/bin/env node
const Program = require('@auttam/easycli').Program
const figlet = require('figlet')
const config = require('./config')

class FigletDemo extends Program {

    async main(text, $options) {
        var data = await this.generate(text, {
            font: $options.font,
            horizontalLayout: $options.horizontalLayout,
            verticalLayout: $options.verticalLayout,
        })
        console.log(data)
    }

    generate(msg, options) {
        return new Promise((resolve, reject) => {
            figlet(msg, options, (err, data) => {
                if (err) {
                    reject(err)
                    return
                }
                resolve(data)
            })
        })
    }
}

// loading available font names
figlet.fonts(function (err, fonts) {
    if (err) {
        console.log('There was some error running figlet demo');
        console.dir(err);
        return;
    }

    // setting font names as accepted values for --font option
    config.options[0].acceptOnly = fonts

    // running program
    Program.run(new FigletDemo(config))
});

```

`package.json` file:

```
{
    "bin":{
        "figlet-demo" : "bin/figlet-demo"
    }
}
```
