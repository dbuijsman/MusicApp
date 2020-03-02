const express = require('express');

const adminAdd = require("./server/admin/adminAdd")
const adminAddSpotify = require("./server/admin/adminFindSpotify")
const adminUpdateSpotify = require("./server/admin/adminUpdateSpotify");
const find = require("./server/find");
const notify = require("./server/notify");
const preferenceArtist = require("./server/preferenceArtist");
const preferenceSong = require("./server/preferenceSong");
const search = require("./server/search");
const suggest = require("./server/suggest");
const users = require("./server/userData");

const app = express();
app.use(express.static('client'));
app.use(express.json());

// This api will be called when somebody wants to sign up.
// If succesfull, it returns a JSON webtoken that will be used in future verifications.
app.post("/api/signup", function (request, response) {
    const newUser = request.body;
    // The usernames "username_" will be used for tests.
    if(newUser.username.toLowerCase().indexOf("username") === 0 ){
        response.sendStatus(422);
    } else {
        users.add(newUser.username, newUser.password)
        .then(token => {
            response.statusMessage = token;
            response.status(200).end();
        })
        .catch(error =>{
            response.sendStatus(errorToStatus(error));
        })
    }
});

// This api will be called when somebody wants to login. 
// If succesfull, it returns a JSON webtoken that will be used in future verifications.
app.post("/api/login", function (request, response){
    const login = request.body;
    users.verify(login.username, login.password)
    .then(token => {
        response.statusMessage = token;
        response.status(200).end();
    })
    .catch(error => {
        response.sendStatus(errorToStatus(error));
    })
});

// This api checks if an user is logged in.
app.get("/api/validate", function(request, response){
    if(!request.get("cookie") || request.get("cookie").indexOf("token")===-1){
        response.sendStatus(401);
    } else {
        token = getToken(request.get("cookie"))
        users.validateToken(token, true)
        .then(result => {
            response.statusMessage = JSON.stringify({"username": result.username, "role": result.role});
            response.status(200).end();
        })
        .catch(error => {
            response.sendStatus(errorToStatus(error));
        })
    }
})

// This api returns a list of artist that start with a given letter.
app.get("/api/artists/:firstLetter", async function (request, response) {
    let user_id;
    if(request.get("cookie") && request.get("cookie").indexOf("token")!==-1){
        token = getToken(request.get("cookie"))
        user = await users.validateToken(token)
        user_id=user.id
    }
    var firstLetter = request.params.firstLetter;
    if(firstLetter==="undefined"){
        firstLetter=undefined
    }
    var start = request.query.start;
    var max = request.query.max;
    if(!max && max !== 0){
        max=20;
    }
    find.artistStartWith(firstLetter, start, max+1)
    .then(results =>{
        return connectingDataAndAddPreferences(user_id, results)
    })
    .then(data => {
        response.json(addHasNextResult(data, max))
    })
    .catch(error => {
        response.sendStatus(errorToStatus(error));
    });
});

// This api returns all songs made by the requested artist. 
// Collaborations are included.
app.get("/api/artist/:name", async function(request, response) {
    let user_id;
    if(request.get("cookie") && request.get("cookie").indexOf("token")!==-1){
        token = getToken(request.get("cookie"))
        user = await users.validateToken(token)
        user_id=user.id
    }
    var nameArtist = request.params.name;
    var start = request.query.start;
    var max = request.query.max;
    if(!max && max !== 0){
        max=20;
    }
    find.songsFromArtist(nameArtist,start,max+1)
    .then(data => {
        return connectingDataAndAddPreferences(user_id, data)
    })
    .then(data => {
        response.json(addHasNextResult(data, max))
    })
    .catch(error => {
        response.sendStatus(errorToStatus(error));
    })
})

// This api returns the most popular songs based on likes and dislikes. 
app.get("/api/popular/songs", async function(request, response) {
    let user_id;
    if(request.get("cookie") && request.get("cookie").indexOf("token")!==-1){
        token = getToken(request.get("cookie"))
        user = await users.validateToken(token)
        user_id=user.id
    }
    var start = request.query.start;
    var max = request.query.max;
    if(!max && max !== 0){
        max=20;
    }
    preferenceSong.mostPopularSongs(start,max+1)
    .then(data => {
        return connectingDataAndAddPreferences(user_id, data)
    })
    .then(data => {
        response.json(addHasNextResult(data, max))
    })
    .catch(error => {
        response.sendStatus(errorToStatus(error));
    })
})

