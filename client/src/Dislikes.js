import React, { useEffect, useState} from 'react';
import Song from './components/Song/Song';

function Dislikes() {
    const [songs, setSongs] = useState([]);
    const [hasPrevious, setHasPrevious] = useState(false);
    const [hasNext, setHasNext] = useState(false);
    const [start, setStart] = useState(0);
    useEffect(() => {
        document.getElementById("previous").classList.add("disabled")
        document.getElementById("next").classList.add("disabled")
        getSongs(0);
    },[]);
    async function getSongs(startFrom){
        if(startFrom === undefined){
            startFrom=start;
        }
        var withStart = ""
        if(startFrom!== undefined){
            withStart += "?start=" + startFrom
        }
        await fetch('/api/dislike' + withStart)
        .then(data => {
            return data.json()
        })
        .then(data => {
            if(data.music.length===0 && startFrom!==0){
                previousResults()
            } else {
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
            }
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
    async function updateSongs(){
        await getSongs();
    }
    return (
        <div>
            <br/>
            {songs.map(song =>(
                <Song song={song} key={song.id} changed={updateSongs}/>
            ))}
            <button className="changeResults" onClick={previousResults} disabled={!hasPrevious} id="previous">&#8249;</button>
            <button className="changeResults" onClick={nextResults} disabled={!hasNext} id="next" >&#8250;</button>
        </div>
    );
}

export default Dislikes;