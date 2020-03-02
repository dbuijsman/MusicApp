import React, { useState} from 'react';
import './Admin.css';

function NewAlbum() {
    const [songs, setSongs] = useState([])
    const [artistsLastSong, setArtistsLastSong] = useState([])
    
    function addArtist(event){
        var songToAddTo = event.target.parentNode
        var inputSongs = songToAddTo.parentNode.parentNode.querySelectorAll(".songObject")
        var songList = inputfieldsSongsToArray(inputSongs)
        songList.splice(songs.length,1)
        let indexSong = songToAddTo.parentNode.className
        var inputArtists = songToAddTo.querySelectorAll(".artist")
        var artistList = inputfieldsArtistsToArray(inputArtists)
        artistList.push("")
        songList[indexSong].featuring = artistList
        setSongs(songList)
    }
    function removeArtist(event){
        var songToRemoveFrom = event.target.parentNode.parentNode
        var inputSongs = songToRemoveFrom.parentNode.querySelectorAll(".songObject")
        var songList = inputfieldsSongsToArray(inputSongs)
        songList.splice(songs.length,1)
        let indexSong = songToRemoveFrom.parentNode.className
        var inputArtists = songToRemoveFrom.querySelectorAll(".artist")
        var artistList = inputfieldsArtistsToArray(inputArtists)
        let indexArtist = event.target.parentNode.className
        artistList.splice(indexArtist,1)
        songList[indexSong].featuring = artistList
        setSongs(songList)
    }
    function addArtistLastSong(event){
        var inputArtists = event.target.parentNode.querySelectorAll(".artist")
        var artistList = inputfieldsArtistsToArray(inputArtists)
        artistList.push("")
        setArtistsLastSong(artistList)
    }
    function removeArtistLastSong(event){
        var inputArtists = event.target.parentNode.parentNode.querySelectorAll(".artist")
        var artistList = inputfieldsArtistsToArray(inputArtists)
        let indexArtist = event.target.parentNode.className
        artistList.splice(indexArtist,1)
        setArtistsLastSong(artistList)
    }
    // This function converts a set of inputfields to an array of artists
    function inputfieldsArtistsToArray(inputfieldsArtists){
        var arrayArtists = []
        for(var inputfield of inputfieldsArtists){
            arrayArtists.push(inputfield.value)
        }
        return arrayArtists  
    }
    function addSong(event){
        var inputSongs = event.target.parentNode.parentNode.parentNode.querySelectorAll(".songObject")
        var songList = inputfieldsSongsToArray(inputSongs)
        event.target.parentNode.querySelector("#newSong").value="";
        setSongs(songList)
        setArtistsLastSong([])
    }
    function removeSong(event){
        var inputSongs = event.target.parentNode.parentNode.parentNode.querySelectorAll(".songObject")
        var songList = inputfieldsSongsToArray(inputSongs)
        var indexSong=event.target.parentNode.parentNode.className
        songList.splice(songs.length,1)
        songList.splice(indexSong,1)
        setSongs(songList)
    }
    // This function converts a set of inputfields to an array of objects that contains the song and featuring artists.
    function inputfieldsSongsToArray(inputfieldsSongs){
        var arraySongs = []
        for(var inputfield of inputfieldsSongs){
            var song = inputfield.querySelector(".song").value
            var inputfieldsArtists = inputfield.querySelectorAll(".artist")
            var arrayArtists = inputfieldsArtistsToArray(inputfieldsArtists)
            arraySongs.push({"name_song": song, "featuring": arrayArtists})
        }
        return arraySongs    
    }
    function checkenter(event){
        if(event.key === "Enter"){
            confirm(event)
        }
    }
    
    async function confirm(event){
        var element = event.target.parentNode;
        while(element.className!=="albumBlock"){
            element=element.parentNode
        }
        var inputSongs = element.querySelectorAll(".songObject")
        var songList = inputfieldsSongsToArray(inputSongs)
        var album = element.querySelector(".album").value
        var artist = element.querySelector(".leadingArtist").value
        await fetch("/api/admin/album", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({"album": album, "artist": artist, "songs": songList})
        })
        .then(status)
        .then(() =>{
            element.querySelector(".error").innerHTML = " ";
            element.querySelector(".succes").innerHTML = "Succesfull! Added the album " + album + " by " + artist + "."
        })
        .catch((error) => {
            element.querySelector(".succes").innerHTML = " "
            element.querySelector(".error").innerHTML = "Oeps! " + error;
        })
    }

    return (
        <article className = "albumBlock">
            <div className="newEntry">New Album</div>
            <br/>
            <div>
                <div className="Input">
                    <div>Album: <input placeholder="Album" type="string" className="album" /></div>
                    <div>Artist: <input placeholder="Artist" type="string" className="leadingArtist" /></div>
                    {songs.map((song,index) =>(
                        <div key={"song" + index + song.name_song} className={index}>
                            <div className="songObject">Song #{songs.indexOf(song)+1}: <input placeholder="Song" defaultValue={song.name_song} type="string" className="song"/>
                                <button className="removeEntry" onClick={removeSong}>-</button>
                                {song.featuring.map((artist,index) => (
                                    <div key={"ft" + index + artist} className={index}>ft.: <input placeholder="Artist" defaultValue={artist} type="string" className="artist"/>
                                        <button id={index} className="removeEntry" onClick={removeArtist}>-</button>
                                    </div>
                                ))}
                                <button className="addEntry" onClick={addArtist}>Add artist</button>
                            </div>
                        </div>
                    ))}
                    <div>
                        <div className="songObject">Song #{songs.length+1}: <input placeholder="Song" type="string" className="song" id="newSong" onKeyPress={checkenter} />
                            <button className="addEntry" onClick={addSong}>Add song</button>
                            {artistsLastSong.map((artist,index) => (
                                <div key={"LastSong" + index + artist} className={index}>ft.: <input placeholder="Artist" defaultValue={artist} type="string" className="artist"/>
                                    <button className="removeEntry" onClick={removeArtistLastSong}>-</button>
                                </div>
                            ))}
                            <button className="addEntry" onClick={addArtistLastSong}>Add artist</button>
                        </div>
                    </div>
                </div>
                <button className="button" id="confirm" onClick={confirm}>Confirm</button>
                <div className="error"> </div>
                <div className="succes"> </div>
            </div>
        </article>
    );
}

export default NewAlbum;





// The functions below are executed in other js files as well.
function translateErrorStatusCodeToString(statusCode){
    // if(statusCode===400){
    //     return "Please fill in all fields."
    // } else if(statusCode===401){
    //     return "Unauthorized."
    // } else if(statusCode===422){
    //     return "This song already exists."
    // } else {
    //     return "Something has gone wrong. Please try again later."
    // }
}
function status(response){
    // return new Promise(function(resolve, reject){
    //     if(response.status === 200){
    //         resolve(response.statusText)
    //     } else {
    //         reject(translateErrorStatusCodeToString(response.status))
    //     }
    // })
}