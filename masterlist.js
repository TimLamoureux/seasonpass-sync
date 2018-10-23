const fs = require('fs');
const readline = require('readline');
const {google} = require('googleapis');
// If modifying these scopes, delete token.json.
//const SCOPES = config.get('google_api.scopes');
//const TOKEN_PATH = config.get('google_api.token_path');

/**
 * Masterlist represents a Googlesheet with passholder definitions
 */
class MasterList {
    constructor( {app = null} ) {
        if ( app == null ) return;
        this.app = app;

    }

    /**
     * Create an OAuth2 client with the given credentials, and then execute the
     * given callback function.
     * @param {Object} credentials The authorization client credentials.
     * @param {function} callback The callback to call with the authorized client.
     */
    authorize(credentials) {
        const {client_secret, client_id, redirect_uris} = credentials;
        this.auth = new google.auth.OAuth2(
            client_id, client_secret, redirect_uris[0]);

        // Check if we have previously stored a token.
        return new Promise((resolve, reject) => {
            try {
                fs.readFile(this.app.config.get('google_api.token_path'), (err, token) => {
                    if (err)
                        return this.getNewToken(this.auth);

                    this.auth.setCredentials(JSON.parse(token));
                    resolve("Google Sheet API Connected");
                });
            } catch (e) {
                reject(e);
            }
        });
    }

    /**
     * Get and store new token after prompting for user authorization, and then
     * execute the given cb with the authorized OAuth2 client.
     * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
     * @param {getEventsCallback} cb The cb for the authorized client.
     */
    getNewToken(oAuth2Client) {
        const authUrl = oAuth2Client.generateAuthUrl({
            access_type: 'online',
            scope: this.app.config.get('google_api.scopes'),
        });
        console.log('Authorize this app by visiting this url:', authUrl);
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });
        rl.question('Enter the code from that page here: ', (code) => {
            rl.close();
            oAuth2Client.getToken(code, (err, token) => {
                if (err) return console.error('Error while trying to retrieve access token', err);
                oAuth2Client.setCredentials(token);
                // Store the token to disk for later program executions
                fs.writeFile(this.app.config.get('google_api.token_path'), JSON.stringify(token), (err) => {
                    if (err) console.error(err);
                    console.success(`New authentication token stored to ${this.app.config.get('google_api.token_path')}`);
                });
            });
        });
    }

    init() {
        return new Promise(async (resolve, reject) => {
            self = this;
            passholders = getPassHolders().then((res) => {
                console.log("Fetched passholders");
                self.passholders = res;
                resolve(res);
            });
        })
    }
}

module.exports = MasterList;