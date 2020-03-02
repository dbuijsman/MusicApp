const request = require('request')

let tokenSpotify;
module.exports = {
    /**
     * 
     * @returns {string} Spotify Acces Token.
     */
    getTokenSpotify: async function(){
            if(!tokenSpotify){
                await getNewTokenSpotify();
            }
            return tokenSpotify
    },
    /**
     * Updates tokenSpotify 
     */
    updateTokenSpotify: async function(){
        getNewTokenSpotify()
    }
};
/**
 * Gets a Spotify Acces Token.
 * @returns {Promise<string>} Spotify Acces Token.
 */
function getNewTokenSpotify(){
    return new Promise(async function(resolve, reject){
        var clientID = "f023a4ae66bc43f684d0a4210134ffa9"
        var clientSecret = "d51754885397478093b97aa4b2f65721"
        var credsToGetToken = clientID + ":" + clientSecret
        base64Cred = Buffer.from(credsToGetToken).toString('base64')
        const options = {
            url: "https://accounts.spotify.com/api/token",
            headers: {
                'Authorization': 'Basic ' + base64Cred
            },
            form: {"grant_type":"client_credentials"}
        };
        try{
            request.post(options, async function(error,response,body){
                var data = JSON.parse(body)
                if(data.error){
                    throw new Error(data.error.message)
                }
                tokenSpotify = data.access_token
                resolve(tokenSpotify)
            })
        }
        catch(error){
            reject(error)
        }
    })
}
