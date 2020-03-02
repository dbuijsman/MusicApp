const mariadb = require('mariadb');
// Creating a pool of connections that can use select on the tables artists, discography, songs and followed_artists. It can also select the lastlogin and id from the table users.
const poolNotify = mariadb.createPool({ 
    host: 'localhost',
    user: 'reader',
    connectionLimit: 10,
    database: 'music'
})

module.exports = {

    /**
     * @typedef {Object} Song
     * @property {number} id Id of the song
     * @property {string} name_song Name of the song.
     * @property {string} name_artist name of the artist without prefix.
     * @property {string} prefix Prefix that belongs to the name of the artist.
     */

    /**
     * Finding new releases of all the artists that are followed by an user
     * @param {number} user_id Id of the user. 
     * @param {number} [start=0] Starting point of the results. Can't be negative.
     * @param {number} [max=20] Maximum amount of results. Can't be negative.
     * @returns {Promise<Song[]>} New released songs. Ordered by time of adding.
     */
    newSongs: function (user_id, start, max){
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
                poolNotify.getConnection()
                .then(conn => {
                    connection = conn;
                    var newSongsRequirements = "user_id=" + user_id + " AND followed_artists.artist_id=discography.artist_id AND song_id=songs.id AND time >= (SELECT lastlogin FROM users WHERE id=" + user_id + ")"
                    var newSongs = "SELECT DISTINCT song_id FROM followed_artists, discography, songs WHERE " + newSongsRequirements + " ORDER BY time LIMIT " + start + "," + max;
                    return connection.query("SELECT name_artist, prefix, name_song, songs.id FROM artists, discography, songs CROSS JOIN (" + newSongs + ") AS newSongs ON songs.id=newSongs.song_id WHERE artists.id=artist_id AND songs.id=discography.song_id ORDER BY time;")
                })
                .then(result => {
                    resolve(result)
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
