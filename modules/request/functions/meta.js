module.exports = async function(program, url, callback,ws,json) {
  console.log(`Meta get`);
  // Register websocket url
  try {
    await program.fetch.fetchUrl(url, {}, function(error, meta, body) {
        if (error) {
            console.error('Error fetching URL:', error);
        } else {
            console.log('Metadata:', meta);
            const bodyString = body.toString('utf8'); // Convert buffer to string
            console.log('Body data:', bodyString);
            const metaRegex = /<meta[^>]*>/gi;
            const metaTags = bodyString.match(metaRegex);
            
            const metaObjects = metaTags.reduce((result, tag) => {
                const matches = tag.match(/(name|property)\s*=\s*"([^"]*)"\s*content\s*=\s*"([^"]*)"/i);
                if (matches && matches.length === 4) {
                    const property = matches[2];
                    const content = matches[3];
                    result[property] = content;
                }
                return result;
            }, {});

            //console.log(metaObjects);

            let metas = {}
            const metaSend = [`og:title`,`og:description`,`og:image`,`al:ios:url`,`al:android:url`]
            // Create object loop
            function decodeHtmlEntities(str) {
                return str.replace(/&#(\d+);/g, function(match, dec) {
                    return String.fromCharCode(dec);
                });
            }
            
            const filteredMetaObjects = Object.keys(metaObjects).reduce((result, key) => {
                if (metaSend.includes(key)) {
                    result[key] = decodeHtmlEntities(metaObjects[key]);
                }
                return result;
            }, {});

            metas = filteredMetaObjects;
            console.log(`Metas`,metas);

            if (callback != undefined) {
                return callback(metas,ws,json);
            } else {
                return bodyString;
            }
        }
    });
  } catch (err) {
      console.error('Error in post:', err.message);
      return false;
  }
};
