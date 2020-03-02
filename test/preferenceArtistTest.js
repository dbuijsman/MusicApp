// Chai-as-promised is imported in order to test the promises.
var chai = require('chai');
var chaiAsPromised = require("chai-as-promised");
chai.should();
chai.use(chaiAsPromised);
var expect = chai.expect;
var assert = chai.assert;

const mariadb = require('mariadb');
const find = require("../server/find");
const preferenceArtist = require("../server/preferenceArtist");
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
      username = connection.escape("usernamePrefArtist%")
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

describe('PreferenceArtist', function() {
  after(async function(){
    await clearFakePreferences()
  }) 
  describe('Add a new artist to follow', function(){
      // Based on hard coded input.
    it('should rejects if the user_id is undefined (e.g. user is not logged in)', function(){
      return preferenceArtist.addFollow(undefined, 1).should.be.rejected;
    })
    it('should reject if an artist don\'t exist', async function(){
      var token = await users.add("UsernamePrefArtistAdd0", "password")
      var user = await users.validateToken(token)
      return await preferenceArtist.addFollow(user.id, 0).should.be.rejected;
    })
    // Based on hard coded input.
    it('should fullfill if an artist exists', async function(){
      var token = await users.add("UsernamePrefArtistAdd1", "password")
      var user = await users.validateToken(token)
      return await preferenceArtist.addFollow(user.id, 2).should.be.fulfilled;
    })
    // Based on hard coded input.
    it('should give only the liked artists', async function(){
      var token = await users.add("UsernamePrefArtistAdd2", "password")
      var user = await users.validateToken(token)
      await preferenceArtist.addFollow(user.id, 10);
      await preferenceArtist.addFollow(user.id, 11);
      results = await preferenceArtist.getFollow(user.id,0,10)
      assert.equal(results.length,2)
    })
    // Based on hard coded input.
    it('should return the right artist', async function(){
      var token = await users.add("UsernamePrefArtistAdd3", "password")
      var user = await users.validateToken(token)
      await preferenceArtist.addFollow(user.id, 10);
      results = await preferenceArtist.getFollow(user.id,0,10)
      assert.equal(results[0].id,10)
    })
  });

  describe('Get following artists', function(){
    it('should reject if the user_id is undefined', async function(){
      return preferenceArtist.getFollow(undefined, 0, 10).should.be.rejected;
    })
    it('should fulfill if the user_id is correct', async function(){
      var token = await users.add("UsernamePrefArtistGet0", "password")
      var user = await users.validateToken(token)
      return preferenceArtist.getFollow(user.id, 0, 10).should.be.fulfilled;
    })
    it('should give an empty set if an user has no artists to follow', async function(){
      var token = await users.add("UsernamePrefArtistGet1", "password")
      var user = await users.validateToken(token)
      var results = await preferenceArtist.getFollow(user.id, 0, 10);
      assert.equal(results.length,0)
    })
    it('should return a result if an user follows an artist', async function(){
      var token = await users.add("UsernamePrefArtistGet2", "password")
      var user = await users.validateToken(token)
      await preferenceArtist.addFollow(user.id, 20);
      var results = await preferenceArtist.getFollow(user.id, 0, 10)
      assert.equal(results.length,1)
    })
  })

  describe('Remove artists to follow', function(){
    it('should rejects if the user_id is undefined (e.g. user is not logged in)', function(){
      return preferenceArtist.removeFollow(undefined, 7).should.be.rejected;
    })
    it('should fullfill if an artist exists', async function(){
      var token = await users.add("UsernamePrefArtistDelete1", "password")
      var user = await users.validateToken(token)
      await preferenceArtist.addFollow(user.id, 11);
      return await preferenceArtist.removeFollow(user.id, 11).should.be.fulfilled;
    })
    it('should delete the requested artist from the followed artists by an user', async function(){
      var token = await users.add("UsernamePrefArtistDelete2", "password")
      var user = await users.validateToken(token)
      await preferenceArtist.addFollow(user.id, 31);
      await preferenceArtist.removeFollow(user.id, 31);
      var result = await preferenceArtist.getFollow(user.id, 0, 10);
      assert.equal(result.length,0)
    })
    it('should delete the requested artist from the followed artists by an user, but no other artist', async function(){
      var token = await users.add("UsernamePrefArtistDelete3", "password")
      var user = await users.validateToken(token)
      await preferenceArtist.addFollow(user.id, 42);
      await preferenceArtist.addFollow(user.id, 12);
      await preferenceArtist.removeFollow(user.id, 42);
      var result = await preferenceArtist.getFollow(user.id, 0, 10);
      assert.equal(result[0].id,12)
    })
    it('should not delete the requested artist from the followed artists by another user', async function(){
      var token1 = await users.add("UsernamePrefArtistDelete5", "password")
      var token2 = await users.add("UsernamePrefArtistDelete6", "password")
      var user1 = await users.validateToken(token1)
      var user2 = await users.validateToken(token2)
      await preferenceArtist.addFollow(user1.id, 45);
      await preferenceArtist.addFollow(user2.id, 45);
      await preferenceArtist.removeFollow(user1.id, 45);
      var result = await preferenceArtist.getFollow(user2.id, 0, 10);
      assert.equal(result.length,1)
    })
  })
  
  describe('Get following artists from a selection', function(){
    it('should fulfill if the user_id is undefined', async function(){
        var result = await find.artistStartWith("Z",0,1)
        return preferenceArtist.getFollowFromSelection(undefined, result).should.be.fulfilled;
    })
    it('should fulfill if the user_id is correct', async function(){
        var result = await find.artistStartWith("Z",0,1)
        var token = await users.add("UsernamePrefArtistGetSel0", "password")
        var user = await users.validateToken(token)
        return preferenceArtist.getFollowFromSelection(user.id, result).should.be.fulfilled;
    })
    it('should fulfill if no artists are given', async function(){
        var result = await find.artistStartWith("ZZZZZZZ",0,0)
        var token = await users.add("UsernamePrefArtistGetSel1", "password")
        var user = await users.validateToken(token)
        return preferenceArtist.getFollowFromSelection(user.id, result).should.be.fulfilled;
    })
    it('should give an empty set if an user has no artists to follow', async function(){
        var result = await find.artistStartWith("S",0,10)
        var token = await users.add("UsernamePrefArtistGetSel2", "password")
        var user = await users.validateToken(token)
        var results = await preferenceArtist.getFollowFromSelection(user.id, result);
        assert.equal(results.length,0)
    })
    it('should return a result if an user follows an artist that is given', async function(){
        var result = await find.artistStartWith("D",0,10)
        var token = await users.add("UsernamePrefArtistGetSel3", "password")
        var user = await users.validateToken(token)
        await preferenceArtist.addFollow(user.id, result[0].id);
        var results = await preferenceArtist.getFollowFromSelection(user.id, result)
        assert.equal(results.length,1)
    })
    it('should return an empty set if none of the artists that are given are followed by the user', async function(){
        var result = await find.artistStartWith("D",0,1)
        var token = await users.add("UsernamePrefArtistGetSel4", "password")
        var user = await users.validateToken(token)
        await preferenceArtist.addFollow(user.id, result[0].id-1);
        var results = await preferenceArtist.getFollowFromSelection(user.id, result)
        assert.equal(results.length,0)
    })
  })
});

