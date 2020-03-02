import React, { useEffect, useState} from 'react';
import Song from '../Song/Song';

function SuggestSong() {
    const [songs, setSongs] = useState([]);
    useEffect(() => {
        getSongs([]);
    },[]);
    const getSongs = async(newState) => {
        await fetch('/api/suggest/song')
        .then(data => {
            return data.json()
        })
        .then(data => {
            var arrIds = []
            var index = 0
            for(var song of newState){
                arrIds.push(song.id)
            }
            while(newState.length<20 && index<data.length){
                if(!arrIds.includes(data[index].id)){
                    newState.push(data[index])
                }
                index++
            }
            setSongs(newState);
        })
    }
    async function updateSongs(song_id){
        var newState = []
        for(var song of songs){
            if(song.id !== song_id){
                newState.push(song)
            }
        }
        await getSongs(newState);
    }
    return (
        <div>
            <br/>
            {songs.map(song =>(
                <Song song={song} key={song.id} changed={updateSongs}/>
            ))}
        </div>
    );
}

export default SuggestSong;