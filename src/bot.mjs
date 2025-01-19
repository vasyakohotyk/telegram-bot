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

// Функція для запиту номера телефону
const sendContactRequest = async (chatId) => {
  const keyboard = {
    keyboard: [[{ text: "Надати номер телефону", request_contact: true }]],
    resize_keyboard: true,
    one_time_keyboard: true,
  };

  await sendMessageAsync(chatId, "Будь ласка, надайте ваш номер телефону, натиснувши кнопку нижче.", keyboard);
};

// Функція для запиту вибору дня
const sendDaySelection = async (chatId) => {
  const days = ["Понеділок", "Вівторок", "Середа", "Четвер", "П'ятниця", "Субота"];
  const keyboard = createKeyboard(days);
  await sendMessageAsync(chatId, "Який день вам підходить для уроку?", keyboard);
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
      await sendMessageAsync(chatId, "Привіт, я Даша, ваш сучасний тютор з англійської!\nІнформація про пробний урок: \n- Повністю безкоштовне \n- Триває 30 хвилин.\n\nДавайте запишемось на пробний урок.");

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
      if (choice === "себе" || choice === "дитину") {
        session.answers.push(choice);
        session.step++;

        // Запитуємо вік залежно від вибору
        if (choice === "себе") {
          await sendMessageAsync(chatId, "Скільки вам років?");
        } else {
          await sendMessageAsync(chatId, "Скільки років дитині?");
        }
      } else {
        await sendMessageAsync(chatId, "Будь ласка, напишіть 'Себе' або 'Дитину'.");
      }
    }

    else if (session.step === 2) {
      const age = parseInt(msg.text.trim(), 10);

      // Перевіряємо, чи це число
      if (!isNaN(age)) {
        session.answers.push(age);
        session.step++;

        // Запитуємо рівень англійської
        const keyboard = createKeyboard(["Початковий", "Середній", "Продвинутий"]);
        await sendMessageAsync(chatId, "Який у вас рівень англійської?", keyboard);
      } else {
        await sendMessageAsync(chatId, "Будь ласка, введіть коректний вік.");
      }
    }
    // Якщо вибір рівня англійської зроблени
    else if (session.step === 3) {
      const level = msg.text.toLowerCase();
      const validLevels = ["початковий", "середній", "продвинутий"];

      if (validLevels.includes(level)) {
        session.answers.push(level);
        session.step++;

        // Запитуємо вибір дня для уроку
        await sendDaySelection(chatId);
      } else {
        await sendMessageAsync(chatId, "Будь ласка, виберіть правильний рівень з кнопок.");
      }
    }
  }
});

// Обробляємо контактні дані
bot.on("contact", async (msg) => {
  const chatId = msg.chat.id;
  const session = sessions[chatId];

  if (session && session.step === 4) {
    // Зберігаємо номер телефону
    session.answers.push(msg.contact.phone_number);

    // Повідомляємо вчителя
    await sendMessageAsync(
      TEACHER_CHAT_ID,
      `Новий запис:\nІм'я: ${session.answers[0]}\nЗаписує: ${session.answers[1]}\nВік: ${session.answers[2]}\nРівень англійської: ${session.answers[3]}\nНомер телефону: ${session.answers[4]}\nДень для уроку: ${session.answers[5]}`
    );

    // Завершуємо сесію
    delete sessions[chatId];
    await sendMessageAsync(chatId, "Дякуємо! Ми зв'яжемось з вами найближчим часом.");
  } else {
    await sendMessageAsync(chatId, "Щось пішло не так. Натисніть /start, щоб почати знову.");
  }
});

// Обробник callback-запитів для кнопок
bot.on("callbackQuery", async (query) => {
  const chatId = query.from.id;
  const session = sessions[chatId];

  if (!session) {
    await sendMessageAsync(chatId, "Натисніть /start, щоб почати.");
    return;
  }

  const answer = query.data;

  try {
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
        await sendMessageAsync(chatId, "Будь ласка, оберіть 'Себе' або 'Дитину' за допомогою кнопок.");
      }
    } else if (session.step === 3) {
      const validLevels = ["початковий", "середній", "продвинутий"];
      if (validLevels.includes(answer)) {
        session.answers.push(answer);
        session.step++;

        // Запитуємо вибір дня
        await sendDaySelection(chatId);
      } else {
        await sendMessageAsync(chatId, "Будь ласка, виберіть правильний рівень за допомогою кнопок.");
      }
    } else if (session.step === 4) {
      session.answers.push(answer);
      session.step++;

      // Викликаємо функцію для запиту номера телефону
      await sendContactRequest(chatId);
    } else {
      await sendMessageAsync(chatId, "Невідома дія. Спробуйте ще раз.");
    }

    await bot.answerCallbackQuery(query.id);
  } catch (error) {
    console.error("Помилка обробки callbackQuery:", error);
    await sendMessageAsync(chatId, "Сталася помилка. Спробуйте ще раз.");
  }
});

export default bot;
