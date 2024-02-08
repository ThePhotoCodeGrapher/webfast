module.exports = async function (program) {
  console.log(`Starting UP Express`);
  program.express = {
      ts: Date.now(),
  };

  const express = require('express');
  const cors = require('cors');
  const bodyParser = require('body-parser');
  const WebSocket = require('ws');
  const crypto = require(`crypto`)
  const port = 1221;
  const basePath = `/api`;

  const app = express();

  const corsOptions = {
      origin: '*',
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
      credentials: true,
      optionsSuccessStatus: 204,
  };

  app.use(cors(corsOptions));
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));
  app.set('view engine', 'ejs');

  let routesPath = program.path.join(__dirname, `routes`);
  // Check if custom routes path
  if (program.set.path != undefined) {
      routesPath = program.path.join(program.set.path, `routes`);
  }

  let exprs = {};

  try {
      let routesData = await program.modules.walkDirectory(routesPath);

      for (let routeData of routesData) {
          let routePath = `${basePath}/${routeData.name}`;

          const split = routeData.name.split('.');
          routeData.type = split.length > 1 ? split[split.length - 1] : 'get';
          routeData.name = split.length > 1 ? split[0] : routeData.name;

          const routeID = program.uuid.v4();
          routeData.tempID = routeID;

          try {
              const stats = await program.fs.statSync(routeData.path);
              const isDirectory = stats.isDirectory();

              if (isDirectory) {
                  for (let subData of routeData.sub) {
                      if (subData !== undefined) {
                          const routeName = subData.name.replace('.get', '').replace('.post', '');
                          const subDataSplit = subData.path.split('.');
                          const type = subDataSplit[subDataSplit.length - 2];

                          subData.name = routeName;
                          delete subData.sub;
                          subData.type = type;

                          subData.func = require(subData.path);
                          exprs[routePath + '/' + routeName] = subData;
                      }
                  }
              } else {
                  routeData.func = require(routeData.path);
                  exprs[routePath] = routeData;
              }
          } catch (err) {
              console.error(`Error Route Func`, routePath);
              console.error(err);
          }

          routeData.webwalk = 0;
      }

      program.express.routes = exprs;

      for (let route in exprs) {
          let routeData = exprs[route];
          let state = false;

          try {
              app[routeData.type](route, async (req, res) => {
                  try {
                      exprs[route].webwalk++;

                      // Get body
                      const requestBody = req.body;
                      const reqParams = req.params;

                      await routeData.func(program, req, res, route, requestBody, reqParams);
                  } catch (err) {
                      console.error(`Error With Route:`, route);
                      console.error(err);
                  }
              });
              state = true;
          } catch (err) {
              console.error(err);
              console.error(`Error Setting Up Route`);
          }

          exprs[route].state = state;
      }

      console.log(`Routes are set up successfully`);
  } catch (err) {
      console.error(err);
      console.error(`Error Setting Up Routes`);
  }

  program.express.app = app;

  // Let app listen for content
  app.get(`/app/content/ton/manifest.json`, async (req, res) => {
      // Let's create a json
      const manifest = {
          url: process.env.url,
          name: process.env.name,
          iconUrl: process.env.image
      };

      res.setHeader('Content-Type', 'application/json');
      res.json(manifest);
  });

  app.get(`/app/content/:type/:file`, async (req, res) => {
      console.log(`Content Get`);
      // Try To get file from content folder
      try {
          const filePath = program.path.join(__dirname, `..`, `..`, `app`, `content`, req.params.type, req.params.file);
          let contentFolder = filePath;

          // Check if minify at the end
          const fileName = req.params.file;
          const isMinified = /-min\.js$/.test(fileName);

          if (isMinified) {
              console.log(`${fileName} ends with -min.js`);
              const toRequestFile = req.params.file.replace(`-min.js`, `.js`);
              contentFolder = program.path.join(__dirname, `..`, `..`, `app`, `content`, req.params.type, toRequestFile);
          } else {
              console.log(`${fileName} does not end with -min.js`);
          }

          res.sendFile(contentFolder);
      } catch (err) {
          console.error(err);
          console.error(`Error Getting : ${req.params.type}`, req.params.file);
      }
  })

  app.listen(port, () => {
      console.log(`Server Listening`, port, basePath);
  });

  program.express.url = {
      adaptive: {
          get: [],
          post: [],
      },
      set: function (requestPath, actionType, callback) {
          program.express.url.adaptive[actionType] = app[actionType](requestPath, async (req, res) => {
              let run = await callback(req, res, req.body, req.params);
              return run;
          });
          return true;
      },
  };

  program.express.setted = true;

  let clients = new Map();
  // Start socket thingy
  const PORT = process.env.socket || 3000;
  const wss = new WebSocket.Server({ port: PORT });

 
  wss.on('connection', (ws, req) => {
    console.log(`Socket Connected`);

    // Generate a unique ID for the WebSocket connection
    const clientId = program.uuid.v4();
    const reqURL = req.url;
    console.log(`We have some data`, reqURL);
    const queryStringWithoutQBT = reqURL.replace('/socket.io/?qbt=', '');
    const queryParamsArray = queryStringWithoutQBT.split('&');

    const parsedQuery = queryParamsArray.reduce((acc, param) => {
        const [key, value] = param.split('=');
        acc[key] = decodeURIComponent(value);
        return acc;
    }, {});

    // Extract data from the parsed query
    const { auth_date, query_id, user, hash } = parsedQuery;

    // Stringify the 'user' field if it contains JSON data
    if (user != undefined) {
        try {
            parsedQuery.user = JSON.stringify(parsedQuery.user);
        } catch (error) {
            console.error('Error parsing JSON in user field:', error);
        }
    }

    // Construct the data check string
    const sortedKeys = Object.keys(parsedQuery).sort();
    const data_check_string = sortedKeys.map(key => `${key}=${String(parsedQuery[key])}`).join('\n');

    function HMAC_SHA256(data, key) {
        const hmac = crypto.createHmac('sha256', key);
        hmac.update(data);
        return hmac.digest('hex');
    }

    const bot_token = process.env.telegram; // replace with your actual bot token
    const secret_key = HMAC_SHA256(bot_token, 'WebAppData');
    const calculated_hash = HMAC_SHA256(data_check_string, secret_key);

    const received_hash = hash; // replace with the actual received hash

    if (calculated_hash === received_hash) {
        // Data is from Telegram and has not been tampered with
        // Additional check for auth_date if needed
        const currentUnixTimestamp = Math.floor(new Date().getTime() / 1000);
        if (parseInt(auth_date, 10) <= currentUnixTimestamp) {
            // Data is not outdated
            // Use the validated data as needed
            console.log('Data from Telegram is valid');
        } else {
            console.error('Received data is outdated');
        }
    } else {
        console.error('Received data has been tampered with');
    }

    console.log(parsedQuery);

    // Store the WebSocket connection with its ID in the map
    clients.set(clientId, ws);

    // Send the client ID to the connected client
    ws.send(JSON.stringify({ type: 'clientId', id: clientId, params: parsedQuery }));

    // Set up a ping interval to keep the connection alive
    const pingInterval = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
            ws.ping();
        } else {
            // If the connection is closed, remove it from the map
            clearInterval(pingInterval);
            clients.delete(clientId);
            console.log(`Removed disconnected socket with ID: ${clientId}`);
        }
    }, 5000); // Adjust the interval as needed

    ws.on('close', () => {
        console.log(`Socket Disconnected`);
        clearInterval(pingInterval);
        clients.delete(clientId);
    });

    // WebSocket on message event
    ws.on('message', async (message) => {
        console.log(`Received message from ${clientId}: ${message}`);

        try {
            // Check for function
            const json = JSON.parse(message.toString(`utf-8`));
            const data = json.message;
            const path = json.path;
            const split = path.split(".")
            
            // Check if function is running in program modules that you can add in the init scirpt when using remote
            if (program.modules.receive != undefined) {
                try {
                    let resp = await program.modules.process[path[0]][path[1]][path[2]](program,ws,json,data,path);
                    if (resp != false) {
                        ws.send(JSON.stringify(resp));
                    }
                } catch (err) {
                    console.error(`Error Running receive`);
                    ws.send(JSON.stringify({
                        ts : Date.now(),
                        error : true,
                        message : `Error Event Program receive`
                    }));
                }
            }

            // Add your custom on message logic here
            // For example, you can broadcast the message to all connected clients
            clients.forEach((client, id) => {
                if (client.readyState === WebSocket.OPEN && id !== clientId) {
                    //ws.send(`Broadcast from ${clientId}: ${message}`);
                }
            });

            // Check if 
        } catch(err) {
            console.error(`Error Something`);

        }
    });
});


  return program;
};
