import TeleBot from 'telebot';

const bot = new TeleBot(process.env.TELEGRAM_BOT_TOKEN);

// ID вчителя
const TEACHER_CHAT_ID = 7114975475;

const sessions = {};

// Функція для асинхронної відправки повідомлень
const sendMessageAsync = (chatId, text, options = {}) => {
  return bot.sendMessage(chatId, text, options);
};

// Обробка команд /start та інших запитів
bot.on('text', async (msg) => {
  const chatId = msg.chat.id;
  let session = sessions[chatId];

  if (!session) {
    session = sessions[chatId] = { answers: [], step: 0 };
  }

  if (msg.text === '/start') {
    await sendMessageAsync(chatId, "Привіт, я Даша, твій сучасний тютор з англійської! Давайте запишемось на пробний урок.");
    await sendMessageAsync(chatId, "Як вас звати?");
    session.step = 1;
    return;
  }

  // Обробка відповідей на запитання
  switch (session.step) {
    case 1: // Запитуємо ім'я
      session.answers.push(msg.text);
      session.step = 2;
      await sendMessageAsync(chatId, "Записуєте себе чи дитину? Виберіть одну з опцій нижче.", {
        reply_markup: {
          inline_keyboard: [
            [{ text: "Себе", callback_data: "sebe" }],
            [{ text: "Дитину", callback_data: "dytynu" }]
          ]
        }
      });
      break;

    case 2: // Очікуємо вибір "Себе" або "Дитину"
      break;

    case 3: // Запитуємо день тижня
      session.answers.push(msg.text);
      session.step = 4;
      await sendMessageAsync(chatId, "Який день тижня вам зручний для проведення уроку?");
      
      // Відправка кнопок для вибору дня
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
      break;

    case 4: // Запитуємо час
      session.answers.push(msg.text);
      await sendMessageAsync(TEACHER_CHAT_ID, `Новий запис:\nІм'я: ${session.answers[0]}\nЗаписує: ${session.answers[1]}\nДень уроку: ${session.answers[2]}\nЧас: ${session.answers[3]}`);
      delete sessions[chatId];
      break;

    default:
      await sendMessageAsync(chatId, "Натисніть /start, щоб почати.");
  }
});

// Обробка вибору "Себе" або "Дитину" через callback
bot.on('callback_query', async (query) => {
  const chatId = query.message.chat.id;
  const session = sessions[chatId];
  const choiceMap = {
    sebe: "Себе",
    dytynu: "Дитину"
  };

  const selectedChoice = choiceMap[query.data];
  if (selectedChoice) {
    session.answers.push(selectedChoice);
    session.step = 3;
    await sendMessageAsync(chatId, `Ви вибрали: ${selectedChoice}. Тепер виберіть день для уроку.`);
  }

  await bot.answerCallbackQuery(query.id, { text: `Ви обрали: ${selectedChoice}`, show_alert: true });
});

export default bot;
