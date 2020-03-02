import React from 'react';
import './HeaderOfLetters.css';
import { Link } from 'react-router-dom';

function HeaderOfLetters() {
    var letters = ["0-9"]
    for(var charLetter='A'.charCodeAt(0); charLetter<'Z'.charCodeAt(0)+1; charLetter++){
        letters.push(String.fromCharCode(charLetter))
    }

  return (
    <header id="startWith">
        <ul>
            {letters.map(letter => (
                <li key={letter}><Link to={'/artists/' + letter} >{letter}</Link></li>
            ))}
        </ul>
    </header>
  );
}

export default HeaderOfLetters;
