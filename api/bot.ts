// import { Bot, webhookCallback } from "grammy";
// import { Menu } from "@grammyjs/menu";

// const token = process.env.BOT_TOKEN;
// if (!token) throw new Error("BOT_TOKEN is unset");

// // create a bot
// const bot = new Bot(token);

// // create a menu

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

// // apply menu
// bot.use(menu);

// bot.command("start", async (ctx) => {
//   // send menu
//   await ctx.reply("This is my first telegram bot:", { reply_markup: menu });
// });

// export default webhookCallback(bot, 'http')

import { Bot, Context, session, SessionFlavor, webhookCallback } from 'grammy'
import { Menu, MenuRange } from '@grammyjs/menu'

/** This is how the dishes look that this bot is managing */
interface Dish {
  id: string
  name: string
}

interface SessionData {
  favoriteIds: string[]
}

type MyContext = Context & SessionFlavor<SessionData>

const dishDatabase: Dish[] = [
  { id: 'pasta', name: 'Pasta' },
  { id: 'pizza', name: 'Pizza' },
  { id: 'sushi', name: 'Sushi' },
  { id: 'entrct', name: 'Entrecôte' },
]

const token = process.env.BOT_TOKEN;
if (!token) throw new Error("BOT_TOKEN is unset");
const bot = new Bot<MyContext>(token)

bot.use(
  session({
    initial(): SessionData {
      return { favoriteIds: [] }
    },
  })
)

// Create a dynamic menu that lists all dishes in the dishDatabase,
// one button each
const mainText = 'Pick a dish to rate it!'
const foodMenu = new Menu<MyContext>('food-menu')
foodMenu.dynamic(() => {
  const range = new MenuRange<MyContext>()
  for (const dish of dishDatabase) {
    range
      .submenu(
        { text: dish.name, payload: dish.id }, // label and payload
        'dish-menu', // navigation target menu
        ctx =>
          ctx.editMessageText(dishText(dish.name), {
            parse_mode: 'HTML',
          }) // handler
      )
      .row()
  }
  return range
})

// Create the sub-menu that is used for rendering dishes
const dishText = (dish: string) => `<b>${dish}</b>\n\nYour rating:`
const dishMenu = new Menu<MyContext>('dish-menu')
dishMenu.dynamic(ctx => {
  const dish = ctx.match
  if (typeof dish !== 'string') throw new Error('No dish chosen!')
  return createDishMenu(dish)
})

/** Creates a menu that can render any given dish */
function createDishMenu(dish: string) {
  return new MenuRange<MyContext>()
    .text(
      {
        text: ctx => ctx.session.favoriteIds.includes(dish) ? 'Yummy!' : 'Meh.',
        payload: dish,
      },
      ctx => {
        const set = new Set(ctx.session.favoriteIds)
        if (!set.delete(dish)) set.add(dish)
        ctx.session.favoriteIds = Array.from(set.values())
        ctx.menu.update()
      }
    )
    .row()
    .back({ text: 'X Delete', payload: dish }, async ctx => {
      const index = dishDatabase.findIndex(d => d.id === dish)
      dishDatabase.splice(index, 1)
      await ctx.editMessageText('Pick a dish to rate it!')
    })
    .row()
    .back({ text: 'Back', payload: dish })
}

foodMenu.register(dishMenu)
bot.use(foodMenu)

bot.command('start', ctx => ctx.reply(mainText, { reply_markup: foodMenu }))
bot.command('help', async ctx => {
  const text = 'Send /start to see and rate dishes. Send /fav to list your favorites!'
  await ctx.reply(text)
})
bot.command('fav', async ctx => {
  const favs = ctx.session.favoriteIds
  if (favs.length === 0) {
    await ctx.reply('You do not have any favorites yet!')
    return
  }
  const names = favs
    .map(id => dishDatabase.find(dish => dish.id === id))
    .filter((dish): dish is Dish => dish !== undefined)
    .map(dish => dish.name)
    .join('\n')
  await ctx.reply(`Those are your favorite dishes:\n\n${names}`)
})

bot.catch(console.error.bind(console))

export default webhookCallback(bot, 'http')
