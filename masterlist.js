const fs = require('fs');
const readline = require('readline');
const {google} = require('googleapis');
// If modifying these scopes, delete token.json.
//const SCOPES = this.app.config.get('google_api.scopes');
//const TOKEN_PATH = this.app.config.get('google_api.token_path');

/**
 * Masterlist represents a Googlesheet with passholder definitions
 */
class MasterList {
    constructor({app = null}) {
        if (app == null) return;
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
                fs.readFile(this.app.config.get('google_api.token_path'), async (err, token) => {
                    if (err)
                        return this.getNewToken(this.auth);

                    await this.auth.setCredentials(JSON.parse(token));
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
                    console.log(`New authentication token stored to ${this.app.config.get('google_api.token_path')}`);
                    this.auth.setCredentials(JSON.parse(oAuth2Client.credentials));
                });
            });
        });
    }

    init() {
        return new Promise((resolve, reject) => {
            let self = this;
            try {
                this.passholdersFromSheet().then((res) => {
                    console.log("Fetched passholders");
                    self.passholders = res;
                    resolve(res);
                }, err => {
                    console.error(err);
                });
            } catch (e) {
                console.err(`Error occured: ${e}`);
                console.err(e.stack);
            }
        })
    }

    passholdersFromSheet() {
        return new Promise((resolve, reject) => {
            // workaround for issues with this.auth in google.sheets({version: 'v4', this.auth});
            const auth = this.auth;
            const sheets = google.sheets({version: 'v4', auth});

            try {
                sheets.spreadsheets.values.get({
                    spreadsheetId: this.app.config.get('masterlist.spreadsheet_id'),
                    range: this.app.config.get('masterlist.sheet_id'),
                },  (err, res) => {
                    if (err) {
                        try {
                            fs.unlink(this.app.config.get('google_api.token_path'), async (err) => {
                                if (err) reject(err);

                                console.log('Deleted google access token. Attempting to re-authorize.');
                                try {
                                    await this.authorize(this.app.config.get('google_api.credentials'))
                                    await this.passholdersFromSheet();
                                    await resolve("Connected");
                                } catch (e) {
                                    console.log(e);
                                }
                            })
                        } catch (e) {
                            console.error(e.stack);
                        }
                    }

                    if (res == undefined)
                        reject("Response was undefined");

                    let rows = res.data.values;

                    if (rows.length) {
                        let passholders = [];
                        // TODO: Map instead of reduce
                        rows.reduce((acc, row, idx, rows) => {

                            // Only return what comes below the header row
                            if (idx <= this.app.config.get('masterlist.header_row') - 1) return acc;

                            // Removing 1 because row index starts at 1 in Google Sheets interface
                            let rowTitles = rows[this.app.config.get('masterlist.header_row') - 1];

                            this.app.models.Passholder.bindFromRow({titles: rowTitles, data: row});

                            return acc;
                        }, passholders);

                        //return passholders;
                        resolve(passholders);
                    } else {
                        reject('No passholders found in Masterlist');
                    }
                });
            } catch (e) {
                console.error(e.stack);
            }
        });
    }
}

module.exports = MasterList;