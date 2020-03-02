
const mariadb = require('mariadb');
// Creating a pool of connections that can select, insert and delete likes, dislikes and following artists from the database. 
// It can also use select on the tables artists, discography and songs.
const poolPref = mariadb.createPool({ 
    host: 'localhost',
    user: 'reader',
    connectionLimit: 15,
    database: 'music'
})

module.exports = {
    /**
     * @typedef {Object} Song
     * @property {number} id Id of the song.
     * @property {string} name_song Name of the song.
     * @property {string} name_artist name of the artist without prefix.
     * @property {string} prefix Prefix that belongs to the name of the artist.
     */

    /**
     * Adds a new like to the database if it doesn't exists. If the song is disliked by the user, then it will also remove the dislike.
     * @param {number} user_id Id of the user.
     * @param {number} song_id Id of the song.
     * @returns {Promise<number>} Returns 200 if succesfull.
     */
    addLike: function (user_id, song_id){
        return new Promise(function(resolve, reject){
            let connection;
            poolPref.getConnection()
            .then(conn => {
                connection = conn;
                return connection.query("DELETE FROM disliked_songs WHERE user_id=" + user_id + " AND song_id=" + song_id + ";")
            })
            .then(() => {
                return connection.query("INSERT INTO liked_songs (user_id,song_id) SELECT * FROM (SELECT " + user_id + ", " + song_id + ") AS tmp WHERE NOT EXISTS ( SELECT user_id, song_id FROM liked_songs WHERE user_id=" + user_id + " AND song_id=" + song_id + ") LIMIT 1;")
            })
            .then(() => {
                resolve(200)
            })
            .catch(error => {
                reject(error)
            })
            .finally(() => {
                connection.release();
            })
        })
    },
    /**
     * Gets likes of the requested user.
     * @param {number} user_id Id of the user.
     * @param {number} [start=0] Starting point of the results. Can't be negative.
     * @param {number} [max=20] Maximum amount of results. Can't be negative.
     * @returns {Promise<Song[]>} Liked songs of the user. Ordered by name.
     */
    getLikes: function (user_id, start, max){
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
                    var likesUser = "SELECT DISTINCT liked_songs.song_id FROM liked_songs, songs, discography, artists WHERE user_id=" + user_id + " AND liked_songs.song_id=songs.id AND songs.id=discography.song_id AND artist_id=artists.id ORDER BY name_artist, name_song LIMIT " + start + "," + max;
                    return connection.query("SELECT name_artist, prefix, name_song, songs.id FROM artists, discography, songs CROSS JOIN (" + likesUser + ") AS likes ON songs.id=likes.song_id WHERE artists.id=artist_id AND songs.id=discography.song_id;")
                })
                .then(result => {
                    resolve(result)
                })
                .catch(error => {
                    reject(error)
                })
                .finally(() =>{
                    connection.release();
                })
            } catch(error){
                reject(error)
            }
        })
    },
    /**
     * Removes a like from the database.
     * @param {number} user_id Id of the user.
     * @param {number} song_id Id of the song.
     * @returns {Promise<number>} Returns 200 if succesfull.
     */
    removeLike: function (user_id, song_id){
        return new Promise(function(resolve, reject){
            let connection;
            poolPref.getConnection()
            .then(conn => {
                connection = conn;
                return connection.query("DELETE FROM liked_songs WHERE user_id=" + user_id + " AND song_id=" + song_id + ";")
            })
            .then(() => {
                resolve(200)
            })
            .catch(error => {
                reject(error)
            })
            .finally(() => {
                connection.release();
            })
        })
    },
    /**
     * Returns all the likes by the user that are contained in songs.
     * @param {number} user_id Id of the user.
     * @param {Song[]} songs Array of songs.
     * @returns {number[]} Array of id's of the liked songs.
     */
    getLikesFromSelection(user_id, songs){
        return new Promise(function(resolve, reject){
            if(!user_id || songs.length===0){
                resolve([])
            } else {
                let connection;
                poolPref.getConnection()
                .then(conn => {
                    connection = conn;
                    var idToCheck = "(";
                    for(song of songs){
                        idToCheck += song.id + ", "
                    }
                    idToCheck = idToCheck.substring(0,idToCheck.length-2)
                    idToCheck += ")";
                    return connection.query("SELECT song_id FROM liked_songs WHERE user_id=" + user_id + " AND song_id IN " + idToCheck + ";")
                })
                .then(results => {
                    resolve(results)
                })
                .catch(error => {
                    reject(error)
                })
                .finally(() =>{
                    connection.release();
                })
            }
        })
    },
    /**
     * Adds a new dislike to the database if it doesn't exists. If the song is liked by the user, then it will also remove the dislike.
     * @param {number} user_id Id of the user.
     * @param {number} song_id Id of the song.
     * @returns {Promise<number>} Returns 200 if succesfull.
     */
    addDislike: function (user_id, song_id){
        return new Promise(function(resolve, reject){
            let connection;
            poolPref.getConnection()
            .then(conn => {
                connection = conn;
                return connection.query("DELETE FROM liked_songs WHERE user_id=" + user_id + " AND song_id=" + song_id + ";")
            })
            .then(() => {
                return connection.query("INSERT INTO disliked_songs (user_id,song_id) SELECT * FROM (SELECT " + user_id + ", " + song_id + ") AS tmp WHERE NOT EXISTS ( SELECT user_id, song_id FROM disliked_songs WHERE user_id=" + user_id + " AND song_id=" + song_id + ") LIMIT 1;")
            })
            .then(() => {
                resolve(200)
            })
            .catch(error => {
                reject(error)
            })
            .finally(() => {
                connection.release();
            })
        })
    },
    /**
     * Gets dislikes of the requested user.
     * @param {number} user_id Id of the user.
     * @param {number} [start=0] Starting point of the results. Can't be negative.
     * @param {number} [max=20] Maximum amount of results. Can't be negative.
     * @returns {Promise<Song[]>} Disliked songs of the user. Ordered by name.
     */
    getDislikes: function (user_id, start, max){
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
                    var dislikesUser = "SELECT DISTINCT disliked_songs.song_id FROM disliked_songs, songs, discography, artists WHERE user_id=" + user_id + " AND disliked_songs.song_id=songs.id AND songs.id=discography.song_id AND artist_id=artists.id ORDER BY name_artist, name_song LIMIT " + start + "," + max;
                    return connection.query("SELECT name_artist, prefix, name_song, songs.id FROM artists, discography, songs CROSS JOIN (" + dislikesUser + ") AS dislikes ON songs.id=dislikes.song_id WHERE artists.id=artist_id AND songs.id=discography.song_id;")
                })
                .then(result => {
                    resolve(result)
                })
                .catch(error => {
                    reject(error)
                })
                .finally(() =>{
                    connection.release();
                })
            } catch(error){
                reject(error)
            }
        })
    },
    /**
     * Removes a dislike from the database.
     * @param {number} user_id Id of the user.
     * @param {number} song_id Id of the song.
     * @returns {Promise<number>} Returns 200 if succesfull.
     */
    removeDislike: function (user_id, song_id){
        return new Promise(function(resolve, reject){
            let connection;
            poolPref.getConnection()
            .then(conn => {
                connection = conn;
                return connection.query("DELETE FROM disliked_songs WHERE user_id=" + user_id + " AND song_id=" + song_id + ";")
            })
            .then(() => {
                resolve(200)
            })
            .catch(error => {
                reject(error)
            })
            .finally(() => {
                connection.release();
            })
        })
    },
    /**
     * Returns all the dislikes by the user that are contained in songs.
     * @param {number} user_id Id of the user.
     * @param {Song[]} songs Array of songs.
     * @returns {number[]} Array of id's of the disliked songs.
     */
    getDislikesFromSelection(user_id, songs){
        return new Promise(function(resolve, reject){
            if(!user_id || songs.length===0){
                resolve([])
            } else {
                let connection;
                poolPref.getConnection()
                .then(conn => {
                    connection = conn;
                    var idToCheck = "(";
                    for(song of songs){
                        idToCheck += song.id + ", "
                    }
                    idToCheck = idToCheck.substring(0,idToCheck.length-2)
                    idToCheck += ")";
                    return connection.query("SELECT song_id FROM disliked_songs WHERE user_id=" + user_id + " AND song_id IN " + idToCheck + ";")
                })
                .then(results => {
                    resolve(results)
                })
                .catch(error => {
                    reject(error)
                })
                .finally(() =>{
                    connection.release();
                })
            }
        })
    },
    /**
     * Selects the most popular songs based on the likes and dislikes of users. Likes have weight 1, dislikes -1.
     * @param {number} [start=0] Starting point of the results. Can't be negative.
     * @param {number} [max=20] Maximum amount of results. Can't be negative.
     * @returns {Promise<Song[]>} Array of most popular songs. Ordered by popularity.
     */
    mostPopularSongs: function (start, max){
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
                    var joiningSongsAndLikes = "SELECT songs.id, IFNULL(COUNT(song_id),0) FROM songs LEFT JOIN liked_songs ON songs.id=song_id GROUP BY songs.id"
                    return connection.query("CREATE VIEW likedSongs (song_id, count) AS (" + joiningSongsAndLikes + ");")
                })
                .then(() => {
                    var joiningSongsAndDislikes = "SELECT songs.id, IFNULL(COUNT(song_id),0) FROM songs LEFT JOIN disliked_songs ON songs.id=song_id GROUP BY songs.id"
                    return connection.query("CREATE VIEW dislikedSongs (song_id, count) AS (" + joiningSongsAndDislikes + ");")
                })
                .then(() => {
                    var selectingColums = "SELECT name_artist, prefix, name_song, songs.id FROM artists, discography, songs"
                    var requirements = " WHERE artists.id=artist_id AND songs.id=discography.song_id"
                    // The select from the next lines will select the suggestions based on likes from the liked view and the dislikes from the disliked view.
                    // Likes have weight 1. Dislikes have weight -1.
                    var combiningViewsOrdering = "ORDER BY likedSongs.count-dislikedSongs.count DESC LIMIT " + start + "," + max
                    var combiningViewsRequirements = "likedSongs.song_id=dislikedSongs.song_id " + combiningViewsOrdering
                    var combiningViews = "SELECT likedSongs.song_id FROM likedSongs, dislikedSongs WHERE " + combiningViewsRequirements;
                    return connection.query(selectingColums + " CROSS JOIN (" + combiningViews + ") AS mostPopular ON songs.id=mostPopular.song_id" + requirements + ";")
                })
                .then(results => {
                    resolve(results)
                })
                .catch(error => {
                    reject(error)
                })
                .finally(async () =>{
                    // The views will be deleted after usage.
                    await connection.query("DROP VIEW IF EXISTS likedSongs;")
                    await connection.query("DROP VIEW IF EXISTS dislikedSongs;")
                    await connection.release();
                })
            } catch(error){
                reject(error)
            }
        })
    }
};