const { Client, GatewayIntentBits } = require('discord.js');
const Parser = require('rss-parser');

require('dotenv/config')

const rssFeed = process.env.WORLDBOSS_RSS_TWITTER_FEED
let rssFeedTimeStamp = Date.now();

let nickName = {HT: "", WB: ""};

const client = new Client({
    intents:[
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
})

client.on('ready', () => {
    console.log("Bot is running");

    //Salmilan server, channel, role and bot id initialization
    const guild = client.guilds.cache.get(process.env.DISCORD_SALMILAN_GUILD_ID);
    const channel = client.channels.cache.get(process.env.DISCORD_SALMILAN_CHANNEL_ID);
    const d4Role = guild.roles.cache.get(process.env.DISCORD_SALMILAN_ROLE_ID);
    const d4BotUser = guild.members.cache.get(process.env.DISCORD_SALMILAN_USER_D4BOT_ID);

    //Getting milliseconds until next helltide (Manual)
    const now = new Date();
    const millisTillHelltide = new Date(now.getFullYear(), now.getMonth(), now.getDate(), process.env.HELLTIDE_START_HOUR, process.env.HELLTIDE_START_MINUTE, 0, 0) - now;

    setTimeout(function(){
        helltideEventMessage(channel, d4Role, d4BotUser);
    }, millisTillHelltide);

    setInterval(function(){
        listenWorldBossTwitter(channel, d4Role);
    }, process.env.WORLDBOSS_TWITTER_LISTEN_MINUTES * 60 * 1000)
});

//Handle informing channel when Helltide Event is starting and changing BOT username for next helltide event.
const helltideEventMessage = function(channel, role, d4BotUser){

    const handleHelltideInforming = function(channel, role, d4BotUser){
        
        let helltideStartTimeLeft = 5;
        let currentHelltideTime = new Date( Date.now() + helltideStartTimeLeft * 60 * 1000);

        setTimeout(function(){
            let nextHelltideTime = new Date( Date.now() + process.env.HELLTIDE_EVENT_INTERVAL_MINUTES * 60 * 1000);
            changeNickTime('HT', parseHelltideTime(nextHelltideTime))
            changeNickname(d4BotUser);
        }, helltideStartTimeLeft * 60 * 1000);

        channel.send(`Helltide in ${helltideStartTimeLeft} minutes ${role} - (${parseHelltideTime(currentHelltideTime)})`)
        .then(message => {
            for(var i = 0; i < helltideStartTimeLeft;){
                i++;
                editHellTideMessage(i, message, role, currentHelltideTime, helltideStartTimeLeft);
            }
        });
        console.log("Helltide - Message sent to discord");
    }

    setInterval(function(){
        handleHelltideInforming(channel, role, d4BotUser)
    }, process.env.HELLTIDE_EVENT_INTERVAL_MINUTES * 60 * 1000)

    handleHelltideInforming(channel, role, d4BotUser)
}

//Edits server message based on time left to upcoming Helltide event
const editHellTideMessage = function(i, message, role, currentHelltideTime, helltideStartTimeLeft){
    if(i == helltideStartTimeLeft){
        setTimeout(function(){
            message.edit(`Helltide event **LIVE!** - https://helltides.com/ ${role}`)
            console.log(`Helltide - Message updated to discord - LIVE`);
        }, helltideStartTimeLeft * 60 * 1000);
    }
    else{
        setTimeout(function(){
            message.edit(`Helltide in ${helltideStartTimeLeft - i} minutes ${role} - (${parseHelltideTime(currentHelltideTime)})`);
            console.log(`Helltide - Message updated to discord - ${helltideStartTimeLeft - i} min left`);
        }, i * 60 * 1000);
    }
}

//Listening twitter account for World Boss events and sending message to channel of next boss
//Using timestamp to check if there are new tweets to info about
const listenWorldBossTwitter = function(channel, role){
    let parser = new Parser();

    (async () => {

        let feed = await parser.parseURL(rssFeed);

        console.log("Load Tweets")

        feed.items.forEach(item => {
            if(rssFeedTimeStamp < new Date(item.pubDate).getTime()){

                console.log("New Tweet Found")

                rssFeedTimeStamp = new Date(item.pubDate).getTime();
                
                if(item.title.includes("will spawn")){
                    channel.send(`${item.title} - ${item.link} ${role}`);
                    console.log("Tweet - Message sent to server");
                }
            }
        });
    })();
}

const parseHelltideTime = function(time){
    return time.toLocaleTimeString('en-GB', {hour: '2-digit', minute:'2-digit'})
}

const changeNickTime = function(event, timestamp){
    nickName[event] = `Next ${event} - ${timestamp}`
}

const changeNickname = function(d4BotUser){
    console.log(`Change Diablo 4 bot nickname - ${nickName.HT}`)
    d4BotUser.setNickname(nickName.HT);
}

client.login(process.env.TOKEN);