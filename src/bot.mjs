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
    // Ініціалізація сесії для користувача
    if (!sessions[chatId]) {
      sessions[chatId] = { answers: [], step: 0 };
      
      // Надсилаємо перше привітальне повідомлення
      bot.sendMessage(chatId, "Привіт, я Даша твій сучасний тютор з англійської! Давайте запишемось на пробний урок. Пробний урок триває 30 хвилин, та являється повністю безкоштовним!");

      // Запитуємо ім'я
      bot.sendMessage(chatId, "Як вас звати?");
    } else {
      bot.sendMessage(chatId, "Ви вже почали реєстрацію!");
    }
  } else {
    const session = sessions[chatId];

    // Якщо сесії немає, запитуємо користувача натискати /start
    if (!session) {
      bot.sendMessage(chatId, "Натисніть /start, щоб почати.");
      return;
    }

    // Якщо відповідь на ім'я вже отримано
    if (session.step === 0) {
      // Зберігаємо ім'я користувача
      session.answers.push(msg.text);
      session.step++;

      // Відправляємо ім'я користувача вчителю
      bot.sendMessage(TEACHER_CHAT_ID, `Новий запис:\nІм'я: ${msg.text}`);

      // Відповідаємо користувачу
      bot.sendMessage(chatId, `Ваше ім'я: ${msg.text}. Дякую за відповідь!`);
      
      // Завершуємо сесію після відповіді
      delete sessions[chatId];
    }
  }
});

export default bot;
