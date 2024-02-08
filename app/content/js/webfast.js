console.log(`WebFast!`);
window.WebFast = {
    ts : Date.now()
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

try {
    new WebSocket(socketURL,`test`,{
        timeout : 0
    });

    // Start the other things
    //alert(telegram.initData);
} catch (err) {
    alert(`Err`);
    console.error(err);
}

// On Ready desable all forms with jquery
jQuery(document).ready(function() {
    jQuery('form').submit(function(e) {
        e.preventDefault(); // Prevent the default form submission
        
        // Check what to do like socketpath
        alert(`Form Submit`);
        return false;
    });
});
