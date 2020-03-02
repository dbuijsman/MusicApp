import React, {useState} from 'react';
import SuggestArtist from './components/Suggest/SuggestArtist'
import SuggestSong from './components/Suggest/SuggestSong'

function Suggest() {
    const [selectedOption, setSelectedOption] = useState(<SuggestSong/>)
    function getSongs(){
        setSelectedOption(<SuggestSong/>)
    }
    function getArtists(){
        setSelectedOption(<SuggestArtist/>)
    }
    return (
        <div>
            <button className="changeResults" onClick={getSongs}>Songs</button>
            <button className="changeResults" onClick={getArtists}>Artists</button>
            {selectedOption}
        </div>
    );
}

export default Suggest;