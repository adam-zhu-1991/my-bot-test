import { Bot, Context, session, SessionFlavor, webhookCallback } from "grammy";
import { Menu, MenuRange } from "@grammyjs/menu";

const token = process.env.BOT_TOKEN;
if (!token) throw new Error("BOT_TOKEN is unset");

// create a menu
// const switches = new Set<number>();

// function toggleSwitches(id: number) {
//   if (switches.has(id)) switches.delete(id);
//   else switches.add(id);
// }

// const menu = new Menu("my-menu-identifier")
//   .text("Add", (ctx) => ctx.reply("You pressed Add!"))
//   .text("Switch", (ctx) => {
//     toggleSwitches(ctx.from.id);
//     ctx.menu.update();
//   }).row()
//   .text(
//     (ctx) => `${ctx.from && switches.has(ctx.from.id) ? "Sell 0.01 ETH" : "Buy 0.01 ETH"}`, // 动态标签
//     (ctx) => {
//       ctx.reply(`Hello ${ctx.from.first_name}!`); 
//     },
//   )
//   .text(
//     (ctx) => `${ctx.from && switches.has(ctx.from.id) ? "Sell 0.05 ETH" : "Buy 0.05 ETH"}`, // 动态标签
//     (ctx) => {
//       ctx.reply(`Hello ${ctx.from.first_name}!`);
//     },
//   ).row();

// apply menu
// bot.use(menu);

enum MenuType {
  Buy = 1,
  Sell = 2,
}

interface MenuItem {
  id: string,
  text: string,
  type: MenuType,
}

interface SessionData {
  isSell: Boolean,
}

type MyContext = Context & SessionFlavor<SessionData>

const dynamicMenu: MenuItem[] = [
  { id: 'buy001ETH', text: 'Buy 0.01 ETH', type: MenuType.Buy },
  { id: 'buy005ETH', text: 'Buy 0.05 ETH', type: MenuType.Buy },
  { id: 'sellAllETH', text: 'Sell All ETH', type: MenuType.Sell },
  { id: 'sell001ETH', text: 'Sell 0.01 ETH', type: MenuType.Sell },
  { id: 'sell005ETH', text: 'Sell 0.05 ETH', type: MenuType.Sell },
]

// create a bot
const bot = new Bot<MyContext>(token);

bot.use(
  session({
    initial(): SessionData {
      return { isSell: false }
    },
  })
)

const testMenu = new Menu<MyContext>('test-menu');
testMenu
  .text("Add", (ctx) => ctx.reply("You pressed Add!"))
  .text("Switch", (ctx) => {
    ctx.session.isSell = !ctx.session.isSell;
    ctx.menu.update();
  }).row()
  .dynamic((ctx) => {
    const range = new MenuRange<MyContext>();
    if (ctx.session.isSell) {
      for (const menu of dynamicMenu.filter(menu => menu.type === MenuType.Sell)) {
        range.text(menu.text.toString(), (ctx) => ctx.reply(`You pressed ${menu.text}.`));
      }
    } else {
      for (const menu of dynamicMenu.filter(menu => menu.type === MenuType.Buy)) {
        range.text(menu.text.toString(), (ctx) => ctx.reply(`You pressed ${menu.text}.`));
      }
    }
    return range;
  });

bot.use(testMenu);
bot.command("start", async (ctx) => {
  // send menu
  await ctx.reply("This is my first telegram bot:", { reply_markup: testMenu });
});

export default webhookCallback(bot, 'http')
