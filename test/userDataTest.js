// Chai-as-promised is imported in order to test the promises.
var chai = require('chai');
var chaiAsPromised = require("chai-as-promised");
chai.should();
chai.use(chaiAsPromised);
var expect = chai.expect;
var assert = chai.assert;

const mariadb = require('mariadb');
const jwt = require('jsonwebtoken')
const users = require("../server/userData");

// This function will delete the test entries in the users database

async function clearFakeUsers(){
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
    username = connection.escape("usernameData%")
    var remove = "DELETE FROM users WHERE username LIKE " + username + ";"
    return connection.query(remove)
  })
  .catch(error =>{
    console.log(error)
  })
  .finally(() =>{
    connection.end()
  })
};
describe('Users', function() {
  after(async function() {
    await clearFakeUsers();
    //process.exit(0);
  })
  describe('Add new user', function() {
    it('should throw an error when the username is missing', function() {
      return users.add("","password").should.be.rejectedWith(400);
    });
    it('should throw an error when the pasword is missing', function() {
      return users.add("usernameData0","").should.be.rejectedWith(400);
    });
    it('should fulfill the add promise when all data is entered with an non-existing username', function(){
      return users.add("usernameDataAdd1","password").should.be.fulfilled;
    })
    it('should reject when a new user chooses an existing username', async function(){
      await users.add("usernameDataAdd2","password1")
      return await users.add("usernameDataAdd2","password2").should.be.rejected;
    })
    it('should fullfill if an username contains &', function(){
      return users.add("usernameData&Password", "password").should.be.fulfilled;
    })
  });

  describe('Verify user', function() {
    it('should reject when the username is missing', function() {
      return users.verify(undefined,"pass").should.be.rejectedWith(400);
    });
    it('should reject when the password is missing', function() {
      return users.verify("usernameData0",undefined).should.be.rejectedWith(400);
    });
    it('should verify the newly added user', async function() {
      await users.add("usernameDataVer3","password")
      return await users.verify("usernameDataVer3", "password").should.be.fulfilled;
    })
    it('should reject if password is wrong', async function() {
      await users.add("usernameDataVer4","password")
      return users.verify("usernameDataVer4", "passwordWrong").should.be.rejected;
    })
    it('should reject if username don\'t exist', function() {
      return users.verify("usernameDataVer5", "password").should.be.rejectedWith(401);
    })
  });
  describe('FindUserID', function(){
    it('should reject if token is undefined', function(){
      return users.validateToken(undefined).should.be.rejected;
    })
    // This test depends on a token that is generated in this file. If test fails, please check the code below.
    it('should reject if token is expired (THIS TEST DEPENDS ON HARD CODED GENERATED TOKEN!)', async function(){
      await users.add("usernameDataFind0","password");
      var token = createToken("usernameDataFind0",0)
      return users.validateToken(token).should.be.rejected;
    })
    // This test depends on a token that is generated in this file. If test fails, please check the code below.
    it('should fulfill if token is valid (THIS TEST DEPENDS ON HARD CODED GENERATED TOKEN!)', async function(){
      await users.add("usernameDataFind1","password");
      var token = createToken("usernameDataFind1",100)
      return users.validateToken(token).should.be.fulfilled;
    })
  })
});


// Code below is only for testing.
var key = "WlAye5L1uzZq61p41A6PyhpBxsnklABk6FPAOeOXUwqWuouUEvTG8Apqkqo1uloZ";
function createToken(username, expires){
    var data = {
        username: username,
        previousLogin: Date.now(),
        timestamp: Date.now()
    }
    var signature = key;
    var expires = expires + "s";
    return jwt.sign({ data, }, signature, {expiresIn: expires})
}

