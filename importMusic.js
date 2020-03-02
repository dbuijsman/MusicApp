var fs = require('fs');
var path = require('path');

const admin = require('./admin')

var filePath = path.join(__dirname, 'music.txt');
var data = loadFile(filePath);
initialize(data);

async function loadFile(filePath){
    var lines = fs.readFileSync(filePath, 'utf8');
    return lines;
};


// For every line, it will add the data into the database.
// The data will contain artist (with featured artist), name of the song and coupling them together.
// The counter is used to print the progress of the initialization.
async function initialize(data){
    try{
        counter = 0
        JSON.stringify(eval('music = (' + data + ')'));
        for(var discographyArtist of music){
            //var arrayArtists_id = [];
            var artists = discographyArtist.artist.split(" ft. ");
            for(const song of discographyArtist.songs){
                await admin.addSong(artists, song)
            }
            counter++;
            console.log(Math.floor(counter/music.length*100) + "%")
        }
    }catch (err) {
        console.log("Failed to initialize due to error: " + err)
    }
};
