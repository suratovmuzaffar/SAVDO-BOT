import { Telegraf, Context } from "telegraf";
import { Update } from "telegraf/typings/core/types/typegram";
import * as dotenv from "dotenv";

dotenv.config();

if (!process.env.BOT_TOKEN) {
  throw new Error("BOT_TOKEN muhit o'zgaruvchisi kerak!");
}

const bot = new Telegraf(process.env.BOT_TOKEN);

// Admin ID'larini olish
const adminIds =
  process.env.ADMIN_IDS?.split(",").map((id) => parseInt(id.trim())) || [];

// Admin tekshirish funksiyasi
const isAdmin = (userId: number): boolean => {
  return adminIds.includes(userId);
};

// Utility funksiyalar
const formatUptime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}s ${minutes}d`;
};

// Bot ishga tushganda
bot.start((ctx) => {
  const welcomeMessage = `
🤖 Savdo Bot'ga xush kelibsiz!

📋 Mavjud komandalar:
/products - Mahsulotlar ro'yxati
/order - Buyurtma berish
/help - Yordam

👨‍💼 Admin komandalar:
/mute - Guruhni mute qilish
/unmute - Guruhni unmute qilish
/stats - Statistika

🛒 Savdo vaqti: 9:00 - 21:00
📞 Aloqa: @admin_username
  `;

  ctx.reply(welcomeMessage);
});

// Yordam komamdasi
bot.help((ctx) => {
  const helpMessage = `
📖 Bot haqida yordam

🔧 Asosiy komandalar:
• /products - Barcha mahsulotlar ro'yxati
• /order - Buyurtma berish
• /help - Ushbu yordam xabari

👨‍💼 Admin komandalar:
• /mute - Guruhni mute qilish
• /unmute - Guruhni unmute qilish
• /stats - Bot statistikasi

❓ Savol-javoblar:
• Bot qanday ishlaydi? - Guruhda savdo va tartibni nazorat qiladi
• Buyurtma qanday beriladi? - /order komandasi orqali
• Muammo bo'lsa kim bilan bog'lanish kerak? - @admin_username

🕐 Ish vaqti: 24/7 faol
  `;

  ctx.reply(helpMessage);
});

// Mute komandasi
bot.command("mute", async (ctx) => {
  const userId = ctx.from?.id;

  if (!userId || !isAdmin(userId)) {
    ctx.reply("❌ Bu komandani faqat adminlar ishlatishi mumkin!");
    return;
  }

  if (ctx.chat?.type !== "group" && ctx.chat?.type !== "supergroup") {
    ctx.reply("❌ Bu komanda faqat guruhlarda ishlaydi!");
    return;
  }

  try {
    // Guruh sozlamalarini o'zgartirish (faqat adminlar yoza oladi)
    await ctx.setChatPermissions({
      can_send_messages: false,
      can_send_videos: false,
      can_send_polls: false,
      can_send_other_messages: false,
      can_add_web_page_previews: false,
      can_change_info: false,
      can_invite_users: false,
      can_pin_messages: false,
    });

    ctx.reply("✅ Guruh mute qilindi!\n🔒 Faqat adminlar yoza oladi.");
  } catch (error) {
    console.error("Guruhni mute qilishda xato:", error);
    ctx.reply(
      "❌ Guruhni mute qilishda xato yuz berdi. Botga kerakli admin huquqlari berilganini tekshiring."
    );
  }
});

// Unmute komandasi
bot.command("unmute", async (ctx) => {
  const userId = ctx.from?.id;

  if (!userId || !isAdmin(userId)) {
    ctx.reply("❌ Bu komandani faqat adminlar ishlatishi mumkin!");
    return;
  }

  if (ctx.chat?.type !== "group" && ctx.chat?.type !== "supergroup") {
    ctx.reply("❌ Bu komanda faqat guruhlarda ishlaydi!");
    return;
  }

  try {
    // Guruh sozlamalarini qaytarish (hamma yoza oladi)
    await ctx.setChatPermissions({
      can_send_messages: true,
      can_send_videos: false,
      can_send_polls: true,
      can_send_other_messages: true,
      can_add_web_page_previews: true,
      can_change_info: false,
      can_invite_users: true,
      can_pin_messages: false,
    });

    ctx.reply("✅ Guruh unmute qilindi!\n💬 Hamma a'zolar yoza oladi.");
  } catch (error) {
    console.error("Guruhni unmute qilishda xato:", error);
    ctx.reply("❌ Guruhni unmute qilishda xato yuz berdi.");
  }
});

// Mahsulotlar ro'yxati
bot.command("products", (ctx) => {
  const products = `
🛍️ MAHSULOTLAR RO'YXATI

📱 Telefonlar:
• iPhone 15 Pro - $999
• Samsung Galaxy S24 - $899
• Xiaomi 14 - $599

💻 Laptoplar:
• MacBook Air M2 - $1199
• Dell XPS 13 - $999
• Lenovo ThinkPad - $799

🎧 Aksessuarlar:
• AirPods Pro - $249
• Sony WH-1000XM5 - $399
• Anker PowerBank - $49

💳 To'lov usullari:
• Naqd pul ✅
• Plastik karta ✅
• Bank o'tkazmasi ✅

