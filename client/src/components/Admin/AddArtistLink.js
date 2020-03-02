import React, { useState } from 'react';
import './Admin.css';

function AddArtistLink() {
    const [artists, setArtists] = useState([])
    function checkEnterFind(event){
        if(event.key === "Enter"){
            find(event)
        }
    }
    function find(event){
        var element = event.target.parentNode;
        var parent = element.parentNode.parentNode.parentNode
        parent.querySelector(".succes").innerHTML = " "
        parent.querySelector(".error").innerHTML = " ";
        while(element.className!=="songBlock"){
            element = element.parentNode
        }
        var artist = element.querySelector(".artist").value
        fetch("/api/admin/artist/find?q=" + artist)
        .then(status)
        .then(data =>{
            element.querySelector(".error").innerHTML = " ";
            setArtists(data)
        })
        .catch((error) => {
            element.querySelector(".succes").innerHTML = " "
            element.querySelector(".error").innerHTML = "Oeps! " + error;
        })
    }
    function addArtist(event){
        var element = event.target.parentNode.parentNode.parentNode.parentNode;
        var listOfArtists = event.target.parentNode.querySelectorAll(".result")
        var artistsToAdd = []
        for(var artist of listOfArtists){
            if(artist.checked){
                artistsToAdd.push({"name_artist": artist.name, "source": "Spotify", "id": artist.value})
            }
        }
        fetch("/api/admin/source", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify(artistsToAdd)
        })
        .then(status)
        .then(data =>{
            element.querySelector(".error").innerHTML = " ";
            var succes = ""
            for(var artist of data){
                succes += ", " + artist
            }
            succes = succes.substring(2)
            element.querySelector(".succes").innerHTML = "Succesfull! Added sources for " + succes;
        })
        .catch((error) => {
            element.querySelector(".succes").innerHTML = " "
            element.querySelector(".error").innerHTML = "Oeps! " + error;
        })
    }
    
    
    // The functions below are executed in other js files as well.
    function translateErrorStatusCodeToString(response){
        var statusCode=response.status
        if(statusCode===401){
            return "Unauthorized."
        } else if(statusCode===422){
            return "This artist is already linked."
        } else {
            return response.statusText
        }
    }
    function status(response){
        return new Promise(function(resolve, reject){
            if(response.status === 200){
                resolve(response.json())
            } else {
                reject(translateErrorStatusCodeToString(response))
            }
        })
    }

    return (
        <article className = "songBlock">
            <div className="newEntry">Update artist</div>
            <br/>
            <div>
                <div className="Input">
                    <div>Artist: <input placeholder="Artist" type="string" className="artist" onKeyPress={checkEnterFind} />
                    </div>
                </div>
                <button className="button" id="find" onClick={find}>Find artist</button>
                {artists.length>0 && 
                    <div className="results">
                    <ul>
                        {artists.map(artist =>(
                            <li key={artist.id}><label><input type="checkbox" name={artist.name_artist} className="result" value={artist.id}/>{artist.name_artist}</label></li>
                        ))}
                        <button className="button" id="find" onClick={addArtist}>Add artists</button>
                    </ul>
                    </div>}
                <div className="error"> </div>
                <div className="succes"> </div>
            </div>
        </article>
    );
}

export default AddArtistLink;