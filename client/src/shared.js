
// var currentPage = window.location.pathname.substring(1);
// selectedTab = document.getElementById(currentPage.substring(0,currentPage.indexOf(".")));
// selectedTab.classList.add("selected")


// The functions below are executed in other js files as well.
function translateErrorStatusCodeToString(statusCode){
    if(statusCode==400){
        return "Please fill in all fields."
    } else if(statusCode==401){
        return "This combination of username and password don't match."
    } else if(statusCode==422){
        return "This username already exists."
    } else if(statusCode==404){
        return "Songs not found"
    }else {
        return "Something has go wrong. Please try again later."
    }
}
function status(response){
    return new Promise(function(resolve, reject){
        if(response.status == 200){
            resolve(response)
        } else {
            reject(translateErrorStatusCodeToString(response.status))
        }
    })
}
function json(response){
    return response.json();
}