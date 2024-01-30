module.exports = async function (program) {
    console.log(`Starting UP Express`);
    program.express = {
      ts: Date.now(),
    };
  
    const express = require('express');
    const cors = require('cors');
    const bodyParser = require('body-parser');
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
  
    const routesPath = program.path.join(__dirname, `routes`);
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

              await routeData.func(program, req, res, route,requestBody,reqParams);
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
    app.get(`/app/content/:type/:file`,async (req,res) => {
        console.log(`Content Get`);
        // Try To get file from content folder
        try {
            const filePath = program.path.join(__dirname,`..`,`..`,`app`,`content`,req.params.type,req.params.file);
            let contentFolder = filePath;

            // Check if minify at the end
            const fileName = req.params.file;
            const isMinified = /-min\.js$/.test(fileName);

            if (isMinified) {
                console.log(`${fileName} ends with -min.js`);
                const toRequestFile = req.params.file.replace(`-min.js`,`.js`);
                contentFolder = program.path.join(__dirname,`..`,`..`,`app`,`content`,req.params.type,toRequestFile);
            } else {
                console.log(`${fileName} does not end with -min.js`);
            }

            res.sendFile(contentFolder);
        } catch (err) {
            console.error(err);
            console.error(`Error Getting : ${req.params.type}`,req.params.file);
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
  
    return program;
  };
  