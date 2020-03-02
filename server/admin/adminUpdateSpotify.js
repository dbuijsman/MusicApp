const mariadb = require('mariadb');
const request = require('request')

const admin = require("./adminAdd")
const credentials = require("./externalCredentials")

let token;
(async () => {
    try {
        token = await credentials.getTokenSpotify();
    } catch (e) {
        console.log(e)
    }
})();
// Creating a pool of connections that can use select and insert data on the tables artists, songs, discography, albums and album_track_listing.
const poolAdmin = mariadb.createPool({ 
    host: 'localhost',
    user: 'admin',
    password: 'sogyo',
    connectionLimit: 2,
    database: 'music'
})
module.exports = {
    /**
     * @typedef {Object} Album
     * @property {string} name Name of the album.
     * @property {string} artist Name of the artist.
     * @property {Object[]} trackList Track listing of the album.
     * @property {string} trackList[].name_song Name of the song.
     * @property {string[]} trackList[].featuring Names of featuring artists.
     */

    /**
     * Adds the spotify id to the artist
     * @param {string} artist Name of the artist.
     * @param {string} link Spotify id of the given artist.
     * @returns {Promise<number>} Returns 200 when succesfull.
     */
    addLinkArtist: function (name_artist, link){
        return new Promise(async function(resolve, reject){
            try{
                if(!name_artist || !link){
                    throw new Error(400)
                }
                artist = removePrefix(name_artist);
                let connection;
                poolAdmin.getConnection()
                .then(conn => {
                    connection = conn;
                    return connection.query("SELECT id, linkSpotify FROM artists WHERE name_artist=" + connection.escape(artist) + ";")
                })
                .then(async(result) => {
                    if(result.length !== 1){
                        artist_id = await admin.addArtist(name_artist)
                        result = [{"id": artist_id, "linkSpotify": null}]
                    }
                    if(result[0].linkSpotify !== null){
                        throw new Error(409)
                    }
                    return connection.query("UPDATE artists SET linkSpotify=" + connection.escape(link) + " WHERE id=" + result[0].id +";")
                })
                .then(() => {
                    resolve(200)
                })
                .catch(error => {
                    reject(error)
                })
                .finally(() => {
                    connection.release()
                })
            }
            catch(error){
                reject(error)
            }
        })
    },
    /**
     * Updates the discography of the artist. Rejects with 510 if there is no spotify id linked to the artist.
     * @param {string} name_artist Name of the artist.
     * @returns {Promise<number>} Returns 200 when succesfull.
     */
    updateArtist: function (name_artist){
        return new Promise(async function(resolve, reject){
            try{
                if(!name_artist){
                    throw new Error(400)
                }
                artist = removePrefix(name_artist);
                let connection;
                poolAdmin.getConnection()
                .then(conn => {
                    connection = conn;
                    return connection.query("SELECT id, linkSpotify FROM artists WHERE name_artist=" + connection.escape(artist) + ";")
                })
                .then(async(result) => {
                    if(result.length !== 1){
                        throw new Error(404)
                    }
                    if(result[0].linkSpotify === null){
                        throw new Error(510)
                    }
                    return updateArtistFromID(connection, result[0].linkSpotify, artist)
                })
                .then((result) => {
                    resolve(result)
                })
                .catch(error => {
                    reject(error)
                })
                .finally(() => {
                    connection.release()
                })
            }
            catch(error){
                reject(error)
            }
        })
    },
    /**
     * Update all artists with a link to spotify.
     * @returns {Promise<number>} Returns 200 when succesfull.
     */
    updateAll: function(){
        return new Promise(async function(resolve, reject){
            let connection
            poolAdmin.getConnection()
            .then(conn => {
                connection = conn;
                return connection.query("SELECT name_artist, linkSpotify FROM artists WHERE linkSpotify != \"NULL\";")
            })
            .then(async(results) => {
                for(var result of results){
                    await updateArtistFromID(connection, result.linkSpotify, result.name_artist)
                }
                resolve(200)
            })
            .catch(error => {
                reject(error)
            })
            .finally(() => {
                connection.release()
            })
        })
    }
};

