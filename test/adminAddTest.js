// Chai-as-promised is imported in order to test the promises.
var chai = require('chai');
var chaiAsPromised = require("chai-as-promised");
chai.should();
chai.use(chaiAsPromised);
var expect = chai.expect;
var assert = chai.assert;

const mariadb = require('mariadb');
const admin = require("../server/admin/adminAdd");

const poolTest = mariadb.createPool({ 
    host: 'localhost',
    user: 'test',
    password: 'testing...',
    database: 'music',
    connectionLimit: 2
})

async function clearFakeAdminInput(){
    // Creating a connection that can select and delete data from the tables artists, discography, songs and albums.
    let connection 
    await poolTest.getConnection()
    .then(conn => {
        connection = conn;
        fakeArtist = connection.escape("fakeArtist%")
        console.log("Deleting...")
        var removeArtists = "DELETE FROM artists WHERE name_artist LIKE " + fakeArtist + ";"
        return connection.query(removeArtists)
    })
    .then(() => {
        fakeSong = connection.escape("fakeSong%")
        var removeSongs = "DELETE FROM songs WHERE name_song LIKE " + fakeSong + ";"
        return connection.query(removeSongs)
    })
    .then(() => {
        fakeAlbum = connection.escape("fakeAlbum%")
        var removeAlbums = "DELETE FROM albums WHERE name_album LIKE " + fakeAlbum + ";"
        return connection.query(removeAlbums)
    })
    .catch(error =>{
        console.log(error)
    })
    .finally(() =>{
        console.log("Deleted!")
        connection.release()
    })
};

