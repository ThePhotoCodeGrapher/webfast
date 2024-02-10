const path = require(`path`);
const contentPath = path.join(__dirname,`example`,`content`)
let setArray = {
    wget : '/usr/local/bin/wget',
    process : {
        ts : Date.now(),
        socket : {
            api : {
                list : function(program,ws,json,data,path) {
                    // Example to create process for websocket path action and process data
                    console.log(`Example of list process`);

                    function generateRandomText(length) {
                        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
                        let result = '';
                      
                        for (let i = 0; i < length; i++) {
                          result += characters.charAt(Math.floor(Math.random() * characters.length));
                        }
                      
                        return result;
                      }

                      
                    // Loop for example through 
                    let exampleData = {
                        list : [],
                        ell : data.ell,
                        action : data.action
                    }

                    const pushData = {};
                    for (let i in data.other.items) {
                        const item = data.other.items[i];
                        // We have itme
                        const id = item.id;
                        const key = item.name;

                        pushData[key] = {
                            id : id,
                            text : generateRandomText(10)
                        }
                    }

                    pushData.uuid = program.uuid.v4();
                    exampleData.list.push(pushData);

                    // Send websocket message create standard
                    const sendObject = {
                        func : data.function,
                        data : exampleData,
                        js : `console.log("RUN FROM BACKEND")`
                    }

                    // Sedn back to front-end 
                    //ws.send();
                    
                    return sendObject;
                }
            }
        }
    },
    contentPath : contentPath
};


let program = require(path.join(__dirname,`index.js`))(setArray);
console.log(`Required`);