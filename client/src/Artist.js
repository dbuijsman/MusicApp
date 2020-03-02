import React, { useEffect, useState} from 'react';
import HeaderOfLetters from './components/HeaderOfLetters/HeaderOfLetters';
import Song from './components/Song/Song'; 

function Artist(params) {
    const [songs, setSongs] = useState([]);
    const [hasPrevious, setHasPrevious] = useState(false);
    const [hasNext, setHasNext] = useState(false);
    const [start, setStart] = useState(0);
    const [location,setLocation] = useState(params.match.params.artist)

    useEffect(() => {
        document.getElementById("previous").classList.add("disabled")
        document.getElementById("next").classList.add("disabled")
        getSongs(0);
    },[location]);
    if(location !== params.match.params.artist){
        setStart(0)
        setLocation(params.match.params.artist)
    }
    const getSongs = (startFrom) => {
        var withStart = ""
        if(startFrom!== undefined){
            withStart += "?start=" + startFrom
        }
        fetch('/api/artist/' + params.match.params.artist + withStart)
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
            setSongs(data.music);
        })
    }
    function previousResults(){
        var newStart = Math.max(start-20,0)
        setStart(newStart)
        getSongs(newStart);
    }

    function nextResults(){
        setStart(start+20)
        getSongs(start+20);
    }

    return (
        <div>
        <HeaderOfLetters/>
            <br/>
            {songs.map(song =>(
                <Song song={song} key={song.id} />
            ))}
            <button className="changeResults" onClick={previousResults} disabled={!hasPrevious} id="previous">&#8249;</button>
            <button className="changeResults" onClick={nextResults} disabled={!hasNext} id="next" >&#8250;</button>
        </div>
    );
}

export default Artist;