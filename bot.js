const TelegramBot = require('node-telegram-bot-api');
const fetch = require('node-fetch');

const token = process.env.BOT_TOKEN;
const bot = new TelegramBot(token, { polling: true });

const users = {};

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  users[chatId] = { step: 0, username: '', passwords: [] };
  bot.sendMessage(chatId, 'Please enter your username:');
});

bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  if (!users[chatId]) return;
  const user = users[chatId];
  if (msg.text && msg.text.startsWith('/start')) return;

  if (user.step === 0) {
    user.username = msg.text.trim();
    user.step = 1;
    bot.sendMessage(chatId, 'Please send the password list file (txt):');
  } else if (user.step === 1 && msg.document?.mime_type === 'text/plain') {
    bot.getFileLink(msg.document.file_id).then(url =>
      fetch(url).then(res => res.text()).then(text => {
        user.passwords = text.split(/\r?\n/).filter(Boolean);
        bot.sendMessage(chatId, 'Passwords received! Please wait...');
        const pass = user.passwords[Math.floor(Math.random() * user.passwords.length)];
        setTimeout(() => {
          bot.sendMessage(chatId, `username: ${user.username}\npassword: ${pass}`);
          delete users[chatId];
        }, 3000);
      }).catch(() => bot.sendMessage(chatId, 'File read error'))
    );
  }
});
