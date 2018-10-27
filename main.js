const pjson = require('./package.json');
const AppSPS = require('./app_sps');
const config = require('config');
const program = require('commander');
const Sequelize = require('sequelize');
const inquire = require('inquirer');

//const PassHolder = require('./passholder');

const app = new AppSPS({config: config});







// Program and commands initialization
program
    .version(pjson.version)
    .description(pjson.description);

program
    .command('sync [source] [destination]')
    .alias('s')
    //    .option('-d, --destination', 'Where do you want the sync to go to?')
    .description('Synchronize from source to destination. Currently only support Masterlist -> db')
    .action((source, destination, options) => {
        app.sync( {source: "masterlist", destination: "db"} );

        // TODO: Remove me when photo is implemented.
        //app.photo( {action: "import", options: null} );
    });

program
    .command('photo [import|export]',)
    .description('Import or Export season pass photos into Card DB')
    .action(async (action, options) => {
        // TODO: Update action to var
        await app.photo( {action: "import", options: options} );
        console.log(`Attempted ${app.updateCount} photo updates`)
    });

program.parse(process.argv);





function exitHandler(options, exitCode) {
    console.log(`Seasonpass-sync is about to close`);
    if (options.cleanup) console.log('clean');
    if (exitCode || exitCode === 0) console.log(exitCode);
    if (options.exit) process.exit();
}
//do something when app is closing
process.on('exit', exitHandler.bind(this,{cleanup:true}));

//catches ctrl+c event
process.on('SIGINT', exitHandler.bind(this, {exit:true}));

// catches "kill pid" (for example: nodemon restart)
process.on('SIGUSR1', exitHandler.bind(this, {exit:true}));
process.on('SIGUSR2', exitHandler.bind(this, {exit:true}));

//catches uncaught exceptions
process.on('uncaughtException', exitHandler.bind(this, {exit:true}));