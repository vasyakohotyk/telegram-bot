import TeleBot from "telebot";

// Створення бота
const bot = new TeleBot(process.env.TELEGRAM_BOT_TOKEN);

// ID вчителя
const TEACHER_CHAT_ID = 7114975475;

const sessions = {};

// Інлайн-кнопки для вибору "Себе" або "Дитину"
const optionsPerson = {
  reply_markup: {
    inline_keyboard: [
      [{ text: 'Себе', callback_data: '0' }],
      [{ text: 'Дитину', callback_data: '1' }],
    ]
  }
};

// Функція для відправки повідомлень без блокування основного потоку
const sendMessageAsync = (chatId, text, replyMarkup) => {
  return bot.sendMessage(chatId, text, replyMarkup);
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

      // Тепер запитуємо наступне питання: чи записує користувач себе чи дитину?
      await sendMessageAsync(chatId, "Записуєте себе чи дитину? Напишіть 'Себе' або 'Дитину'.", optionsPerson);
    }
    // Якщо відповідь на "Себе чи дитину?" отримано
    else if (session.step === 1) {
      // Зберігаємо вибір користувача
      session.answers.push(msg.text);

      // Переходимо до вибору дня тижня
      session.step++;
      await sendMessageAsync(chatId, "Який день тижня вам зручний для проведення уроку?");
      
      // Відправляємо інлайн-кнопки для вибору дня
      await sendMessageAsync(chatId, "Виберіть день:", {
        reply_markup: {
          inline_keyboard: [
            [{ text: "Понеділок", callback_data: "pn" }],
            [{ text: "Вівторок", callback_data: "wt" }],
            [{ text: "Середа", callback_data: "sr" }],
            [{ text: "Четвер", callback_data: "ct" }],
            [{ text: "П'ятниця", callback_data: "pt" }],
            [{ text: "Субота", callback_data: "sb" }]
          ]
        }
      });
    }
    // Якщо вибір дня тижня зроблений
    else if (session.step === 2) {
      // Переходимо до запитання про час
      session.step++;
      await sendMessageAsync(chatId, "Який час вам зручний? Напишіть час у форматі 'ГГ:ММ'.");
    }
    // Якщо відповідь на "Час?" отримано
    else if (session.step === 3) {
      // Зберігаємо час
      session.answers.push(msg.text);

      // Завершуємо сесію після збору всіх відповідей і відправляємо вчителю
      await sendMessageAsync(TEACHER_CHAT_ID, `Новий запис:\nІм'я: ${session.answers[0]}\nЗаписує: ${session.answers[1]}\nДень уроку: ${session.answers[2]}\nЧас: ${session.answers[3]}`);

      // Завершуємо сесію
      delete sessions[chatId];
    }
  }
});

// Обробка callback_data для вибору дня
bot.on("callback_query", async (query) => {
  const chatId = query.message.chat.id;
  const session = sessions[chatId];

  if (!session) return;

  const dayMap = {
    pn: "Понеділок",
    wt: "Вівторок",
    sr: "Середа",
    ct: "Четвер",
    pt: "П'ятниця",
    sb: "Субота",
  };

  const selectedDay = dayMap[query.data];
  if (selectedDay) {
    session.answers.push(selectedDay);
    session.step++;

    // Переходимо до запитання про час
    await sendMessageAsync(chatId, "Який час вам зручний? Напишіть час у форматі 'ГГ:ММ'.");
  }

  // Підтверджуємо вибір дня
  await bot.answerCallbackQuery(query.id, { text: `Ви обрали: ${selectedDay}`, show_alert: true });
});

// Запуск бота
bot.start();

export default bot;
