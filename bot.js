﻿// requires
const discord = require('discord.io');
const request = require('request-promise');
const auth = require('./auth.json');
const insults = require('./insults.json');
const alienID = '407917731581657089';
const marketID = '413877823489703947';

// variable area
const Globals = {
    ogreLTCInfo: undefined,
    ogreBTCInfo: undefined,
    geckoInfo: undefined,
    pricePerMillion: undefined,
    litPrice: undefined,
    satPrice: undefined,
    networkInfo: undefined,
    networkQuery: undefined,
    avgTx: undefined,
    netHash: undefined,
    totalNodes: undefined,
    gainsEmoji: undefined,
};
const bot = new discord.Client({
    token: auth.token,
    autorun: true
});

// function to format numbers with commas like currency
function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// function to get random integer in a range
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}

// function to get random insult
function getInsult() {
    return insults[getRandomInt(0, insults.length)];
}  

// async block
async function update() {
    Globals.ogreLTCInfo = await getOgreLTCInfo();
    Globals.ogreBTCInfo = await getOgreBTCInfo();
    Globals.geckoInfo = await getGeckoInfo();
    Globals.networkQuery = await getNetworkInfo();
    if (Globals.networkQuery !== undefined) {
        Globals.networkInfo = Globals.networkQuery;
    } else {
        console.log("** Got undefined data from node")
    }
    Globals.totalNodes = await getTotalNodes();
    Globals.pricePerMillion = Globals.geckoInfo.current_price * 1000000;
    Globals.litPrice = Math.round(Globals.ogreLTCInfo.price * 100000000);
    Globals.satPrice = Math.round(Globals.ogreBTCInfo.price * 100000000);
    Globals.avgTx = Globals.networkInfo.tx_count / Globals.networkInfo.height;
    Globals.netHash = Globals.networkInfo.hashrate / 1000000;
    Globals.lamboPrice = 199800 / Globals.geckoInfo.current_price
    if (Globals.geckoInfo.price_change_percentage_24h > 0) {
        Globals.gainsEmoji = '📈';
    } else {
        Globals.gainsEmoji = '📉';
    }
}

// refreshes variables every 5s
async function init() {
    await update();
    setInterval(update, 5000);
}

// Initialize Discord Bot
(async () => {
    await init();
})()

// on log in
bot.on('ready', (evt) => {
    console.log(`** Connected, logged in as ${bot.username}-${bot.id} and listening for commands.`);
});

// error logging
bot.on('error', console.error);

/*
// logs every single event
bot.on('any', (event) => {
	console.log(event)
}); 
*/

// reconnect if disconected
bot.on('disconnect', function() {
	console.log("** Bot disconnected, reconnecting...");
	bot.connect()  //Auto reconnect
});

// on new member joining
bot.on('guildMemberAdd', (member) => {
    if (member.id === alienID) {
        console.log(`** Alien joined server, told him to go fuck himself`);
        bot.sendMessage({
            to: marketID,
            message: `${getInsult()} <@${member.id}>`
        });
    } else {
        console.log('** New member joined server, welcome message sent');
        bot.sendMessage({
            to: marketID,
            message: `Hey <@${member.id}>, welcome to TurtleCoin!`
        });
    }
});

