import React, { useEffect, useState} from 'react';
import Artist from './components/Artist/Artist';
import Song from './components/Song/Song';

function Search(props) {
    const [results, setResults] = useState([]);
    const [hasPrevious, setHasPrevious] = useState(false);
    const [hasNext, setHasNext] = useState(false);
    const [start, setStart] = useState(0);
    useEffect(() => {
        document.getElementById("previous").classList.add("disabled")
        document.getElementById("next").classList.add("disabled")
        getResults(0);
    },[]);
    const getResults = (startFrom) => {
        var withStart = ""
        if(startFrom!== undefined){
            withStart += "&start=" + startFrom
        }
        fetch('/api/search' + props.location.search + withStart)
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
            setResults(data.music);
        })
    }
    function previousResults(){
        var newStart = Math.max(start-20,0)
        setStart(newStart)
        getResults(newStart);
    }

    function nextResults(){
        setStart(start+20)
        getResults(start+20);
    }

    return (
        <div>
        <br/>
            {results.map(result =>(
                result.hasOwnProperty("name_song") ? <Song song={result} key={"song" + result.id} /> : <Artist artist={result} key={"artist" + result.id} />
                
            ))}
            <button className="changeResults" onClick={previousResults} disabled={!hasPrevious} id="previous">&#8249;</button>
            <button className="changeResults" onClick={nextResults} disabled={!hasNext} id="next" >&#8250;</button>
        </div>
    );
}

export default Search;