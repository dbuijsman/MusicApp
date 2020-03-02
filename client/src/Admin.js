
import React, { useState, useEffect } from 'react';
import AddArtistLink from "./components/Admin/AddArtistLink"
import NewSong from "./components/Admin/NewSong"
import NewAlbum from "./components/Admin/NewAlbum"
import UpdateArtist from "./components/Admin/UpdateArtist"

function Admin() {
    const [isAdmin, setAdmin] = useState(false)
    const [selectedOption, setSelectedOption] = useState(<div/>)
    useEffect(() => {
        getUser();
    },[]);
    const getUser = async() => {
        await fetch('/api/validate/')
        .then(status)
        .then(json)
        .then(response => {
            if(response.role==="admin"){
                setAdmin(true)
            } else {
                setAdmin(false)
            }
        })
    }
    function selectOption(event){
        var option=event.target.value;
        if(option==="newSong"){
            setSelectedOption(<NewSong/>)
        }  else if(option==="newAlbum"){
            setSelectedOption(<NewAlbum/>)
        }  else if(option==="update"){
            setSelectedOption(<UpdateArtist/>)
        }  else if(option==="addArtistLink"){
            setSelectedOption(<AddArtistLink/>)
        }  else {
            setSelectedOption(<div/>)
        }
    }

    async function update(event){
        var element = event.target.parentNode;
        await fetch("/api/admin/update")
        .then(status)
        .then(() =>{
            element.querySelector(".error").innerHTML = " ";
            element.querySelector(".succes").innerHTML = "Succesfull! Updated discography of all artists."
        })
        .catch((error) => {
            element.querySelector(".succes").innerHTML = " "
            element.querySelector(".error").innerHTML = "Oeps! " + error;
        })
    }

    let select;
    let updateAll;
    if(isAdmin){
        select=
        <div>Select: 
            <select id="select" onChange={selectOption}>
                <option defaultValue="selecting">------</option>
                <option value="newSong">New song</option>
                <option value="newAlbum">New album</option>
                <option value="addArtistLink">New artist</option>
                <option value="update">Update</option>
            </select>
        </div>;
        updateAll = 
            <div>
                <button className="button" id="confirm" onClick={update}>Update all</button>
                <div className="error"> </div>
                <div className="succes"> </div>
            </div>
    }
    return (
        <div>
            {select}
            {updateAll}
            {selectedOption}
        </div>
    );
}

export default Admin;


function translateErrorStatusCodeToString(statusCode){
    if(statusCode===401){
        return "Unauthorized."
    } else {
        return "Something has gone wrong. Please try again later."
    }
}
function status(response){
    return new Promise(function(resolve, reject){
        if(response.status === 200){
            resolve(response)
        } else {
            reject(translateErrorStatusCodeToString(response.status))
        }
    })
}
function json(response){
    return JSON.parse(response.statusText);
}
