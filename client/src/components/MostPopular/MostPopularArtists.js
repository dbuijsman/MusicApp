import React, { useEffect, useState} from 'react';
import Artist from '../Artist/Artist';

function MostPopularArtist() {
    const [artists, setArtists] = useState([]);
    const [hasPrevious, setHasPrevious] = useState(false);
    const [hasNext, setHasNext] = useState(false);
    const [start, setStart] = useState(0);
    useEffect(() => {
        document.getElementById("previous").classList.add("disabled")
        document.getElementById("next").classList.add("disabled")
        getArtists(0);
    },[]);
    async function getArtists(startFrom){
        if(startFrom === undefined){
            startFrom=start;
        }
        var withStart = ""
        if(startFrom!== undefined){
            withStart += "?start=" + startFrom
        }
        await fetch('/api/popular/artists' + withStart)
        .then(data => {
            return data.json()
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
            <br/>
            {artists.map(artist =>(
                <Artist artist={artist} key={artist.id}/>
            ))}
            <button className="changeResults" onClick={previousResults} disabled={!hasPrevious} id="previous">&#8249;</button>
            <button className="changeResults" onClick={nextResults} disabled={!hasNext} id="next" >&#8250;</button>
        </div>
    );
}

export default MostPopularArtist;