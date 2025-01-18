import TeleBot from "telebot";

const bot = new TeleBot(process.env.TELEGRAM_BOT_TOKEN);

const sessions = {};

// Відправка привітального повідомлення
bot.on("text", (msg) => {
  const chatId = msg.chat.id;

  // Якщо це перший запит /start
  if (msg.text === "/start") {
    sessions[chatId] = { answers: [], step: 0 };

    bot.sendMessage(chatId, "Привіт, я Даша твій сучасний тютор з англійської! Давайте запишемось на пробний урок. Пробний урок триває 30 хвилин, та являється повністю безкоштовним!");
    bot.sendMessage(chatId, "Як вас звати?");
  } else {
    const session = sessions[chatId];

    if (!session) {
      bot.sendMessage(chatId, "Натисніть /start, щоб почати.");
      return;
    }

    // Зберігаємо ім'я користувача та виводимо наступне повідомлення
    session.answers.push(msg.text); // Зберігаємо ім'я
    session.step++;

    bot.sendMessage(chatId, `Ваше ім'я: ${msg.text}. Дякую за відповідь!`);
    delete sessions[chatId]; // Очистити сесію після отримання відповіді
  }
});

export default bot;
