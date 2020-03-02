var fs = require('fs');
var path = require('path');

const mariadb = require('mariadb');
const admin = require('./admin');
const crypto = require('crypto');

const userDB = process.argv[3];
const passDB = process.argv[5];
if(process.argv[2] !== "-u" || process.argv[4] !== "-p"){
    throw new Error("Please enter node initializeDatabase -u \"username\" -p \"password\".")
}
let connectionInit;
mariadb.createConnection({
    host: 'localhost',
    user: userDB,
    password: passDB,
})
.then(conn => {
    console.log("Connected!");
    connectionInit = conn
    return connectionInit.query("CREATE DATABASE IF NOT EXISTS musicapp;")
})
.then(() => {
    return connectionInit.query("USE musicapp")
})
.then(() =>{
    return connectionInit.query("SHOW VARIABLES LIKE 'max_connections';")
})
.then((res) =>{
    if(res[0].Value < 500){
        return connectionInit.query("SET GLOBAL max_connections=500;")
    }
})
.then(() => {
    return createUsers(connectionInit);
})
.then(() => {
    return makeTables(connectionInit);
})
.then(() => {
    return grantPrivileges(connectionInit);
})
.then(() => {
    return addAdmin(connectionInit);
})
.catch(err => {
    console.log("Failed to initialize due to error: " + err);
})
.finally(() => {
    console.log("Done")
    connectionInit.end();
});

/**
 * Creating the users.
 * @param {Object} connection Connection to the database.
 */
async function createUsers(connection){
    try{
        await connection.query("CREATE USER IF NOT EXISTS adminMusicApp IDENTIFIED BY \'admin\';")
        await connection.query("CREATE USER IF NOT EXISTS readerMusicApp IDENTIFIED BY \'reading...\';")
        await connection.query("CREATE USER IF NOT EXISTS preferencesMusicApp IDENTIFIED BY \'pref\';")
        await connection.query("CREATE USER IF NOT EXISTS credentialsMusicApp IDENTIFIED BY \'validate\';")
        await connection.query("CREATE USER IF NOT EXISTS testMusicApp IDENTIFIED BY \'testing...\';")
    }
    catch(error){
        throw new Error("Couldn't make users due to: " + error)
    }
}

/**
 * Grant the right privileges for every user created
 * @param {Object} connection Connection to the database.
 */
async function grantPrivileges(connection){
    try{
        await connection.query("GRANT SELECT, INSERT ON musicapp.artists TO adminMusicApp;")
        await connection.query("GRANT SELECT, INSERT ON musicapp.discography TO adminMusicApp;")
        await connection.query("GRANT SELECT, INSERT ON musicapp.songs TO adminMusicApp;")
        await connection.query("GRANT SELECT, INSERT ON musicapp.albums TO adminMusicApp;")
        await connection.query("GRANT SELECT, INSERT ON musicapp.album_track_listing TO adminMusicApp;")
        await connection.query("GRANT SELECT ON musicapp.artists TO readerMusicApp;")
        await connection.query("GRANT SELECT ON musicapp.discography TO readerMusicApp;")
        await connection.query("GRANT SELECT ON musicapp.songs TO readerMusicApp;")
        await connection.query("GRANT SELECT ON musicapp.* TO preferencesMusicApp;")
        await connection.query("GRANT DROP ON musicapp.* TO preferencesMusicApp;")
        await connection.query("GRANT INSERT, DELETE ON musicapp.followed_artists TO preferencesMusicApp;")
        await connection.query("GRANT INSERT, DELETE ON musicapp.liked_songs TO preferencesMusicApp;")
        await connection.query("GRANT INSERT, DELETE ON musicapp.disliked_songs TO preferencesMusicApp;")
        await connection.query("GRANT CREATE VIEW ON musicapp.* TO preferencesMusicApp;")
        await connection.query("GRANT SELECT, INSERT ON musicapp.users TO credentialsMusicApp;")
        await connection.query("GRANT UPDATE (lastlogin, currentlogin) ON musicapp.users TO credentialsMusicApp;")
        await connection.query("GRANT SELECT, DELETE ON musicapp.artists TO testMusicApp;")
        await connection.query("GRANT SELECT, DELETE ON musicapp.discography TO testMusicApp;")
        await connection.query("GRANT SELECT, DELETE ON musicapp.songs TO testMusicApp;")
        await connection.query("GRANT SELECT, DELETE ON musicapp.albums TO testMusicApp;")
        await connection.query("GRANT DELETE ON musicapp.users TO testMusicApp;")
    }
    catch(error){
        throw new Error("Couldn't grant privileges due to: " + error)
    }
}

