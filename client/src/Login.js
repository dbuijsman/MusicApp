
import React from 'react';
import './style/Login.css';
import { Link } from 'react-router-dom'

function Login(props) {
    function checkenter(event){
        if(event.key === "Enter"){
            login(event)
        }
    }
    async function login(event){
        let credentials = event.target.parentNode.parentNode
        var username = credentials.querySelector("#username").value;
        var pass = credentials.querySelector("#password").value;
        await fetch("/api/login", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({"username": username, "password": pass})
        })
        .then(status)
        .then(response =>{
            var expDate = Date.now()+ 24 * 60 * 60 * 1000;
            document.cookie = "token=" + response + "; expires=" + expDate;
            if(props.isPopup){
                document.getElementById("popupLogin").style.display="none";
                window.location.reload();
            } else {
                window.location.replace("home")
            }
    
        })
        .catch((error) => {
            document.getElementById("loginerror").innerHTML = "Oeps! " + error;
        })
    }
    function closePopup(){
        document.getElementById("popupLogin").style.display="none";
    }
    return (
        <article className = "singleBlock">
            <div className="login">Login {props.isPopup && <span className="close" onClick={closePopup}>&times;</span>}</div>
            <br/>
            <div>
                <div className="credentials">
                    <div>Username: <input placeholder="Username" type="string" id="username" /></div>
                    <div>Password: <input placeholder="Password" type="password" id="password" className="password" onKeyPress={checkenter}/></div>
                </div>
                <button className="button" id="loginbutton" onClick={login}>Log in</button>
                <label onClick={closePopup}> <Link to="/signup"> Or Sign Up</Link></label>
                <div className="error" id="loginerror"> </div>
            </div>
        </article>
    );
}

export default Login;


// The functions below are executed in other js files as well.
function translateErrorStatusCodeToString(statusCode){
    if(statusCode===400){
        return "Please fill in all fields."
    } else if(statusCode===401){
        return "This combination of username and password don't match."
    } else if(statusCode===422){
        return "This username already exists."
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