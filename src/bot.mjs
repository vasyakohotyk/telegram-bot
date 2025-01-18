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

        // Запитуємо вік залежно від вибору
        if (choice === 'себе') {
          await sendMessageAsync(chatId, "Скільки вам років?");
        } else {
          await sendMessageAsync(chatId, "Скільки років дитині?");
        }
      } else {
        await sendMessageAsync(chatId, "Будь ласка, напишіть 'Себе' або 'Дитину'.");
      }
    }
    // Якщо вік введено
    else if (session.step === 2) {
      const age = parseInt(msg.text.trim(), 10);

      // Перевіряємо, чи це число
      if (!isNaN(age)) {
        session.answers.push(age);
        session.step++;

        // Створюємо клавіатуру для вибору дня тижня
        const daysOfWeek = ["Понеділок", "Вівторок", "Середа", "Четвер", "П'ятниця", "Субота"];
        const keyboard = createKeyboard(daysOfWeek);
        await sendMessageAsync(chatId, "Виберіть день тижня для уроку:", keyboard);
      } else {
        await sendMessageAsync(chatId, "Будь ласка, введіть коректний вік.");
      }
    }
    // Якщо вибір дня тижня зроблений
    else if (session.step === 3) {
      // Зберігаємо вибір дня
      session.answers.push(msg.text);

      // Запитуємо час
      await sendMessageAsync(chatId, "Який час вам зручний? Напишіть час у форматі 'ГГ:ММ'.");
      session.step++;
    }
    // Якщо час вибрано
    else if (session.step === 4) {
      // Зберігаємо час
      session.answers.push(msg.text);

      // Завершуємо сесію після збору всіх відповідей і відправляємо вчителю
      await sendMessageAsync(TEACHER_CHAT_ID, `Новий запис:\nІм'я: ${session.answers[0]}\nЗаписує: ${session.answers[1]}\nВік: ${session.answers[2]}\nДень уроку: ${session.answers[3]}\nЧас: ${session.answers[4]}`);

      // Завершуємо сесію
      delete sessions[chatId];
    }
  }
});

// Обробник callback-запитів для кнопок
bot.on("callbackQuery", async (query) => {
  const chatId = query.from.id;
  const messageId = query.message.message_id;

  // Отримуємо дані з кнопки
  const answer = query.data;
  const session = sessions[chatId];

  if (session.step === 1) {
    // Зберігаємо вибір користувача
    if (answer === 'себе' || answer === 'дитину') {
      session.answers.push(answer);
      session.step++;

      // Запитуємо вік залежно від вибору
      if (answer === 'себе') {
        await sendMessageAsync(chatId, "Скільки вам років?");
      } else {
        await sendMessageAsync(chatId, "Скільки років дитині?");
      }
    }
  } else if (session.step === 2) {
    // Якщо користувач натиснув день
    const daysOfWeek = ["Понеділок", "Вівторок", "Середа", "Четвер", "П'ятниця", "Субота"];
    if (daysOfWeek.includes(answer)) {
      session.answers.push(answer);

      // Переходимо до вибору часу
      session.step++;
      await sendMessageAsync(chatId, "Який час вам зручний? Напишіть час у форматі 'ГГ:ММ'.");
    }
  }

  // Видаляємо повідомлення з кнопками після вибору
  await bot.deleteMessage(chatId, messageId);
});

export default bot;
