module.exports = async function(program, url, body) {
  console.log(`Fetch Post`);
  // Register websocket url
  try {
      const headers = {
          accept: 'application/json',
          'content-type': 'application/json'
      };

      let theOptions = {
          method: 'POST',
          headers: headers,
          body: JSON.stringify(body),
      };

      // Using standard fetch function
      const response = await fetch(url, theOptions);

      if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const responseData = await response.json();
      console.log('Response Data:', responseData);

      // Return response data or true to indicate success
      return responseData || true;
  } catch (err) {
      console.error('Error in post:', err.message);
      return false;
  }
};
