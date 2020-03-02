// Chai-as-promised is imported in order to test the promises.
var chai = require('chai');
var chaiAsPromised = require("chai-as-promised");
chai.should();
chai.use(chaiAsPromised);
var expect = chai.expect;
var assert = chai.assert;

const mariadb = require('mariadb');
const admin = require("../server/admin/adminAdd");
const find = require("../server/find");
const suggest = require("../server/suggest");
const preferenceArtist = require("../server/preferenceArtist");
const preference = require("../server/preferenceSong");
const users = require("../server/userData");

async function clearFakePreferences(){
    let connection;
    // Creates a connection that can delete data from the tablea users, artists and songs.
    await mariadb.createConnection({
      host: 'localhost',
      user: 'test',
      password: 'testing...',
      database: 'music'
    })
    .then(conn => {
      connection = conn;
      username = connection.escape("usernameSugg%")
      console.log("Deleting...")
      var removeUser = "DELETE FROM users WHERE username LIKE " + username + ";"
      return connection.query(removeUser)
    })
    .then(() => {
      fakeArtist = connection.escape("ZZZsuggArtist%")
      var removeArtists = "DELETE FROM artists WHERE name_artist LIKE " + fakeArtist + ";"
      return connection.query(removeArtists)
    })
    .then(() => {
      fakeSong = connection.escape("ZZZsuggSong%")
      var removeSongs = "DELETE FROM songs WHERE name_song LIKE " + fakeSong + ";"
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

describe('Suggest', function() {
  after(async function(){
    await clearFakePreferences()
  })
  describe('songs to like', function(){
    it('should rejects if the user_id is undefined (e.g. user is not logged in)', function(){
        return suggest.songFromLikes(undefined).should.be.rejected;
    })
    it('should fullfill if the user_id is correct', async function(){
        var token = await users.add("usernameSugg0", "password")
        var user = await users.validateToken(token)
        return suggest.songFromLikes(user.id).should.be.fulfilled;
    })
    it('should return suggestions even when an user has no likes', async function(){
        var token = await users.add("usernameSugg1", "password")
        var user = await users.validateToken(token)
        var result = await suggest.songFromLikes(user.id);
        assert.isOk(result.length>0);
    })
    it('should give the most liked song (counted with multiplicity) as the first suggestion', async function(){
        var token1 = await users.add("usernameSugg2", "password")
        var token2 = await users.add("usernameSugg3", "password")
        var user1 = await users.validateToken(token1)
        await admin.addSong(["ZZZsuggArtistLike1"], "ZZZsuggSong0")
        await admin.addSong(["ZZZsuggArtistLike2"], "ZZZsuggSong1")
        var songs1 = await find.songsFromArtist("ZZZsuggArtistLike1")
        var songs2 = await find.songsFromArtist("ZZZsuggArtistLike2")
        await preference.addLike(user1.id, songs1[0].id)
        var user2 = await users.validateToken(token2)
        await preference.addLike(user2.id, songs1[0].id)
        await preference.addLike(user2.id, songs2[0].id)
        var result = await suggest.songFromLikes(user1.id);
        assert.equal(result[0].id, songs2[0].id);
    })
    it('should ignore liked songs of the user', async function(){
        var token1 = await users.add("usernameSugg4", "password")
        var token2 = await users.add("usernameSugg5", "password")
        await admin.addSong(["ZZZsuggArtist1"], "ZZZsuggSong1")
        var songsOfArtist = await find.songsFromArtist("ZZZsuggArtist1")
        var user1 = await users.validateToken(token1)
        await preference.addLike(user1.id, songsOfArtist[0].id)
        var user2 = await users.validateToken(token2)
        await preference.addLike(user2.id, songsOfArtist[0].id)
        var results = await suggest.songFromLikes(user1.id);
        var songs = []
        for(result of results){
          songs.push(result.id)
        }
        expect(songs).not.to.include(songsOfArtist[0].id);
    })
    it('should ignore disliked songs of the user', async function(){
        var token1 = await users.add("usernameSugg6", "password")
        var token2 = await users.add("usernameSugg7", "password")
        var user1 = await users.validateToken(token1)
        await admin.addSong(["ZZZsuggArtist2"], "ZZZsuggSong0")
        await admin.addSong(["ZZZsuggArtist3"], "ZZZsuggSong1")
        var songsOfArtist1 = await find.songsFromArtist("ZZZsuggArtist2")
        var songsOfArtist2 = await find.songsFromArtist("ZZZsuggArtist3")
        await preference.addLike(user1.id, songsOfArtist1[0].id)
        await preference.addDislike(user1.id, songsOfArtist2[0].id)
        var user2 = await users.validateToken(token2)
        await preference.addLike(user2.id, songsOfArtist1[0].id)
        await preference.addLike(user2.id, songsOfArtist2[0].id)
        var results = await suggest.songFromLikes(user1.id);
        var songs = []
        for(result of results){
          songs.push(result.id)
        }
        expect(songs).not.to.include(songsOfArtist2[0].id);
    })
  });
  describe('artists to follow', function(){
    it('should rejects if the user_id is undefined (e.g. user is not logged in)', function(){
        return suggest.artistFromFollow(undefined).should.be.rejected;
    })
    it('should fullfill if the user_id is correct', async function(){
        var token = await users.add("usernameSuggFollow0", "password")
        var user = await users.validateToken(token)
        return suggest.artistFromFollow(user.id).should.be.fulfilled;
    })
    it('should return suggestions even when an user has no follows', async function(){
        var token = await users.add("usernameSuggFollow1", "password")
        var user = await users.validateToken(token)
        var result = await suggest.artistFromFollow(user.id);
        assert.isOk(result.length>0);
    })
    it('should give the most followed artist (counted with multiplicity) as the first suggestion', async function(){
        var token1 = await users.add("usernameSuggFollow2", "password")
        var token2 = await users.add("usernameSuggFollow3", "password")
        var user1 = await users.validateToken(token1)
        await admin.addSong(["ZZZsuggArtistFollow11"], "ZZZsuggSong0")
        await admin.addSong(["ZZZsuggArtistFollow12"], "ZZZsuggSong1")
        var artists = await find.artistStartWith("ZZZsuggArtistFollow1",0,2)
        await preferenceArtist.addFollow(user1.id, artists[0].id)
        var user2 = await users.validateToken(token2)
        await preferenceArtist.addFollow(user2.id, artists[0].id)
        await preferenceArtist.addFollow(user2.id, artists[1].id)
        var result = await suggest.artistFromFollow(user1.id);
        assert.equal(result[0].id, artists[1].id);
    })
    it('should ignore follows of the user', async function(){
        var token1 = await users.add("usernameSuggFollow4", "password")
        var token2 = await users.add("usernameSuggFollow5", "password")
        await admin.addSong(["ZZZsuggArtistFollow23"], "ZZZsuggSongFollow1")
        var artists = await find.artistStartWith("ZZZsuggArtistFollow2",0,2)
        var user1 = await users.validateToken(token1)
        await preferenceArtist.addFollow(user1.id, artists[0].id)
        var user2 = await users.validateToken(token2)
        await preferenceArtist.addFollow(user2.id, artists[0].id)
        var results = await suggest.artistFromFollow(user1.id);
        var artists = []
        for(result of results){
          artists.push(result.id)
        }
        expect(artists).not.to.include(artists[0].id);
    })
  });
});