🚚 Yetkazib berish: 1-3 kun ichida
📞 Buyurtma: /order komandasi orqali
  `;

  ctx.reply(products);
});

// Buyurtma berish
bot.command("order", (ctx) => {
  const userName = ctx.from?.first_name || "Foydalanuvchi";
  const userId = ctx.from?.id;

  const orderMessage = `
🛒 BUYURTMA BERISH

👋 Salom ${userName}!

📋 Buyurtma berish uchun:
1. Kerakli mahsulotni tanlang
2. Miqdorini bildiring
3. Manzil va telefon raqamingizni yuboring

📞 Aloqa:
• Telegram: @admin_username
• Telefon: +998 90 123 45 67

⏰ Ish vaqti: 9:00 - 21:00
🚚 Yetkazib berish: 1-3 kun

💡 Maslahat: Tezroq javob olish uchun to'liq ma'lumot yuboring!
  `;

  ctx.reply(orderMessage);

  // Admin ga xabar yuborish
  if (adminIds.length > 0) {
    const adminNotification = `
🔔 YANGI BUYURTMA SO'ROVI

👤 Mijoz: ${userName}
🆔 ID: ${userId}
📅 Vaqt: ${new Date().toLocaleString("uz-UZ")}

👆 Mijoz bilan bog'laning!
    `;

    adminIds.forEach((adminId) => {
      bot.telegram.sendMessage(adminId, adminNotification);
    });
  }
});

// Stats komandasi (faqat adminlar uchun)
bot.command("stats", (ctx) => {
  const userId = ctx.from?.id;

  if (!userId || !isAdmin(userId)) {
    ctx.reply("❌ Bu komandani faqat adminlar ishlatishi mumkin!");
    return;
  }

  const uptime = process.uptime();
  const uptimeFormatted = formatUptime(uptime);

  const stats = `
📊 **BOT STATISTIKASI**

⏱️ **Ishlash vaqti:** ${uptimeFormatted}
🤖 **Bot holati:** Faol
💾 **Xotira:** ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB
🔄 **Restart:** ${new Date().toLocaleString("uz-UZ")}

📈 **Bugungi ko'rsatkichlar:**
• Xabarlar: N/A
• Buyurtmalar: N/A
• Yangi a'zolar: N/A

🎯 **Maqsad:** Guruhni tartibli va savdoni oson qilish!
  `;

  ctx.reply(stats, { parse_mode: "Markdown" });
});

// Yangi a'zo qo'shilganda
bot.on("new_chat_members", (ctx) => {
  const newMembers = ctx.message.new_chat_members;

  if (newMembers) {
    newMembers.forEach((member) => {
      if (!member.is_bot) {
        const welcomeMessage = `
👋 **Xush kelibsiz, ${member.first_name}!**

🛒 **Bizning savdo guruhimizga xush kelibsiz!**

📋 **Qoidalar:**
• Faqat savdo haqida gaplashing
• Spam va reklama taqiqlangan
• Hurmatli muloqat qiling

💡 **Foydali komandalar:**
• /products - Mahsulotlar ro'yxati
• /order - Buyurtma berish
• /help - Yordam

🎉 **Xarid qiling va zavqlaning!**
        `;

        ctx.reply(welcomeMessage, { parse_mode: "Markdown" });
      }
    });
  }
});

// Kiruvchi xabarlarni filtrlash
bot.on("text", (ctx) => {
  if (!ctx.message || !("text" in ctx.message)) return;

  const text = ctx.message.text.toLowerCase();
  const spamWords = ["reklama", "spam", "click", "link", "telegram.me"];

  // Spam tekshirish
  if (spamWords.some((word) => text.includes(word))) {
    try {
      ctx.deleteMessage().catch(() => {
        // Agar xabarni o'chira olmasa, ogohlantirishni yuborish
        ctx.reply("⚠️ Spam aniqlandi! Iltimos bunday xabarlar yubormang.");
      });
    } catch (error) {
      console.error("Xabarni o'chirishda xato:", error);
    }
    return;
  }

  // Savdo vaqtini tekshirish
  const currentHour = new Date().getHours();
  if (currentHour < 9 || currentHour > 21) {
    if (
      text.includes("sotish") ||
      text.includes("narx") ||
      text.includes("buyurtma")
    ) {
      ctx.reply("🕐 Savdo vaqti: 9:00 - 21:00\n⏰ Hozir savdo vaqti emas!");
    }
  }
});

// Xatoliklarni ushlash
bot.catch((err, ctx) => {
  console.error("Bot xatosi:", err);
  ctx.reply("❌ Xatolik yuz berdi. Keyinroq urinib ko'ring.");
});

// Botni ishga tushirish
bot.launch({
  allowedUpdates: ["message", "callback_query", "chat_member"],
});

console.log("🚀 Savdo bot ishga tushdi!");
console.log("📅 Vaqt:", new Date().toLocaleString("uz-UZ"));
console.log("🤖 Bot nomi: Telegram Savdo Bot");

// Graceful shutdown
process.once("SIGINT", () => {
  console.log("⏹️ Bot to'xtatilmoqda...");
  bot.stop("SIGINT");
});

process.once("SIGTERM", () => {
  console.log("⏹️ Bot to'xtatilmoqda...");
  bot.stop("SIGTERM");
});
