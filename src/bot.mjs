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

      // Відповідаємо користувачу
      await sendMessageAsync(chatId, `Ви записуєте: ${selected === "self" ? "Себе" : "Дитину"}. Дякуємо за відповідь!`);

      // Запитуємо ще один наступний питання
      await sendMessageAsync(
        chatId,
        "Яку дату вам зручніше для уроку?",
      );
    }
    // Якщо відповідь на "Зручна дата?" отримано
    else if (session.step === 2) {
      session.answers.push(msg.text);
      session.step++;

      // Відповідаємо користувачу
      await sendMessageAsync(chatId, `Ви обрали дату: ${msg.text}. Дякуємо за відповідь!`);

      // Запитуємо ще один наступний питання
      await sendMessageAsync(
        chatId,
        "Який час вам зручний?",
      );
    }
    // Якщо відповідь на "Зручний час?" отримано
    else if (session.step === 3) {
      session.answers.push(msg.text);
      session.step++;

      // Відповідаємо користувачу
      await sendMessageAsync(chatId, `Ви обрали час: ${msg.text}. Дякуємо за відповідь!`);

      // Завершуємо сесію після збору всіх відповідей і відправляємо вчителю
      await sendMessageAsync(TEACHER_CHAT_ID, `Новий запис:\nІм'я: ${session.answers[0]}\nЗаписує: ${session.answers[1] === "self" ? "Себе" : "Дитину"}\nДата: ${session.answers[2]}\nЧас: ${session.answers[3]}`);

      // Завершуємо сесію
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
    // Зберігаємо відповідь на кнопку як текст
    session.answers.push(query.data);

    session.step++;

    // Відповідаємо користувачу
    await sendMessageAsync(chatId, `Ви записуєте: ${query.data === "self" ? "Себе" : "Дитину"}. Дякуємо за відповідь!`);

    // Запитуємо ще один наступний питання
    await sendMessageAsync(
      chatId,
      "Яку дату вам зручніше для уроку?",
    );
  }
});

export default bot;
