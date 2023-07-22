import { Bot, webhookCallback } from "grammy";
import { Menu } from "@grammyjs/menu";

const token = process.env.BOT_TOKEN;
if (!token) throw new Error("BOT_TOKEN is unset");

// create a bot
const bot = new Bot(token);

// create a menu

const switches = new Set<number>();

function toggleSwitches(id: number) {
  if (switches.has(id)) switches.delete(id);
  else switches.add(id);
}

const menu = new Menu("my-menu-identifier")
  .text("Add", (ctx) => ctx.reply("You pressed Add!"))
  .text("Switch", (ctx) => {
    toggleSwitches(ctx.from.id);
    ctx.menu.update();
  }).row()
  .text(
    (ctx) => `${ctx.from && switches.has(ctx.from.id) ? "Sell 0.01 ETH" : "Buy 0.01 ETH"}`, // 动态标签
    (ctx) => ctx.reply(`Hello ${ctx.from.first_name}!`),
  )
  .text(
    (ctx) => `${ctx.from && switches.has(ctx.from.id) ? "Sell 0.05 ETH" : "Buy 0.05 ETH"}`, // 动态标签
    (ctx) => ctx.reply(`Hello ${ctx.from.first_name}!`),
  ).row();

// apply menu
bot.use(menu);

bot.command("start", async (ctx) => {
  // send menu
  await ctx.reply("This is my first telegram bot:", { reply_markup: menu });
});

export default webhookCallback(bot, 'http')
