module.exports = function(source) {
    return source.replace(
        /var binding_path =.*/,
        'var binding_path = "./binding/node-v48-win32-x64/node_sqlite3.node"')
};