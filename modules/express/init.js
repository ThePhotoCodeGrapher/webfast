module.exports = async function(program) {
    console.log(`Starting UP Express`);
    program.express = {
        ts : Date.now()
    }

    // Express and cors
    const express = require('express');
    const cors = require('cors');
    const bodyParser = require('body-parser');
    const port = 1221;
    const basePath = `/api`;
    
    // Run Express
    const app = express();

    // Setup Cors
    const corsOptions = {
        origin: '*', // or specify your allowed origins
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
        credentials: true,
        optionsSuccessStatus: 204,
    };
      
    // Use Core Options
    app.use(cors(corsOptions));

    // Set View Engine
    app.set('view engine', 'ejs');

    // Enable bodyparser
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));

    // Let's go through the folder routes and subdirectory
    const routesPath = program.path.join(__dirname,`routes`);

    let exprs = {};

    try {
        // Get routes for route path and setup the routes for express
        let routesData = await program.modules.walkDirectory(routesPath);

        // Loop Through routes
        for (let rI in routesData) {
            // Get the current route
            let route = routesData[rI];
            //console.log(`Route : `,route.path);

            let routePath = `${basePath}`
            // Loop Through sub and create path with basePath
            for (let s in route.sub) {
                routePath = `${routePath}/${route.sub[s]}`
            }

            // Check to split name
            const split = route.name.split(`.`);
            route.type = `get`;
            if (split.length > 1) {
                // we have a get or post
                route.type = split[split.length-1];
                route.name = split[0];
            }

            // FUll Route
            routePath = `${routePath}/${route.name}`;

            // Create Route UUID for easy findable
            const routeID = program.uuid.v4();

            // Setup ID
            route.tempID = routeID;

            // Setup the function
            try {
                route.func = require(route.path);
            } catch(err) {
                console.error(`Error Route Func`,routePath);
                console.error(err);
            }

            // Save route for path
            route.webwalk = 0;
            exprs[routePath] = route;

            console.log(`Setting Up Route`);
        }

        // Setted Up Routes
        program.express.routes = exprs;

        // Now we can setup the real shizzle for the post and get situation
        //req,res,program
        for (let route in exprs) {
            // Setup route
            let routeData = exprs[route];
            console.log(`Setup Route`,route);
            let state = false;
            try {
                // This is where the magic happens when we receive an incomming request it will 
                // route it through the dynamice route folder
                app[routeData.type](route,async (req,res) => {
                    try {
                        // Count walkthrough
                        exprs[route].webwalk++;

                        // Now passthrough func
                        await routeData.func(program,req,res,route);
                    } catch (err) {
                        console.error(`Error With Route:`,route);
                        console.error(err);
                    }
                });
                state = true;
            } catch (err) {
                console.error(err);
                console.error(`Error Setting Up Route`);
            }

            // Set state
            exprs[route].state = state;
        }

        console.log(`We have routes`);
    } catch (err) {
        console.error(err);
        console.error(`Error Routes`);
    }


    app.listen(port, () => {
        console.log(`Server Listening`,port,basePath);
    });
    
    program.express.app = app;
    return program;
}