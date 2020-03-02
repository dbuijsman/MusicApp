import React, { useState, useEffect } from 'react';
import './Song.css';
import { Link } from 'react-router-dom';

function Song(props) {
    const [preference, setPreference] = useState(props.song.preference)
    const [extraArtists, setExtraArtists] = useState([])
    useEffect(() => {
        var extra = []
        if(props.song.name_artist.length>1){
            for(var index=1;index<props.song.name_artist.length;index++){
                extra.push(props.song.name_artist[index])
            }
            setExtraArtists(extra)
        }
    },[]);
    let likebutton
    if(preference==="none"){
        likebutton = 
        <label key = {preference}>
            <input type="image" className = "like" onClick={addLike} src="../img/like.png"/>
            <input type="image" className = "like" onClick={addDislike} src="../img/dislike.png"/>
        </label>
    } else {
        likebutton = <label key = {preference}><input type="image" className="removePref" onClick={removePreference} onMouseEnter={mouseEnter} onMouseLeave={mouseLeave} src={"../img/" + preference + ".png"}/></label>
    }

    async function addLike(){
        await fetch('/api/like', {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({"id": props.song.id})
        })
        .then(response => {
            if(response.status===200){
                setPreference("like")
                if(props.changed){
                    props.changed(props.song.id)
                }
            } else if(response.status===401){
                document.getElementById("popupLogin").style.display="block";
            } else if(response.status>=400){
                alert(translateErrorStatusCodeToString(response.status))
            }
        })
    }
    
    async function addDislike(){
        await fetch('/api/dislike', {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({"id": props.song.id})
        })
        .then(response => {
            if(response.status===200){
                setPreference("dislike")
                if(props.changed){
                    props.changed(props.song.id)
                }
            } else if(response.status===401){
                document.getElementById("popupLogin").style.display="block";
            } else if(response.status>=400){
                alert(translateErrorStatusCodeToString(response.status))
            }
        })
    }
    async function removePreference(event){
        await fetch('/api/' + preference, {
            method: "DELETE",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({"id": props.song.id})
        })
        .then(response => {
            if(response.status===200){
                setPreference("none")
                if(props.changed){
                    props.changed(props.song.id)
                }
            }
        })
    }
    function mouseEnter(event){
        event.target.src="../img/cancel.png"
    }
    function mouseLeave(event){
        event.target.src="../img/" + preference + ".png"
    }
    return (
        <article className="artistblock">
            <label className="name"><Link to={'/artist/' + props.song.name_artist[0]} className="FollowArtist">{props.song.name_artist[0]}</Link>
            {extraArtists.map(artist =>(
            <label key={artist}> & <Link to={'/artist/' + artist} className="FollowArtist">{artist}</Link></label>
            ))} - {props.song.name_song}</label>
            {likebutton}
        </article>
    );
}

export default Song;



// The functions below are executed in other js files as well.
function translateErrorStatusCodeToString(statusCode){
    if(statusCode===401){
        return "Please log in first."
    } else if(statusCode===404){
        return "Song not found"
    }else {
        return "Something has gone wrong. Please try again later."
    }
}