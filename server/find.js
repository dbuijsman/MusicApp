const mariadb = require('mariadb');

// Creating a pool of connections that can use select on the tables artists, discography and songs.
const poolFind = mariadb.createPool({ 
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
     * @typedef {Object} Song
     * @property {number} id Id of the song
     * @property {string} name_song Name of the song.
     * @property {string} name_artist name of the artist without prefix.
     * @property {string} prefix Prefix that belongs to the name of the artist.
     */

    /**
     * Find all the artists starting with firstLetter. Rejects if start or max is NaN or negative.
     * @param {string} [firstLetter=""] First letter. 0-9 will be converted to searching for every digit.
     * @param {number} [start=0] Starting point of the results. Can't be negative.
     * @param {number} [max=20] Maximum amount of results. Can't be negative.
     * @returns {Promise<Artist[]>} Array of artists that starts with the requested letter. Ordered by name.
     */
    artistStartWith: function (firstLetter, start, max){
        return new Promise(function(resolve, reject){
            try{
                if(!firstLetter){
                    firstLetter="";
                }
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
                poolFind.getConnection()
                .then(conn =>{
                    connection = conn
                    firstLetter = connection.escape(firstLetter + "%");
                    // If firstLetter is 0-9, then for every digit, this will add a requirement for the search query.
                    if(firstLetter == "\'0-9%\'"){
                        firstLetter = "\"0"
                        for(number=1; number<10; number++){
                            firstLetter += "%\"  OR name_artist LIKE \"" + number;
                        }
                        firstLetter+="%\"";
                    }
                    var search = "SELECT id, name_artist, prefix FROM artists WHERE name_artist LIKE " + firstLetter + " ORDER BY name_artist LIMIT " + start + "," + max + ";";
                    return connection.query(search)
                })
                .then(results =>{
                    resolve(results);
                })
                .catch(error => {
                    reject(error)
                })
                .finally(() =>{
                    connection.release()
                });
            } catch(error){
                reject(error)
            }
        })
    },
    /**
     * Find all songs of a given artist. Rejects if start or max is NaN or negative.
     * @param {string} name_artist Name of the artist
     * @param {number} [start=0] Starting point of the results. Can't be negative.
     * @param {number} [max=20] Maximum amount of results. Can't be negative.
     * @returns {Promise<Song[]>} Array of songs from the requested artist. Ordered by name.
     */
    songsFromArtist: function(name_artist, start, max){
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
                let connection
                poolFind.getConnection()
                .then(conn => {
                    connection = conn
                    artist = connection.escape(removePrefix(name_artist));
                })
                .then(() => {
                    var subquery = "SELECT DISTINCT song_id FROM artists, discography, songs WHERE name_artist=" + artist + " AND songs.id=discography.song_id AND artist_id=artists.id ORDER BY name_artist, name_song LIMIT " + start + "," + max;
                    var totalquery = "SELECT name_artist, prefix, name_song, songs.id FROM artists, discography, songs CROSS JOIN (" + subquery + ") AS songsOfArtist ON songs.id=songsOfArtist.song_id WHERE artists.id=artist_id AND songs.id=discography.song_id;"
                    return connection.query(totalquery);
                })
                .then(tab => {
                    resolve(tab)
                })
                .catch(error => {
                    reject(error)
                })
                .finally(() => {
                    connection.release()
                })
            } catch(error){
                reject(error)
            }
        })
    }
};
function removePrefix(artist){
    if(artist===undefined){
        return artist;
    }
    arrayPrefixes = ["A ", "An ", "The "];
    for(const prefix of arrayPrefixes){
        if(artist.startsWith(prefix)){
            return artist.substring(prefix.length, artist.length);
        }
    }
    return artist
}