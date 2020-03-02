const mariadb = require('mariadb');
// Creating a pool of connections that can user select on the tables artists, discography and songs.
const poolSearch = mariadb.createPool({ 
    host: 'localhost',
    user: 'reader',
    connectionLimit: 10,
    database: 'music'
})

module.exports = {
    /**
     * @typedef {Object} Artist
     * @property {number} id Id of the artist.
     * @property {string} name_artist name of the artist without prefix.
     * @property {string} prefix Prefix that belongs to the name of the artist.
     */

    /**
     * @typedef {Object} Song
     * @property {number} id Id of the song.
     * @property {string} name_song Name of the song.
     * @property {string} name_artist name of the artist without prefix.
     * @property {string} prefix Prefix that belongs to the name of the artist.
     */

    /**
     * Searches the database. Ordered by: exact result artist-song, exact result artist, exact result song, non-exact result artist, non-exact result song, non-exact result artist-song
     * Searching for collaborations is not implemented yet.
     * @param {string} searchTerm If the search term contains a hyphen, then it will only look for artist - song
     * @param {number} [start=0] Starting point of the results. Can't be negative.
     * @param {number} [max=20] Maximum amount of results. Can't be negative.
     * @returns {Promise<Artist[]|Song[]>} Array of artists and songs.
     */
    search: function (searchTerm, start, max){
        return new Promise(async function(resolve, reject){
            if(!start){
                start=0;
            }
            if(!max && max !== 0){
                max=20;
            }
            try{
                if(!searchTerm || isNaN(start) || isNaN(max) || start<0 || max<0){
                    throw new Error(400)
                }
                start = parseInt(start)
                max= parseInt(max)
                searchTerm = searchTerm.trim()
                searchTerm = removePrefix(searchTerm)
                if(searchTerm.includes("- ")){
                    parsedSearchTerm = searchTerm.split(" - ")
                    results = await searchWithHyphen(parsedSearchTerm[0].trim(), parsedSearchTerm[1].trim(), start, max)
                } else {
                    results = await searchWithoutHyphen(searchTerm,start,max)
                }
                resolve(results)
            } catch(error){
                reject(error)
            }
        })
    }
};
/**
 * Searches the database for the combination artist - song.
 * @param {string} artist Name of the artist.
 * @param {string} song Name of the song.
 * @param {number} [start=0] Starting point of the results.
 * @param {number} [max=20] Maximum amount of results.
 * @returns {Promise<Artist[]|Song[]>} Object consist of artists and songs.
 */
function searchWithHyphen(artist, song, start, max){
    return new Promise(function(resolve, reject){
        let foundResults =[];
        let connection;
        max=start + max;
        poolSearch.getConnection()
        .then(conn => {
            connection = conn;
            // Searching exact result for artist - song
            findExactArtist = "name_artist=" + connection.escape(artist)
            findExactSong = "name_song=" + connection.escape(song)
            return connection.query(getStringFindSongData(findExactArtist + " AND " + findExactSong, max))
        })
        .then(results => {
            var processedResults = processResults(foundResults,results,start,max)
            foundResults = processedResults.results;
            start = processedResults.start;
            max = processedResults.max;
            // Searching non-exact result for artist - song
            findNonExactArtist = "name_artist LIKE " + connection.escape("%" + artist + "%")
            findNonExactSong = "name_song LIKE " + connection.escape("%" + song + "%")
            return connection.query(getStringFindSongData(findNonExactArtist + " AND " + findNonExactSong, max))
        })
        .then(results => {
            var processedResults = processResults(foundResults,results,start,max)
            resolve(processedResults.results)
        })
        .catch(error => {
            reject(error)
        })
        .finally(() =>{
            connection.release();
        })
    })
}

/**
 * Searches the database. Ordered by: exact result artist-song, exact result artist, exact result song, non-exact result artist, non-exact result song, non-exact result artist-song
 * Searching for collaborations is not implemented yet.
 * @param {string} artist Name of the artist.
 * @param {string} song Name of the song.
 * @param {number} [start=0] Starting point of the results.
 * @param {number} [max=20] Maximum amount of results.
 * @returns {Promise<Artist[]|Song[]>} Object consist of artists and songs.
 */
