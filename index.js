// import { Bot, webhookCallback } from "grammy";

// const token = process.env.BOT_TOKEN;
// if (!token) throw new Error("BOT_TOKEN is unset");

// const bot = new Bot(token);

// export default webhookCallback(bot, "http");

import { Bot } from 'grammy';

const { BOT_TOKEN, WEBHOOK } = process.env;
const bot = new Bot(BOT_TOKEN);

bot.api.setWebhook(WEBHOOK);
