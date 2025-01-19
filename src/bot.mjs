import TeleBot from "telebot";

const bot = new TeleBot(process.env.TELEGRAM_BOT_TOKEN);

// ID вчителя
const TEACHER_CHAT_ID = 7114975475;

const sessions = {};

// Функція для відправки повідомлень без блокування основного потоку
const sendMessageAsync = (chatId, text, keyboard = null) => {
  return bot.sendMessage(chatId, text, { replyMarkup: keyboard });
};

// Функція для створення клавіатури
const createKeyboard = (options) => {
  return {
    inline_keyboard: options.map(option => [{ text: option, callback_data: option }])
  };
};

// Відправка привітального повідомлення
bot.on("text", async (msg) => {
  const chatId = msg.chat.id;

  if (msg.text === "/start") {
    if (!sessions[chatId]) {
      sessions[chatId] = { answers: [], step: 0 };

      await sendMessageAsync(chatId, "Привіт, я Даша твій сучасний тютор з англійської! Давайте запишемось на пробний урок. Пробний урок триває 30 хвилин, та являється повністю безкоштовним!");
      await sendMessageAsync(chatId, "Як вас звати?");
    }
  } else {
    const session = sessions[chatId];
    if (!session) {
      await sendMessageAsync(chatId, "Натисніть /start, щоб почати.");
      return;
    }

    if (session.step === 0) {
      session.answers.push(msg.text);
      session.step++;
      const keyboard = createKeyboard(["Себе", "Дитину"]);
      await sendMessageAsync(chatId, "Записуєте себе чи дитину?", keyboard);
    } else if (session.step === 2) {
      const age = parseInt(msg.text.trim(), 10);
      if (!isNaN(age)) {
        session.answers.push(age);
        session.step++;
        const keyboard = createKeyboard(["Beginner", "Intermediate", "Advanced"]);
        await sendMessageAsync(chatId, "Який у вас рівень англійської?", keyboard);
      } else {
        await sendMessageAsync(chatId, "Будь ласка, введіть коректний вік.");
      }
    } else if (session.step === 4) {
      session.answers.push(msg.text);
      await sendMessageAsync(TEACHER_CHAT_ID, `Новий запис:\nІм'я: ${session.answers[0]}\nЗаписує: ${session.answers[1]}\nВік: ${session.answers[2]}\nРівень англійської: ${session.answers[3]}\nНомер телефону: ${session.answers[4]}`);
      delete sessions[chatId];
      await sendMessageAsync(chatId, "Дякую! Ваші дані успішно надіслані.");
    }
  }
});

bot.on("callbackQuery", async (query) => {
  const chatId = query.from.id;
  const session = sessions[chatId];

  if (!session) {
    await sendMessageAsync(chatId, "Натисніть /start, щоб почати.");
    return;
  }

  const answer = query.data.toLowerCase();

  if (session.step === 1) {
    if (answer === "себе" || answer === "дитину") {
      session.answers.push(answer);
      session.step++;
      if (answer === "себе") {
        await sendMessageAsync(chatId, "Скільки вам років?");
      } else {
        await sendMessageAsync(chatId, "Скільки років дитині?");
      }
    } else {
      await sendMessageAsync(chatId, "Будь ласка, виберіть одну з опцій: 'Себе' або 'Дитину'.");
    }
  } else if (session.step === 3) {
    const validLevels = ["beginner", "intermediate", "advanced"];
    if (validLevels.includes(answer)) {
      session.answers.push(answer);
      session.step++;
      await sendMessageAsync(chatId, "Будь ласка, надайте ваш номер телефону.");
    } else {
      await sendMessageAsync(chatId, "Будь ласка, виберіть правильний рівень.");
    }
  }
  bot.answerCallbackQuery(query.id); // Завершення callback
});

// Запуск бота
bot.start();
