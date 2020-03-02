
const mariadb = require('mariadb');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

// Creating a pool of connections that can use select and insert on the users table. It can update the currentlogin and lastlogin column.
const poolCredentials = mariadb.createPool({ 
    host: 'localhost',
    user: 'verification',
    connectionLimit: 10,
    database: 'music'
})
// This key will be used to encrypt the passwords of the users.
var key = "WlAye5L1uzZq61p41A6PyhpBxsnklABk6FPAOeOXUwqWuouUEvTG8Apqkqo1uloZ";

module.exports = {
    /**
     * @typedef {Object} UserData
     * @property {number} id Id of the user.
     * @property {string} username 
     * @property {string} role Role of the user (e.g. admin).
     */

    /**
     * Adds a new user to the database.
     * @param {string} username 
     * @param {string} password 
     * @returns {Promise<string>} JSON webtoken that can be used to verify the user.
     */
    add: function(username, password){
        return new Promise(function(resolve, reject){
            try{
                if(!username || !password ){
                    throw new Error(400)
                    }
                let connection;
                poolCredentials.getConnection()
                .then(conn => {
                    connection = conn;
                    return connection.query("SELECT username FROM users WHERE username = " + connection.escape(username) + " LIMIT 1;")
                })
                .then((result) =>{
                    // Throws if the user already exists.
                    if(result.length !=0){
                        throw new Error(422)
                    }
                    const salt = crypto.randomBytes(32).toString('hex');
                    var hash = crypto.createHmac('sha512', salt);
                    const passSave = hash.update(password).digest('hex');
                    var insertNewUser = "INSERT INTO users (username, password, salt, lastlogin) VALUES (" + connection.escape(username) + ", \"" + passSave + "\", \"" + salt + "\", current_timestamp());"
                    return connection.query(insertNewUser);
                })
                .then(()=> {
                    resolve(createToken(username,Date.now()));
                })
                .catch(error => {
                    reject(error);
                })
                .finally(() => {
                    connection.release()
                });
            } catch(error){
                reject(error);
            }
        })
    },
    /**
     * Checks if the username and password matches.
     * @param {string} username 
     * @param {string} password 
     * @returns {Promise<string>} JSON webtoken that can be used to verify the user.
     */
    verify: function (username, password){
        return new Promise(function(resolve, reject){
            try {
                if(!username || !password){
                    throw new Error(400);
                }
                let connection;
                poolCredentials.getConnection()
                .then(conn =>{
                    connection = conn
                    return connection.query("SELECT password, salt FROM users WHERE username = " + connection.escape(username) + " LIMIT 1")
                })
                .then((result) =>{
                    // Throws if the username can't be found.
                    if(result.length != 1){
                        throw new Error(401)
                    }
                    // Encrypting the given password in order to compare the encrypted one with the password in the database.
                    var cypher = crypto.createHmac('sha512', result[0].salt).update(password).digest('hex');
                    if(cypher != result[0].password){
                        throw new Error(401)
                    }
                    var updateLastLogin = "UPDATE users SET lastlogin=currentlogin WHERE username=" + connection.escape(username) + ";"
                    return connection.query(updateLastLogin)
                })
                .then(() => {
                    return connection.query("UPDATE users SET currentlogin=current_timestamp() WHERE username=" + connection.escape(username) + ";")
                })
                .then(() =>{
                    resolve(createToken(username))
                })
                .catch(error => {
                    reject(error)
                })
                .finally(() =>{
                    connection.release()
                });
            } catch(error){
                reject(error);
            }
        })
    },
    /**
     * Verifies if a JSON webtoken is valid and not expired.
     * @param {string} token JSON webtoken.
     * @returns {Promise<UserData>} The id, username and role of the user that belongs to the token
     */
    validateToken: function(token){
        return new Promise(function(resolve,reject){
            try{
                if(!token){
                    throw new Error(400)
                }
                var decodedToken = jwt.verify(token, key);
                if((decodedToken.exp)*1000 < Date.now()){
                    throw new Error(401);
                }
                let connection;
                poolCredentials.getConnection()
                .then(conn => {
                    connection = conn
                    var findUsername = "SELECT id, username, role FROM users WHERE username = \"" + decodedToken.data.username + "\" LIMIT 1;"
                    return connection.query(findUsername);
                })
                .then(result => {
                    if(result.length==0){
                        throw new Error(404 + ": User " + decodedToken.data.username + " not found")
                    } else {
                        resolve(result[0])
                    }
                })
                .catch(error => {
                    reject(error)
                })
                .finally(() => {
                    connection.release();
                })
            } catch(error) {
                reject(error);
            }            
        })
    }
};

function createToken(username){
    var data = {
        username: username,
        timestamp: Date.now()
    }
    var signature = key;
    var expires = "8h";
    return jwt.sign({ data, }, signature, {expiresIn: expires})
}