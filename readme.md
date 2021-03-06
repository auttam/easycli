# Easy CLI

## Installation
Install **@auttam/easycli** package

```
npm install @auttam/easycli
```

## Example # 1

```js
const { Program } = require('@auttam/easycli');

class HelloWorld extends Program {

    main(message, $options){
        // use default message if message not from the cli
        let greetMessage = message || "Hello World!";        

        // check for the underline options
        if($options.$has("u", "U", "underline")) {
            greetMessage = `\u001b[4m${greetMessage}\u001b[0m`;
        }

        // check of the color options
        if($options.$has("c", "C", "color")) {
            greetMessage = `\u001b[32m${greetMessage}\u001b[0m`;
        }

        console.log(greetMessage);
    }
}

// run the program
Program.run(new HelloWorld());
```

To test, save the example above as `bin/hello-world.js` file and run the following commands -

```
node ./bin/hello-world
# output: Hello World!

node ./bin/hello-world "Test Message"
# output: Test Message

node ./bin/hello-world -cu
# displays 'Hello World!' with underline and green color

node ./bin/hello-world -h 
# displays help

node ./bin/hello-world -v
# displays cli version which is by default '1.0.0'
```

- All the *non-option* command-line arguments are passed as the parameters of the `main()` method
- Add `$params` parameter to the `main()` method to access all the parameters supplied from the cli
- Add `$options` parameter to the `main()` method to access all options supplied from the cli
    - Use `$options.$has(...names)` to check if any of the option from the list is set
    - Use `$options.$get(name)` to get the value supplied with the option e.g. `node ./bin/hello-world --value_option=my_value`
    - To access options by name e.g. `$options.underline` when any of `-u`, `-U` or `--underline` option is set, add program configuration. Find more information [here](https://github.com/auttam/easycli/wiki/CLI-Configuration).

## Example # 2
```js
const { Program } = require("@auttam/easycli");

// enable commands
Program.settings({
  enableCommands: true,
});

class SimpleCalculator extends Program {
  divideCommand(dividend, divisor) {
    if (isNaN(dividend) || isNaN(divisor)) {
      console.log("dividend and divisor must be numbers");
      return;
    }
    console.log(`${dividend}/${divisor} = ${dividend / divisor}`);
  }

  addCommand(...numbers) {
    // due to configuration added below,
    // the numbers parameter will never be empty
    if (numbers.some((item) => isNaN(item))) {
      console.log("All parameters must be numbers");
      return;
    }

    const total = numbers.reduce((sum, number) => sum + number);
    console.log(`${numbers.join("+")} = ${total}`);
  }
}

// add configuration and run program
Program.run(
  new SimpleCalculator({
    commands: [
      {
        name: "add",
        method:"addCommand",
        params: [
          {
            name: "numbers",
            required: true,
          }
        ],
      },
    ],
  })
);
```
To test, save the example above as `bin/simple-calculator.js` file and run following commands -

```
# Displays list of available commands
node ./bin/simple-calculator

# Runs add command
node ./bin/simple-calculator add 5 5 5
# output: 5+5+5 = 15

# Runs divide command
node ./bin/simple-calculator divide 5 2
# output: 5/2 = 2.5
```

Printing CLI help using `node ./bin/simple-calculator -h`
```
Simple Calculator v1.0.0

Usage: simple-calculator <command>

Available Commands:

   divide
   add

See command help for more options

Other usage:

   simple-calculator --help, -h             To view help
   simple-calculator <command> --help, -h   To view command help
   simple-calculator --version, -v          To view help
   simple-calculator help                   To view help

```

## More help 
Quick start guide and more help [available here](https://github.com/auttam/easycli/wiki)
