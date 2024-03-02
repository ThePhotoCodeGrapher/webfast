module.exports = async function(program,json) {
    console.log(`Pocess Startup`);
    // Process startup for mollie
    if (!json.active) {
        return false;
    }

    if (json.url[json.url.length-1] == `/`) {
        json.url = json.url.slice(0, -1)
    }

    // When active startup process by indexing functions
    const functionPath = program.path.join(json.path,`functions`);
    console.log(`Function Path`);
    let restArray = {
        get : async function(url,params) {
            console.log(`GET`);

            // Process params for url
            let count = 0;
            for (let param in params) {
                console.log(`Param ${param}`);
                if (count == 0) {
                    url += `?`;
                } else {
                    url += `&`
                }
                url += `${param}=${params[param]}`;
                count++;
            }

            const data = await program.modules.request.get(program, url, undefined, {
                'Authorization': `Bearer ${json.key}`
            })

            return data;
        },
        post : async function(url,params) {
            console.log(`POST`);

        }
    }

    // Start sync
    //https://api.frankfurter.app/latest?to=EUR%2CUSD
    restArray.currencySync = async function() {
        const data = await program.modules.request.get(program, `https://api.frankfurter.app/latest`);
        // process
        console.log(`Process Data`);
        data.ts = Date.now();
        program.tmp.currency = data;
    }
    restArray.int = setInterval(function(){
        console.log(`Set INterval`);
        restArray.currencySync();
        console.log(Date.now(),program.tmp.currency);
    },14 * 60 * 1000)
    
    // Sync Onces
    await restArray.currencySync();

    // In init we want to do the get request
    const getURL = `${json.url}/v2/methods/all`
    const requestUSD = await restArray.get(getURL,{
        locale : "en_US",
        'amount[value]'  :  "100.00",
        'amount[currency]'  :  "USD",
        "include"       :   "pricing"
    })

    const requestEU = await restArray.get(getURL,{
        locale : "en_US",
        'amount[value]'  :  "100.00",
        'amount[currency]'  :  "EUR",
        "include"       :   "pricing"
    })

    // Process both
    // Check who bigger then other
    let mainLoop;
    let subLoop;
    if (requestEU.count > requestUSD.count) {
        mainLoop = requestEU._embedded.methods;
        subLoop = requestUSD._embedded.methods;
    } else {
        mainLoop = requestUSD._embedded.methods;
        subLoop = requestEU._embedded.methods;
    }

    // Make paymentArray 
    let payar = {}

    // Set to arrays
    // Loop Through main
    const loopthrough = [mainLoop,subLoop];
    for (let l in loopthrough) {
        let currentLoop = loopthrough[l];
        for (let nm in currentLoop) {
            const itemData = currentLoop[nm];

            // Set data
            if (itemData.status == undefined) {
                continue;
            }
            if (payar[itemData.id] == undefined) {
                payar[itemData.id] = {
                    desc : itemData.description,
                    status : itemData.status,
                    res : itemData.resource,
                    images : itemData.image,
                    currency : {},
                    pricing : {
                        items : itemData.pricing
                    }
                }
            }

            // Now loop through pricing to see max and min
            let allPricing = [];

            let maxPers = 0;
            let minPers = 0;
            let maxFix = 0;
            let minFix = 0;
            let pricingCurrency = [];
            for (let prI in itemData.pricing) {
                // get item
                const pricing = itemData.pricing[prI];

                let setPricing = {};

                for (let key in pricing) {
                    switch (key) {
                        case `variable`:
                            const thePerc = Number(pricing[key]);
                            if (thePerc > maxPers) {
                                maxPers = thePerc;
                            }
                            if (thePerc < minPers || minPers == 0) {
                                minPers = thePerc;
                            }
                            setPricing.percentage = thePerc;
                        break;
                        case `fixed`:
                            const fixPrice = Number(pricing[key].value);
                            // Set fix price
                            if (fixPrice > maxFix) {
                                maxFix = fixPrice;
                            }
                            if (fixPrice < minFix || minFix == 0) {
                                minFix = fixPrice;
                            }
                            pricing[key].value = Number(pricing[key].value);
                            setPricing[key] = pricing[key];

                            // check if in array
                            if (pricingCurrency.indexOf(pricing[key].currency) == -1) {
                                pricingCurrency.push(pricing[key].currency)
                            }
                        break;
                        default:
                            console.log(`Set Just: ${key}`);
                            setPricing[key] = pricing[key];
                    }
                }
                allPricing.push(setPricing);
            }
            console.log(`We have all pricing per item now`);
            itemData.pricing = {
                all : allPricing,
                perc : {
                    min : minPers,
                    max : maxPers
                },
                fix : {
                    min : minFix,
                    max : maxFix
                },
                currencies : pricingCurrency
            }
            payar[itemData.id].pricing = itemData.pricing;

            // Now grab currency
            const currency = {
                max : itemData.maximumAmount.value,
                min : itemData.minimumAmount.value
            };

            if (payar[itemData.id].currency[itemData.minimumAmount.currency] == undefined) {
                payar[itemData.id].currency[itemData.minimumAmount.currency] = currency;
            } else {
                console.error(`Currency already set`);
            }
        }
    }

    restArray.methods = payar;

    return restArray;
}