// This api returns the most popular songs based on likes and dislikes. 
app.get("/api/popular/artists", async function(request, response) {
    let user_id;
    if(request.get("cookie") && request.get("cookie").indexOf("token")!==-1){
        token = getToken(request.get("cookie"))
        user = await users.validateToken(token)
        user_id=user.id
    }
    var start = request.query.start;
    var max = request.query.max;
    if(!max && max !== 0){
        max=20;
    }
    preferenceArtist.mostPopularArtists(start,max+1)
    .then(data => {
        return connectingDataAndAddPreferences(user_id, data)
    })
    .then(data => {
        response.json(addHasNextResult(data, max))
    })
    .catch(error => {
        response.sendStatus(errorToStatus(error));
    })
})

// This api returns all the searching results. The results contains artists and songs.
app.get("/api/search", async function(request, response) {
    let user_id;
    if(request.get("cookie") && request.get("cookie").indexOf("token")!==-1){
        token = getToken(request.get("cookie"))
        user = await users.validateToken(token)
        user_id=user.id
    }
    var searchTerm = request.query.q;
    var start = request.query.start;
    var max = request.query.max;
    if(!max && max !== 0){
        max=20;
    }
    search.search(searchTerm,start,max+1)
    .then(data => {
        return connectingDataAndAddPreferences(user_id, data)
    })
    .then(data => {
        response.json(addHasNextResult(data, max))
    })
    .catch(error => {
        response.sendStatus(errorToStatus(error));
    })
})

// This api adds a new like from an user to the database.
// Rejects if an user isn't logged in.
app.post("/api/like", function(request, response) {
    if(!request.get("cookie") || request.get("cookie").indexOf("token")===-1){
        response.sendStatus(401);
    } else if(isNaN(request.body.id)){
        response.sendStatus(400);
    } else {
        token = getToken(request.get("cookie"))
        users.validateToken(token)
        .then(user => {
            return preferenceSong.addLike(user.id, request.body.id)
        })
        .then(() => {
            response.sendStatus(200);
        })
        .catch(error => {
            response.sendStatus(errorToStatus(error));
        })
    }
})

// This api returns a collection of liked songs from an user.
// Rejects if an user isn't logged in.
app.get("/api/like", function(request, response) {
    if(!request.get("cookie") || request.get("cookie").indexOf("token")===-1){
        response.sendStatus(401);
    } else {
        token = getToken(request.get("cookie"))
        var start = request.query.start;
        var max = request.query.max;
        let user_id
        users.validateToken(token)
        .then(user => {
            user_id=user.id
            if(!max && max !== 0){
                max=20;
            }
            return preferenceSong.getLikes(user.id, start, max+1)
        })
        .then(data => {
            return connectingDataAndAddPreferences(user_id, data)
        })
        .then(data => {
            response.json(addHasNextResult(data, max))
        })
        .catch(error => {
            response.sendStatus(errorToStatus(error));
        })
    }
})

// This api removes a like from an user to the database.
// Rejects if an user isn't logged in.
app.delete("/api/like", function(request, response) {
    if(!request.get("cookie") || request.get("cookie").indexOf("token")===-1){
        response.sendStatus(401);
    } else if(isNaN(request.body.id)){
        response.sendStatus(400);
    } else {
        token = getToken(request.get("cookie"))
        users.validateToken(token)
        .then(user => {
            return preferenceSong.removeLike(user.id, request.body.id)
        })
        .then(() => {
            response.sendStatus(200);
        })
        .catch(error => {
            response.sendStatus(errorToStatus(error));
        })
    }
})

// This api adds a new dislike from an user to the database.
// Rejects if an user isn't logged in.
app.post("/api/dislike", function(request, response) {
    if(!request.get("cookie") || request.get("cookie").indexOf("token")===-1){
        response.sendStatus(401);
    } else if(isNaN(request.body.id)){
        response.sendStatus(400);
    } else {
        token = getToken(request.get("cookie"))
        users.validateToken(token)
        .then(user => {
            return preferenceSong.addDislike(user.id, request.body.id)
        })
        .then(() => {
            response.sendStatus(200);
        })
        .catch(error => {
            response.sendStatus(errorToStatus(error));
        })
    }
})

