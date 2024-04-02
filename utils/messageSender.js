
const axios = require('axios')
require('dotenv').config()

const messageSender = async (phone, body)=>{
    try {
      let config = {
        method: 'get',
        url: `http://`+ process.env.smsUrl  + process.env.smsPassword +`&type=text&senderid=`+ process.env.smsUserName + `&number=${phone}&message=${encodeURIComponent(body)}`,
        headers: { 
        },
      };
      axios.request(config)
.then((response) => {
  console.log("[INFO] ", response.data );
})
.catch((error) => {
  console.log("[ERROR] " + error);
});
} catch (e) { console.log("[ERROR] " + e)}}

module.exports = messageSender;