import TeleBot from "telebot";

const bot = new TeleBot(process.env.TELEGRAM_BOT_TOKEN);

// ID вчителя
const TEACHER_CHAT_ID = 7114975475;

const sessions = {};

// Функція для відправки повідомлень без блокування основного потоку
const sendMessageAsync = (chatId, text, replyMarkup) => {
  return bot.sendMessage(chatId, text, { reply_markup: replyMarkup });
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
      await sendMessageAsync(chatId, "Записуєте себе чи дитину?", {
        keyboard: [
          ['Себе', 'Дитину']
        ],
        one_time_keyboard: true
      });
    }
    // Якщо відповідь на "Себе чи дитину?" отримано
    else if (session.step === 1) {
      // Зберігаємо вибір користувача
      const choice = msg.text.toLowerCase();
      if (choice === 'себе' || choice === 'дитину') {
        session.answers.push(choice);
        session.step++;
        await sendMessageAsync(chatId, "Який день тижня вам зручний для проведення уроку?", {
          keyboard: [
            ['Понеділок', 'Вівторок'],
            ['Середа', 'Четвер'],
            ['П\'ятниця', 'Субота']
          ],
          one_time_keyboard: true
        });
      } else {
        await sendMessageAsync(chatId, "Будь ласка, виберіть 'Себе' або 'Дитину'.");
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
        await sendMessageAsync(chatId, "Будь ласка, виберіть правильний день.");
      }
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

export default bot;
