import TelegramBot from 'node-telegram-bot-api';

// Ваш токен для бота
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });

// ID вчителя
const TEACHER_CHAT_ID = 7114975475;

const sessions = {};

// Функція для відправки повідомлень з кнопками
const sendMessageAsync = (chatId, text, keyboard = null) => {
  return bot.sendMessage(chatId, text, { reply_markup: keyboard });
};

// Функція для створення клавіатури
const createKeyboard = (options) => {
  return {
    inline_keyboard: options.map(option => [{ text: option, callback_data: option }])
  };
};

// Відправка привітального повідомлення
bot.on('text', async (msg) => {
  const chatId = msg.chat.id;

  // Якщо це перший запит /start
  if (msg.text === "/start") {
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

      // Запитуємо, чи записує користувач себе чи дитину, використовуючи кнопки
      const keyboard = createKeyboard(["Себе", "Дитину"]);
      await sendMessageAsync(chatId, "Записуєте себе чи дитину?", keyboard);
    }
    // Якщо відповідь на "Себе чи дитину?" отримано
    else if (session.step === 1) {
      const choice = msg.text.toLowerCase();
      if (choice === 'себе' || choice === 'дитину') {
        session.answers.push(choice);
        session.step++;
        await sendMessageAsync(chatId, "Який день тижня вам зручний для проведення уроку? Напишіть день, наприклад: 'Понеділок'.");
      } else {
        await sendMessageAsync(chatId, "Будь ласка, напишіть 'Себе' або 'Дитину'.");
      }
    }
    // Якщо вибір дня тижня зроблений
    else if (session.step === 2) {
      const day = msg.text.trim().toLowerCase();
      const validDays = ["понеділок", "вівторок", "середа", "четвер", "п'ятниця", "субота"];
      
      if (validDays.includes(day)) {
        session.answers.push(day);
        session.step++;
        await sendMessageAsync(chatId, "Який час вам зручний? Напишіть час у форматі 'ГГ:ММ'.");
      } else {
        await sendMessageAsync(chatId, "Будь ласка, напишіть правильний день тижня.");
      }
    }
    // Якщо відповідь на "Час?" отримано
    else if (session.step === 3) {
      session.answers.push(msg.text);

      // Завершуємо сесію після збору всіх відповідей і відправляємо вчителю
      await sendMessageAsync(TEACHER_CHAT_ID, `Новий запис:\nІм'я: ${session.answers[0]}\nЗаписує: ${session.answers[1]}\nДень уроку: ${session.answers[2]}\nЧас: ${session.answers[3]}`);

      // Завершуємо сесію
      delete sessions[chatId];
    }
  }
});

// Обробник callback-запитів для кнопок
bot.on("callback_query", async (query) => {
  const chatId = query.from.id;
  const messageId = query.message.message_id;

  // Отримуємо дані з кнопки
  const answer = query.data.toLowerCase();
  const session = sessions[chatId];

  if (session.step === 1) {
    if (answer === 'себе' || answer === 'дитину') {
      session.answers.push(answer);
      session.step++;
      await sendMessageAsync(chatId, "Який день тижня вам зручний для проведення уроку? Напишіть день, наприклад: 'Понеділок'.");
    }
  }

  // Видаляємо повідомлення з кнопками після вибору
  await bot.deleteMessage(chatId, messageId);
});

export default bot;