// This api returns a collection of disliked songs from an user.
// Rejects if an user isn't logged in.
app.get("/api/dislike", function(request, response) {
    if(!request.get("cookie") || request.get("cookie").indexOf("token")===-1){
        response.sendStatus(401);
    } else {
        token = getToken(request.get("cookie"))
        var start = request.query.start;
        var max = request.query.max;
        let user_id
        users.validateToken(token)
        .then(user => {
            user_id=user.id
            if(!max && max !== 0){
                max=20;
            }
            return preferenceSong.getDislikes(user.id, start, max+1)
        })
        .then(data => {
            return connectingDataAndAddPreferences(user_id, data)
        })
        .then(data => {
            response.json(addHasNextResult(data, max))
        })
        .catch(error => {
            response.sendStatus(errorToStatus(error));
        })
    }
})

// This api removes a dislike from an user to the database.
// Rejects if an user isn't logged in.
app.delete("/api/dislike", function(request, response) {
    if(!request.get("cookie") || request.get("cookie").indexOf("token")===-1){
        response.sendStatus(401);
    } else if(isNaN(request.body.id)){
        response.sendStatus(400);
    } else {
        token = getToken(request.get("cookie"))
        users.validateToken(token)
        .then(user => {
            return preferenceSong.removeDislike(user.id, request.body.id)
        })
        .then(() => {
            response.sendStatus(200);
        })
        .catch(error => {
            response.sendStatus(errorToStatus(error));
        })
    }
})

// This api adds a new followed artist from an user to the database.
// Rejects if an user isn't logged in.
app.post("/api/follow", function(request, response) {
    if(!request.get("cookie") || request.get("cookie").indexOf("token")===-1){
        response.sendStatus(401);
    } else if(isNaN(request.body.id)){
        response.sendStatus(400);
    } else {
        token = getToken(request.get("cookie"))
        users.validateToken(token)
        .then(user => {
            return preferenceArtist.addFollow(user.id, request.body.id)
        })
        .then(() => {
            response.sendStatus(200);
        })
        .catch(error => {
            response.sendStatus(errorToStatus(error));
        })
    }
})

// This api returns the followed artists from an user.
// Rejects if an user isn't logged in.
app.get("/api/follow", function(request, response) {
    if(!request.get("cookie") || request.get("cookie").indexOf("token")===-1){
        response.sendStatus(400);
    } else {
        token = getToken(request.get("cookie"))
        var start = request.query.start;
        var max = request.query.max;
        let user_id
        users.validateToken(token)
        .then(user => {
            if(!max && max !== 0){
                max=20;
            }
            user_id=user.id
            return preferenceArtist.getFollow(user_id, start, max+1)
        })
        .then(data => {
            return connectingDataAndAddPreferences(user_id,data)
        })
        .then(data => {
            response.json(addHasNextResult(data, max))
        })
        .catch(error => {
            response.sendStatus(errorToStatus(error));
        })
    }
})

// This api removes a followed artist from an user to the database.
// Rejects if an user isn't logged in.
app.delete("/api/follow", function(request, response) {
    if(!request.get("cookie") || request.get("cookie").indexOf("token")===-1){
        response.sendStatus(401);
    } else if(isNaN(request.body.id)){
        response.sendStatus(400);
    } else {
        token = getToken(request.get("cookie"))
        users.validateToken(token)
        .then(user => {
            return preferenceArtist.removeFollow(user.id, request.body.id)
        })
        .then(() => {
            response.sendStatus(200);
        })
        .catch(error => {
            response.sendStatus(errorToStatus(error));
        })
    }
})

// This api returns 20 suggestions for the user.
// Rejects if an user is not logged in.
app.get("/api/suggest/song", function(request, response) {
    if(!request.get("cookie") || request.get("cookie").indexOf("token")===-1){
        response.sendStatus(401);
    } else {
        token = getToken(request.get("cookie"))
        let user_id
        users.validateToken(token)
        .then(user => {
            user_id=user.id
            return suggest.songFromLikes(user.id)
        })
        .then(data => {
            return connectingDataAndAddPreferences(user_id, data)
        })
        .then(data => {
            response.json(data)
        })
        .catch(error => {
            response.sendStatus(errorToStatus(error));
        })
    }
})
// This api returns 20 suggestions for the user.
// Rejects if an user is not logged in.
app.get("/api/suggest/artist", function(request, response) {
    if(!request.get("cookie") || request.get("cookie").indexOf("token")===-1){
        response.sendStatus(401);
    } else {
        token = getToken(request.get("cookie"))
        let user_id
        users.validateToken(token)
        .then(user => {
            user_id=user.id
            return suggest.artistFromFollow(user_id)
        })
        .then(data => {
            return connectingDataAndAddPreferences(user_id, data)
        })
        .then(data => {
            response.json(data)
        })
        .catch(error => {
            response.sendStatus(errorToStatus(error));
        })
    }
})

