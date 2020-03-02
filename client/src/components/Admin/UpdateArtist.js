import React, { useState } from 'react';
import './Admin.css';

function UpdateArtist() {
    const [noLink, setNoLink] = useState(false)
    function checkEnterUpdate(event){
        if(event.key === "Enter"){
            update(event)
        }
    }
    function checkEnterLink(event){
        if(event.key === "Enter"){
            addLink(event)
        }
    }
    
    async function addLink(event){
        if(!noLink){
            setNoLink(true)
        } else {
            var element = event.target.parentNode;
            while(element.className!=="songBlock"){
                element = element.parentNode
            }
            var artist = element.querySelector(".artist").value
            var link = element.querySelector(".link").value
            await fetch("/api/admin/update/link", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({"artist": artist, "link": link})
            })
            .then(status)
            .then(() =>{
                element.querySelector(".error").innerHTML = " ";
                element.querySelector(".succes").innerHTML = "Succesfull! Added link to " + artist + "."
            })
            .catch((error) => {
                element.querySelector(".succes").innerHTML = " "
                element.querySelector(".error").innerHTML = "Oeps! " + error;
            })
        }
    }
    async function update(event){
        var element = event.target.parentNode;
        while(element.className!=="songBlock"){
            element = element.parentNode
        }
        var artist = element.querySelector(".artist").value
        await fetch("/api/admin/update/artist", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({"artist": artist})
        })
        .then(status)
        .then(() =>{
            element.querySelector(".error").innerHTML = " ";
            element.querySelector(".succes").innerHTML = "Succesfull! Updated the discography of " + artist + "."
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
        } else {
            return response.statusText
        }
    }
    function status(response){
        return new Promise(function(resolve, reject){
            if(response.status === 200){
                resolve(response.statusText)
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
                    <div>Artist: <input placeholder="Artist" type="string" className="artist" onKeyPress={checkEnterUpdate} />
                    {noLink && 
                        <div>Spotify ID: <input placeholder="Spotify ID" type="string" className="link" onKeyPress={checkEnterLink}/></div>}
                    </div>
                </div>
                <button className="button" id="confirm" onClick={addLink}>{!noLink? "Add link" : "Confirm link"}</button>
                <button className="button" id="confirm" onClick={update}>Update</button>
                <div className="error"> </div>
                <div className="succes"> </div>
            </div>
        </article>
    );
}

export default UpdateArtist;