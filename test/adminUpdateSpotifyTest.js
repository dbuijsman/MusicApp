// Chai-as-promised is imported in order to test the promises.
var chai = require('chai');
var chaiAsPromised = require("chai-as-promised");
chai.should();
chai.use(chaiAsPromised);
var expect = chai.expect;
var assert = chai.assert;

const mariadb = require('mariadb');
const adminAdd = require("../server/admin/adminAdd");
const adminSpotify = require("../server/admin/adminUpdateSpotify");
const find = require("../server/find");

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
        fakeArtist = connection.escape("fakeAdminUpdateArtist%")
        console.log("Deleting...")
        var removeArtists = "DELETE FROM artists WHERE name_artist LIKE " + fakeArtist + ";"
        return connection.query(removeArtists)
    })
    .then(() => {
        fakeSong = connection.escape("fakeAdminUpdateSong%")
        var removeSongs = "DELETE FROM songs WHERE name_song LIKE " + fakeSong + ";"
        return connection.query(removeSongs)
    })
    .then(() => {
        fakeAlbum = connection.escape("fakeAdminUpdateAlbum%")
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

describe('AdminUpdate', function() {
    after(async function(){
        await clearFakeAdminInput()
        poolTest.end()
    })
    describe('add link to artist', function(){
        it('should reject if the artist don\'t exists', function(){
            return adminSpotify.addLinkArtist("fakeAdminUpdateArtistLink0","token").should.be.rejected
        })
        it('should reject if the artist has a spotify id', async function(){
            await adminAdd.addSong(["fakeAdminUpdateArtistLink1"], "fakeAdminUpdateSongLink0")
            await adminSpotify.addLinkArtist("fakeAdminUpdateArtistLink1", "Token")
            return adminSpotify.addLinkArtist("fakeAdminUpdateArtistLink1", "Token").should.be.rejected
        })
        it('should fullfill if the artist has no spotify id', async function(){
            await adminAdd.addSong(["fakeAdminUpdateArtistLink2"], "fakeAdminUpdateSongLink1")
            return adminSpotify.addLinkArtist("fakeAdminUpdateArtistLink2","token").should.be.fulfilled
        })
    });
    describe('update discography', function(){
        it('should reject if the artist don\'t exists', function(){
            return adminSpotify.updateArtist("fakeAdminUpdateArtist0").should.be.rejected
        })
        it('should reject if the artist has no spotify id', async function(){
            await adminAdd.addSong(["fakeAdminUpdateArtist1"], "fakeAdminUpdateSong0")
            return adminSpotify.updateArtist("fakeAdminUpdateArtist1").should.be.rejected
        })
        // Based on hard coded data.
        it('should fulfill if the artist has a spotify id', async function(){
            try{
                await adminSpotify.addLinkArtist("In This Moment", "6tbLPxj1uQ6vsRQZI2YFCT")
            }
            catch{}
            return adminSpotify.updateArtist("In This Moment").should.be.fulfilled
        })
        it('should not add any songs when there are no new songs', async function(){
            try{
                await adminSpotify.addLinkArtist("Korn", "3RNrq3jvMZxD9ZyoOZbQOD")
            }
            catch{}
            await adminSpotify.updateArtist("Korn")
            var songs1 = await find.songsFromArtist("Korn", 0, 500)
            await adminSpotify.updateArtist("Korn")
            var songs2 = await find.songsFromArtist("Korn", 0, 500)
            assert.equal(songs1.length,songs2.length)
        })
    });
});

