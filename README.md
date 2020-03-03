In order to run MusicApp

Requirements:
1. MariaDB which is available at https://mariadb.com/downloads/
2. Node.js webserver (https://nodejs.org/en/) 

Installation:
Run the following commands from the command line in the main folder of this project:
1. 'npm run installmusicapp'
2. 'node initializeDatabase.js -u \\username\\ -p \\password\\'
  where you fill in the credentials for an account of MariaDB with has the privileges to create a database, setting global settings (only needed if there won't be enough connections), creating users, granting select, insert, update, delete and drop privileges to the database, creating tables and setting foreign keys.
3. You can import a data set from this project by running 'node importMusic.js'. This will import all data from the file music.txt.
  
Starting:
Run 'npm run musicapp' from the command line in the main folder of this project. The server will be listening to port 8800.
The default credentials to log in as admin are: username: admin, password: PassWordMusicApp!. This credentials can be changed in InitializeDatabase.js
On the admin page you can add new artists, songs or albums to the database or you can add the spotify url for some artist so you can update the discography of this artist with one click. This will use credentials in order to send a request to an API of spotify. This can be changed in the file admin/externalCredentials.js.

Users can like songs, dislike songs and follow artists. They get updates when there are new songs of artists that they follow since their last login. Users can also discover new songs and artists via the suggestions page. These suggestions are based on the preferences of the users. The server will create an ordered list where the ordering is based on a weight sum where the weight is based on the number of times the song is liked by another user with a similar interest and it will have weight equal to the amount of similarities of interest between the logged in user and every other user. There is a similar algorithm for creating suggestions for artists to follow.

Users can only use all the functionality of the MusicApp when they are logged in. After the registration their credentials will be saved in the database. The password is first salted and hashed using Hmac with sha512 before saving it. After login the user will receive a jwt that will be used for verification. The implementation of this process can be found in the file userdata.js