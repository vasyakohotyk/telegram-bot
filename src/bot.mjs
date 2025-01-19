import TeleBot from "telebot";

const bot = new TeleBot(process.env.TELEGRAM_BOT_TOKEN);

// ID вчителя
const TEACHER_CHAT_ID = 806072377;

const sessions = {};

// Функція для відправки повідомлень
const sendMessageAsync = (chatId, text, keyboard = null) => {
  return bot.sendMessage(chatId, text, { replyMarkup: keyboard });
};

// Функція для створення клавіатури
const createKeyboard = (options) => {
  return {
    inline_keyboard: options.map(option => [{ text: option, callback_data: option }])
  };
};

// Функція для запиту номера телефону
const sendContactRequest = async (chatId) => {
  const keyboard = {
    keyboard: [[{ text: "Надати номер телефону", request_contact: true }]],
    resize_keyboard: true,
    one_time_keyboard: true,
  };

  await sendMessageAsync(chatId, "Будь ласка, надайте ваш номер телефону, натиснувши кнопку нижче.", keyboard);
};

// Обробка текстових повідомлень
bot.on("text", async (msg) => {
  const chatId = msg.chat.id;

  // Якщо це перший запит /start
  if (msg.text === "/start") {
    if (!sessions[chatId]) {
      sessions[chatId] = { answers: [], step: 0 };

      // Привітання
      await sendMessageAsync(chatId, "Привіт, я Даша, ваш сучасний тютор з англійської!\nІнформація про пробний урок: \n- Повністю безкоштовне \n- Триває 30 хвилин.\n\nДавайте запишемось на пробний урок.");
      await sendMessageAsync(chatId, "Як вас звати?");
    }
  } else {
    const session = sessions[chatId];

    // Якщо сесії немає
    if (!session) {
      await sendMessageAsync(chatId, "Натисніть /start, щоб почати.");
      return;
    }

    // Якщо отримано ім'я
    if (session.step === 0) {
      session.answers.push({ name: msg.text });
      session.step++;

      // Запитуємо Telegram-тег
      await sendMessageAsync(chatId, "Вкажіть ваш Telegram-тег (наприклад, @username).");
    } 
    // Якщо отримано Telegram-тег
    else if (session.step === 1) {
      const telegramTag = msg.text.trim();

      if (telegramTag.startsWith("@") && telegramTag.length > 1) {
        session.answers.push({ telegramTag });
        session.step++;

        // Запитуємо, чи записує користувач себе чи дитину
        const keyboard = createKeyboard(["Себе", "Дитину"]);
        await sendMessageAsync(chatId, "Записуєте себе чи дитину?", keyboard);
      } else {
        await sendMessageAsync(chatId, "Будь ласка, введіть коректний Telegram-тег, який починається з @.");
      }
    }
    // Інші етапи обробляються через callbackQuery
  }
});

// Обробка кнопок (callbackQuery)
bot.on("callbackQuery", async (msg) => {
  const chatId = msg.from.id;
  const session = sessions[chatId];
  const data = msg.data; // Дані з кнопки

  if (!session) {
    await sendMessageAsync(chatId, "Натисніть /start, щоб почати.");
    return;
  }

  // Якщо вибір "Себе чи Дитину"
  if (session.step === 2) {
    if (data === "Себе" || data === "Дитину") {
      session.answers.push({ choice: data });
      session.step++;

      if (data === "Себе") {
        await sendMessageAsync(chatId, "Скільки вам років?");
      } else {
        await sendMessageAsync(chatId, "Скільки років дитині?");
      }
    }
  } 
  // Якщо вибір рівня англійської
  else if (session.step === 4) {
    const validLevels = ["Новачок", "Середній", "Просунутий"];
    if (validLevels.includes(data)) {
      session.answers.push({ level: data });
      session.step++;

      // Запитуємо день проведення уроку
      const days = ["Понеділок", "Вівторок", "Середа", "Четвер", "П’ятниця", "Субота", "Неділя"];
      const keyboard = createKeyboard(days);
      await sendMessageAsync(chatId, "Оберіть день проведення уроку:", keyboard);
    }
  } 
  // Якщо вибір дня
  else if (session.step === 5) {
    const validDays = ["Понеділок", "Вівторок", "Середа", "Четвер", "П’ятниця", "Субота", "Неділя"];
    if (validDays.includes(data)) {
      session.answers.push({ day: data });

      // Запитуємо номер телефону
      await sendContactRequest(chatId);

      // Надсилаємо підтвердження
      await sendMessageAsync(chatId, "Дякую, ваші дані записано.");
    }
  }
});

export default bot;