/**
 * Creates all the tables.
 * @param {Object} connection Connection to the database.
 */
async function makeTables(connection){
    try{
        var artists = createTable("artists") + addName("artist") + ", prefix VARCHAR(7), linkSpotify VARCHAR(128) NULL);";
        await connection.query(artists);
        var songs = createTable("songs") + addName("song") + ", language VARCHAR(32), time TIMESTAMP);";
        await connection.query(songs);
        var albums = createTable("albums") + addName("album") + addForeignKeyReference("artist_id", "artists") + ");";
        await connection.query(albums);
        var genres = createTable("genres") + addName("genre") + ");";
        await connection.query(genres);
        var discography = createTable("discography") + addForeignKeyReference("artist_id", "artists") + addForeignKeyReference("song_id", "songs") + ");";
        await connection.query(discography);
        var albumTrackListing = createTable("album_track_listing") + addForeignKeyReference("album_id", "albums") + addForeignKeyReference("song_id", "songs") + ");";
        await connection.query(albumTrackListing);
        var songGenre = createTable("song_genre") + addForeignKeyReference("song_id", "songs") + addForeignKeyReference("genre_id", "genres") + ");";
        await connection.query(songGenre);
        var users = createTable("users") + ", username VARCHAR(64) NOT NULL, password VARCHAR(255) NOT NULL, salt binary(64) NOT NULL, currentlogin TIMESTAMP, lastlogin TIMESTAMP, role VARCHAR(10));";
        await connection.query(users);
        var likedSongs = createTable("liked_Songs") + addForeignKeyReference("user_id", "users") + addForeignKeyReference("song_id", "songs") + ");";
        await connection.query(likedSongs);
        var likedSongs = createTable("disliked_Songs") + addForeignKeyReference("user_id", "users") + addForeignKeyReference("song_id", "songs") + ");";
        await connection.query(likedSongs);
        var followedArtists = createTable("followed_Artists") + addForeignKeyReference("user_id", "users") + addForeignKeyReference("artist_id", "artists") + ");";
        await connection.query(followedArtists);
    } catch(err){
        throw new Error("Couldn't make tables due to: " + err)
    }
};

function createTable(tableName){
    return "CREATE TABLE " + tableName + " (id INT NOT NULL PRIMARY KEY AUTO_INCREMENT";
}
function addName(tablename){
    return ", name_" + tablename + " VARCHAR(128) NOT NULL";
}
function addForeignKeyReference(columnName, referenceTable){
    return ", " + columnName + " INT NOT NULL, FOREIGN KEY (" + columnName + ") REFERENCES " + referenceTable + " (id) ON UPDATE CASCADE ON DELETE CASCADE";
}
async function addAdmin(connection){
    const salt = crypto.randomBytes(32).toString('hex');
    var hash = crypto.createHmac('sha512', salt);
    const passSave = hash.update("PassWordMusicApp!").digest('hex');
    var insertNewUser = "INSERT INTO users (username, password, salt, lastlogin) VALUES (\"admin\", \"" + passSave + "\", \"" + salt + "\", current_timestamp());"
    await connection.query(insertNewUser);
}

