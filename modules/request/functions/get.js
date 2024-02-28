module.exports = async function(program, url, body,headers) {
  console.log(`Fetch Post`);
  // Register websocket url
  try {
      if (headers == undefined) {
        headers = {
          accept: 'application/json',
          'content-type': 'application/json'
          }
      };

      let theOptions = {
          method: 'get',
          headers: headers,
          body: JSON.stringify(body),
      };

      if (body == undefined) {
        delete theOptions.body;
      }

      // Using standard fetch function
      const response = await fetch(url, theOptions);
        // Get response body
        const respBody = await response.json(); // Assuming the response is JSON

        // Get response headers
        const respHeaders = response.headers;

      if (!response.ok) {
          throw new Error(respBody);
      }

      const responseData = respBody;
      console.log('Response Data:', responseData);

      // Return response data or true to indicate success
      return responseData || true;
  } catch (err) {
      console.error('Error in get:', err.message);
      return false;
  }
};
