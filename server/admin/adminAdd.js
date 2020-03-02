const mariadb = require('mariadb');
// Creating a pool of connections that can use select and insert data on the tables artists, songs, discography, albums and album_track_listing.
const poolAdmin = mariadb.createPool({ 
    host: 'localhost',
    user: 'admin',
    password: 'sogyo',
    connectionLimit: 20,
    database: 'music'
})
module.exports = {
    /**
     * @typedef {Object} ArtistExternal
     * @property {string} name_artist name of the artist.
     * @property {string} source External source.
     * @property {number} id Id of the artist from the source.
     */

    /**
     * @typedef {Object} Source 
     * @property {string} source External source.
     * @property {number} id Id of an artist from the source.
     */

    /**
     * Adding a new song with artists to the database. Rejects if the song already exists.
     * @param {string[]} artists Array of names of artists.
     * @param {string} song Name of the song.
     * @returns {Promise<number>} Returns 200 if adding the song was succesfull.
     */
    addSong: function (artists, song){
        return new Promise(async function(resolve, reject){
            try{
                if(typeof artists === 'string'){
                    artists=[artists];
                }
                if(!artists || artists.length!== new Set(artists).size || !artists.length || !song){
                    throw new Error(400)
                }
                var arrayArtists_id = [];
                // This loop will get the id for every artist in the artists array. If an entry is empty, then it will skip the entry.
                for(const artist of artists){
                    if(!artist){
                        continue;
                    }
                    artist_id = await addNewArtist(artist.trim());
                    arrayArtists_id.push(artist_id);
                }
                await addNewSong(song, arrayArtists_id);
                resolve(200)
            }
            catch(error){
                if(error.hasOwnProperty("song_id")){
                    error = error.error
                }
                reject(error)
            }
        })
    },
    /**
     * Adding a new album to the database. Rejects if data is incomplete or the album already exists.
     * @param {string} album Name of the album.
     * @param {string} artist Name of the leading artist of the album.
     * @param {Object[]} songs Array of songs on the album.
     * @param {string} songs[].name_song Name of the song.
     * @param {string[]} songs[].featuring Name of other artists that collaborated on the song.
     * @returns {Promise<number>} Returns 200 if succesfull.
     */
    addAlbum: function (album, artist, songs){
        return new Promise(async function(resolve, reject){
            try{
                if(!album || !artist || !songs || songs.length!== new Set(songs).size || !songs.length){
                    throw new Error(400)
                }
                const artist_id = await addNewArtist(artist.trim())
                var arraySong_id = [];
                // This loop will get the id for every song in the songs array. If the song object is of the wrong from, then it will reject. If the name of the song is empty, then it will skip the entry.
                for(const song of songs){
                    if(!song.hasOwnProperty("name_song")){
                        throw new Error(400)
                    }
                    if(!song.name_song || (song.featuring && song.featuring.includes(artist))){
                        continue;
                    }
                    song.arrayArtist_id = [artist_id]
                    if(song.featuring){
                        if(typeof song.featuring === "string"){
                            song.featuring = [song.featuring]
                        }
                        for(extraArtist of song.featuring){
                            var extraArtist_id = await addNewArtist(extraArtist.trim())
                            song.arrayArtist_id.push(extraArtist_id)
                        }
                    }
                    try{
                        song_id = await addNewSong(song.name_song, song.arrayArtist_id)
                        arraySong_id.push(song_id)
                    }
                    catch (error) {
                        arraySong_id.push(error.song_id)
                    }
                }
                await addNewAlbum(album, artist_id, arraySong_id)
                resolve(200)
            }
            catch(error){
                reject(error)
            }
        })
    },
    /**
     * Adds a source to an artist. If the artist doesn't exists, then it will add a new artist.
     * @param {ArtistExternal} artist Artist with source to add.
     * @returns {Promise<number>} Returns 200 when succesfull
     */
    addSourceArtist: function(artist){
        return new Promise(function(resolve, reject){
            parsedArtist = seperatePrefix(artist.name_artist)
            let connection;
            poolAdmin.getConnection()
            .then(conn => {
                connection=conn;
                return connection.query("SELECT name_artist,link" + artist.source + " FROM artists WHERE name_artist=" + connection.escape(parsedArtist.name_artist) + " LIMIT 1;")
            })
            .then(async(results) => {
                if(results.length===0){
                    await addNewArtist(artist.name_artist,artist)
                } else if(!results[0]["link" + artist.source]){
                    await addNewSource(parsedArtist.name_artist,artist)
                }
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
    }
};
/**
 * Adds a new source to an existing artist.
 * @param {string} name_artist Name of the artist without prefix.
 * @param {ArtistExternal} artist Existing artist with a new source.
 * @returns {Promise<number>} Returns 200 when succesfull.
 */
function addNewSource(name_artist, artist){
    return new Promise(async function(resolve, reject){
        let connection;
        poolAdmin.getConnection()
        .then(conn => {
            connection=conn
            return connection.query("UPDATE artists SET link" + artist.source + "=" + connection.escape(artist.id) + " WHERE name_artist=" + connection.escape(name_artist))
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
}

/**
 * Adds a new artist to the database if it doesn't exists.
 * @param {string} artist Name of the artist.
 * @param {ArtistExternal} [source] External source. Needed for updating the discography of an artist.
 * @returns {Promise<number>} Id of the given artist.
 */
function addNewArtist(artist, source){
    return new Promise(async function(resolve, reject){
        parsedArtist = seperatePrefix(artist)
        let connection;
        poolAdmin.getConnection()
        .then(conn => {
            connection = conn 
            // Creating the query. The if-statements are thery to add a prefix if the name of an artist starts with one.
            var insertArtist = "INSERT INTO artists (name_artist"
            if(parsedArtist.prefix != null){
                insertArtist += ", prefix";
            }
            if(source){
                insertArtist += ", link" + source.source
            }
            insertArtist += ") SELECT * FROM (SELECT " + connection.escape(parsedArtist.name_artist)
            if(parsedArtist.prefix != null){
                insertArtist += ", \"" + parsedArtist.prefix +"\"";
            }
            if(source){
                insertArtist += ", " + connection.escape(source.id)
            }
            insertArtist += ") AS tmp WHERE NOT EXISTS ( SELECT name_artist FROM artists WHERE name_artist=" + connection.escape(parsedArtist.name_artist) +") LIMIT 1;";
            return connection.query(insertArtist);
        })
        .then(() => {
            var findArtist_id = "SELECT id FROM artists WHERE name_artist = " + connection.escape(parsedArtist.name_artist) + " LIMIT 1;"
            return connection.query(findArtist_id);
        })
        .then(result => {
            if(result.length===0){
                throw new Error(500)
            }
            resolve(result[0].id)
        })
        .catch(error => {
            reject(error)
        })
        .finally(() => {
            connection.release();
        })
    })
}

/**
 * Add a new song to the database. Rejects with error 422 and song_id if the song already exists.
 * @param {string} songName Name of the song.
 * @param {number[]} arrayArtists_id Array of the id's of the corresponding artists
 * @returns {Promise<number>} Id of the added song
 */
function addNewSong(songName, arrayArtists_id){
    return new Promise(function(resolve, reject){
        let connection;
        let song_id;
        poolAdmin.getConnection()
        .then(conn => {
            connection=conn;
            var stringOfArtistID = ""
            for(artist_id of arrayArtists_id){
                stringOfArtistID += "," + artist_id;
            }
            stringOfArtistID = stringOfArtistID.substring(1)
            var searchSong = "SELECT songs.id FROM discography, songs WHERE name_song=" + connection.escape(songName) + " AND songs.id=song_id AND artist_id IN (" + stringOfArtistID + ") LIMIT 1;";
            return connection.query(searchSong)
        })
        .then(result => {
            if(result.length!==0){
                throw {"error": new Error(422), "song_id": result[0].id}
            }
            var insertSong = "INSERT INTO songs (name_song) VALUES (" + connection.escape(songName) + ");"
            return connection.query(insertSong);       
        })
        .then(() => {
            var findSongID = "SELECT id FROM songs WHERE id=(SELECT LAST_INSERT_ID()) LIMIT 1;";
            return connection.query(findSongID)
        })
        .then(async(result) => {
            song_id = result[0].id
            for(const artist_id of arrayArtists_id){
                var insertSongIntoDiscography = "INSERT INTO discography (artist_id, song_id) VALUES (" + artist_id + ", " + song_id + ");";
                await connection.query(insertSongIntoDiscography);
            }
        })
        .then(() => {
            resolve(song_id)
        })
        .catch(error => {
            reject(error)
        })
        .finally(() => {
            connection.release();
        })
    })  
};

/**
 * Adds a new album to the database. Rejects if the album already exists. Rejects if the album already exists.
 * @param {string} albumName Name of the album.
 * @param {number} artist_id Id of the artists that realeased the album.
 * @param {number[]} arraySong_id Array of id's of the songs on the album.
 * @returns {Promise<number>} Id of the added album.
 */
function addNewAlbum(albumName, artist_id, arraySong_id){
    return new Promise(function(resolve,reject){
        let connection;
        let album_id;
        poolAdmin.getConnection()
        .then(conn => {
            connection=conn;
            var searchAlbum = "SELECT name_album FROM albums WHERE name_album=" + connection.escape(albumName) + " AND artist_id=" + artist_id + " LIMIT 1;";
            return connection.query(searchAlbum)
        })
        .then(result => {
            if(result.length!==0){
                throw new Error(422)
            }
            var insertAlbum = "INSERT INTO albums (name_album, artist_id) VALUES (" + connection.escape(albumName) + "," + artist_id + ");"
            return connection.query(insertAlbum);       
        })
        .then(() => {
            var findAlbumID = "SELECT id FROM albums WHERE id=(SELECT LAST_INSERT_ID()) LIMIT 1;";
            return connection.query(findAlbumID)
        })
        .then(async(result) => {
            album_id = result[0].id
            for(const song_id of arraySong_id){
                var insertSongIntoTrackListing = "INSERT INTO album_track_listing (album_id, song_id) VALUES (" + album_id + ", " + song_id + ");";
                await connection.query(insertSongIntoTrackListing);
            }
        })
        .then(() => {
            resolve(album_id)
        })
        .catch(error => {
            reject(error)
        })
        .finally(() => {
            connection.release();
        })
    }) 
}

function seperatePrefix(artist){
    arrayPrefixes = ["A ", "An ", "The "];
    for(const prefix of arrayPrefixes){
        if(artist.startsWith(prefix)){
            artist = artist.substring(prefix.length);
            return {"prefix": prefix, "name_artist": artist}
        }
    }
    return {"prefix": null, "name_artist": artist}
}