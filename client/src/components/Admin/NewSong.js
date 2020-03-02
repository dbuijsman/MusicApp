
import React, { useState} from 'react';
import './Admin.css';

function NewSong() {
    const [artists, setArtists] = useState([])
    function addArtist(event){
        var inputArtists = event.target.parentNode.parentNode.querySelectorAll(".artist")
        var artistList = inputfieldsArtistsToArray(inputArtists)
        event.target.parentNode.querySelector(".artist").value="";
        setArtists(artistList)
    }
    function removeArtist(event){
        var inputArtists = event.target.parentNode.parentNode.querySelectorAll(".artist")
        var artistList = inputfieldsArtistsToArray(inputArtists)
        let removingElement;
        if(event.target.parentNode.querySelector(".artist").value){
            removingElement = event.target.parentNode.querySelector(".artist").value
        }
        artistList.splice(artists.length,1)
        artistList.splice(event.target.id,1)
        setArtists(artistList)
    }
    // This function converst a set of inputfields to an array of artists
    function inputfieldsArtistsToArray(inputfieldsArtists){
        var arrayArtists = []
        for(var inputfield of inputfieldsArtists){
            arrayArtists.push(inputfield.value)
        }
        return arrayArtists    
    }
    function checkenter(event){
        if(event.key === "Enter"){
            confirm(event)
        }
    }
    
    async function confirm(event){
        var element = event.target.parentNode;
        while(element.className!=="songBlock"){
            element = element.parentNode
        }
        var inputfieldsArtists = element.querySelectorAll(".artist")
        var artistList = inputfieldsArtistsToArray(inputfieldsArtists)
        var song = element.querySelector(".song").value
        await fetch("/api/admin/song", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({"artists": artistList, "song": song})
        })
        .then(status)
        .then(() =>{
            var stringOfArtists = "";
            for(var artist of artistList){
                stringOfArtists += artist + " & "
            }
            stringOfArtists = stringOfArtists.substring(0,stringOfArtists.length-3)
            element.querySelector(".error").innerHTML = " ";
            element.querySelector(".succes").innerHTML = "Succesfull! Added " + stringOfArtists + " - " + song + "."
        })
        .catch((error) => {
            element.querySelector(".succes").innerHTML = " ";
            element.querySelector(".error").innerHTML = "Oeps! " + error;
        })
    }
    
    
    // The functions below are executed in other js files as well.
    function translateErrorStatusCodeToString(statusCode){
        if(statusCode===400){
            return "Please fill in all fields."
        } else if(statusCode===401){
            return "Unauthorized."
        } else if(statusCode===422){
            return "This song already exists."
        } else {
            return "Something has gone wrong. Please try again later."
        }
    }
    function status(response){
        return new Promise(function(resolve, reject){
            if(response.status === 200){
                resolve(response.statusText)
            } else {
                reject(translateErrorStatusCodeToString(response.status))
            }
        })
    }

    return (
        <article className = "songBlock">
            <div className="newEntry">New Song</div>
            <br/>
            <div>
                <div className="Input">
                    {artists.map((artist,index) =>(
                        <div key={index + artist} >Artist: <input placeholder="Artist" defaultValue={artist} type="string" className="artist"/>
                        <button id={index} className="removeEntry" onClick={removeArtist}>-</button></div>
                    ))}
                    <div>Artist: <input placeholder="Artist" type="string" className="artist" />
                    <button className="addEntry" onClick={addArtist}>+</button>
                    <div id="songParent">Song: <input placeholder="Song" type="string" className="song" onKeyPress={checkenter}/></div></div>
                </div>
                <button className="button" id="confirm" onClick={confirm}>Confirm</button>
                <div className="error"> </div>
                <div className="succes"> </div>
            </div>
        </article>
    );
}

export default NewSong;