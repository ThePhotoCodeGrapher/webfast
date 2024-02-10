console.log(`WebFast!`);
let web= {};
web.fast = {
    ts : Date.now(),
    action : function(data,ell) {
        console.log(`Action Function`,data,ell);
    },
    functions : {
        isURL : function(str) {
            // Regular expression to check if a string is a URL
            var pattern = new RegExp('^(https?:\\/\\/)?'+ // protocol
                '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+ // domain name
                '((\\d{1,3}\\.){3}\\d{1,3}))'+ // OR ip (v4) address
                '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ // port and path
                '(\\?[;&a-z\\d%_.~+=-]*)?'+ // query string
                '(\\#[-a-z\\d_]*)?$','i'); // fragment locator
            return pattern.test(str);
        },
        form : function(data,ell) {
            console.log(`Handle Form Function`);
        },
        list : function(data) {
            console.log(`When we have a list function run`);
            console.log(data);
            // Get ellement data
            const ellData = web.fast.tmp.list[data.ell];

            // So we have the html
            const ell = ellData.ell;
            
            // Now loop through list item
            for (let listI in data.list) {
                const listItem = data.list[listI];
                const uuid = `${listItem.uuid}`;
                delete listItem.uuid;
                console.log(uuid,`The List Item`,listItem);
                const div = jQuery(ellData.html).clone();
                jQuery(div).attr(`id`,uuid);

                // Now check for listitem
                for (let key in listItem) {
                    // Now we have listitems
                    let itemList = listItem[key];

                    // Get item
                    console.log(`The Item List`);
                    console.log(itemList);
                    const setText = itemList.text;
                    jQuery(div).find(`[webfast-ell="${key}"]`).each(function() {
                        var elementType = $(this).prop('tagName').toLowerCase();
                        console.log(`Set Element`, elementType);
                        switch (elementType) {
                            case 'img':
                                if (isURL(setText)) {
                                    $(this).attr('src', setText); 
                                } else {
                                    console.error(`List missing URL for image`);
                                }

                                break;
                            case 'input':
                                $(this).val(setText);
                                break;
                            default:
                                $(this).html(setText);
                                break;
                        }
                    });
                    
                }

                jQuery(ell).append(div);
            }
        }
    },
    que : {
        list : [],
        state : false,
        run : function(count){
            // Grab first before sending
            item = web.fast.que.list[0];
            if (item != undefined) {
                delete web.fast.que.list[0];
                web.fast.que.list.slice(1);
                console.log(`Sending Item`,item);
                
                web.fast.socket.send(JSON.stringify(item)); // Send data to the server
            }
        }
    },
    tmp : {
        int : {},
        list: {}
    },
    socket : undefined,
    process : {
        list : function(data) {
            console.log(`Processing List`);
        }
    }
}
// Connect to the Socket.IO server
const telegram = window.Telegram.WebApp;
// Step 1: Parse the query string
if (webfastSocket == undefined) {
    webfastSocket = window.location.host;
}

let setData;
if (telegram.initData == ``) {
    setData = `hybrid.institute.anonymous`
} else {
    setData = telegram.initData;
}

const socketURL = `wss://${webfastSocket.replace(`https://`,``)}socket.io/?qbt=${setData}`;

// Assuming you have a variable `socketURL` containing your WebSocket URL
web.fast.connectWebSocket = function(socketURL,maxRetries = 40, retries = 0) {
    web.fast.createWebSocket = function(socketURL, maxRetries, retries) {
        const ws = new WebSocket(socketURL);
        web.fast.socket = ws;
        ws.onopen = () => {
            console.log('WebSocket connected');
            // Start other things (e.g., send initial data)
            web.fast.que.state = true;
        };

        ws.onmessage = (event) => {
            //console.log('Received:', event.data);
            // Handle received data
            web.fast.que.state = Date.now();
            web.fast.receive(`socket`,event.data); // Placeholder for processing response
        };

        ws.onclose = (event) => {
            web.fast.que.state = false;
            if (retries < maxRetries) {
                retries++;
                console.log(`WebSocket closed. Retrying in 10 seconds...`);
                setTimeout(web.fast.createWebSocket(socketURL,maxRetries,retries), 10000); // Retry after 10 seconds
            } else {
                console.log(`WebSocket connection failed after ${maxRetries} attempts.`);
                // Handle failure (e.g., show an error message)
            }
        };

        ws.onerror = (error) => {
            console.error('WebSocket error:', error);
            // Handle error (e.g., show an error message)
            web.fast.que.state = false;
        };

        // Send message to path for example api.example.event
        web.fast.sendMessage = function(path,message) {
            // Add to que
            web.fast.que.list.push({
                path : path,
                message : message});
        }
    };

    web.fast.createWebSocket(socketURL, maxRetries, retries); // Initial connection
}

