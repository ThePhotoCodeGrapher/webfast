module.exports = {
    dependOn : [`modules.request.get`],
    name : 'payment-sync',
    run : async function(program,name) {
        console.log(`Running ${name}`);

        // Lets make a mockup for providers
        const routesPath = program.path.join(__dirname,`providers`);
        let moduleData = await program.modules.walkDirectory(routesPath);
        
        // Set Module
        let setModule = {
            ts : Date.now()
        }

        // loop Throuh module data 
        for (let moduleIndex in moduleData) {
            // Get the module
            let module = moduleData[moduleIndex];
            // Create module in setModule
            try {
                // We have set module
                // read startup file
                const mainModulePath = program.path.join(routesPath,`${module.name}`);
                const startupPath = program.path.join(mainModulePath,`startup.js`);

                // Check if program set path
                if (program.set.path == undefined) {
                    continue;
                }
                //const configRead = JSON.parse(program.fs.readFileSync(program.path.join(program.set.path,`payment.config.json`),`UTF-8`));
                const configRead = {
                    "mollie"    :   {
                        "active"    :   Boolean(process.env.MOLLIE_ACTIVE),
                        "key"       :   process.env.MOLLIE_KEY,
                        "partnerId" :   process.env.MOLLIE_PARTNER_ID,
                        "profileId" :   process.env.MOLLIE_PROFILE_ID,
                        "url"       :   process.env.MOLLIE_URL
                    }
                };
                // Read
                const json = configRead[module.name];
                if (json == undefined) {
                    throw new Error(`NO JSON data found payment config ${module.name}`);
                }
                json.path = mainModulePath;
                json.name = module.name;
                setModule[module.name] = await require(startupPath)(program,json);
            } catch (err) {
                console.error(`Error Setting Module Data`,module.name);
                console.error(err);
            }
        }
        
        // Put in program modules
        //program.modules.request = setModule;
        
        // Here we can do whatever like grab modules for generator and represent them here
        return setModule;
    }
}