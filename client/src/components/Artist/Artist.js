import React, { useState, useEffect } from 'react';
import './Artist.css';
import { Link } from 'react-router-dom';

function Artist(props) {
    const [follow, setFollow] = useState(props.artist.isFollowed)
    useEffect(() => {
        setFollow(props.artist.isFollowed);
    },[]);
    let followbutton;
    if(follow){
        followbutton = <label><input type="image" className="remove" onClick={removeFollow} onMouseEnter={mouseEnter} onMouseLeave={mouseLeave} src="../img/following.png"/></label>
    } else {
        followbutton = <label><input type="image" className="follow" onClick={addFollow} src="../img/follow.png"/></label>
    }
    async function addFollow(){
        await fetch('/api/follow', {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({"id": props.artist.id})
        })
        .then(response => {
            if(response.status===200){
                setFollow(true)
                if(props.changed){
                    props.changed(props.artist.id)
                }
            } else if(response.status===401){
                document.getElementById("popupLogin").style.display="block";
            } else if(response.status>=400){
                alert(translateErrorStatusCodeToString(response.status))
            }
        })
    }
    async function removeFollow(){
        await fetch('/api/follow', {
            method: "DELETE",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({"id": props.artist.id})
        })
        .then(response => {
            if(response.status===200){
                setFollow(false)
                if(props.changed){
                    props.changed(props.artist.id)
                }
            }
        })
    }
    function mouseEnter(event){
        event.target.src="../img/cancel.png"
    }
    function mouseLeave(event){
        event.target.src="../img/following.png"
    }
    return (
        <article className="artistblock" key={props.name_artist}>
            <label className="name"> <Link to={'/artist/' + props.artist.name_artist} className="FollowArtist">{props.artist.name_artist}</Link></label>
            {followbutton}
        </article>
    );
}

export default Artist;


// The functions below are executed in other js files as well.
function translateErrorStatusCodeToString(statusCode){
    if(statusCode===401){
        return "Please log in first."
    } else if(statusCode===404){
        return "Artist not found"
    }else {
        return "Something has gone wrong. Please try again later."
    }
}