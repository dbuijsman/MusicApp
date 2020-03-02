
const mariadb = require('mariadb');
// Creating a pool of connections that can use select, insert and delete on the table followed_artists. 
// It can also select data from the table artists.
const poolPref = mariadb.createPool({ 
    host: 'localhost',
    user: 'reader',
    connectionLimit: 10,
    database: 'music'
})

module.exports = {
    /**
     * @typedef {Object} Artist
     * @property {number} id Id of the artist
     * @property {string} name_artist name of the artist without prefix.
     * @property {string} prefix Prefix that belongs to the name of the artist.
     */

    /**
     * Adds a new follow to the database if it doesn't exist. 
     * @param {number} user_id Id of the user.
     * @param {number} artist_id Id of the artist.
     * @returns {Promise<number>} Returns 200 if succesfull.
     */
    addFollow: function (user_id, artist_id){
        return new Promise(function(resolve, reject){
            let connection;
            poolPref.getConnection()
            .then(conn => {
                connection = conn;
                return connection.query("INSERT INTO followed_artists (user_id,artist_id) SELECT * FROM (SELECT " + user_id + ", " + artist_id + ") AS tmp WHERE NOT EXISTS ( SELECT user_id, artist_id FROM followed_artists WHERE user_id=" + user_id + " AND artist_id=" + artist_id + ") LIMIT 1;")
            })
            .then(() => {
                resolve(200)
            })
            .catch(error => {
                reject(error)
            })
            .finally(() => {
                connection.end();
            })
        })
    },
    /**
     * Gets follows of the requested user.
     * @param {number} user_id Id of the user.
     * @param {number} [start=0] Starting point of the results. Can't be negative.
     * @param {number} [max=20] Maximum amount of results. Can't be negative.
     * @returns {Promise<Artist[]>} Artists that are followed by the requested user. Ordered by name.
     */
    getFollow: function (user_id, start, max){
        return new Promise(function(resolve, reject){
            if(!start){
                start=0;
            }
            if(!max && max !== 0){
                max=20;
            }
            try{
                if(isNaN(start) || isNaN(max) || start<0 || max<0){
                    throw new Error(400)
                }
                let connection;
                poolPref.getConnection()
                .then(conn => {
                    connection = conn;
                    return connection.query("SELECT artists.id, name_artist, prefix FROM artists, followed_artists WHERE artists.id=artist_id AND user_id=" + user_id + " ORDER BY name_artist LIMIT " + start + "," + max + ";")
                })
                .then(results => {
                    resolve(results)
                })
                .catch(error => {
                    reject(error)
                })
                .finally(() =>{
                    connection.end();
                })
            } catch(error){
                reject(error)
            }
        })
    },
    /**
     * Removes a follow to the database. 
     * @param {number} user_id Id of the user.
     * @param {number} artist_id Id of the artist.
     * @returns {Promise<number>} Returns 200 if succesfull.
     */
    removeFollow: function (user_id, artist_id){
        return new Promise(function(resolve, reject){
            let connection;
            poolPref.getConnection()
            .then(conn => {
                connection = conn;
                return connection.query("DELETE FROM followed_artists WHERE user_id=" + user_id + " AND artist_id=" + artist_id + ";")
            })
            .then(() => {
                resolve(200)
            })
            .catch(error => {
                reject(error)
            })
            .finally(() => {
                connection.end();
            })
        })
    },
    /**
     * Returns all the followed artists by the user that are contained in artists.
     * @param {number} user_id Id of the user.
     * @param {Artist[]} artists Array of artists.
     * @returns {number[]} Array of id's of followed artists.
     */
    getFollowFromSelection(user_id, artists){
        return new Promise(function(resolve, reject){
            if(!user_id || artists.length===0){
                resolve([])
            } else {
                let connection;
                poolPref.getConnection()
                .then(conn => {
                    connection = conn;
                    var idToCheck = "(";
                    for(artist of artists){
                        idToCheck += artist.id + ", "
                    }
                    idToCheck = idToCheck.substring(0,idToCheck.length-2)
                    idToCheck += ")";
                    return connection.query("SELECT artist_id FROM followed_artists WHERE user_id=" + user_id + " AND artist_id IN " + idToCheck + ";")
                })
                .then(results => {
                    resolve(results)
                })
                .catch(error => {
                    reject(error)
                })
                .finally(() =>{
                    connection.end();
                })
            }
        })
    },
    /**
     * Selects the most popular artists based on the follows of users.
     * @param {number} [start=0] Starting point of the results. Can't be negative.
     * @param {number} [max=20] Maximum amount of results. Can't be negative.
     * @returns {Promise<Artist[]>} Array of the most popular artists. Ordered by popularity.
     */
    mostPopularArtists: function (start, max){
        return new Promise(function(resolve, reject){
            try{
                if(!start){
                    start=0;
                }
                if(!max && max !== 0){
                    max=20;
                }
                if(isNaN(start) || isNaN(max) || start<0 || max<0){
                    throw new Error(400)
                }
                let connection;
                poolPref.getConnection()
                .then(conn => {
                    connection = conn;
                    var ordering = "GROUP BY artists.id ORDER BY IFNULL(COUNT(artist_id),0) DESC LIMIT " + start + "," + max + ";"
                    return connection.query("SELECT name_artist, prefix, artists.id FROM artists LEFT JOIN followed_artists ON artists.id=artist_id " + ordering)
                })
                .then(results => {
                    resolve(results)
                })
                .catch(error => {
                    reject(error)
                })
                .finally(() =>{
                    connection.end();
                })
            } catch(error){
                reject(error)
            }
        })
    }
};