// Call the function to start the WebSocket connection
web.fast.receive = function(data,message) {
    // Placeholder for processing the received data
    // Implement your logic here (e.g., update UI, handle specific messages)
    //console.log('Processing received data:', data,message);
    const json = JSON.parse(message);
    switch (data) {
        case `socket`:
            // Socket Data response
            // Check if js
            if (json.js) {
                try {
                    eval(json.js);
                } catch (err){
                    console.error(`Error Running Message js`);
                }
            }

            // Check if there is any func or something
            if (json.func != undefined) {
                // Run this func with the data
                console.log(`Run Function`,`web.fast.${json.func}`);
                try {
                    eval(`web.fast.${json.func}`)(json.data)
                } catch (err) {
                    console.error(`Error with running dynamic function`);
                    console.error(err);
                }
            }
        break;
    }
}

// On Ready desable all forms with jquery
jQuery(document).ready(function() {

    // Make function
    web.fast.tmp.int.que = setInterval(function(){
        // This is the function
        if (web.fast.que.state != false && web.fast.que.list.length > 0) {
            // State check
            web.fast.que.run();
        }
    },10);

    // Scan for all webfast ellements
    jQuery(`[webfast]`).each(function() {
        let elementType = jQuery(this).prop('nodeName');
        console.log('Element type:', elementType);

        // Get now the data 
        let webAction = jQuery(this).attr(`webfast`);
        let action = jQuery(this).attr(`webfast-${webAction}`);
        console.log(`Data Actions webAction, action`,webAction,action);

        // Create action runner
        // Check if id
        if (jQuery(this).attr(`id`) == undefined) {
            const array = new Uint32Array(1);
            window.crypto.getRandomValues(array);
            const randomValue = array[0];

            console.log(`Set UUID: ${randomValue}`);
            jQuery(this).attr(`id`,randomValue);
        }

        const id = jQuery(this).attr(`id`);
        
        switch (elementType) {
            case "FORM":
                jQuery(this).submit(function(e) {
                    e.preventDefault(); // Prevent the default form submission
                    
                    // Check what to do like socketpath
                    web.fast.action(action,this,e);
                    return false;
                });
            break;
            case "DIV":
                // We will do the div element part
                // check whyt type etc
                // Make request to server with websocket thingy
                // Set in QUE
                let other;
                console.log(`The Action`,action);
                if (action.split(`.`)[1] == `list`) {
                    other = {
                        type : action
                    }

                    // Create empty list 
                    const html = jQuery(this).html();
                    jQuery(this).html(``);
                    // Set List Event data
                    web.fast.tmp.list[id] = {
                        html : html, 
                        ell : this,
                        items : []
                    };

                    // Now scan all 
                    jQuery(html).find(`[webfast-ell]`).each(function(){
                        if (jQuery(this).attr(`id`) == undefined) {
                            const newArray = new Uint32Array(1);
                            window.crypto.getRandomValues(newArray);
                            const newRandom = newArray[0];

                            const name = jQuery(this).attr(`webfast-ell`);
                            console.log(`Set UUID: ${newRandom}`);
                            jQuery(this).attr(`id`,newRandom);
                            web.fast.tmp.list[id].items.push({
                                id : newRandom,
                                name : name
                            });
                        }
                    });

                    other.items = web.fast.tmp.list[id].items;
                    console.log(`We found some`);
                }

                const webFastFunc = jQuery(this).attr(`webfast-func`);

                // Create que instead of sending quick
                web.fast.que.list.push({
                    path : `socket.api.${webAction}`,
                    message : {
                        ts : Date.now(),
                        ell : jQuery(this).attr(`id`),
                        other : other,
                        action : action,
                        webAction : webAction,
                        function : webFastFunc
                    }
                })

            break;
            case "BUTTON":
                // Check button interaction
                console.error(`SETUP BUTTON INTERACTION`);
            break;
            default:
                console.error(`No Action for : ${elementType}`);
        }
    });

    // Connect to websocket
    web.fast.connectWebSocket(socketURL);
});
