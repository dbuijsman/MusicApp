import React, { useEffect, useState} from 'react';
import Artist from '../Artist/Artist';

function SuggestArtist() {
    const [artists, setArtists] = useState([]);
    useEffect(() => {
        getArtists([]);
    },[]);
    const getArtists = async(newState) => {
        await fetch('/api/suggest/artist')
        .then(data => {
            return data.json()
        })
        .then(data => {
            var arrIds = []
            var index = 0
            for(var artist of newState){
                arrIds.push(artist.id)
            }
            while(newState.length<20 && index<data.length){
                if(!arrIds.includes(data[index].id)){
                    newState.push(data[index])
                }
                index++
            }
            setArtists(newState)
        })
    }
    async function updateArtists(artist_id){
        var newState = []
        for(var artist of artists){
            if(artist.id !== artist_id){
                newState.push(artist)
            }
        }
        await getArtists(newState);
    }

    return (
        <div>
            <br/>
            {artists.map(artist =>(
                <Artist artist={artist} key={artist.id} changed={updateArtists}/>
            ))}
        </div>
    );
}

export default SuggestArtist;