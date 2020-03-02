// Chai-as-promised is imported in order to test the promises.
var chai = require('chai');
var chaiAsPromised = require("chai-as-promised");
chai.should();
chai.use(chaiAsPromised);
var assert = chai.assert;

const search = require("../server/search");


describe('Search', function() {
    describe('Fullfill or reject', function(){
        it('should reject when the searchterm is undefined', function(){
            return search.search(undefined,0,1).should.be.rejected
        })
        it('should fulfill if the searchterm contains an %', function(){
            return search.search("some%",0,10).should.be.fulfilled
        })
        it('should fulfill if the searchterm contains an \"', function(){
            return search.search('some"',0,10).should.be.fulfilled
        })
        it('should fulfill if the searchterm contains an \'', function(){
            return search.search("some'",0,10).should.be.fulfilled
        })
    });
    describe('Exact results', function(){ 
        it('should return artist-song result first when the search term is complete (with -)', async function(){
            results = await search.search("Metallica - One",0,1)
            assert.equal(results[0].name_artist + " - " + results[0].name_song, "Metallica - One")
        })     
        it('should return artist-song result first when the search term is complete (without -)', async function(){
            results = await search.search("Metallica One",0,1)
            assert.equal(results[0].name_artist + " - " + results[0].name_song, "Metallica - One")
        })     
        it('should return artist result first when searching for an artist', async function(){
            results = await search.search("Metallica",0,1)
            assert.isOk(!results[0].hasOwnProperty("name_song"))
        })   
        it('should return a song result first when searching for a song', async function(){
            results = await search.search("City of Angels",0,1)
            assert.isOk(results[0].hasOwnProperty("name_song"))
        })         
    });
    describe('Non-exact results', function(){     
        it('should return artist result first when searching for an artist', async function(){
            results = await search.search("of",0,1)
            assert.isOk(!results[0].hasOwnProperty("name_song"))
        })   
        it('should return a song result first when searching for a song', async function(){
            results = await search.search("The Unforgiv",0,1)
            assert.isOk(results[0].hasOwnProperty("name_song"))
        })  
        it('should return a result when the search term is part of a artist-song',async function(){
            results = await search.search("This Moment - Black W",0,1)
            assert.isOk(results.length>0)
        })
    });
    describe('Other searching tests', function(){
        it('should be case-insensitive', async function(){
            results = await search.search("sUM 41",0,1)
            assert.equal(results[0].name_artist,"Sum 41")
        })
        it('should return at most 20 results', async function(){
            results = await search.search("of the",0,20)
            assert.equal(results.length,20)
        })
        it('should return an empty list when there is no result', async function(){
            results = await search.search("Gibberish12213414",0,20)
            assert.equal(results.length,0)
        })
    });
});
