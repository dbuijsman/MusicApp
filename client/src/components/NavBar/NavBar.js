import React, { useState, useEffect } from 'react';
import './NavBar.css';
import { Link } from 'react-router-dom';

function NavBar() {
    const [user, setUser] = useState({});
    const [isLoggedIn, setLoggedIn] = useState(false);
    const [newSongs, setNewSongs] = useState(0);
    const [isAdmin, setAdmin] = useState(false);
    useEffect(() => {
        getUser();
        getNewSongs();
    },[]);
    const getUser = async() => {
        await fetch('/api/validate')
        .then(status)
        .then(json)
        .then(response => {
            setUser(response)
            setLoggedIn(true)
            if(response.role==="admin"){
                setAdmin(true)
            }
        })
    }
    const getNewSongs = async() => {
        await fetch('/api/new')
        .then(status)
        .then(data => {
            return data.json()
        })
        .then(data => {
            if(data.hasNext){
                setNewSongs(21)
            } else {
                setNewSongs(data.music.length)
            }
        })
    }

    let dropmenu;
    let badge;
    let signup;
    let loggin;
    let admin;
    admin = <li/>
    if(isLoggedIn){
        if(newSongs>20){
            badge = <div className="badge">20+</div>
        } else if(newSongs>0){
            badge = <div className="badge">{newSongs}</div>
        }else {
            badge = <div></div>
        }
        dropmenu = 
        <div className="dropdown">
            <button className="dropbtn">Settings {badge}
            </button>
            <div className="dropdown-content">
                <a>{user.username}</a>
                <Link to="/new">New songs {badge}</Link>
                <Link to="/likes">Likes</Link>
                <Link to="/dislikes">Dislikes</Link>
                <Link to="/follow">Follow</Link>
                <Link to="/suggest">Suggestions</Link>
                 <button className="button" id="reset" onClick={logout}> Log out</button>
            </div>
        </div>
        signup = <li></li>
        loggin = <li></li>
        if(isAdmin){
            admin = 
            <li id="admin">
                <Link to="/admin">Admin</Link>
            </li>
        }
    } else {
        loggin = 
        <li id="login">
            <Link to="/login">Login</Link>
        </li>
        signup = 
        <li id="signup">
            <Link to="/signup">Signup</Link>
        </li>
    }
  return (
    <nav id="navigationbar">
        <ul>

        </ul>
        <li id="home">
            <Link to="/">Home</Link>
        </li>
        <li id="artists">
            <Link to="/artists">Artists</Link>
        </li>
        <li id="popular">
            <Link to="/popular">Most popular</Link>
        </li>
        {signup}
        {loggin}
        {admin}
        {dropmenu}
        <li id="searchBar">
        <input placeholder="Search" type="string" id="query" onKeyPress={checkenter} />
        <input type="image" className = "search" onClick={search} src="../img/search.png"/>
        </li>
    </nav>
  );
}

export default NavBar;


function logout(){
    document.cookie = "token=0;expires=Thu, 01 Jan 1970 00:00:00 GMT";
    window.location.reload();
}

function checkenter(event){
    if(event.key === "Enter"){
        search(event)
    }
}

async function search(event){
    var query = event.target.parentNode.querySelector("#query").value;
    if(query){
        window.location.replace("/search?q=" + query)
    }
}


function translateErrorStatusCodeToString(statusCode){
    if(statusCode===400){
        return "Please fill in all fields."
    } else if(statusCode===401){
        return "This combination of username and password don't match."
    } else if(statusCode===422){
        return "This username already exists."
    } else if(statusCode===404){
        return "Songs not found"
    }else {
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