/**
 * Updates the discography of the artist from spotify.
 * @param {Object} connection connection to the database.
 * @param {string} artistId Spotify ID of an artist.
 * @param {string} artist Name of the artist without prefix.
 * @returns {Promise<number>} Returns 200 when succesfull.
 */
async function updateArtistFromID(connection, artistId, artist){
    return new Promise(function(resolve, reject){
        request.get('https://api.spotify.com/v1/artists/' + artistId + '/albums?market=NL&include_groups=album&limit=50&offset=0', async function(error, response, body){
            try{
                if(error){
                    await credentials.updateTokenSpotify()
                    token = credentials.getTokenSpotify()
                    throw new Error(error)
                }
                var data = JSON.parse(body)
                if(data.error){
                    throw new Error(data.error.message)
                }
                var albums = data.items
                var results = await connection.query("SELECT name_album FROM albums,artists WHERE name_artist=" + connection.escape(artist) + " AND artists.id=artist_id;")
                var existingAlbums = []
                for(result of results){
                    existingAlbums.push(result.name_album)
                }
                for(var album of albums){
                    var name_album = album.name
                    if(existingAlbums.includes(name_album)){
                        continue
                    }
                    await getTrackList(token, album)
                    .then(async(data) => {
                        if(data.trackList.length){
                            try{
                                await admin.addAlbum(data.name_album,data.artist,data.trackList)
                            }
                            catch(error){
                                if(error.message!=422){
                                    throw new Error(error.message)
                                }
                            }
                        }
                    })
                    .catch(error => {
                        reject(error)
                    })
                }
                resolve(200)
            }
            catch(error){
                reject(error)
            }
        })
        .auth(null,null,true,token)
    })
}

/**
 * Gets the track listing of the album by calling a Spotify API.
 * @param {string} token Spotify webtoken
 * @param {Object} album Object of the album
 * @param {string} album.name Name of the album
 * @param {string} album.id Spotify id of the album
 * @param {Object[]} album.artists Array of objects of artists.
 * @param {string} album.artists[].name Name of the artist
 * @returns {Promise<Album>} Album with tracklist. 
 */
function getTrackList(token, album){
    return new Promise(async function(resolve, reject){
        var leadArtist = album.artists[0].name
        var trackList = []
        request.get('https://api.spotify.com/v1/albums/' + album.id + '/tracks?limit=50&market=NL', async function(erroralb, responsealb, bodyalb){
            try{
                if(erroralb){
                    throw new Error(erroalb)
                }
                var data = JSON.parse(bodyalb)
                var songs = data.items
                LOOP_SONG: for(var song of songs){
                    var skipSongsArray = ["Live", " - ", "Interview"]
                    for(var string of skipSongsArray){
                        if(song.name.includes(string)){
                            continue LOOP_SONG;
                        }
                    }
                    var ft = []
                    for(var artist of song.artists){
                        var parsedName = artist.name.split(", ")
                        for(var name_artist of parsedName){
                            if(name_artist !== leadArtist){
                                ft.push(name_artist)
                            }
                        }
                    }
                    var arrayOfFeaturing = ["ft. ", "feat ", "feat. ", "featuring "]
                    var name_song = song.name;
                    for(string of arrayOfFeaturing){
                        if(name_song.toLowerCase().includes(string)){
                            name_song = name_song.substring(0,name_song.indexOf(string)-1)
                        }
                    }
                    trackList.push({"name_song": name_song.trim(), "featuring": ft})
                }
                resolve({"name_album": album.name, "artist": leadArtist,  "trackList": trackList})
            }
            catch(error){
                reject(error)
            }
        })
        .auth(null,null,true,token)
    })
}

function removePrefix(artist){
    arrayPrefixes = ["A ", "An ", "The "];
    for(const prefix of arrayPrefixes){
        if(artist.startsWith(prefix)){
            artist = artist.substring(prefix.length);
            return artist
        }
    }
    return artist
}