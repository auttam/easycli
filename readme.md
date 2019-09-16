# Easy CLI
A quick and easy way of creating a command-line tool for npm package.

## Quick Start Guide

### Installation

```
npm install @auttam/easycli
```

### Creating a simple CLI program with EasyCli
Following is an example of a simple CLI program that accepts command-line arguments and prints a message to the console.

1. Initialize new npm package if not already exists
2. Install easy cli package (see the installation above)
3. Create `bin/hello-world.js` script with the following code -

```javascript
#!/usr/bin/env node
const Program = require('@auttam/easycli').Program

// represents the CLI program
class HelloWorld extends Program {

    // method called when CLI is invoked
    // command-line arguments passed as the parameters
    // parameter $options contains all the options 
    main(message, $options) {
        
        message = message || 'Hello World'
        
        // checking if '-U' option is set
        if ($options.$get('U')) {
            message = message.toUpperCase()
        }

        // printing the message
        console.log(message)
    }
}

// Running the program
Program.run(new HelloWorld())
```

Run the script using the following command -
```
node ./bin/hello-world "simple cli" -U

# expected output
# SIMPLE CLI
```
To test the CLI tool globally -

Update the `bin` field in package.json as with a command as shown in example below and install the package globally -

```
{
    "bin":{
        "hello-world" : "bin/hello-world"
    }
}
```

Try following commands (assuming package is installed globally) -

```
hello-world

# expected output
# SIMPLE CLI
```
#### Cli Help
EasyCli generates and displays the help for the CLI tool when `-h` or `--help` option is set. To view the help for the `hello-world` tool, run the script as following:

```
node ./bin/hello-world -h 
```
#### Cli Version
Like help, easycli also displays version information when any of `-v`, `--ver`, or `--version` option is set:

 ```
node ./bin/hello-world -v 
```

### Creating a command based CLI program
EasyCli supports two types of programs: a simple program like shown above which contains a "main" method that is called whenever CLI is invoked. All command-line arguments are interpreted as the parameters and options of this method. 

Another type of program it supports is the command based program that contains multiple methods that are called based on the requested command. 

Following is an example of a CLI program that accepts 3 different commands: `print-message`, `sum` and `test`.

Create another script called `bin/demo-commands.js` and copy the following contents -

```javascript
#!/usr/bin/env node
const Program = require('@auttam/easycli').Program

// enable commands
Program.settings({
    enableCommands: true
})

// represents the CLI program
class DemoCommands extends Program {

    // method called when 'print-message' command is requested
    // parameters work same as for main() method
    printMessageCommand(message, $options) {
        message = message || 'Hello World'

        // checking if '-U' option is set
        if ($options.$get('U')) {
            message = message.toUpperCase()
        }

        // printing the message
        console.log(message)
    }

    // method called when 'sum' command is requested
    // parameters work same as for main() method
    sumCommand(...numbers) {
        if (!numbers.length) return
        console.log('Result:', numbers.reduce((p, c) => p + c))
    }

    // method called when 'test' command is requested
    // parameters work same as for main() method
    testCommand($params, $options) {
        console.log('This is a test command');
        // log all parameters supplied to the cli program
        console.log('params:', $params.$unknown);
        //log all options supplied to the cli program
        console.log('options:', $options.$unknown);
    }

}

// Running the program
Program.run(new DemoCommands())

```
To run the commands implemented above, run the script as shown in the following examples -
```
# 1. running print-message command
node ./bin/demo-commands print-message "Hello Commands!"

# expected output
# Hello Commands!
```
```
# 2. running sum command
node ./bin/demo-commands sum 1 2 3 4 5

# expected output
# Result: 15
```
```
# 3. running test command
node ./bin/demo-commands test param1 param2 --option1 --option2 Yes

# expected output
# This is a test command
# params: [ 'param1', 'param2' ]
# options: { option1: true, option2: 'Yes' }
```
### Creating configuration

EasyCli generates an internal configuration from the code that is used to run the program and to display CLI help. 

This configuration can be customized or elaborated for more advanced uses.

Following code shows how to add configuration for the `hello-world` program-

```javascript
#!/usr/bin/env node
const Program = require('@auttam/easycli').Program

// configuration object
var config = {
    help: 'This is a demo command-line tool',
    params: [
        {
            name: 'message',
            help: 'message to print'
        }
    ]
}

#!/usr/bin/env node
const Program = require('@auttam/easycli').Program

// represents the CLI program
class HelloWorld extends Program {

    // method called when CLI is invoked
    // command-line arguments passed as the parameters
    // parameter $options contains all the options 
    main(message, $options) {
        
        message = message || 'Hello World'
        
        // checking if '-U' option is set
        if ($options.$get('U')) {
            message = message.toUpperCase()
        }

        // printing the message
        console.log(message)
    }
}

// Running the program
Program.run(new HelloWorld(config))
```
Run the script again with `-h` or `--help` option and notice how help now shows help text for `message` parameter.

```
node ./bin/hello-world -h 
```

Though the configuration shown above just adds the help texts to the program and to its `message` parameter, several other things can be configured. See [CLI Configuration](https://github.com/auttam/easycli/wiki/CLI-Configuration) wiki on github for information.

For more information visit [wiki](https://github.com/auttam/easycli/wiki) page.