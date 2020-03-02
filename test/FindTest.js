// Chai-as-promised is imported in order to test the promises.
var chai = require('chai');
var chaiAsPromised = require("chai-as-promised");
chai.should();
chai.use(chaiAsPromised);
var expect = chai.expect;
var assert = chai.assert;

const find = require("../server/find");


describe('Find', function() {
  describe('Find artists', function(){
    // Testing first letter
    it('should fulfill if first letter is undefined', function() {
      return find.artistStartWith(undefined,0,10).should.be.fulfilled;
    })
    it('should fulfill when first letter contains " ', function() {
      return find.artistStartWith("\"",0,10).should.be.fulfilled;
    })
    // Depends on hard coded name (Bad Meets Evil which is in the first 100 results of B)
    it('should find Bad Meets Evil when looking for B', async function() {
      var names = []
      var results = await find.artistStartWith("B",0,100);
      for(var result of results){
        names.push(result.name_artist)
      }
      expect(names).to.include("Bad Meets Evil");
    })
    // Depends on hard coded name (3 Doors Down which is in the first 100 results of numbers)
    it('should find 3 Doors Down when looking for numbers', async function() {
      var names = []
      var results = await find.artistStartWith("0-9",0,100);
      for(var result of results){
        names.push(result.name_artist)
      }
      expect(names).to.include("3 Doors Down");
    })

    // Testing start
    it('should fulfill if start is undefined', function() {
      return find.artistStartWith("A",undefined,10).should.be.fulfilled;
    })
    it('should reject when start is NaN ', function() {
      return find.artistStartWith("A",0, "S").should.be.rejected;
    })
    it('should reject when start contains " ', function() {
      return find.artistStartWith("A", "1\"0", 20).should.be.rejected;
    })
    // Depends on hard coded name (D12 which is the first entry after initialization for the letter D. This will probably not change)
    it('should find D12 as first entry when start is undefined', async function() {
      var results = await find.artistStartWith("D",undefined,10);
      assert.equal(results[0].name_artist, "D12");
    })
    it('should reject if start < 0', function() {
      return find.artistStartWith("A",-1,10).should.be.rejected;
    })
    it('should fulfill if start = 0', function() {
      return find.artistStartWith("A",0,10).should.be.fulfilled;
    })
    it('should fulfill if start > 0', function() {
      return find.artistStartWith("A",10,30).should.be.fulfilled;
    })
    it('should give no results if start is bigger then the total amount of results', async function() {
      var results = await find.artistStartWith("X",10000,10);
      assert.equal(results.length, 0);
    })

    // Testing max
    it('should give 20 results if max is undefined', async function() {
      var results = await find.artistStartWith("S",0,undefined);
      assert.equal(results.length,20);
    })
    it('should reject when max is NaN ', async function() {
      return find.artistStartWith("A",0, "S").should.be.rejected;
    })
    it('should reject when max contains " ', async function() {
      return find.artistStartWith("A",0, "1\"0").should.be.rejected;
    })
    it('should reject if max < 0', function() {
      return find.artistStartWith("A",1,-1).should.be.rejected;
    })
    it('should fulfill if max = 0', function() {
      return find.artistStartWith("A",0,0).should.be.fulfilled;
    })
    it('should give no results if max = 0', async function() {
      var results = await find.artistStartWith("E",0,0);
      assert.equal(results.length, 0);
    })
    it('should fulfill if max > 0', function() {
      return find.artistStartWith("A",10,10).should.be.fulfilled;
    })
    it('should limit the number of results by max', async function() {
      var results = await find.artistStartWith("E",0,3);
      assert.equal(results.length, 3);
    })
  });

  describe('Find songs of an artist', function(){
    it('should return empty set if an artist can\'t be found', async function(){
      var results = await find.songsFromArtist("NOT EXISTING ARTIST",0,10);
      assert.equal(results.length,0)
    })
    it('should return empty set when the artist is undefined', async function(){
      var results = await find.songsFromArtist(undefined,0,10);
      assert.equal(results.length,0)
    })
    // Depends on hard coded name (Sum 41 which has multiple songs)
    it('should find songs for an existing artist', async function(){
      var results = await find.songsFromArtist("Sum 41",0,10);
      assert.isOk(results.length > 1, "It should find multiple songs for Sum 41")
    })
    // Depends on hard coded name (Guns N' Roses which contains ')
    it('should find songs when the artist name contains \'', async function() {
      results = await find.songsFromArtist("Guns N' Roses",0,10);
      assert.isOk(results.length > 0, "It should find the songs for Guns N' Roses")
    })
    // Depends on hard coded name (Gamper & Dadoni which contains &)
    it('should find songs when the artist name contains &', async function() {
      results = await find.songsFromArtist("Gamper & Dadoni",0,10);
      assert.isOk(results.length > 0, "It should find the songs for Gamper & Dadoni")
    })
    // Depends on hard coded name (Lost Frequencies which has multiple collaborations)
    it('should also give artists that collaborated', async function(){
      var names = [];
      var results = await find.songsFromArtist("Lost Frequencies",0,10);
      for(var result of results){
        names.push(result.name_artist)
      }
      assert.isOk(names.length > 1, "It should find multiple artists for Lost Frequencies")
    })
    // Depends on hard coded name (Lost Frequencies which has made the song 'Crazy' together with Zonderling)
    it('should find original artist at collaborations', async function(){
      var names = [];
      var results = await find.songsFromArtist("Lost Frequencies",0,10);
      for(var result of results){
        if(result.name_song === "Crazy"){
          names.push(result.name_artist)
        }
      }
      expect(names).to.include("Lost Frequencies");
    })
    // Depends on hard coded name (Three Days Grace and Hinder have both made a song called 'Without You')
    it('should not find an artist that has made a different song with the same name', async function(){
      var names = [];
      var results = await find.songsFromArtist("Hinder",0,10);
      for(var result of results){
        if(result.name_song === "Without You"){
          names.push(result.name_artist)
        }
      }
      expect(names).to.not.include("Three Days Grace");
    })
  })
});
