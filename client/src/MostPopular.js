import React, {useState} from 'react';
import MostPopularArtists from './components/MostPopular/MostPopularArtists'
import MostPopularSongs from './components/MostPopular/MostPopularSongs'

function MostPopular() {
    const [selectedOption, setSelectedOption] = useState(<MostPopularSongs/>)
    function getSongs(){
        setSelectedOption(<MostPopularSongs/>)
    }
    function getArtists(){
        setSelectedOption(<MostPopularArtists/>)
    }
    return (
        <div>
            <button className="changeResults" onClick={getSongs}>Songs</button>
            <button className="changeResults" onClick={getArtists}>Artists</button>
            {selectedOption}
        </div>
    );
}

export default MostPopular;