import Botkit from 'botkit'
import slack from 'slack'
import redis from 'redis'
import dotenv from 'dotenv'

dotenv.config()

let redisClient = redis.createClient()

var bot = Botkit.slackbot({
  debug: false
});
bot.spawn({
  token: process.env.SLACK_API_TOKEN_FOR_BOT
}).startRTM();

bot.hears('use (.*) (.*)', ['direct_mention'], function(bot, message) {
  slack.users.info({token: process.env.SLACK_API_TOKEN_FOR_BOT, user: message.user}, (err, data) => {
    let slack_name = data.user.name;
    let repository = message.match[1];
    let stage = message.match[2];

    let key = repository + ':'  + stage
    redisClient.get(key, (err, reply) => {
      if (reply == null) {
        redisClient.set(key, slack_name);
        bot.reply(message, `${slack_name} is using ${repository} ${stage}`);
      } else {
        if (slack_name == reply) {
          bot.reply(message, `You are using ${repository} ${stage}`);
        } else {
          bot.reply(message, `@${slack_name}: ${reply} is using ${repository} ${stage}`);
        }
      }

    })
  })
});

bot.hears('finish (.*) (.*)', ['direct_mention'], function(bot, message) {
  slack.users.info({token: process.env.SLACK_API_TOKEN_FOR_BOT, user: message.user}, (err, data) => {
    let slack_name = data.user.name;
    let repository = message.match[1];
    let stage = message.match[2];
    let key = repository + ':'  + stage
    redisClient.del(key)
    bot.reply(message, `${slack_name} is finished using ${repository} ${stage}`);
  })
});