// on message handling
bot.on('message', (user, userID, channelID, message, evt) => {
    // It will listen for messages that will start with `!`
    if (message[0] === '!') {
        const [cmd, args] = message.substring(1).split(' ');

        // difficulty command
        if (cmd === 'difficulty') {
            // check that none of the variables are undefined
            if (Globals.networkInfo.hashrate === undefined) {
                console.log('** Undefined difficulty requested');
                bot.sendMessage({
                    to: channelID,
                    message: 'Whoops! I\'m still gathering data for you, please try again later. 😄'
                });
            } else {
                console.log('** Current difficulty message sent');
                bot.sendMessage({
                    to: channelID,
                    message: `The current difficulty is **${numberWithCommas(Globals.networkInfo.hashrate * 30)}**`
                });
            }
        }

        // hashrate command
        if (cmd === 'hashrate') {
            // check that none of the variables are undefined
            if (Globals.netHash === undefined) {
                console.log('** Undefined hashrate requested');
                bot.sendMessage({
                    to: channelID,
                    message: 'Whoops! I\'m still gathering data for you, please try again later. 😄'
                });
            } else {
                console.log('** Current hashrate message sent');
                bot.sendMessage({
                    to: channelID,
                    message: `The current global hashrate is **${Globals.netHash.toFixed(2)} MH/s**`
                });
            }
        }   

        // height command
        if (cmd === 'height') {
            // check that none of the variables are undefined
            if (Globals.networkInfo.height === undefined) {
                console.log('** Undefined block height requested');
                bot.sendMessage({
                    to: channelID,
                    message: 'Whoops! I\'m still gathering data for you, please try again later. 😄'
                });
            } else {
                console.log('** Current block height message sent');
                bot.sendMessage({
                    to: channelID,
                    message: `The current  block height is **${numberWithCommas(Globals.networkInfo.height)}**`
                });
            }
        }   
        
        // help command
        if (cmd === 'help') {
            console.log('** Help menu message sent');
            bot.sendMessage({
                to: channelID,
                message: '\`\`\`!difficulty   :   Displays current difficulty.\n' +
                    '!hashrate     :   Displays current network hashrate.\n' +
                    '!height       :   Displays current block height.\n' +
                    '!help         :   Displays this menu.\n' +
                    '!mcap         :   Displays current market capitilization.\n' +
                    '!lambo        :   Displays current price of new lambo.\n' +
                    '!network      :   Displays network information.\n' +
                    '!price        :   Displays price information.\n' +
                    '!supply       :   Displays current network hashrate.\n\`\`\`'
            });
        }

        // lambo command
        if (cmd === 'lambo') {
            // check that none of the variables are undefined
            if (Globals.lamboPrice === undefined) {
                console.log('** Undefined lambo price requested');
                bot.sendMessage({
                    to: channelID,
                    message: 'Whoops! I\'m still gathering data for you, please try again later. 😄'
                });
            } else {
                console.log('** Current lambo price message sent');
                bot.sendMessage({
                    to: channelID,
                    message: `A 2019 Lamborghini Huracan costs roughly **${numberWithCommas(Globals.lamboPrice.toFixed(2))} TRTL**`
                });
            }
        }   

        // mcap command
        if (cmd === 'mcap') {
            // check that none of the variables are undefined
            if (Globals.networkInfo.height === undefined) {
                console.log('** Undefined market cap requested');
                bot.sendMessage({
                    to: channelID,
                    message: 'Whoops! I\'m still gathering data for you, please try again later. 😄'
                });
            } else {
                console.log('** Current market cap message sent');
                bot.sendMessage({
                    to: channelID,
                    message: `TurtleCoin's market cap is **$${numberWithCommas(Globals.geckoInfo.market_cap.toFixed(2))}** USD`
                });
            }
        }

         // network command
         if (cmd === 'network') {
            // check that none of the variables are undefined
            if (Globals.netHash === undefined || Globals.networkInfo === undefined || Globals.totalNodes === undefined) {
                console.log('** Undefined network info requested');
                bot.sendMessage({
                    to: channelID,
                    message: 'Whoops! I\'m still gathering data for you, please try again later. 😄'
                });
            } else {
                console.log('** Network info message sent');
                bot.sendMessage({
                    to: channelID,
                    embed: {
                        color: 3066993,
                        thumbnail: {
                            url: 'https://raw.githubusercontent.com/turtlecoin/turtlecoin.lol/master/images/favicons/apple-touch-icon-120x120.png',
                        },
                        fields: [{
                                name: "Stats",
                                value: `Network Hashrate: **${Globals.netHash.toFixed(2)} MH/s**\n` +
                                    `Current Height: **${numberWithCommas(Globals.networkInfo.height)}**\n` +
                                    `Total Nodes: **${numberWithCommas(Globals.totalNodes)}**`
                            },
                            {
                                name: "Transactions",
                                value: `Avg TX/Block: **${Globals.avgTx.toFixed(2)}**\n` +
                                    `TX in Mempool: **${numberWithCommas(Globals.networkInfo.tx_pool_size)}**`
                            }
                        ],
                        footer: {
                            text: 'MarketTalk © 2019 ExtraHash'
                        }
                    }
                });
            }
        }
        
        // price command
        if (cmd === 'price') {
            // check that none of the variables are undefined
            if (Globals.litPrice === undefined || Globals.satPrice === undefined || Globals.pricePerMillion === undefined || Globals.geckoInfo.price_change_percentage_24h === undefined || Globals.geckoInfo.total_volume === undefined || Globals.geckoInfo.market_cap === undefined || Globals.geckoInfo.circulating_supply === undefined) {
                console.log('** Undefined price info requested');
                bot.sendMessage({
                    to: channelID,
                    message: 'Whoops! I\'m still gathering data for you, please try again later. 😄'
                });
            } else {
                console.log('** Price info message sent');
                bot.sendMessage({
                    to: channelID,
                    embed: {
                        color: 3066993,
                        thumbnail: {
                            url: 'https://raw.githubusercontent.com/turtlecoin/turtlecoin.lol/master/images/favicons/apple-touch-icon-120x120.png',
                        },
                        fields: [{
                                name: "Rank",
                                value: `${Globals.geckoInfo.market_cap_rank}`
                            },
                            {
                                name: "Price",
                                value: `TRTL/LTC: **${Globals.litPrice.toFixed(0)} litoshi**\n` +
                                    `TRTL/BTC: **${Globals.satPrice.toFixed(0)} satoshi**\n` +
                                    `USD Per Million: **$${Globals.pricePerMillion.toFixed(2)}**`
                            },
                            {
                                name: `Movement ${Globals.gainsEmoji}`,
                                value: `24h Change: **${Globals.geckoInfo.price_change_percentage_24h.toFixed(2)}%**\n` +
                                    `24h Volume: **$${numberWithCommas(Globals.geckoInfo.total_volume.toFixed(2))}**\n` +
                                    `Market Cap: **$${numberWithCommas(Globals.geckoInfo.market_cap.toFixed(2))}**\n` +
                                    `Current Supply: **${numberWithCommas(Globals.geckoInfo.circulating_supply)} TRTL**`
                            }
                        ],
                        footer: {
                            text: 'MarketTalk © 2019 ExtraHash'
                        }
                    }
                });
            }
        }

        // supply command
        if (cmd === 'supply') {
            // check that none of the variables are undefined
            if (Globals.networkInfo.height === undefined) {
                console.log('** Undefined supply requested');
                bot.sendMessage({
                    to: channelID,
                    message: 'Whoops! I\'m still gathering data for you, please try again later. 😄'
                });
            } else {
                console.log('** Supply message sent');
                bot.sendMessage({
                    to: channelID,
                    message: `The current circulating supply is **${numberWithCommas(Globals.geckoInfo.circulating_supply)}** TRTL`
                });
            }
        } 
        
        // whine command
        if (cmd === 'whine') {
            console.log('** Told someone to nut up and stop being a sniveling bitch');
            bot.sendMessage({
                to: channelID,
                message: 'Don\'t be such a sniveling little bitch.'
            });
        } 

    }
});

