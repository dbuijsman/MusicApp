// Chai-as-promised is imported in order to test the promises.
var chai = require('chai');
var chaiAsPromised = require("chai-as-promised");
chai.should();
chai.use(chaiAsPromised);
var expect = chai.expect;
var assert = chai.assert;

const mariadb = require('mariadb');
const admin = require("../server/admin/adminAdd");
const find = require("../server/find")
const notify = require("../server/notify")
const preferenceArtist = require("../server/preferenceArtist")
const users = require("../server/userData");

async function clearFakeData(){
    let connection;
    // Creates a connection that can delete data from the tables users, artists and songs.
    mariadb.createConnection({
      host: 'localhost',
      user: 'test',
      password: 'testing...',
      database: 'music'
    })
    .then(conn => {
      connection = conn;
      username = connection.escape("usernameNot%")
      console.log("Deleting...")
      var removeUsers = "DELETE FROM users WHERE username LIKE " + username + ";"
      return connection.query(removeUsers)
    })
    .then(() => {
      fakeArtist = connection.escape("ArtistNot%")
      var removeArtists = "DELETE FROM artists WHERE name_artist LIKE " + fakeArtist + ";"
      return connection.query(removeArtists)
    })
    .then(() => {
      fakeSongs = connection.escape("SongNot%")
      var removeSongs = "DELETE FROM songs WHERE name_song LIKE " + fakeSongs + ";"
      return connection.query(removeSongs)
    })
    .catch(error =>{
      console.log(error)
    })
    .finally(() =>{
      console.log("Deleted!")
      connection.end()
    })
  };

describe('Notify', function() {
  after(async function(){
    await clearFakeData()
  })
  describe('Find new songs', function(){
    it('should rejects if the user_id is undefined (e.g. user is not logged in)', function(){
        return notify.newSongs(undefined, 0, 10).should.be.rejected;
    })
    it('should fulfill if the user_id is correct', async function(){
      var token = await users.add("UsernameNot0", "password")
      var user = await users.validateToken(token)
      return notify.newSongs(user.id, 0, 10).should.be.fulfilled;
    })
    it('should give an empty set if an user has no artists to follow', async function(){
      var token = await users.add("UsernameNot1", "password")
      var user = await users.validateToken(token)
      var results = await notify.newSongs(user.id, 0, 10);
      assert.equal(results.length,0)
    })
    it('should give an empty set when there are no new songs', async function(){
      var token = await users.add("UsernameNot2", "password")
      var user = await users.validateToken(token)
      await preferenceArtist.addFollow(user.id, 12);
      var results = await notify.newSongs(user.id, 0, 10)
      assert.equal(results.length,0)
    })
    it('should give a result when an artist released a new song', async function(){
      var token = await users.add("UsernameNot3", "password")
      var user = await users.validateToken(token)
      var artist = await find.artistStartWith("A",0,1)
      await preferenceArtist.addFollow(user.id, artist[0].id);
      await admin.addSong([artist[0].name_artist], "SongNot1")
      var results = await notify.newSongs(user.id, 0, 10)
      assert.equal(results.length,1)
    })
    it('should return the right song when an artist released a new song', async function(){
      var token = await users.add("UsernameNot4", "password")
      var user = await users.validateToken(token)
      var artist = await find.artistStartWith("B",0,1)
      await preferenceArtist.addFollow(user.id, artist[0].id);
      await admin.addSong([artist[0].name_artist], "SongNot2")
      var results = await notify.newSongs(user.id, 0, 10)
      assert.equal(results[0].name_song,"SongNot2")
    })
    it('should return both artists when they collaborated on a new song and the user only follows one of them', async function(){
      var token = await users.add("UsernameNot5", "password")
      var user = await users.validateToken(token)
      var artist = await find.artistStartWith("C",0,2)
      await preferenceArtist.addFollow(user.id, artist[0].id);
      await admin.addSong([artist[0].name_artist, "ArtistNot1"], "SongNot3")
      var results = await notify.newSongs(user.id, 0, 10)
      assert.equal(results.length,2)
    })
    it('should not return duplicates when the followed artists together released a new song', async function(){
      var token = await users.add("UsernameNot6", "password")
      var user = await users.validateToken(token)
      var artist = await find.artistStartWith("D",0,2)
      await preferenceArtist.addFollow(user.id, artist[0].id);
      await preferenceArtist.addFollow(user.id, artist[1].id);
      await admin.addSong([artist[0].name_artist, artist[1].name_artist], "SongNot4")
      var results = await notify.newSongs(user.id, 0, 10)
      assert.equal(results.length,2)
    })
    it('should return all new songs when a followed artists released multiple songs', async function(){
      var token = await users.add("UsernameNot7", "password")
      var user = await users.validateToken(token)
      var artist = await find.artistStartWith("E",0,2)
      await preferenceArtist.addFollow(user.id, artist[0].id);
      await admin.addSong([artist[0].name_artist], "SongNot5")
      await admin.addSong([artist[0].name_artist], "SongNot6")
      var results = await notify.newSongs(user.id, 0, 10)
      assert.equal(results.length,2)
    })
  });
});

