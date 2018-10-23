const pjson = require('./package.json');
const AppSPS = require('./app_sps');
const config = require('config');
const program = require('commander');
const Sequelize = require('sequelize');

//const PassHolder = require('./passholder');
// Photo, Masterlist

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
    });

/*program
    .command('photo [import|export]',)
    .description('Import or Export season pass photos into Card DB')
    .action((action, options) => {
        photo(action, options);
    });*/

program.parse(process.argv);