// get LTC Info from TradeOgre
async function getOgreLTCInfo() {
    const requestOptions = {
        method: 'GET',
        uri: 'https://tradeogre.com/api/v1/ticker/LTC-TRTL',
        headers: {},
        json: true,
        gzip: true
    };
    try {
        const result = await request(requestOptions);
        //console.log(result);
        return result;
    } catch (err) {
        console.log('Request failed, TradeOgre API call error:\n', err);
        return undefined;
    }
}

// get BTC Info from TradeOgre
async function getOgreBTCInfo() {
    const requestOptions = {
        method: 'GET',
        uri: 'https://tradeogre.com/api/v1/ticker/BTC-TRTL',
        headers: {},
        json: true,
        gzip: true
    };
    try {
        const result = await request(requestOptions);
        //console.log(result);
        return result;
    } catch (err) {
        console.log('Request failed, TradeOgre API call error:', err);
        return undefined;
    }
}

// get TRTL Info from CoinGecko
async function getGeckoInfo() {
    const requestOptions = {
        method: 'GET',
        uri: 'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=turtlecoin&order=market_cap_desc&per_page=100&page=1&sparkline=false',
        headers: {},
        json: true,
        gzip: true
    };
    try {
        const result = await request(requestOptions);
        //console.log(result[0]);
        return result[0];
    } catch (err) {
        console.log('Request failed, CoinGecko trtl API call error: \n', err);
        return undefined;
    }
}

// get TRTL Network Info from TurteCoin node
async function getNetworkInfo() {
    const requestOptions = {
        method: 'GET',
        uri: 'http://node.turtlepool.space:11898/getinfo',
        headers: {},
        json: true,
        gzip: true
    };
    try {
        const result = await request(requestOptions);
        //console.log(result);
        return result;
    } catch (err) {
        console.log('Request failed, TurtleCoin Node API call error');
        return undefined;
    }
}

// get TRTL Network Info from ShellMaps
async function getTotalNodes() {
    const requestOptions = {
        method: 'GET',
        uri: 'https://shellmap.mine2gether.com/api/stats',
        headers: {},
        json: true,
        gzip: true
    };
    try {
        const result = await request(requestOptions);
        //console.log(`Shellmaps Total Node Count: ${result.globalData.nodeCount}`);
        return result.globalData.nodeCount;
    } catch (err) {
        console.log('Request failed, ShellMaps API call error: \n', err);
        return undefined;
    }
}
