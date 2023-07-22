import { Bot } from "grammy";
import { Menu } from "@grammyjs/menu";

const token = process.env.BOT_TOKEN;
if (!token) throw new Error("BOT_TOKEN is unset");

// create a bot
const bot = new Bot(token);

// create a menu
const menu = new Menu("my-menu-identifier")
  .text("A", (ctx) => ctx.reply("You pressed A!")).row()
  .text("B", (ctx) => ctx.reply("You pressed B!"));

// apply menu
bot.use(menu);

bot.command("start", async (ctx) => {
  // send menu
  await ctx.reply("Check out this menu:", { reply_markup: menu });
});

bot.start();
