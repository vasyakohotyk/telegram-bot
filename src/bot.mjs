import TeleBot from "telebot";

const bot = new TeleBot(process.env.TELEGRAM_BOT_TOKEN);

// ID вчителя
const TEACHER_CHAT_ID = 7114975475;

const sessions = {};

// Функція для відправки повідомлень без блокування основного потоку
const sendMessageAsync = (chatId, text, replyMarkup = null) => {
  return bot.sendMessage(chatId, text, { replyMarkup });
};

// Створення інлайн кнопок
const createButtons = () => {
  return {
    inline_keyboard: [
      [{ text: "Себе", callback_data: "self" }],
      [{ text: "Дитину", callback_data: "child" }],
    ],
  };
};

// Відправка привітального повідомлення
bot.on("text", async (msg) => {
  const chatId = msg.chat.id;

  // Якщо це перший запит /start
  if (msg.text === "/start") {
    // Ініціалізація сесії для користувача
    if (!sessions[chatId]) {
      sessions[chatId] = { answers: [], step: 0 };

      // Надсилаємо перше привітальне повідомлення
      await sendMessageAsync(chatId, "Привіт, я Даша твій сучасний тютор з англійської! Давайте запишемось на пробний урок. Пробний урок триває 30 хвилин, та являється повністю безкоштовним!");

      // Запитуємо ім'я
      await sendMessageAsync(chatId, "Як вас звати?");
    } else {
      await sendMessageAsync(chatId, "Ви вже почали реєстрацію!");
    }
  } else {
    const session = sessions[chatId];

    // Якщо сесії немає, запитуємо користувача натискати /start
    if (!session) {
      await sendMessageAsync(chatId, "Натисніть /start, щоб почати.");
      return;
    }

    // Якщо відповідь на ім'я вже отримано
    if (session.step === 0) {
      // Зберігаємо ім'я користувача
      session.answers.push(msg.text);
      session.step++;

      // Відправляємо ім'я користувача вчителю
      await sendMessageAsync(TEACHER_CHAT_ID, `Новий запис:\nІм'я: ${msg.text}`);

      // Відповідаємо користувачу
      await sendMessageAsync(chatId, `Ваше ім'я: ${msg.text}. Дякую за відповідь!`);

      // Тепер запитуємо наступне питання з кнопками
      await sendMessageAsync(
        chatId,
        "Записуєте себе чи дитину?",
        createButtons()
      );
    }
    // Якщо відповідь на "Себе чи дитину?" отримано
    else if (session.step === 1) {
      const selected = msg.text === "Себе" ? "self" : "child";
      session.answers.push(selected);
      session.step++;

      // Відправляємо вибір користувача вчителю
      await sendMessageAsync(
        TEACHER_CHAT_ID,
        `Новий запис:\nЗаписуєте: ${selected === "self" ? "Себе" : "Дитину"}`
      );

      // Завершуємо сесію після відповіді
      await sendMessageAsync(chatId, "Дякуємо! Ми зв'яжемося з вами.");
      delete sessions[chatId];
    }
  }
});

// Обробка callback_data для кнопок
bot.on("callback_query", async (query) => {
  const chatId = query.message.chat.id;
  const session = sessions[chatId];

  if (!session) return;

  if (session.step === 1) {
    if (query.data === "self") {
      session.answers.push("self");
      session.step++;
      await sendMessageAsync(chatId, "Ви записуєте себе. Дякуємо!");
    } else if (query.data === "child") {
      session.answers.push("child");
      session.step++;
      await sendMessageAsync(chatId, "Ви записуєте дитину. Дякуємо!");
    }

    // Відправляємо дані вчителю
    await sendMessageAsync(
      TEACHER_CHAT_ID,
      `Новий запис:\nЗаписуєте: ${query.data === "self" ? "Себе" : "Дитину"}`
    );

    // Завершуємо сесію після відповіді
    delete sessions[chatId];
  }
});

export default bot;
