import TeleBot from "telebot";

const bot = new TeleBot(process.env.TELEGRAM_BOT_TOKEN);

// ID вчителя
const TEACHER_CHAT_ID = 7114975475;

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

// Відправка привітального повідомлення
bot.on("text", (msg) => {
  const chatId = msg.chat.id;

  // Якщо це перший запит /start
  if (msg.text === "/start") {
    sessions[chatId] = { answers: [], step: 0 };

    bot.sendMessage(chatId, "Привіт, я Даша твій сучасний тютор з англійської! Давайте запишемось на пробний урок. Пробний урок триває 30 хвилин, та являється повністю безкоштовним!")
      .then(() => {
        setTimeout(() => {
          // Після привітального повідомлення відправляємо перше питання
          bot.sendMessage(chatId, questions[0]);
        }, 2000); // Затримка 2 секунди
      });
  } else {
    const session = sessions[chatId];

    if (!session) {
      bot.sendMessage(chatId, "Натисніть /start, щоб почати.");
      return;
    }

    const step = session.step;

    if (step < questions.length) {
      session.answers.push(msg.text);
      session.step++;

      if (session.step < questions.length) {
        bot.sendMessage(chatId, questions[session.step]);
      } else {
        // Коли всі питання відповідані, відправляємо дані вчителю
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
        delete sessions[chatId]; // очищаємо сесію
      }
    }
  }
});

// Обробка callback_data для кнопок
bot.on("callback_query", (query) => {
  const chatId = query.message.chat.id;
  const session = sessions[chatId];

  if (!session) return;

  if (session.step === 1) {
    if (query.data === "self") {
      session.answers.push("Себе");
      session.step++;
      bot.sendMessage(chatId, "Який ваш вік?");
    } else if (query.data === "child") {
      session.answers.push("Дитину");
      session.step++;
      bot.sendMessage(chatId, "Який вік дитини?");
    }
  }
});

export default bot;
