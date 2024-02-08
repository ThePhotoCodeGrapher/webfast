console.log(`WebFast!`);
let web= {};
web.fast = {
    ts : Date.now(),
    action : function(data,ell) {
        console.log(`Action Function`,data,ell);
    },
    functions : {
        form : function(data,ell) {
            console.log(`Handle Form Function`);
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
        int : {}
    },
    socket : undefined
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
            console.log('Received:', event.data);
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
web.fast.connectWebSocket(socketURL);
web.fast.receive = function(data) {
    // Placeholder for processing the received data
    // Implement your logic here (e.g., update UI, handle specific messages)
    console.log('Processing received data:', data);
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
                if (action == `list`) {
                    other = {
                        type : action,
                        html : jQuery(this).html()
                    }
                }
                web.fast.sendMessage(`socket.api.${webAction}`,{
                    ts : Date.now(),
                    ell : jQuery(this).attr(`id`),
                    other : other
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
});
