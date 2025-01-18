import TeleBot from "telebot";

const bot = new TeleBot(process.env.TELEGRAM_BOT_TOKEN);

// ID вчителя
const TEACHER_CHAT_ID = 7114975475;

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

    // Зберігаємо ім'я користувача
    session.answers.push(msg.text);
    session.step++;

    // Відправляємо ім'я користувача вчителю
    bot.sendMessage(TEACHER_CHAT_ID, `Новий запис:\nІм'я: ${msg.text}`);

    // Відповідаємо користувачу
    bot.sendMessage(chatId, `Ваше ім'я: ${msg.text}. Дякую за відповідь!`);

    // Очищаємо сесію
    delete sessions[chatId];
  }
});

export default bot;