describe('AdminAdd', function() {
    after(async function(){
        await clearFakeAdminInput()
        poolTest.end()
    })
    describe('add a new song', function(){
        // Based on hard coded imput Salvia - Always which is an existing song in the database.
        it('should reject if the song already exists', function(){
            return admin.addSong(["Saliva"],"Always").should.be.rejected;
        })
        it('should reject if the artist is undefined', function(){
            return admin.addSong(undefined,"fakeSongUndefArtist").should.be.rejected;
        })
        it('should reject if no artist is given', function(){
            return admin.addSong([],"fakeSongNoArtist0").should.be.rejected;
        })
        it('should reject if artists contains an empty name', function(){
            return admin.addSong([""],"fakeSongNoArtist1").should.be.rejected;
        })
        // Based on hard coded imput Saliva which is an existing artist in the database.
        it('should reject if the song is undefined', function(){
            return admin.addSong(["Saliva"],undefined).should.be.rejected;
        })
        // Based on hard coded imput Saliva which is an existing artist in the database.
        it('should reject if the song is empty', function(){
            return admin.addSong(["Saliva"],"").should.be.rejected;
        })
        it('should fullfill if artists is a string', function(){
            return admin.addSong("FakeArtistString","fakeSong0").should.be.fulfilled;
        })
        it('should fulfill if the artist and song don\'t exists', function(){
            return admin.addSong(["fakeArtist1"],"fakeSong1").should.be.fulfilled;
        })
        // Based on hard coded imput Saliva which is an existing artist in the database.
        it('should fulfill if the artist exists but the song doesn\'t', function(){
            return admin.addSong(["Saliva"],"fakeSong2").should.be.fulfilled;
        })
        it('should fulfill if the name of an artist contains &', function(){
            return admin.addSong(["fakeArtistWith2 & fakeArtist3"],"fakeSong2").should.be.fulfilled;
        })
        // Based on hard coded imput Saliva which is an existing artist in the database.
        it('should not add a new artist if the artist already exists', async function(){
            await admin.addSong(["Saliva"],"fakeSong3")
            let connection
            let testResult
            return poolTest.getConnection()
            .then(conn => {
                connection = conn
                return connection.query("SELECT name_artist FROM artists WHERE name_artist=\"Saliva\";")
            })
            .then(result => {
                testResult = result;
            })
            .finally(() =>{
                connection.release()
                return assert.equal(testResult.length,1)
            })
        })
        it('should add a new artist if the artist doesn\'t exist', async function(){
            await admin.addSong(["fakeArtist4"],"fakeSong4")
            let connection
            let testResult
            return poolTest.getConnection()
            .then(conn => {
                connection = conn
                return connection.query("SELECT name_artist FROM artists WHERE name_artist=\"fakeArtist4\";")
            })
            .then(result => {
                testResult = result;
            })
            .finally(() =>{
                connection.release()
                return assert.equal(testResult.length,1)
            })
        })
        it('should add a new artist if the name of the artist contains an &', async function(){
            await admin.addSong(["fakeArtist5 & fakeArtist6"],"fakeSong4")
            let connection
            let testResult
            return poolTest.getConnection()
            .then(conn => {
                connection = conn
                return connection.query("SELECT name_artist FROM artists WHERE name_artist=\"fakeArtist5 & fakeArtist6\";")
            })
            .then(result => {
                testResult = result;
            })
            .finally(() =>{
                connection.release()
                return assert.equal(testResult.length,1)
            })
        })
        // Based on hard coded imput Saliva which is an existing artist in the database.
        it('should add a new song to the right artist when the artist already exists', async function(){
            await admin.addSong(["Saliva"],"fakeSong5")
            let connection
            let testResult
            return poolTest.getConnection()
            .then(conn => {
                connection = conn
                return connection.query("SELECT name_song FROM artists, discography, songs WHERE artists.id=artist_id AND songs.id=song_id AND name_artist=\"Saliva\" AND name_song=\"fakeSong5\";")
            })
            .then(result => {
                testResult = result;
            })
            .finally(() =>{
                connection.release()
                return assert.equal(testResult.length,1)
            })
        })
        it('should add a new song to the right artist when the artist doesn\'t exists', async function(){
            await admin.addSong(["fakeArtist7"],"fakeSong6")
            let connection
            let testResult
            return poolTest.getConnection()
            .then(conn => {
                connection = conn
                return connection.query("SELECT name_song FROM artists, discography, songs WHERE artists.id=artist_id AND songs.id=song_id AND name_artist=\"fakeArtist7\" AND name_song=\"fakeSong6\";")
            })
            .then(result => {
                testResult = result;
            })
            .finally(() =>{
                connection.release()
                return assert.equal(testResult.length,1)
            })
        })
        it('should add a new song to the right artists when multiple artists collaborates', async function(){
            await admin.addSong(["fakeArtist8", "fakeArtist9"],"fakeSong7")
            let connection
            let testResult
            return poolTest.getConnection()
            .then(conn => {
                connection = conn
                return connection.query("SELECT name_artist FROM artists, discography, songs WHERE artists.id=artist_id AND songs.id=song_id AND name_song=\"fakeSong7\";")
            })
            .then(result => {
                testResult = result;
            })
            .finally(() =>{
                connection.release()
                return assert.equal(testResult.length,2)
            })
        })
    });
    
    describe('add a new album', function(){
        it('should reject if the album already exists', async function(){
            await admin.addAlbum("FakeAlbum","Saliva",[{"name_song": "FakeSongAlbum1", "featuring": "FakeArtistAlbum1"}])
            return admin.addAlbum("FakeAlbum","Saliva",[{"name_song": "FakeSongAlbum2", "featuring": "FakeArtistAlbum1"}]).should.be.rejected;
        })
        it('should reject if the album is undefined', function(){
            return admin.addAlbum(undefined,"FakeArtistAlbum2", [{"name_song": "FakeSongAlbum3", "featuring": "FakeArtistAlbum1"}]).should.be.rejected;
        })
        it('should reject if the artist is undefined', function(){
            return admin.addAlbum("FakeAlbum",undefined,[{"name_song": "FakeSongAlbum4", "featuring": "FakeArtistAlbum1"}]).should.be.rejected;
        })
        it('should reject if no song is given', function(){
            return admin.addAlbum("FakeAlbum2","FakeArtistAlbum2", []).should.be.rejected;
        })
        it('should reject if the song is undefined', function(){
            return admin.addAlbum("FakeAlbum3","Saliva",undefined).should.be.rejected;
        })
        it('should reject if the name of the album is empty', function(){
            return admin.addAlbum("","Saliva",[{"name_song": "FakeSongAlbum5", "featuring": "FakeArtistAlbum1"}]).should.be.rejected;
        })
        it('should reject if the name of the artist is empty', function(){
            return admin.addAlbum("FakeAlbum4","",[{"name_song": "FakeSongAlbum6", "featuring": "FakeArtistAlbum1"}]).should.be.rejected;
        })
        it('should fulfill if the album don\'t exists', function(){
            return admin.addAlbum("FakeAlbum5","FakeArtistAlbum2", [{"name_song": "FakeSongAlbum7", "featuring": "FakeArtistAlbum1"}]).should.be.fulfilled;
        })
        // Based on hard coded imput Saliva which is an existing artist in the database.
        it('should fulfill if the artist exists', function(){
            return admin.addAlbum("FakeAlbum5","Seether", [{"name_song": "FakeSongAlbum8", "featuring": "FakeArtistAlbum1"}]).should.be.fulfilled;
        })
        it('should fulfill if an two artists made an album with the same name', async function(){
            await admin.addAlbum("FakeAlbum6","FakeArtistAlbum3", [{"name_song": "FakeSongAlbum9", "featuring": null}]);
            return admin.addAlbum("FakeAlbum6","FakeArtistAlbum4", [{"name_song": "FakeSongAlbum9", "featuring": null}]).should.be.fulfilled;
        })
        // Based on hard coded imput Saliva which is an existing artist in the database.
        it('should fulfill if the featuring artists are not given', function(){
            return admin.addAlbum("FakeAlbum7","FakeArtistAlbum5", [{"name_song": "FakeSongAlbum10"}, {"name_song":"FakeSongAlbum11"}]).should.be.fulfilled;
        })
        // Based on hard coded imput Saliva which is an existing artist in the database.
        it('should not add a new artist if the artist already exists', async function(){
            await admin.addAlbum("FakeAlbum7","Saliva", [{"name_song": "FakeSongAlbum12"}, {"name_song":"FakeSongAlbum13"}])
            let connection
            let testResult
            return poolTest.getConnection()
            .then(conn => {
                connection = conn
                return connection.query("SELECT name_artist FROM artists WHERE name_artist=\"Saliva\";")
            })
            .then(result => {
                testResult = result;
            })
            .finally(() =>{
                connection.release()
                return assert.equal(testResult.length,1)
            })
        })
        it('should add a new artist if the artist doesn\'t exist', async function(){
            await admin.addAlbum("FakeAlbum7","FakeArtistAlbum6", [{"name_song": "FakeSongAlbum14"}])
            let connection
            let testResult
            return poolTest.getConnection()
            .then(conn => {
                connection = conn
                return connection.query("SELECT name_artist FROM artists WHERE name_artist=\"FakeArtistAlbum6\";")
            })
            .then(result => {
                testResult = result;
            })
            .finally(() =>{
                connection.release()
                return assert.equal(testResult.length,1)
            })
        })
        it('should add a new album to an artist', async function(){
            await admin.addAlbum("FakeAlbum8","FakeArtistAlbumLink7", [{"name_song": "FakeSongAlbum14"}])
            let connection
            let testResult
            return poolTest.getConnection()
            .then(conn => {
                connection = conn
                return connection.query("SELECT name_artist FROM artists, albums WHERE artists.id=artist_id AND name_album=\"FakeAlbum8\";")
            })
            .then(result => {
                testResult = result;
            })
            .finally(() =>{
                connection.release()
                return assert.equal(testResult.length,1)
            })
        })
        it('should add a new album to the right artist when the artist already exists', async function(){
            await admin.addAlbum("FakeAlbum9","D12", [{"name_song": "FakeSongAlbum14"}])
            let connection
            let testResult
            return poolTest.getConnection()
            .then(conn => {
                connection = conn
                return connection.query("SELECT name_artist FROM artists, albums WHERE artists.id=artist_id AND name_album=\"FakeAlbum9\";")
            })
            .then(result => {
                testResult = result;
            })
            .finally(() =>{
                connection.release()
                return assert.equal(testResult[0].name_artist,"D12")
            })
        })
        it('should add a new album to the right artist when the artist don\'t exists', async function(){
            await admin.addAlbum("FakeAlbum10","FakeArtistAlbum7", [{"name_song": "FakeSongAlbum14"}])
            let connection
            let testResult
            return poolTest.getConnection()
            .then(conn => {
                connection = conn
                return connection.query("SELECT name_artist FROM artists, albums WHERE artists.id=artist_id AND name_album=\"FakeAlbum10\";")
            })
            .then(result => {
                testResult = result;
            })
            .finally(() =>{
                connection.release()
                return assert.equal(testResult[0].name_artist,"FakeArtistAlbum7")
            })
        })
        it('should add a new song to the right artists when multiple artists collaborates', async function(){
            await admin.addAlbum("FakeAlbum11","FakeArtistAlbum8", [{"name_song": "FakeSongAlbum15", "featuring":"FakeArtistAlbum9"}])
            let connection
            let testResult
            return poolTest.getConnection()
            .then(conn => {
                connection = conn
                return connection.query("SELECT name_artist FROM artists, discography, songs WHERE artists.id=artist_id AND songs.id=song_id AND name_song=\"fakeSong7\";")
            })
            .then(result => {
                testResult = result;
            })
            .finally(() =>{
                connection.release()
                return assert.equal(testResult.length,2)
            })
        })
    });
});

