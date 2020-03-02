// Chai-as-promised is imported in order to test the promises.
var chai = require('chai');
var chaiAsPromised = require("chai-as-promised");
chai.should();
chai.use(chaiAsPromised);
var expect = chai.expect;
var assert = chai.assert;

const mariadb = require('mariadb');
const preference = require("../server/preferenceSong");
const users = require("../server/userData");

async function clearFakePreferences(){
    let connection;
    // Creates a connection that can delete data from the users table.
    await mariadb.createConnection({
      host: 'localhost',
      user: 'test',
      password: 'testing...',
      database: 'music'
    })
    .then(conn => {
      connection = conn;
      username = connection.escape("UsernamePrefSong%")
      console.log("Deleting...")
      var removeUser = "DELETE FROM users WHERE username LIKE " + username + ";"
      return connection.query(removeUser)
    })
    .catch(error =>{
      console.log(error)
    })
    .finally(() =>{
      console.log("Deleted!")
      connection.end()
    })
  };

describe('PreferenceSong', function() {
  after(async function(){
    await clearFakePreferences()
  })
  describe('Add a new like', function(){
    it('should rejects if an user_id is undefined (e.g. user is not logged in)', function(){
      return preference.addLike(undefined, 1).should.be.rejected;
    })
    it('should reject if a song doesn\'t exist', async function(){
      var token = await users.add("UsernamePrefSongLikeAdd0", "password")
      var user = await users.validateToken(token)
      return await preference.addLike(user.id, 0).should.be.rejected;
    })
    it('should fullfill if a song exists', async function(){
      var token = await users.add("UsernamePrefSongLikeAdd1", "password")
      var user = await users.validateToken(token)
      return await preference.addLike(user.id, 1).should.be.fulfilled;
    })
    it('should give all the liked songs', async function(){
      var token = await users.add("UsernamePrefSongLikeAdd2", "password")
      var user = await users.validateToken(token)
      await preference.addLike(user.id, 2);
      await preference.addLike(user.id, 3);
      results = await preference.getLikes(user.id,0,10)
      assert.equal(results.length,2)
    })
    // Based on hard coded input. Song with id 12 has 2 artists.
    it('should return multiple artists for a collaboration', async function(){
      var token = await users.add("UsernamePrefSongLikeAdd5", "password")
      var user = await users.validateToken(token)
      await preference.addLike(user.id, 12);
      results = await preference.getLikes(user.id,0,10)
      assert.equal(results.length,2)
    })
    it('should remove a dislike when the songs gets liked', async function(){
      var token = await users.add("UsernamePrefSongLikeAdd6", "password")
      var user = await users.validateToken(token)
      await preference.addDislike(user.id, 13);
      await preference.addLike(user.id, 13);
      results = await preference.getDislikes(user.id,0,10)
      assert.equal(results.length,0)
    })
  });
  
  describe('Get likes', function(){
    it('should reject if the user_id is undefined', function(){
      return preference.getLikes(undefined, 0, 10).should.be.rejected;
    })
    it('should fulfill if the user_id is correct', async function(){
      var token = await users.add("UsernamePrefSongLikeGet0", "password")
      var user = await users.validateToken(token)
      return preference.getLikes(user.id, 0, 10).should.be.fulfilled;
    })
    it('should give an empty set if an user has no liked songs', async function(){
      var token = await users.add("UsernamePrefSongLikeGet1", "password")
      var user = await users.validateToken(token)
      var results = await preference.getLikes(user.id, 0, 10);
      assert.equal(results.length,0)
    })
    it('should return a result if an user has a liked song', async function(){
      var token = await users.add("UsernamePrefSongLikeGet2", "password")
      var user = await users.validateToken(token)
      await preference.addLike(user.id, 127);
      var results = await preference.getLikes(user.id, 0, 10)
      assert.equal(results.length,1)
    })
  })

  describe('Remove likes', function(){
    it('should rejects if the user_id is undefined (e.g. user is not logged in)', function(){
      return preference.removeLike(undefined, 1).should.be.rejected;
    })
    it('should fullfill if a song exists', async function(){
      var token = await users.add("UsernamePrefSongLikeRemove1", "password")
      var user = await users.validateToken(token)
      await preference.addLike(user.id, 1);
      return await preference.removeLike(user.id, 1).should.be.fulfilled;
    })
    it('should delete the requested song from the likes of an user', async function(){
      var token = await users.add("UsernamePrefSongLikeRemove2", "password")
      var user = await users.validateToken(token)
      await preference.addLike(user.id, 2);
      await preference.removeLike(user.id, 2);
      var result = await preference.getLikes(user.id, 0, 10);
      assert.equal(result.length,0)
    })
    it('should delete the requested song from the likes of an user, but no other song', async function(){
      var token = await users.add("UsernamePrefSongLikeRemove3", "password")
      var user = await users.validateToken(token)
      await preference.addLike(user.id, 865);
      await preference.addLike(user.id, 347);
      await preference.removeLike(user.id, 865);
      var result = await preference.getLikes(user.id, 0, 10);
      assert.equal(result[0].id,347)
    })
    it('should not delete the requested song from the likes of another user', async function(){
      var token1 = await users.add("UsernamePrefSongLikeRemove5", "password")
      var token2 = await users.add("UsernamePrefSongLikeRemove6", "password")
      var user1 = await users.validateToken(token1)
      var user2 = await users.validateToken(token2)
      await preference.addLike(user1.id, 300);
      await preference.addLike(user2.id, 300);
      await preference.removeLike(user1.id, 300);
      var result = await preference.getLikes(user2.id, 0, 10);
      assert.equal(result.length,1)
    })
  })

  describe('Add a new dislike', function(){
    it('should rejects if an user_id is undefined (e.g. user is not logged in)', function(){
      return preference.addDislike(undefined, 1).should.be.rejected;
    })
    it('should reject if a song doesn\'t exist', async function(){
      var token = await users.add("UsernamePrefSongDislikeAdd0", "password")
      var user = await users.validateToken(token)
      return await preference.addDislike(user.id, 0).should.be.rejected;
    })
    it('should fullfill if a song exists', async function(){
      var token = await users.add("UsernamePrefSongDislikeAdd1", "password")
      var user = await users.validateToken(token)
      return await preference.addDislike(user.id, 1).should.be.fulfilled;
    })
    it('should give only the disliked songs', async function(){
      var token = await users.add("UsernamePrefSongDislikeAdd2", "password")
      var user = await users.validateToken(token)
      await preference.addDislike(user.id, 546);
      await preference.addDislike(user.id, 846);
      results = await preference.getDislikes(user.id,0,10)
      assert.equal(results.length,2)
    })
    // Based on hard coded input. The song with id 12 has 2 artists.
    it('should return multiple artists for a collaboration', async function(){
      var token = await users.add("UsernamePrefSongDislikeAdd5", "password")
      var user = await users.validateToken(token)
      await preference.addDislike(user.id, 12);
      results = await preference.getDislikes(user.id,0,10)
      assert.equal(results.length,2)
    })
    it('should remove a like when the songs gets disliked', async function(){
      var token = await users.add("UsernamePrefSongDislikeAdd6", "password")
      var user = await users.validateToken(token)
      await preference.addLike(user.id, 1000);
      await preference.addDislike(user.id, 1000);
      results = await preference.getLikes(user.id,0,10)
      assert.equal(results.length,0)
    })
  });
  
  describe('Get dislikes', function(){
    it('should reject if the user_id is undefined', function(){
      return preference.getDislikes(undefined, 0, 10).should.be.rejected;
    })
    it('should fulfill if the user_id is correct', async function(){
      var token = await users.add("UsernamePrefSongDislikeGet0", "password")
      var user = await users.validateToken(token)
      return preference.getDislikes(user.id, 0, 10).should.be.fulfilled;
    })
    it('should give an empty set if an user has no disliked songs', async function(){
      var token = await users.add("UsernamePrefSongDislikeGet1", "password")
      var user = await users.validateToken(token)
      var results = await preference.getDislikes(user.id, 0, 10);
      assert.equal(results.length,0)
    })
    it('should return a result if an user has a disliked song', async function(){
      var token = await users.add("UsernamePrefSongDislikeGet2", "password")
      var user = await users.validateToken(token)
      await preference.addDislike(user.id, 388);
      var results = await preference.getDislikes(user.id, 0, 10)
      assert.equal(results.length,1)
    })
  })

  describe('Remove dislikes', function(){
    it('should rejects if the user_id is undefined (e.g. user is not logged in)', function(){
      return preference.removeDislike(undefined, 1).should.be.rejected;
    })
    it('should fullfill if a song exists', async function(){
      var token = await users.add("UsernamePrefSongDislikeRemove1", "password")
      var user = await users.validateToken(token)
      await preference.addDislike(user.id, 1);
      return await preference.removeDislike(user.id, 1).should.be.fulfilled;
    })
    it('should delete the requested song from the dislikes of an user', async function(){
      var token = await users.add("UsernamePrefSongDislikeRemove2", "password")
      var user = await users.validateToken(token)
      await preference.addDislike(user.id, 766);
      await preference.removeDislike(user.id, 766);
      var result = await preference.getDislikes(user.id, 0, 10);
      assert.equal(result.length,0)
    })
    it('should delete the requested song from the dislikes of an user, but no other song', async function(){
      var token = await users.add("UsernamePrefSongDislikeRemove3", "password")
      var user = await users.validateToken(token)
      await preference.addDislike(user.id, 876);
      await preference.addDislike(user.id, 456);
      await preference.removeDislike(user.id, 876);
      var result = await preference.getDislikes(user.id, 0, 10);
      assert.equal(result[0].id,456)
    })
    it('should not delete the requested song from the dislikes of another user', async function(){
      var token1 = await users.add("UsernamePrefSongDislikeRemove5", "password")
      var token2 = await users.add("UsernamePrefSongDislikeRemove6", "password")
      var user1 = await users.validateToken(token1)
      var user2 = await users.validateToken(token2)
      await preference.addDislike(user1.id, 709);
      await preference.addDislike(user2.id, 709);
      await preference.removeDislike(user1.id, 709);
      var result = await preference.getDislikes(user2.id, 0, 10);
      assert.equal(result.length,1)
    })
  })
});

