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
     * @typedef {Object} ArtistExternal
     * @property {string} name_artist name of the artist.
     * @property {string} source External source.
     * @property {number} id Id of the artist from the source.
     */

    /**
     * Finds artists and spotify id.
     * @param {string} searchTerm Search term.
     * @returns {Promise<ArtistExternal[]>} Array of artists found on Spotify.
     */
    findArtists: function(searchTerm){
        return new Promise(async function(resolve, reject){
            searchTerm = searchTerm.replace(new RegExp(' ', 'g'), '%20')
            request.get('https://api.spotify.com/v1/search?q=' + searchTerm +'&type=artist&market=NL&limit=20&offset=0', async function(error, response, body){
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
                    var resultingArtists = data.artists.items
                    var artists = []
                    for(var artist of resultingArtists){
                        artists.push({"name_artist": artist.name, "source": "Spotify", "id": artist.id})
                    }
                    resolve(artists)
                }
                catch(error){
                    reject(error)
                }
            })
            .auth(null,null,true,token)
        })
    },
    /**
     * Adding artists with their link to the database.
     * @param {ArtistExternal[]} artists Array of artists to add to the database.
     */
    addArtists: function(artists){
        return new Promise(async function(resolve, reject){

        })
    }
};

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