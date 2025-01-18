import TeleBot from "telebot";

const bot = new TeleBot(process.env.TELEGRAM_BOT_TOKEN);

// Відправка привітального повідомлення
bot.on("text", (msg) => {
  if (msg.text === "/start") {
    bot.sendMessage(msg.chat.id, "Привіт, я Даша твій сучасний тютор з англійської! Давайте запишемось на пробний урок. Пробний урок триває 30 хвилин, та являється повністю безкоштовним!");
  } else {
    msg.reply.text(msg.text + msg.text + msg.text);
  }
});

export default bot;
