let find = require('find');
let fs = require('fs');

async function findPhoto(first_name, last_name, where = []) {
    return new Promise( (resolve, reject) => {
        if (first_name == undefined || last_name == undefined) reject();

        where.map( (location) => {
            // Trying to find in Google Drive
            if (location.localeCompare("drive", undefined, {ignorePunctuation: true}) == 0) {
                return findPhotoFromDrive();
            }
            findPhotoFromDisk(first_name, last_name, location).then( files => {
                // Good job, we found some photos for this passholder!
                if (files.length > 0) {
                    console.log(`Files: ${files}`);
                    resolve(files);
                }
                else {
                    console.log(`No file was found for ${first_name} ${last_name}`)
                }
            });
        } );
    })
}

function findPhotoFromDisk(first_name, last_name, dir) {

    return new Promise( resolve => {
        let regex = RegExp(`^(?=.*?(${first_name.replace(/[-\\/\\\\^$*+?.()|[\\]{}]/g, '\\\\$&')}))(?=.*?(${last_name.replace(/[-\\/\\\\^$*+?.()|[\\]{}]/g, '\\\\$&')})).*`, 'igm')

        if (fs.existsSync(dir)) {
            find.file(regex, dir, (files) => {
                resolve(files);
            })
        }

    }, reject => {
        console.error(reject);
    });




     return "";
}

function findPhotoFromDrive() {
    return photo;
}

/**
 * Converts a source src to Blob in order to store it in the database
 * @param src source file, url or Google Drive photo
 */
function toBlob(src) {
    return new Promise( (resolve, reject) => {
        if ( fs.existsSync(src) ) {

            fs.readFile(src, (err, data) => {
                if (err) {
                    console.error(err);
                    reject(err);
                }
                resolve(data);
            });
        }
        else {
            reject(`The file ${src} does not exist.`);
        }
    });

    // TODO: URL
    // TODO: Google Drive
}

module.exports.findPhoto = findPhoto;
module.exports.toBlob = toBlob;