import dotenv from "dotenv";
dotenv.config();

import { Telegraf, Context } from "telegraf";
import { ChatPermissions } from "telegraf/typings/core/types/typegram";
import { Message } from "telegraf/typings/core/types/typegram";

// .env dan token olish
const BOT_TOKEN = process.env.BOT_TOKEN;

if (!BOT_TOKEN) {
  console.error("❌ BOT_TOKEN yo‘q! .env faylni tekshir.");
  process.exit(1);
}

class SavdoBot {
  private bot: Telegraf;
  private unmuteUsers: Set<number>;

  constructor() {
    this.bot = new Telegraf(BOT_TOKEN!);
    this.unmuteUsers = new Set();
    this.setupHandlers();
  }
  /**
   * Guruhdagi barcha foydalanuvchilarni mute qilish
   */
  private async autoMuteAll(chatId: number): Promise<void> {
    try {
      const permissions: ChatPermissions = {
        can_send_messages: false,
        can_send_polls: false,
        can_send_other_messages: false,
        can_add_web_page_previews: false,
        can_change_info: false,
        can_invite_users: false,
        can_pin_messages: false,
      };

      await this.bot.telegram.setChatPermissions(chatId, permissions);
      console.log(`Chat ${chatId} mute qilindi`);
    } catch (error) {
      console.error(`Mute qilishda xatolik ${chatId}:`, error);
    }
  }

  /**
   * Foydalanuvchini unmute qilish
   */
  private async unmuteUser(chatId: number, userId: number): Promise<void> {
    try {
      const permissions: ChatPermissions = {
        can_send_messages: true,
        can_send_polls: true,
        can_send_other_messages: true,
        can_add_web_page_previews: true,
        can_change_info: false,
        can_invite_users: false,
        can_pin_messages: false,
      };

      await this.bot.telegram.restrictChatMember(chatId, userId, {
        permissions,
        until_date: 0, // 0 = cheksiz
      });
      this.unmuteUsers.add(userId);
      console.log(`Foydalanuvchi ${userId} unmute qilindi`);
    } catch (error) {
      console.error(`Unmute xatolik ${userId}:`, error);
    }
  }

  /**
   * Foydalanuvchini mute qilish
   */
  private async muteUser(chatId: number, userId: number): Promise<void> {
    try {
      const permissions: ChatPermissions = {
        can_send_messages: false,
        can_send_polls: false,
        can_send_other_messages: false,
        can_add_web_page_previews: false,
        can_change_info: false,
        can_invite_users: false,
        can_pin_messages: false,
      };

      await this.bot.telegram.restrictChatMember(chatId, userId, {
        permissions,
        until_date: 0, // 0 = cheksiz
      });

      this.unmuteUsers.delete(userId);
      console.log(`Foydalanuvchi ${userId} mute qilindi`);
    } catch (error) {
      console.error(`Mute xatolik ${userId}:`, error);
    }
  }

  /**
   * Admin ekanligini tekshirish
   */
  private async isAdmin(chatId: number, userId: number): Promise<boolean> {
    try {
      const member = await this.bot.telegram.getChatMember(chatId, userId);
      return member.status === "administrator" || member.status === "creator";
    } catch (error) {
      console.error("Admin tekshirishda xatolik:", error);
      return false;
    }
  }

  /**
   * Argumentlarni parse qilish
   */
  private parseArgs(text: string): [number, number] | null {
    const parts = text.trim().split(/\s+/);
    if (parts.length !== 3) return null;

    const oluvchiId = parseInt(parts[1]!, 10);
    const sotuvchiId = parseInt(parts[2]!, 10);

    if (isNaN(oluvchiId) || isNaN(sotuvchiId)) return null;

    return [oluvchiId, sotuvchiId];
  }

