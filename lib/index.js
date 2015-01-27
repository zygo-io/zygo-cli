var Zygo = require('zygo-server');
var path = require('path');
var cli = require('cli');
var log = require('./log');

//Set up options and documentation.
cli.parse({
  //commands
  serve: ['s', 'Start a zygo server instance serving your app.'],
  setmode: ['m', 'Set application mode to production or development.', 'string'],
  bundle: ['b', 'Bundle the application. Bundles only used in production mode.'],

  //context
  debug: [false, 'Print detailed error messages.'],
  port: ['p', 'Overrides the server port specified in zygo.json.', 'number'],
  dir: ['d', 'Directory to bundle into.']
});

cli.main(function(args, options) {
  var zygoJSON = args[0] || 'zygo.json';
  var zygo = new Zygo(zygoJSON);

  zygo.initialize()
    .then(function() {
      //Save context options in their zygo.json


      //Run any commands they may have specified.
      if (options.serve) return serve(zygo, options);
      if (options.setmode) return setmode(zygo, options);
      if (options.bundle) return bundle(zygo, options);

      //No command specified. Ok.
      log.printError("No command specified. For help, run:");
      log.printNormal("zygo-cli --help");
    })
    .catch(function(error) {
      log.printError("Could not load zygo.json. Run zygo-cli as follows:");
      log.printNormal("zygo-cli [options] zygo.json");
      log.printNormal(getError(error, options));
    });
});

//Spin up a server instance.
function serve(zygo, options) {
  zygo.createServer(options.port || zygo.config.port);
}

function setmode(zygo, options) {

}

//Manually run bundling.
function bundle(zygo, options) {
  //If they specify a build directory, update the config.
  if (options.dir) {
    options.dir = path.resolve(process.cwd(), options.dir);

    log.printInfo("Build dir specified, updating zygo.json...");
    zygo.config.buildDir = options.dir;
    return Zygo.Config.save(zygo.config, {
      buildDir: { type: 'path' }
    })
      .then(function() {
        log.printOk("Updated.");
        options.dir = null;

        bundle(zygo, options);
      })
      .catch(function(error) {
        log.printError("Could not save build dir.");
        log.printNormal(getError(error, options));
      });
  }

  log.printInfo("Bundling app...");
  return zygo.build(options.dir)
    .then(function() {
      log.printOk("Successfully built bundles.");
    })
    .catch(function(error) {
      log.printError("Issue bundling app.");
      log.printNormal(getError(error, options));
    });
}

//Utility function. Given an error, returns what should be printed based on CLI debug flag.
function getError(error, options) {
  if (options.debug) return error.stack;
  return error;
}