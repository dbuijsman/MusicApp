import React from 'react';
import {BrowserRouter as Router, Switch, Route} from 'react-router-dom';
import './style/App.css';
import NavBar from './components/NavBar/NavBar';
import Home from './Home';
import Login from './Login';
import Signup from './Signup';
import ListOfArtists from './ListOfArtists';
import Artist from './Artist';
import MostPopular from './MostPopular';
import Search from './Search';
import NewSongs from './NewSongs';
import Likes from './Likes';
import Dislikes from './Dislikes';
import Suggest from './Suggest';
import Follow from './Follow';
import Admin from './Admin';


function App() {
  window.onclick = function(event) {
    if (event.target == document.getElementById("popupLogin")) {
      document.getElementById("popupLogin").style.display = "none";
    }
  }
  return (
    <Router>
      <NavBar/>
      <Switch>
        <Route path="/" exact component={Home}/>
        <Route path="/login" component={Login}/>
        <Route path="/signup" component={Signup}/>
        <Route path="/artists/:firstLetter" component={ListOfArtists}/>
        <Route path="/artists/" exact component={ListOfArtists}/>
        <Route path="/artist/:artist" component={Artist}/>
        <Route path="/popular" component={MostPopular}/>
        <Route path="/search" component={Search}/>
        <Route path="/new" component={NewSongs}/>
        <Route path="/likes" component={Likes}/>
        <Route path="/dislikes" component={Dislikes}/>
        <Route path="/suggest" component={Suggest}/>
        <Route path="/follow" component={Follow}/>
        <Route path="/admin" component={Admin}/>
      </Switch>
      <div id="popupLogin" className="popup">
          <Login isPopup={true}/>
      </div>
    </Router>
  );
}

export default App;