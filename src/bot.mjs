import TeleBot from "telebot";

const bot = new TeleBot(process.env.TELEGRAM_BOT_TOKEN);

// ID вчителя
const TEACHER_CHAT_ID = 806072377;
const TEACHER_CHAT_ID1 = 7114975475;


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

    if (!session) {
      await sendMessageAsync(chatId, "Натисніть /start, щоб почати.");
      return;
    }

    if (session.step === 0) {
      session.answers.push({ name: msg.text });
      session.step++;
      await sendMessageAsync(chatId, "Вкажіть ваш Telegram-тег (наприклад, @username). У разі відсутності (приклад - @-)");
    } else if (session.step === 1) {
      const telegramTag = msg.text.trim();

      if (telegramTag.startsWith("@") && telegramTag.length > 1 || telegramTag === "-") {
        session.answers.push({ telegramTag });
        session.step++;

        const keyboard = createKeyboard(["Себе", "Дитину"]);
        await sendMessageAsync(chatId, "Записуєте себе чи дитину?", keyboard);
      } else {
        await sendMessageAsync(chatId, "Будь ласка, введіть коректний Telegram-тег, який починається з @.");
      }
    } else if (session.step === 3) {
      const age = parseInt(msg.text.trim(), 10);

      if (!isNaN(age) && age > 0) {
        session.answers.push({ age });
        session.step++;

        const keyboard = createKeyboard(["Новачок", "Середній", "Просунутий"]);
        await sendMessageAsync(chatId, "Який у вас рівень англійської?", keyboard);
      } else {
        await sendMessageAsync(chatId, "Будь ласка, введіть коректний вік.");
      }
    }
  }
});

// Обробка кнопок (callbackQuery)
bot.on("callbackQuery", async (msg) => {
  const chatId = msg.from.id;
  const session = sessions[chatId];
  const data = msg.data;

  if (!session) {
    await sendMessageAsync(chatId, "Натисніть /start, щоб почати.");
    return;
  }

  if (session.step === 2) {
    if (data === "Себе" || data === "Дитину") {
      session.answers.push({ choice: data });
      session.step++;
      const question = data === "Себе" ? "Скільки вам років?" : "Скільки років дитині?";
      await sendMessageAsync(chatId, question);
    }
  } else if (session.step === 4) {
    const validLevels = ["Новачок", "Середній", "Просунутий"];
    if (validLevels.includes(data)) {
      session.answers.push({ level: data });
      session.step++;

      const days = ["Понеділок", "Вівторок", "Середа", "Четвер", "П’ятниця", "Субота", "Неділя"];
      const keyboard = createKeyboard(days);
      await sendMessageAsync(chatId, "Оберіть день проведення уроку:", keyboard);
    }
  } else if (session.step === 5) {
    const validDays = ["Понеділок", "Вівторок", "Середа", "Четвер", "П’ятниця", "Субота", "Неділя"];
    if (validDays.includes(data)) {
      session.answers.push({ day: data });
      session.step++;

      await sendContactRequest(chatId);
    }
  }
});

// Обробка контактних даних
bot.on("contact", async (msg) => {
  const chatId = msg.chat.id;
  const session = sessions[chatId];

  if (session && session.step === 6) {
    const contact = msg.contact.phone_number;
    session.answers.push({ phone: contact });

    // Відправка інформації вчителю
    const messageToTeacher = `
Запис на урок:
- Ім'я: ${session.answers[0].name}
- Telegram: ${session.answers[1].telegramTag}
- Кого записують: ${session.answers[2].choice}
- Вік: ${session.answers[3].age}
- Рівень англійської: ${session.answers[4].level}
- День: ${session.answers[5].day}
- Номер телефону: ${contact}
    `;

    await sendMessageAsync(TEACHER_CHAT_ID, messageToTeacher);
    await sendMessageAsync(TEACHER_CHAT_ID1, messageToTeacher);

    // Відповідь користувачу
    await sendMessageAsync(chatId, "Дякую! Ваша заявка прийнята. Ми зв'яжемося з вами найближчим часом.");

    // Завершення сесії
    delete sessions[chatId];
  }
});


export default bot;