import { Bot, webhookCallback } from "grammy";
import { Menu } from "@grammyjs/menu";

const token = process.env.BOT_TOKEN;
if (!token) throw new Error("BOT_TOKEN is unset");

// create a bot
const bot = new Bot(token);

// create a menu
const menu = new Menu("my-menu-identifier")
  .text("Add", (ctx) => ctx.reply("You pressed Add!"))
  .text("Switch", (ctx) => ctx.reply("You pressed Switch!")).row()
  .text("Buy 0.01", (ctx) => ctx.reply("You pressed B 0.01!"))
  .text("Buy 0.05", (ctx) => ctx.reply("You pressed B 0.05!")).row();

// apply menu
bot.use(menu);

bot.command("start", async (ctx) => {
  // send menu
  await ctx.reply("This is my first telegram bot:", { reply_markup: menu });
});

export default webhookCallback(bot, 'http')
