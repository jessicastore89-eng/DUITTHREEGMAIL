const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// Konfigurasi Kredensial Telegram Anda
const TELEGRAM_BOT_TOKEN = "8900009325:AAEAP-IkisdY7kec8WmesuvQ0EtBnRCsjGc";
const ADMIN_CHAT_ID = "7137550430"; // ID Anda/Admin untuk Verifikasi ACC/REJECT
const CHANNEL_CHAT_ID = "@threeilm"; // ID/Username Channel Publik Info Log

const TELEGRAM_API = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

// 1. ENDPOINT: NOTIFIKASI WITHDRAW (Kirim langsung ke Channel)
app.post('/api/withdraw', async (req, res) => {
  const { username, amount, method } = req.body;
    
      const textChannel = `📢 *NOTIFIKASI WITHDRAW*\n\n${username} sedang dalam proses withdraw sebesar *Rp ${parseInt(amount).toLocaleString('id-ID')}* via *${method}*.`;
        
          try {
              await axios.post(`${TELEGRAM_API}/sendMessage`, {
                    chat_id: CHANNEL_CHAT_ID,
                          text: textChannel,
                                parse_mode: 'Markdown'
                                    });
                                        res.status(200).json({ success: true });
                                          } catch (err) {
                                              res.status(500).json({ error: err.message });
                                                }
                                                });

                                                // 2. ENDPOINT: USER SETOR GMAIL (Kirim log ke Channel & Kirim Tombol ACC ke Admin)
                                                app.post('/api/submit-gmail', async (req, res) => {
                                                  const { username, userEmail, gmailList } = req.body;
                                                    const totalGmail = gmailList.length;

                                                      // Notif ke Channel Publik
                                                        const textChannel = `ki akun Gmail *${userEmail}* telah menyetor *${totalGmail} Gmail*. Sedang ditinjau oleh Admin.`;
                                                          
                                                            // Notif khusus ke Chat Admin + Tombol inline (Inline Keyboard)
                                                              const textAdmin = `📥 *SETORAN GMAIL BARU*\n\nPengirim: ${username} (${userEmail})\nTotal: ${totalGmail} Akun\n\n*Daftar Gmail*:\n${gmailList.join('\n')}`;

                                                                try {
                                                                    // Kirim ke Channel
                                                                        await axios.post(`${TELEGRAM_API}/sendMessage`, { chat_id: CHANNEL_CHAT_ID, text: textChannel, parse_mode: 'Markdown' });

                                                                            // Kirim ke Admin + Tombol Interaktif
                                                                                await axios.post(`${TELEGRAM_API}/sendMessage`, {
                                                                                      chat_id: ADMIN_CHAT_ID,
                                                                                            text: textAdmin,
                                                                                                  parse_mode: 'Markdown',
                                                                                                        reply_markup: {
                                                                                                                inline_keyboard: [
                                                                                                                          [
                                                                                                                                      { text: "✅ Terima (ACC)", callback_data: `acc_${username}_${totalGmail}` },
                                                                                                                                                  { text: "❌ Tolak (Reject)", callback_data: `reject_${username}` }
                                                                                                                                                            ]
                                                                                                                                                                    ]
                                                                                                                                                                          }
                                                                                                                                                                              });

                                                                                                                                                                                  res.status(200).json({ success: true });
                                                                                                                                                                                    } catch (err) {
                                                                                                                                                                                        res.status(500).json({ error: err.message });
                                                                                                                                                                                          }
                                                                                                                                                                                          });

                                                                                                                                                                                          // 3. TELEGRAM WEBHOOK CALLBACK (Membaca respon klik Tombol dari Admin)
                                                                                                                                                                                          app.post('/telegram-webhook', async (req, res) => {
                                                                                                                                                                                            const { callback_query, message } = req.body;

                                                                                                                                                                                              // Jika admin membalas pesan penolakan dengan teks teks biasa
                                                                                                                                                                                                if (message && message.reply_to_message) {
                                                                                                                                                                                                     // Logika mendeteksi alasan penolakan dan meneruskannya ke database user web
                                                                                                                                                                                                          const alasan = message.text;
                                                                                                                                                                                                               console.log(`Alasan penolakan admin: ${alasan}`);
                                                                                                                                                                                                                    // Disini Anda panggil database Anda untuk mengubah status menjadi 'Ditolak' dan mengirim teks alasan ke user di Web
                                                                                                                                                                                                                         return res.sendStatus(200);
                                                                                                                                                                                                                           }

                                                                                                                                                                                                                             if (!callback_query) return res.sendStatus(200);

                                                                                                                                                                                                                               const data = callback_query.data;
                                                                                                                                                                                                                                 const chatId = callback_query.message.chat.id;
                                                                                                                                                                                                                                   const messageId = callback_query.message.message_id;

                                                                                                                                                                                                                                     if (data.startsWith('acc_')) {
                                                                                                                                                                                                                                         const [_, user, total] = data.split('_');
                                                                                                                                                                                                                                             const rewardTotal = total * 4500;
                                                                                                                                                                                                                                                 
                                                                                                                                                                                                                                                     // Update pesan di Telegram Admin agar tombol hilang
                                                                                                                                                                                                                                                         await axios.post(`${TELEGRAM_API}/editMessageText`, {
                                                                                                                                                                                                                                                               chat_id: chatId,
                                                                                                                                                                                                                                                                     message_id: messageId,
                                                                                                                                                                                                                                                                           text: `✅ *SETORAN DISETUJUI*\n\nAkun milik *${user}* sebanyak ${total} Gmail telah diterima. Saldo Rp ${rewardTotal.toLocaleString('id-ID')} masuk ke user.`,
                                                                                                                                                                                                                                                                                 parse_mode: 'Markdown'
                                                                                                                                                                                                                                                                                     });
                                                                                                                                                                                                                                                                                         
                                                                                                                                                                                                                                                                                             // Tambah saldo ke database user di sini...

                                                                                                                                                                                                                                                                                               } else if (data.startsWith('reject_')) {
                                                                                                                                                                                                                                                                                                   const [_, user] = data.split('_');

                                                                                                                                                                                                                                                                                                       // Minta admin mengetik alasan lewat Reply pesan
                                                                                                                                                                                                                                                                                                           await axios.post(`${TELEGRAM_API}/sendMessage`, {
                                                                                                                                                                                                                                                                                                                 chat_id: chatId,
                                                                                                                                                                                                                                                                                                                       text: `✍️ Silakan balas/reply pesan ini dan ketik *Alasan Penolakan* untuk user *${user}*:`,
                                                                                                                                                                                                                                                                                                                             reply_markup: { force_reply: true }
                                                                                                                                                                                                                                                                                                                                 });
                                                                                                                                                                                                                                                                                                                                   }

                                                                                                                                                                                                                                                                                                                                     res.sendStatus(200);
                                                                                                                                                                                                                                                                                                                                     });

                                                                                                                                                                                                                                                                                                                                     app.listen(3000, () => console.log('Server DuitinGmail running on port 3000'));