// This api returns new songs released by a followed artist.
// Rejects if an user is not loged in
app.get("/api/new", function(request, response) {
    if(!request.get("cookie") || request.get("cookie").indexOf("token")===-1){
        response.sendStatus(401);
    } else {
        token = getToken(request.get("cookie"))
        var start = request.query.start;
        var max = request.query.max;
        let user_id
        users.validateToken(token)
        .then(user => {
            user_id=user.id
            if(!max && max !== 0){
                max=20;
            }
            return notify.newSongs(user.id, start, max+1)
        })
        .then(data => {
            return connectingDataAndAddPreferences(user_id, data)
        })
        .then(data => {
            response.json(addHasNextResult(data, max))
        })
        .catch(error => {
            response.sendStatus(errorToStatus(error));
        })
    }
})

app.post("/api/admin/song", function(request, response){
    if(!request.get("cookie") || request.get("cookie").indexOf("token")===-1){
        response.sendStatus(401);
    } else {
        var artists = request.body.artists;
        var song = request.body.song;
        token = getToken(request.get("cookie"))
        users.validateToken(token)
        .then(user => {
            if(user.role!=="admin"){
                throw new Error(401)
            }
            return adminAdd.addSong(artists,song)
        })
        .then(() => {
            response.sendStatus(200);
        })
        .catch(error => {
            response.sendStatus(errorToStatus(error));
        })
    }
})

app.post("/api/admin/album", function(request, response){
    if(!request.get("cookie") || request.get("cookie").indexOf("token")===-1){
        response.sendStatus(401);
    } else {
        var album = request.body.album;
        var artist = request.body.artist;
        var songs = request.body.songs;
        token = getToken(request.get("cookie"))
        users.validateToken(token)
        .then(user => {
            if(user.role!=="admin"){
                throw new Error(401)
            }
            return adminAdd.addAlbum(album,artist,songs)
        })
        .then(() => {
            response.sendStatus(200);
        })
        .catch(error => {
            response.sendStatus(errorToStatus(error));
        })
    }
})

app.post("/api/admin/source", function(request, response){
    if(!request.get("cookie") || request.get("cookie").indexOf("token")===-1){
        response.sendStatus(401);
    } else {
        var artists = request.body;
        token = getToken(request.get("cookie"))
        users.validateToken(token)
        .then(async(user) => {
            if(user.role!=="admin"){
                throw new Error(401)
            }
            var succes = []
            for(artist of artists){
                await adminAdd.addSourceArtist(artist)
                await adminUpdateSpotify.updateArtist(artist.name_artist)
                succes.push(artist)
            }
            return succes
        })
        .then(succes => {
            response.json(succes);
        })
        .catch(error => {
            response.sendStatus(errorToStatus(error));
        })
    }
})

app.get("/api/admin/artist/find", async function(request, response) {
    var searchTerm = request.query.q;
    if(!request.get("cookie") || request.get("cookie").indexOf("token")===-1){
        response.sendStatus(401);
    } else {
        token = getToken(request.get("cookie"))
        users.validateToken(token)
        .then(user => {
            if(user.role!=="admin"){
                throw new Error(401)
            }
            return adminAddSpotify.findArtists(searchTerm)
        })
        .then(data => {
            response.json(data)
        })
        .catch(error => {
            response.sendStatus(errorToStatus(error));
        })
    }
})

app.get("/api/admin/update", function(request, response){
    if(!request.get("cookie") || request.get("cookie").indexOf("token")===-1){
        response.sendStatus(401);
    } else {
        token = getToken(request.get("cookie"))
        users.validateToken(token)
        .then(user => {
            if(user.role!=="admin"){
                throw new Error(401)
            }
            return adminUpdateSpotify.updateAll()
        })
        .then(data => {
            response.json(data)
        })
        .catch(error => {
            console.log(error)
            response.sendStatus(errorToStatus(error));
        })
    }
})