  /**
   * Handler larni sozlash
   */
  private setupHandlers(): void {
    // /startSavdo buyrug'i
    this.bot.command("startSavdo", async (ctx: Context) => {
      const chatId = ctx.chat?.id;
      const userId = ctx.from?.id;

      if (!ctx.message || !("text" in ctx.message)) {
        await ctx.reply("❌ Xatolik: Ma'lumotlar to'liq emas!");
        return;
      }
      const messageText = ctx.message.text;

      if (!chatId || !userId || !messageText) {
        await ctx.reply("❌ Xatolik: Ma'lumotlar to'liq emas!");
        return;
      }

      // Faqat guruh yoki superguruhda ishlaydi
      if (ctx.chat?.type !== "group" && ctx.chat?.type !== "supergroup") {
        await ctx.reply("❌ Bu buyruq faqat guruhlarda ishlaydi!");
        return;
      }

      // Admin tekshirish
      if (!(await this.isAdmin(chatId, userId))) {
        await ctx.reply("❌ Faqat adminlar bu buyruqni ishlatishi mumkin!");
        return;
      }

      // Argumentlarni parse qilish
      const args = this.parseArgs(messageText);
      if (!args) {
        await ctx.reply(
          "❌ To'g'ri format:\n/startSavdo oluvchiID sotuvchiID\n\n" +
            "Misol: /startSavdo 123456789 987654321"
        );
        return;
      }

      const [oluvchiId, sotuvchiId] = args;

      try {
        // Ikkalasini unmute qilish
        await this.unmuteUser(chatId, oluvchiId);
        await this.unmuteUser(chatId, sotuvchiId);

        await ctx.replyWithHTML(
          `🔵 Savdo boshlandi!\n\n` +
            `🤵‍♂️ Oluvchi ID: <a href="tg://user?id=${oluvchiId}">${oluvchiId}</a>\n` +
            `🧑‍💼 Sotuvchi ID: <a href="tg://user?id=${sotuvchiId}">${sotuvchiId}</a>\n\n` +
            `SAVDODA OMAD TILAYMAN`
        );
      } catch (error) {
        await ctx.reply(`❌ Xatolik: ${String(error)}`);
      }
    });

    // /endSavdo buyrug'i
    this.bot.command("endSavdo", async (ctx: Context) => {
      const chatId = ctx.chat?.id;
      const userId = ctx.from?.id;

      if (!ctx.message || !("text" in ctx.message)) {
        await ctx.reply("❌ Xatolik: Ma'lumotlar to'liq emas!");
        return;
      }

      const messageText = ctx.message.text;

      if (!chatId || !userId) {
        await ctx.reply("❌ Xatolik: Ma'lumotlar to'liq emas!");
        return;
      }

      // Faqat guruh yoki superguruhda ishlaydi
      if (ctx.chat?.type !== "group" && ctx.chat?.type !== "supergroup") {
        await ctx.reply("❌ Bu buyruq faqat guruhlarda ishlaydi!");
        return;
      }

      // Admin tekshirish
      if (!(await this.isAdmin(chatId, userId))) {
        await ctx.reply("❌ Faqat adminlar bu buyruqni ishlatishi mumkin!");
        return;
      }

      // Argumentlarni parse qilish
      const args = this.parseArgs(messageText);
      if (!args) {
        await ctx.reply(
          "❌ To'g'ri format:\n/endSavdo oluvchiID sotuvchiID\n\n" +
            "Misol: /endSavdo 123456789 987654321"
        );
        return;
      }

      const [oluvchiId, sotuvchiId] = args;

      try {
        // Ikkalasini mute qilish
        await this.muteUser(chatId, oluvchiId);
        await this.muteUser(chatId, sotuvchiId);

        await ctx.replyWithHTML(
          `🔴 Savdo tugadi!\n\n` +
            `🤵‍♂️ Oluvchi ID: <a href="tg://user?id=${oluvchiId}">${oluvchiId}</a>\n` +
            `🧑‍💼 Sotuvchi ID: <a href="tg://user?id=${sotuvchiId}">${sotuvchiId}</a>\n\n` +
            `SAVDO YAKUNLANDI 🎉 \n SAVDOINGIZ UCHUN RAHMAT 🤝 `
        );
      } catch (error) {
        await ctx.reply(`❌ Xatolik: ${String(error)}`);
      }
    });

    // Oddiy xabarlarni boshqarish
    this.bot.on("text", async (ctx: Context) => {
      const chatId = ctx.chat?.id;
      const userId = ctx.from?.id;
      const messageId = ctx.message?.message_id;

      if (!chatId || !userId || !messageId) return;

      // Faqat guruh yoki superguruhda ishlaydi
      if (ctx.chat?.type !== "group" && ctx.chat?.type !== "supergroup") {
        return;
      }

      try {
        // Admin tekshirish
        if (await this.isAdmin(chatId, userId)) {
          // Admin har doim yoza oladi
          return;
        }

        // Unmute ro'yxatida tekshirish
        if (this.unmuteUsers.has(userId)) {
          // Unmute qilingan, xabarni qoldirish
          return;
        }

        // Admin ham emas, unmute ham emas - xabarni o'chirish
        try {
          await this.bot.telegram.deleteMessage(chatId, messageId);
        } catch (deleteError) {
          console.error("Xabar o'chirishda xatolik:", deleteError);
        }
      } catch (error) {
        // Xatolik bo'lsa, xabarni o'chirish
        try {
          await this.bot.telegram.deleteMessage(chatId, messageId);
        } catch (deleteError) {
          console.error("Xabar o'chirishda xatolik:", deleteError);
        }
      }
    });

    // Xato handler
    this.bot.catch((error, ctx) => {
      console.error("Bot xatoligi:", error);
      console.error("Context:", ctx);
    });
  }

  /**
   * Botni ishga tushirish
   */
  public async start(): Promise<void> {
    try {
      console.log("🤖 SAVDO-BOT ishga tushmoqda...");
      console.log("📝 Bot run bo'lganda guruhdagi hamma mute bo'ladi");
      console.log(
        "🔓 /startSavdo oluvchiID sotuvchiID - foydalanuvchilarni unmute qilish"
      );
      console.log(
        "🔒 /endSavdo oluvchiID sotuvchiID - foydalanuvchilarni mute qilish"
      );

      await this.bot.launch();
      console.log("✅ Bot muvaffaqiyatli ishga tushdi!");

      // Graceful shutdown
      process.once("SIGINT", () => this.bot.stop("SIGINT"));
      process.once("SIGTERM", () => this.bot.stop("SIGTERM"));
    } catch (error) {
      console.error("Bot ishga tushirishda xatolik:", error);
    }
  }
}

// Botni ishga tushirish
const bot = new SavdoBot();
bot.start().catch(console.error);

export default SavdoBot;
