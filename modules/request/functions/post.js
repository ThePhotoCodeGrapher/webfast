module.exports = async function(program, url, body,headers) {
  console.log(`Fetch Post`);
  // Register websocket url
  try {
    if (headers == undefined) {
        headers = {
            accept: 'application/json',
            'content-type': 'application/json'
        };
    }

      let theOptions = {
          method: 'POST',
          headers: headers,
          body: JSON.stringify(body),
      };

      // Using standard fetch function
      const response = await fetch(url, theOptions);
        // Get response body
        const respBody = await response.json(); // Assuming the response is JSON

        // Get response headers
        const respHeaders = response.headers;

      if (!response.ok) {
        if (respBody.parameters != undefined) {
          // Probably some wait 
          if (respBody.parameters.retry_after != undefined) {
            const timeOUtAmount = respBody.parameters.retry_after * 1000*60; // for 1 minute if retry_ is 1 minute
            await setTimeout(async function(){
              return await program.modules.request.post(program,url,body,headers);
            },timeOUtAmount);
          }
        } else {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
      }

      const responseData = respBody;
      console.log('Response Data:', responseData);

      // Return response data or true to indicate success
      return responseData || true;
  } catch (err) {
      console.error('Error in post:', err.message);
      return false;
  }
};