app.post("/api/admin/update/artist", function(request, response){
    if(!request.get("cookie") || request.get("cookie").indexOf("token")===-1){
        response.sendStatus(401);
    } else {
        var artist = request.body.artist;
        token = getToken(request.get("cookie"))
        users.validateToken(token)
        .then(user => {
            if(user.role!=="admin"){
                throw new Error(401)
            }
            return adminUpdateSpotify.updateArtist(artist)
        })
        .then(data => {
            response.json(data)
        })
        .catch(error => {
            response.statusMessage = error.message
            var status = errorToStatus(error)
            response.sendStatus(status);
        })
    }
})
app.post("/api/admin/update/link", function(request, response){
    if(!request.get("cookie") || request.get("cookie").indexOf("token")===-1){
        response.sendStatus(401);
    } else {
        var artist = request.body.artist;
        var link = request.body.link;
        token = getToken(request.get("cookie"))
        users.validateToken(token)
        .then(user => {
            if(user.role!=="admin"){
                throw new Error(401)
            }
            return adminUpdateSpotify.addLinkArtist(artist, link)
        })
        .then(() => {
            response.sendStatus(200);
        })
        .catch(error => {
            response.sendStatus(errorToStatus(error));
        })
    }
})

function getToken(cookie){
    parsedCookie = cookie.split("; ")
    for(string of parsedCookie){
        if(string.indexOf("token")!==-1)
        return string.substring(6)
    }
}

// This function converts an unexpected error in a Internal Server Error.
function errorToStatus(error){
    if(isNaN(error.message)){
        console.log(error)
        return 500
    } else {
        return error.message
    }
}

// This function add collaborations together and it will add the prefixes to the names of the artists.
// It will also check if a song is liked or disliked by the user.
async function connectingDataAndAddPreferences(user_id, data){
    listOfArtists = [];
    listOfSongs = []
    for(artistOrSong of data){
        if(artistOrSong.hasOwnProperty("name_song")){
            listOfSongs.push(artistOrSong)
        } else {
            listOfArtists.push(artistOrSong)
        }
    }
    var followedArtists = await preferenceArtist.getFollowFromSelection(user_id, listOfArtists)
    var followed = []
    for(artist of followedArtists){
        followed.push(artist.artist_id)
    }
    var likedSongs = await preferenceSong.getLikesFromSelection(user_id, listOfSongs)
    var liked = []
    for(song of likedSongs){
        liked.push(song.song_id)
    }
    var dislikedSongs = await preferenceSong.getDislikesFromSelection(user_id, listOfSongs)
    var disliked = []
    for(song of dislikedSongs){
        disliked.push(song.song_id)
    }
    var checkList = [];
    var newList = []
    for(artistOrSong of data){
        if(artistOrSong.prefix){
            artistOrSong.name_artist = artistOrSong.prefix + artistOrSong.name_artist
            artistOrSong.prefix = null;
        }
        if(artistOrSong.hasOwnProperty("name_song")){
            var property = "song" + artistOrSong.id
            if(checkList.hasOwnProperty(property)){
                if(!checkList[property].name_artist.includes(artistOrSong.name_artist)){
                    checkList[property].name_artist.push(artistOrSong.name_artist)
                }
            } else {
                if(typeof artistOrSong.name_artist=== "string"){
                    artistOrSong.name_artist = [artistOrSong.name_artist]
                }
                if(liked.includes(artistOrSong.id)){
                    artistOrSong.preference = "like"
                } else if(disliked.includes(artistOrSong.id)){
                    artistOrSong.preference = "dislike"
                }else{
                    artistOrSong.preference = "none"
                }
                checkList[property] = artistOrSong
            }
        } else {
            artistOrSong.isFollowed = followed.includes(artistOrSong.id)
            checkList["artist" + artistOrSong.id]=artistOrSong
        }
    }
    for(prop in checkList){
        newList.push(checkList[prop])
    }
    return(newList)
}

function addHasNextResult(data, max){
    if(max<1){
        throw new Error(400)
    }
    if(data.length===max+1){
        data.splice(max,1)
        hasNext=true;
    } else{
        hasNext = false;
    }
    return {"music": data, "hasNext": hasNext}
}

app.listen(8800, () => console.log('Listening on port 8800!'));