function searchWithoutHyphen(searchTerm, start, max){
    return new Promise(function(resolve, reject){
        let foundResults =[];
        let connection
        max=start+max;
        let parsedSearchTerm= searchTerm.split(" ");
        poolSearch.getConnection()
        .then(conn => {
            connection = conn;
            for(word of parsedSearchTerm){
                word = word.trim();
            }
            if(parsedSearchTerm.length>1){
                // Searching exact result for artist - song
                findExactCombinations = getStringCombinations(connection, parsedSearchTerm, true)
                return connection.query(getStringFindSongData(findExactCombinations, max))
            } else {
                return []
            }
        })
        .then(results => {
            var processedResults = processResults(foundResults,results,start,max)
            foundResults = processedResults.results;
            start = processedResults.start;
            max = processedResults.max;
            // Searching exact result for artist
            findExactArtist = "name_artist = " + connection.escape(searchTerm)
            return connection.query(getStringFindArtistData(findExactArtist, max))
        })
        .then(results => {
            var processedResults = processResults(foundResults,results,start,max)
            foundResults = processedResults.results;
            start = processedResults.start;
            max = processedResults.max;
            // Searching exact result for song
            findExactSong = "name_song = " + connection.escape(searchTerm)
            return connection.query(getStringFindSongData(findExactSong, max))
        })
        .then(results => {
            var processedResults = processResults(foundResults,results,start,max)
            foundResults = processedResults.results;
            start = processedResults.start;
            max = processedResults.max;
            // Searching non-exact result for artist
            findNonExactArtist = "name_artist LIKE " + connection.escape("%" + searchTerm + "%")
            return connection.query(getStringFindArtistData(findNonExactArtist, max))
        })
        .then(results => {
            var processedResults = processResults(foundResults,results,start,max)
            foundResults = processedResults.results;
            start = processedResults.start;
            max = processedResults.max;
            // Searching non-exact result for song
            findNonExactSong = "name_song LIKE " + connection.escape("%" + searchTerm + "%")
            return connection.query(getStringFindSongData(findNonExactSong, max))
        })
        .then(results => {
            var processedResults = processResults(foundResults,results,start,max)
            foundResults = processedResults.results;
            start = processedResults.start;
            max = processedResults.max;
            if(parsedSearchTerm.length>1){
                // Searching non-exact result for artist - song
                findNonExactCombinations = getStringCombinations(connection, parsedSearchTerm, false)
                return connection.query(getStringFindSongData(findNonExactCombinations, max))
            } else {
                return []
            }
        })
        .then(results => {
            var processedResults = processResults(foundResults,results,start,max)
            resolve(processedResults.results)
        })
        .catch(error => {
            reject(error)
        })
        .finally(() =>{
            connection.release();
        })
    })
}

function removePrefix(artist){
    arrayPrefixes = ["A ", "An ", "The "];
    for(const prefix of arrayPrefixes){
        if(artist.startsWith(prefix)){
            artistName = artist.substring(prefix.length, artist.length);
            return artistName;
        }
    }
    return artist;
}


function getStringFindSongData(searchTerm, max){
    var findSong = "SELECT DISTINCT songs.id FROM songs, discography, artists WHERE songs.id=song_id AND artists.id=artist_id AND " + searchTerm + " ORDER BY name_artist, name_song LIMIT " + "0," + max;
    return "SELECT name_artist, prefix, name_song, songs.id FROM artists, discography, songs CROSS JOIN (" + findSong + ") as results ON songs.id=results.id WHERE artists.id=artist_id AND songs.id=song_id;"
}
function getStringFindArtistData(searchTerm, max){
    return "SELECT name_artist, prefix, artists.id FROM artists WHERE " + searchTerm + " ORDER BY name_artist LIMIT " + "0," + max + ";"
}
/**
 * Adding the new results to the old ones. Skips the first amount of start entries and it updates the new max.
 * @param {Artist[]|Song[]} oldResults Results of the previous queries.
 * @param {Artist[]|Song[]} newResults Result of the last query
 * @param {number} start Number of results that must be skipped.
 * @param {number} max Maximum amount of results
 * @returns {Artist[]|Song[]} Object consisting of the new results, the new start and the new max.
 */
function processResults(oldResults,newResults,start,max){
    var idOfResults = []
    for(result of newResults){
        if(start>0){
            if(!idOfResults.includes(result.id)){
                start--;
            }
        } else {
                oldResults.push(result)
        }
        idOfResults.push(result.id)
    }
    max = max-new Set(idOfResults).size
    return {"results":oldResults, "start":start,"max":max}
}
/**
 * Constructs a string of requirements so the database will search for all combinations of artist - song (in that order)
 * @param {Object} connection The connection to the database.
 * @param {string[]} parsedSearchTerm Array of single words.
 * @param {boolean} isExact True if the results must be exact.
 * @returns {string} String with the requirements.
 */
function getStringCombinations(connection, parsedSearchTerm, isExact){
    var stringRequirements = ""
    for(var index=0;index<parsedSearchTerm.length-1;index++){
        stringRequirements += "(name_artist LIKE "
        var artist=""
        for(subindex=0; subindex<=index;subindex++){
            artist += parsedSearchTerm[subindex] + " "
        }
        stringRequirements += escapeString(connection, artist, isExact) + " AND name_song LIKE "
        var song = ""
        for(subindex=index+1; subindex<parsedSearchTerm.length;subindex++){
            song += parsedSearchTerm[subindex] + " "
        }
        stringRequirements += escapeString(connection, song, isExact) + ") OR "
    }
    return stringRequirements.substring(0,stringRequirements.length-4)
}

function escapeString(connection, string, isExact){
    string = string.trim()
    if(isExact){
        return connection.escape(string)
    } else {
        return connection.escape("%" + string + "%")
    }
}