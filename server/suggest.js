const mariadb = require('mariadb');

const admin = require("./admin/adminAdd");

// Creating a pool of connections that can use select on the tables artists, discography, songs, liked_songs, disliked_songs and followed_artists.
// It can also create and drop views.
const poolSuggest = mariadb.createPool({ 
    host: 'localhost',
    user: 'reader',
    connectionLimit: 15,
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
     * Makes suggestions based on likes and dislikes of users. Likes have weight 1, dislikes have weight -1.
     * These numbers are multiplied by the amount of shared likes or dislikes with the requested user.
     * Filters out likes and dislikes of the requested user.
     * @param {number} user_id Id of the user.
     * @returns {Promise<Song[]} Array of 20 suggested songs.
     */
    songFromLikes: function (user_id){
        return new Promise(function(resolve, reject){
            try{
                if(!user_id){
                    throw new Error(400)
                }
                let connection;
                let likedSongsUser
                let dislikedSongsUser
                poolSuggest.getConnection()
                .then(conn => {
                    connection = conn;
                    // Creating a view consisting of all the users that share likes with the given user. Duplicates are allowed.
                    likedSongsUser = "SELECT song_id FROM liked_songs WHERE user_id=" + user_id;
                    dislikedSongsUser = "SELECT song_id FROM disliked_songs WHERE user_id=" + user_id;
                    otherUsersWithSimilarLikes = "SELECT user_id FROM liked_songs WHERE song_id IN (" + likedSongsUser + ") AND user_id!=" + user_id;
                    return connection.query("Create VIEW otherUsers" + user_id + " (user_id) AS (" + otherUsersWithSimilarLikes + ");")
                })
                .then(() => {
                    // Creating a view consisting of all songs and a count that represents how many times the song is liked by users from the first view (counted with multiplicity)
                    var likesOtherUsers = "SELECT liked_songs.song_id FROM liked_songs, otherUsers" + user_id + " WHERE liked_songs.user_id=otherUsers" + user_id + ".user_id";
                    var joiningSongsAndLikes = "SELECT songs.id, IFNULL(COUNT(likes.song_id),0) FROM songs LEFT JOIN (" + likesOtherUsers + ") AS likes ON songs.id=likes.song_id GROUP BY songs.id"
                    return connection.query("CREATE VIEW liked" + user_id + "(song_id, count) AS (" + joiningSongsAndLikes + ");")
                })
                .then(() => {
                    // Creating a view consisting of all songs and a count that represents how many times the song is disliked by users from the first view (counted with multiplicity)
                    var dislikesOtherUsers = "SELECT disliked_songs.song_id FROM disliked_songs, otherUsers" + user_id + " WHERE disliked_songs.user_id=otherUsers" + user_id + ".user_id";
                    var joiningSongsAndDislikes = "SELECT songs.id, IFNULL(COUNT(dislikes.song_id),0) FROM songs LEFT JOIN (" + dislikesOtherUsers + ") AS dislikes ON songs.id=dislikes.song_id GROUP BY songs.id"
                    return connection.query("CREATE VIEW disliked" + user_id + "(song_id, count) AS (" + joiningSongsAndDislikes + ");")
                })
                .then(() => {
                    var selectingColums = "SELECT name_artist, prefix, name_song, songs.id FROM artists, discography, songs"
                    var requirements = " WHERE artists.id=artist_id AND songs.id=discography.song_id"
                    // The select from the next lines will select the suggestions based on likes from the liked view and the disliked from the disliked view.
                    // Liked songs and disliked songs from the user will be removed from the suggestions.
                    // Likes have weight 1. Dislikes have weight -1.
                    var combiningViewsOrdering = "ORDER BY liked" + user_id + ".count-disliked" + user_id + ".count DESC LIMIT 20"
                    var combiningViewsFilter = "liked" + user_id + ".song_id NOT IN (" + likedSongsUser + ") AND liked" + user_id + ".song_id NOT IN (" + dislikedSongsUser + ") " + combiningViewsOrdering;
                    var combiningViewsRequirements = "liked" + user_id + ".song_id=disliked" + user_id + ".song_id AND " + combiningViewsFilter
                    var combiningViews = "SELECT liked" + user_id + ".song_id FROM liked" + user_id + ", disliked" + user_id + " WHERE " + combiningViewsRequirements;
                    return connection.query(selectingColums + " CROSS JOIN (" + combiningViews + ") AS suggestions ON songs.id=suggestions.song_id" + requirements + ";")
                })
                .then(results => {
                    resolve(results)
                })
                .catch(error => {
                    reject(error)
                })
                .finally(async () =>{
                    // The views will be deleted after usage.
                    await connection.query("DROP VIEW otherUsers" + user_id)
                    await connection.query("DROP VIEW liked" + user_id)
                    await connection.query("DROP VIEW disliked" + user_id)
                    connection.end();
                })
            }
            catch(error){
                reject(error)
            }
        })
    },
    /**
     * Makes suggestions based on follows of user. A follow of an user is multiplied by the amount of shared follows with the requested users. 
     * Filters out follows of the requested user.
     * @param {number} user_id Id of the user.
     * @returns {Promise<Artist[]>} Array of 20 suggested artists.
     */
    artistFromFollow: function (user_id){
        return new Promise(function(resolve, reject){
            try{
                if(!user_id){
                    throw new Error(400)
                }
                let connection;
                let followedArtistsUser
                poolSuggest.getConnection()
                .then(conn => {
                    connection = conn;
                    // Creating a view consisting of all the users that share artists with the given user. Duplicates are allowed.
                    followedArtistsUser = "SELECT artist_id FROM followed_artists WHERE user_id=" + user_id;
                    var otherUsersWithSimilarArtists = "SELECT user_id FROM followed_artists WHERE artist_id IN (" + followedArtistsUser + ") AND user_id!=" + user_id;
                    return connection.query("Create VIEW otherUsersFollow" + user_id + " (user_id) AS (" + otherUsersWithSimilarArtists + ");")
                })
                .then(() => {
                    // Creating a view consisting of all artist and a count that represents how many times the song is liked by users from the first view (counted with multiplicity)
                    var followedArtistOtherUsers = "SELECT followed_artists.artist_id FROM followed_artists, otherUsersFollow" + user_id + " WHERE followed_artists.user_id=otherUsersFollow" + user_id + ".user_id";
                    var joiningSongsAndFollows = "SELECT artists.id, IFNULL(COUNT(followed.artist_id),0) FROM artists LEFT JOIN (" + followedArtistOtherUsers + ") AS followed ON artists.id=followed.artist_id GROUP BY artists.id"
                    return connection.query("CREATE VIEW followed" + user_id + "(artist_id, count) AS (" + joiningSongsAndFollows + ");")
                })
                .then(() => {
                    // The select from the next lines will select the suggestions based on follows from the followed view.
                    var combiningViewsOrdering = "ORDER BY followed" + user_id + ".count DESC LIMIT 20";
                    var combiningViewsFilter = "followed" + user_id + ".artist_id NOT IN (" + followedArtistsUser + ") ";
                    var combiningViews = "SELECT followed" + user_id + ".artist_id FROM followed" + user_id + " WHERE " + combiningViewsFilter + combiningViewsOrdering;
                    return connection.query("SELECT artists.id, name_artist, prefix FROM artists CROSS JOIN (" + combiningViews + ") AS suggestions ON artists.id=suggestions.artist_id;")
                })
                .then(results => {
                    resolve(results)
                })
                .catch(error => {
                    reject(error)
                })
                .finally(async () =>{
                    // The views will be deleted after usage.
                    await connection.query("DROP VIEW otherUsersFollow" + user_id)
                    await connection.query("DROP VIEW followed" + user_id)
                    connection.end()
                })
            }
            catch(error){
                reject(error)
            }
        })
    }
};
