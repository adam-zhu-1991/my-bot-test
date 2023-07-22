import { Bot, Context, session, SessionFlavor, webhookCallback } from "grammy";
import { Menu, MenuRange } from "@grammyjs/menu";
import {
  type Conversation,
  type ConversationFlavor,
  conversations,
  createConversation,
} from "@grammyjs/conversations";

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
};

interface MenuItem {
  id: string,
  text: string,
  type: MenuType,
};

interface SessionData {
  isSell: Boolean,
  walletName: String,
  walletAddress: String,
};

type MyContext = Context & SessionFlavor<SessionData> & ConversationFlavor;
type MyConversation = Conversation<MyContext>;

const dynamicMenu: MenuItem[] = [
  { id: 'buy001ETH', text: 'Buy 0.01', type: MenuType.Buy },
  { id: 'buy005ETH', text: 'Buy 0.05', type: MenuType.Buy },
  { id: 'sellAllETH', text: 'Sell All', type: MenuType.Sell },
  { id: 'sell001ETH', text: 'Sell 0.01', type: MenuType.Sell },
  { id: 'sell005ETH', text: 'Sell 0.05', type: MenuType.Sell },
];

// create a bot
const bot = new Bot<MyContext>(token);

bot.use(
  session({
    initial(): SessionData {
      return { isSell: false, walletName: '', walletAddress: '' }
    },
  })
);

bot.use(conversations());

const nameRegExp = new RegExp(/^[a-zA-Z0-9]+$/);
async function checkName(conversation: MyConversation, ctx: MyContext) {
  const { msg } = await conversation.waitFor(":text");
  const walletName = msg.text;
  const isLegal = nameRegExp.test(walletName);
  if (walletName.length === 0 || walletName.length > 8 || !isLegal) {
    await ctx.reply("This is not a valid wallet name, Name must be alphanumeric, 8 letters max.");
    return { success: false };
  }
  return { walletName, success: true };
}

async function setName(conversation: MyConversation, ctx: MyContext) {
  await ctx.reply("What would you like to name this copy trade wallet? 8 letters max, only numbers and letters.");
  const { walletName, success } = await checkName(conversation, ctx);
  if (success) {
    ctx.session.walletName = walletName || '';
    await setAddress(conversation, ctx);
  }
}

const addressRegExp = new RegExp(/^0x[a-fA-F0-9]{40}$/);
async function checkAddress(conversation: MyConversation, ctx: MyContext) {
  const { msg } = await conversation.waitFor(":text");
  const walletAddress = msg.text;
  const isLegal = addressRegExp.test(walletAddress);
  if (walletAddress.length === 0 || walletAddress.length !== 42 || !isLegal) {
    await ctx.reply("This is not a valid wallet address, Please try again.");
    return { success: false };
  }
  return { walletAddress, success: true };
}

async function setAddress(conversation: MyConversation, ctx: MyContext) {
  await ctx.reply("Reply to this message with the desired wallet address you'd like to copy trades from.");
  const { walletAddress, success } = await checkAddress(conversation, ctx);
  if (!success) {
    await setAddress(conversation, ctx);
  } else {
    ctx.session.walletAddress = walletAddress || '';
    await createWalletSuccess(conversation, ctx);
  }
}

async function createWalletSuccess(conversation: MyConversation, ctx: MyContext) {
  const message = `✅Added ARB Wallet(💳${ctx.session.walletName})\n<i>${ctx.session.walletAddress}</i>`;
  await ctx.reply(message, {
    parse_mode: "HTML"
  });
}

async function createWallet(conversation: MyConversation, ctx: MyContext) {
  await setName(conversation, ctx);
}

bot.use(createConversation(createWallet));

const testMenu = new Menu<MyContext>('test-menu');
testMenu
  .text("Add Wallet", async (ctx) => {
    await ctx.conversation.enter("createWallet");
  })
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
