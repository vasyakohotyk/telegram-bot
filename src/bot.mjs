import TeleBot from "telebot"

const bot = new TeleBot(process.env.TELEGRAM_BOT_TOKEN)

bot.on("text", msg => msg.reply.text(msg.text + msg.text + msg.text))

const sessions = {};
const questions = [
  "Як вас звати?",
  "Записуєте себе чи дитину?",
  "Який ваш вік?",
  "Який вік дитини?",
  "Який ваш номер телефону?",
  "Який день тижня вам зручний для проведення пробного уроку?",
  "Ваш Telegram тег (поставте - , якщо ви хочете пропустити це питання)?",
  "Який ваш рівень володіння мовою (A1-C2)?"
];

// Логування помилок
bot.on("polling_error", (error) => {
  console.error("Polling error:", error);
});

// Обробка команди /start
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const userName = msg.chat.username;
  sessions[chatId] = { answers: [], step: 0, isChild: null };

  bot.sendPhoto(chatId, 'https://static.vecteezy.com/vite/assets/photo-masthead-375-BoK_p8LG.webp', {
    caption: `Привіт, я Даша твій сучасний тютор з англійської! Давайте запишемось на пробний урок. Пробний урок триває 30 хвилин, та являється повністю безкоштовним!`
  }).then(() => {
    setTimeout(() => {
    bot.sendMessage(chatId, questions[0]);
    },2000)
  });
  
});

// Обробка повідомлень
bot.on("message", (msg) => {
  const chatId = msg.chat.id;

  if (msg.text && msg.text.startsWith("/")) return;

  const session = sessions[chatId];
  if (!session) {
    bot.sendMessage(chatId, "Натисніть /start, щоб почати.");
    return;
  }

  const step = session.step;

  if (step === 0) {
    session.answers.push(msg.text);
    session.step++;
    bot.sendMessage(chatId, questions[1], {
      reply_markup: {
        inline_keyboard: [
          [{ text: "Себе", callback_data: "self" }],
          [{ text: "Дитину", callback_data: "child" }],
        ],
      },
    });
  } else if (step === 2) {
    session.answers.push(msg.text);
    session.step++;
    bot.sendMessage(chatId, questions[4], {
      reply_markup: {
        keyboard: [[{ text: "Надіслати номер телефону", request_contact: true }]],
        resize_keyboard: true,
        one_time_keyboard: true,
      },
    });
  } else if (step === 3) {
    const phoneNumber = msg.contact ? msg.contact.phone_number : msg.text;
    session.answers.push(phoneNumber);
    session.step++;
    bot.sendMessage(chatId, questions[5], {
      reply_markup: {
        inline_keyboard: [
          [{ text: "Понеділок", callback_data: "pn" }],
          [{ text: "Вівторок", callback_data: "wt" }],
          [{ text: "Середа", callback_data: "sr" }],
          [{ text: "Четвер", callback_data: "ct" }],
          [{ text: "П'ятниця", callback_data: "pt" }],
          [{ text: "Субота", callback_data: "sb" }],
        ],
      },
    });
  } else if (step === 5) {
    session.answers.push(msg.text || "Не вказано");
    bot.sendMessage(chatId, questions[7], {
      reply_markup: {
        inline_keyboard: [
          [{ text: "A0", callback_data: "A0" }],
          [{ text: "A1", callback_data: "A1" }],
          [{ text: "A2", callback_data: "A2" }],
          [{ text: "B1", callback_data: "B1" }],
          [{ text: "B2", callback_data: "B2" }],
          [{ text: "C1", callback_data: "C1" }],
          [{ text: "C2", callback_data: "C2" }],
        ],
      },
    });
    session.step++;
  } else if (step === 6) {
    session.answers.push(msg.text || "Не вказано");
    const summary = `Новий запис на урок:\n\n` +
      `1. Ім'я: ${session.answers[0]}\n` +
      `2. Запис: ${session.answers[1] === "self" ? "Себе" : "Дитину"}\n` +
      `3. Вік: ${session.answers[2]}\n` +
      `4. Телефон: ${session.answers[3]}\n` +
      `5. День уроку: ${session.answers[4]}\n` +
      `6. Telegram: @${session.answers[5]}\n` +
      `7. Рівень: ${session.answers[6]}`;

    bot.sendMessage(TEACHER_CHAT_ID, summary);
    bot.sendMessage(chatId, "Дякуємо! Ми зв'яжемося з вами.");
    delete sessions[chatId];
  }
});

// Обробка callback_data для кнопок
// Обробка callback_data для кнопок
bot.on("callback_query", (query) => {
    const chatId = query.message.chat.id;
    const session = sessions[chatId];
  
    if (!session) return;
  
    if (session.step === 1) {
      if (query.data === "self") {
        session.answers.push("Себе");
        session.isChild = false;
        session.step++;
        bot.sendMessage(chatId, "Який ваш вік?");
      } else if (query.data === "child") {
        session.answers.push("Дитину");
        session.isChild = true;
        session.step++;
        bot.sendMessage(chatId, "Який вік дитини?");
      }
    } else if (session.step === 4) {
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
        bot.sendMessage(chatId, questions[6]);
      }
    } else if (session.step === 6) {
      const levelMap = {
        A0: "A0",
        A1: "A1",
        A2: "A2",
        B1: "B1",
        B2: "B2",
        C1: "C1",
        C2: "C2",
      };
  
      const selectedLevel = levelMap[query.data];
      if (selectedLevel) {
        session.answers.push(selectedLevel);
        session.step++;
        
        // Підсумкове повідомлення про нового користувача
        const summary = `Новий запис на урок:\n\n` +
          `1. Ім'я: ${session.answers[0]}\n` +
          `2. Запис: ${session.answers[1] === "self" ? "Себе" : "Дитину"}\n` +
          `3. Вік: ${session.answers[2]}\n` +
          `4. Телефон: ${session.answers[3]}\n` +
          `5. День уроку: ${session.answers[4]}\n` +
          `6. Telegram: @${session.answers[5]}\n` +
          `7. Рівень: ${session.answers[6]}`;
  
        bot.sendMessage(TEACHER_CHAT_ID, summary);
        bot.sendMessage(chatId, "Дякуємо! Ми зв'яжемося з вами для подальшої консультації.");
        delete sessions[chatId];
      }
    }
  });
  
export default bot
