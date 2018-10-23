
module.exports.isURL = function(url) {
    return url != null && url.match(new RegExp(/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)?/gi))
}
module.exports.strToBool = function(string){
    if (undefined == string) return false;
    switch(string.toLowerCase().substring(0,1)){
        case "t": case "y": case "1": return true;
        case "f": case "n": case "0": case null: case undefined: return false;
        default: return Boolean(string);
    }
}