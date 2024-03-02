console.log(`WebFast!`);
let web= {};
web.fast = {
    ts : Date.now(),
    action : function(data,ell) {
        console.log(`Action Function`,data,ell);
    },
    getCookieValue : function(cookieName) {
        let allCookies = document.cookie;
        let cookies = document.cookie.split("; ");
        for (let i = 0; i < cookies.length; i++) {
            let cookie = cookies[i].split("=");
            if (cookie[0] === cookieName) {
            return decodeURIComponent(cookie[1]);
            }
        }
        return null; // Cookie not found
    },
    redirect :async function(data) {
        console.log(`Received Redirect`,data.event);
        const state = data.event.type;
        if (state == true && web.fast.redirected == undefined) {
            // Redirect
            console.log(`Replace to : `, data.event.url);
            web.fast.redirected = Date.now();
            
            let replacedURL = data.event.url.replace(`https://`,``);
            if (data.event.full == true) {
                replacedURL = data.event.url;

            }
            // check if new hash
            const sendData = telegram.initData.replace(`__order`,``)
            
            const id = data.event.requestID;
            if (web.fast.user != undefined && jQuery(`[wbfst-frame="${id}"]`).length == 0 && data.event.full != true) {
                //const myUrl = new URL(data.event.url);
                //history.pushState({}, null, myUrl); // Update the URL without reloading the page
                //window.location.hash = window.location.hash.replace(`__order`,``);
                window.Telegram.WebView.onEvent(`back_button_pressed`, function(event){
                    console.log(`Back Button Event Pressed`,event);
                    const frame = jQuery(`[wbfst-frame="${id}"]`);
                    jQuery(frame).animate({ opacity:0 }, 600,function(){
                        jQuery(this).remove();
                    });
                    window.Telegram.WebApp.BackButton.hide();
                })
                await web.fast.telegram(`frame`).set(id,replacedURL,async function(id){
                    console.log(`Clicked Close`,id);
                    const frame = jQuery(`[wbfst-frame="${id}"]`);
                    console.log(`The Frame`,frame);
                    jQuery(frame).animate({ opacity:0 }, 600,function(){
                        jQuery(this).remove();
                    });
                    
                });
            }else if (data.event.full == true && web.fast.user != undefined) {
                // typeof order.state
                window.Telegram.WebApp.disableClosingConfirmation(false);
                window.Telegram.WebApp.close();
            } else {
                window.location.replace(data.event.url);
            }
        } else {
            //console.error(`Something wrong redirect`,data.event);
        }
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
    },
    telegram : function(action){
        // check if action is to set frame
        if (action == `frame`) {
            return {
                get : async function(id) {
                    console.log(`Get Frame for ID`,id);
                },
                close : async function(id) {
                    console.log(`Close Frame`);
                },
                set : async function(id,url,closeAction,zIndex = 9990) {
                    if (web.fast.user != undefined) {
                        //console.error(`NO USER`);
                        //return window.location.href = url;
                        window.Telegram.WebApp.HapticFeedback.impactOccurred('medium');
                    }
                    console.log(`Telegram Frame Set`,id,url,closeAction);
                    let iframe = document.createElement('iframe');
                    iframe.src = url; // Replace with your desired URL

                    const settedID = ``+id;
                    // Set additional attributes (optional)
                    iframe.style.border = 'none'; // Remove the border
                    iframe.style.width = '100vw'; // Set width to 100vw
                    iframe.style.height = '100vh'; // Set height to 100vh
                    iframe.style.top = '0'; // Set height to 100vh
                    iframe.style.left = '0'; // Set height to 100vh
                    iframe.style[`z-index`] = zIndex; // Set height to 100vh
                    iframe.id = settedID;

                    iframe.style.position = 'fixed';

                    // Append the iframe to the body
                    document.body.appendChild(iframe);
                    jQuery(iframe).attr(`id`,settedID);
                    jQuery(iframe).attr(`wbfst-frame`,settedID);

                    try {
                        //window.Telegram.WebApp.web_app_open_link(url);
                        if (web.fast.user != undefined) {
                            window.closeIframe = function() {
                                console.log(`Close Iframe`,id);
                                //jQuery(`#${id}`).hide();
                                closeAction(id);
                            } 
                        } else {
                            // Set on click event
                            if (closeAction != undefined) {
                                console.log(`Set Close Action`);
                                window.closeIframe = function() {
                                    console.log(`Close Iframe`,id);
                                    //jQuery(`#${id}`).hide();
                                    closeAction(id);
                                } 
                            }
                        }

                    } catch (err) {
                        console.error(err);
                        console.error(`Error opening link`,url);
                    }
                }
            }
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
// Split hash
const locSplit = window.location.hash.split(`__`);

//alert(locSplit);
if (telegram.initData == ``) {
    setData = `hybrid.institute.anonymous`
} else if (locSplit.length > 1 && locSplit[1] == `redirected`) {
    setData = telegram.initData.replace(`__order&`,`&`);
} else {
    setData = telegram.initData;
}
//alert(setData);

const socketURL = `wss://${webfastSocket.replace(`https://`,``)}socket.io/?qbt=${setData}`;

let countedError = 0;
// Assuming you have a variable `socketURL` containing your WebSocket URL
web.fast.connectWebSocket = function(socketURL,maxRetries = 40, retries = 0) {
    web.fast.createWebSocket = function(socketURL, maxRetries, retries) {
        const ws = new WebSocket(socketURL);
        web.fast.socket = ws;
        ws.onopen = () => {
            console.log('WebSocket connected');
            // Start other things (e.g., send initial data)
            web.fast.que.state = true;

            //alert(web.fast.tools.isMobile);
            var generateRandomId = async function(length) {
                var result = '';
                var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
                var charactersLength = characters.length;
                for (var i = 0; i < length; i++) {
                    result += characters.charAt(Math.floor(Math.random() * charactersLength));
                }
                return result;
            };

            function arraySend() {
                try {
                    if (web.fast.user != undefined && web.fast.inial == undefined || window.Telegram.WebApp.initData == `` && web.fast.inial == undefined) {
                        let arraySend = [];
                        jQuery(`[webfast-get]`).each(async function(){
                            const type =  jQuery(this).attr(`webfast-get`);
                            let  id = jQuery(this).attr(`id`);
                            console.log(`THE GET`);
                            if (id == undefined) {
                                id = await generateRandomId(8); // Generate a random ID of length 8
                            }
                            arraySend.push({
                                id : id,
                                type : type
                            })
                        })
                        console.log(`Send Array`,arraySend);
                        web.fast.tools.on.connect(arraySend);
                        } else {
                            if (countedError < 3) {
                                console.error(`Tried 10 times`);
                            } else {
                                console.error(`Try again`);
                                throw new Error(`error some send`);
                            }
                            
                        }
                } catch (err) {
                    setTimeout(function(){
                        arraySend();
                    },200);
                }
            }
            // send array
            arraySend();
            
        };

        ws.onmessage = (event) => {
            //console.log('Received:', event.data);
            // Handle received data
            // Check if type user then we will walk through the data to set the data for the user
            try {
            const json = JSON.parse(event.data);
            if (json.type == `user`) {
                // We have user data
                console.log(`Set User Data`);
                web.fast.user = json;
                
                // Now go Through to set all data
                // Get all webfast client
                jQuery(`[webfast-client]`).each(function(){
                    // Get type
                    const clientType = jQuery(this).attr(`webfast-client`);
                    console.log(`Client Type`);
                    // Check split
                    const split = clientType.replace(/ /g,``).split(`||`);

                    // set check
                    let setted = false;
                    for (let s in split) {
                        // Get value
                        let getValue = split[s];
                        // Get value from json.data
                        if (json.data[getValue] != undefined && setted == false) {
                            const toSetValue = json.data[getValue];
                            console.log(`Set Value`,toSetValue);
                            jQuery(this).html(toSetValue)
                            setted = true;
                        }
                    }
                })

                if (json.data.images != undefined) {
                    console.log(`Set Images`,json.data.images);
                    const oneImage = json.data.images[json.data.images.length-1];
                    console.log(oneImage);
                    jQuery(`[webfast-client="image"]`).each(function(){
                        console.log(`Setted`);
                        jQuery(this).css({
                            'background-image': `url(${oneImage})`,
                            'background-size': 'cover',
                            'background-position': 'center'
                        });
                    });
                }
            }

            web.fast.que.state = Date.now();
            web.fast.receive(`socket`,event.data); // Placeholder for processing response
            jQuery(document).ready(function(){
                try {
                    web.fast.tools.on.connect();
                } catch (err) {
                    console.error(`error getting connect data`);
                }
            })
            } catch (err) {
                console.error(`Error Receiving`);
                console.error(event);
            }
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
