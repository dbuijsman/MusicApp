
import React from 'react';
import './style/Login.css';

function Signup() {
    return (
        <article className = "singleBlock">
            <div className="login">Signup</div>
            <br/>
            <div>
                <div className="credentials">
                    <div>Username: <input placeholder="Username" type="string" id="username" /></div>
                    <div>Password: <input placeholder="Password" type="password" className="password" id="password" /></div>
                    <div>Password: <input placeholder="Password (again)" type="password" className="password" id="password2" onKeyPress={checkenter} /></div>
                </div>
                <button className="button" id="signUpButton" onClick={signup}>Sign up</button>
                <div className="error" id="signUpError"> </div>
            </div>
        </article>
    );
}

export default Signup;

function checkenter(event){
    if(event.key === "Enter"){
        signup(event)
    }
}

async function signup(event){
    var username = document.getElementById("username").value;
    var pass = document.getElementById("password").value;
    var pass2 = document.getElementById("password2").value;
    if(pass === pass2){
        await fetch("/api/signup", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({"username": username, "password": pass})
        })
        .then(status)
        .then(response => {
            var expDate = Date.now()+ 24 * 60 * 60 * 1000;
            document.cookie = "token=" + response + "; expires=" + expDate;
            window.location.replace("home.html")
        })
        .catch(error =>{
            document.getElementById("signUpError").innerHTML = "Oeps! " + error;
        })
    } else {
        document.getElementById("signUpError").innerHTML = "The passwords don't match";
    }
}


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