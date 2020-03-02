import React, { useEffect, useState} from 'react';
import './style/ListOfArtists.css';
import HeaderOfLetters from './components/HeaderOfLetters/HeaderOfLetters';
import Artist from './components/Artist/Artist';

function ListOfArtists(params) {
    const [location,setLocation] = useState(params.match.params.firstLetter)
    const [artists, setArtists] = useState([]);
    const [hasPrevious, setHasPrevious] = useState(false);
    const [hasNext, setHasNext] = useState(false);
    const [start, setStart] = useState(0);
    useEffect(() => {
        document.getElementById("previous").classList.add("disabled")
        document.getElementById("next").classList.add("disabled")
        getArtists(0);
    },[location]);
    
    if(location !== params.match.params.firstLetter){
        setStart(0)
        setLocation(params.match.params.firstLetter)
    }
    async function getArtists(startFrom) {
        var withStart = ""
        if(startFrom!== undefined){
            withStart += "?start=" + startFrom
        }
        fetch('/api/artists/' + location + withStart)
        .then(data => {
            return data.json();
        })
        .then(data => {
            setHasNext(data.hasNext)
            if(startFrom===0){
                setHasPrevious(false)
                document.getElementById("previous").classList.add("disabled")
            } else {
                setHasPrevious(true)
                document.getElementById("previous").classList.remove("disabled")
            }
            if(!data.hasNext){
                document.getElementById("next").classList.add("disabled")
            } else {
                document.getElementById("next").classList.remove("disabled")
            }
            setArtists(data.music)
        })
    }
    function previousResults(){
        var newStart = Math.max(start-20,0)
        setStart(newStart)
        getArtists(newStart);
    }

    function nextResults(){
        setStart(start+20)
        getArtists(start+20);
    }

    return (
        <div>
            <HeaderOfLetters/>
            <br/>
            {artists.map(artist =>(
            <Artist artist ={artist} key={artist.id}/>
            ))}
            <button className="changeResults" onClick={previousResults} disabled={!hasPrevious} id="previous">&#8249;</button>
            <button className="changeResults" onClick={nextResults} disabled={!hasNext} id="next" >&#8250;</button>
        </div>
    );
}

export default ListOfArtists;