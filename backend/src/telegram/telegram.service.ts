import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaymentMethod, Prisma, Role } from '@prisma/client';
import * as ExcelJS from 'exceljs';
import { Markup, Telegraf } from 'telegraf';
import { AuditService } from '../audit/audit.service';
import { PaymentsService } from '../payments/payments.service';
import { PrismaService } from '../prisma/prisma.service';
import { SalesService } from '../sales/sales.service';

const BTN_HARIDLARIM = '🛒 Haridlarim';
const BTN_QARZLARIM = '💰 Qarzlarim';
const BTN_TOLOVLARIM = "💳 To'lovlarim";
const BTN_PROFIL = '👤 Profil';
const BTN_CHIQISH = '🚪 Chiqish';
const BTN_NEW_ORDER = '🛒 Yangi buyurtma';

const MENU_BUTTONS = [[BTN_HARIDLARIM], [BTN_QARZLARIM], [BTN_TOLOVLARIM], [BTN_PROFIL, BTN_CHIQISH]];
const CODE_PATTERN = /^\d{4}$/;

const HEADER_FILL: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2F5597' } };
const HEADER_FONT: Partial<ExcelJS.Font> = { bold: true, color: { argb: 'FFFFFFFF' } };

function formatAmount(value: string | number | Prisma.Decimal) {
  return new Intl.NumberFormat('uz-UZ').format(Number(value.toString()));
}

function formatDate(date: Date) {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

@Injectable()
export class TelegramService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TelegramService.name);
  private bot: Telegraf | null = null;
  private botUsername: string | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly audit: AuditService,
    private readonly sales: SalesService,
    private readonly payments: PaymentsService,
  ) {}

  status() {
    return { configured: Boolean(this.config.get('TELEGRAM_BOT_TOKEN')), botUsername: this.botUsername };
  }

  async onModuleInit() {
    const token = this.config.get<string>('TELEGRAM_BOT_TOKEN');
    if (!token) {
      this.logger.warn('TELEGRAM_BOT_TOKEN is not set — Telegram bot is disabled');
      return;
    }
    const bot = new Telegraf(token);
    this.registerHandlers(bot);
    try {
      const me = await bot.telegram.getMe();
      this.botUsername = me.username;
      this.bot = bot;
      // bot.launch() does not resolve until the bot stops polling — start it without awaiting
      bot.launch().catch((error) => this.logger.error('Telegram bot stopped unexpectedly', error as Error));
      this.logger.log(`Telegram bot @${me.username} started (long polling)`);
    } catch (error) {
      this.logger.error('Failed to start Telegram bot', error as Error);
    }
  }

  onModuleDestroy() {
    this.bot?.stop('shutdown');
  }

  private mainMenu() {
    return Markup.keyboard(MENU_BUTTONS).resize();
  }

  private adminMenu() {
    const webAppUrl = this.config.get<string>('TELEGRAM_WEBAPP_URL');
    const orderButton = webAppUrl ? Markup.button.webApp(BTN_NEW_ORDER, `${webAppUrl}/tg/orders/new`) : BTN_NEW_ORDER;
    return Markup.keyboard([[orderButton]]).resize();
  }

  private registerHandlers(bot: Telegraf) {
    bot.start(async (ctx) => {
      const payload = (ctx.startPayload ?? '').trim();
      if (CODE_PATTERN.test(payload)) {
        await this.tryLinkByCode(ctx, payload);
        return;
      }
      await this.greet(ctx);
    });

    bot.on('text', async (ctx) => {
      const text = (ctx.message.text ?? '').trim();

      const linked = await this.findByTelegramId(String(ctx.chat.id));
      if (!linked) {
        if (CODE_PATTERN.test(text)) {
          await this.tryLinkByCode(ctx, text);
          return;
        }
        await ctx.reply("Kompaniya administratori bergan 4 xonali kodni yuboring.");
        return;
      }

      if (linked.type === 'user') {
        switch (text) {
          case BTN_NEW_ORDER:
            if (!this.config.get<string>('TELEGRAM_WEBAPP_URL')) {
              await ctx.reply("Mini App hali sozlanmagan. Administrator bilan bog'laning.");
              return;
            }
            return;
          default:
            await ctx.reply("Quyidagi menyudan bo'limni tanlang.", this.adminMenu());
        }
        return;
      }

      switch (text) {
        case BTN_HARIDLARIM:
          await this.sendOrdersExcel(ctx, linked.clientId, linked.companyId);
          return;
        case BTN_QARZLARIM:
          await this.sendDebtSummary(ctx, linked.clientId, linked.companyId);
          return;
        case BTN_TOLOVLARIM:
          await this.sendPaymentsExcel(ctx, linked.clientId, linked.companyId);
          return;
        case BTN_PROFIL:
          await this.sendProfile(ctx, linked.clientId, linked.companyId);
          return;
        case BTN_CHIQISH:
          await ctx.reply("Bu bo'lim tez orada ishga tushadi 🚧");
          return;
        default:
          await ctx.reply("Quyidagi menyudan bo'limni tanlang.", this.mainMenu());
      }
    });
  }

  private async greet(ctx: any) {
    const linked = await this.findByTelegramId(String(ctx.chat.id));
    if (linked?.type === 'user') {
      await ctx.reply("Xush kelibsiz! Yangi buyurtma yaratish uchun tugmani bosing.", this.adminMenu());
      return;
    }
    if (linked) {
      await ctx.reply("Xush kelibsiz! Quyidagi menyudan bo'limni tanlang.", this.mainMenu());
      return;
    }
    await ctx.reply("Assalomu alaykum! Hisobingizni ulash uchun kompaniya administratori bergan 4 xonali kodni yuboring.");
  }

  private async tryLinkByCode(ctx: any, code: string) {
    const chatId = String(ctx.chat.id);
    const alreadyLinked = await this.findByTelegramId(chatId);
    if (alreadyLinked) {
      await ctx.reply('Bu Telegram allaqachon hisobga ulangan.', this.mainMenu());
      return;
    }

    const user = await this.prisma.user.findUnique({ where: { telegramConnectCode: code } });
    if (user && user.telegramConnectCodeExpiresAt && user.telegramConnectCodeExpiresAt >= new Date()) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          telegramId: chatId,
          telegramUsername: ctx.from?.username,
          telegramConnected: true,
          telegramConnectCode: null,
          telegramConnectCodeExpiresAt: null,
        },
      });
      await this.audit.write({ userId: user.id, companyId: user.companyId, action: 'telegram_connection', entity: 'User', entityId: user.id });
      await ctx.reply(`Tayyor! Hisob ulandi. Xush kelibsiz, ${user.firstName}!`, this.adminMenu());
      return;
    }

    const client = await this.prisma.client.findUnique({ where: { telegramConnectCode: code } });
    if (!client || !client.telegramConnectCodeExpiresAt || client.telegramConnectCodeExpiresAt < new Date()) {
      await ctx.reply("Kod topilmadi yoki muddati tugagan. Administratordan yangi kod so'rang.");
      return;
    }

    await this.prisma.client.update({
      where: { id: client.id },
      data: {
        telegramId: chatId,
        telegramUsername: ctx.from?.username,
        telegramConnectCode: null,
        telegramConnectCodeExpiresAt: null,
      },
    });
    await this.audit.write({ userId: null, companyId: client.companyId, action: 'telegram_connection', entity: 'Client', entityId: client.id });
    await ctx.reply(`Tayyor! Hisob ulandi. Xush kelibsiz, ${client.firstName}!`, this.mainMenu());
  }

  private async sendDebtSummary(ctx: any, clientId: string, companyId: string) {
    const summary = await this.payments.debtSummary(clientId, companyId);
    const now = formatDate(new Date());
    const text =
      `💰 Qarzlar Ma'lumoti (${now} holatiga):\n\n` +
      `🛒 Haridlar qarzi: ${formatAmount(summary.qarz)} UZS\n` +
      `➖➖➖➖➖➖➖➖➖➖\n` +
      `💰 Jami qarz: ${formatAmount(summary.qarz)} UZS\n\n` +
      `💳 Balans: ${formatAmount(summary.balans)} UZS`;
    await ctx.reply(text);
  }

  private async sendProfile(ctx: any, clientId: string, companyId: string) {
    const client = await this.prisma.client.findUnique({ where: { id: clientId } });
    if (!client) return;
    const summary = await this.payments.debtSummary(clientId, companyId);
    const fullName = [client.firstName, client.lastName].filter(Boolean).join(' ');
    const text =
      `👤 Profil ma'lumotlari:\n\n` +
      `🪪 Ism: ${fullName}\n` +
      `📱 Telefon: ${client.phone ?? '—'}\n` +
      `📧 Email: —\n` +
      `📍 Manzil: —\n` +
      `💳 Balans: ${formatAmount(summary.balans)} UZS`;
    await ctx.reply(text);
  }

  private async sendOrdersExcel(ctx: any, clientId: string, companyId: string) {
    const client = await this.prisma.client.findUnique({ where: { id: clientId } });
    if (!client) return;
    const sales = await this.sales.listForClient(clientId, companyId);
    if (sales.length === 0) {
      await ctx.reply("Sizda hali buyurtmalar yo'q.");
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Haridlarim');
    sheet.columns = [
      { header: '№', key: 'no', width: 6 },
      { header: 'Zakaz raqami', key: 'orderNumber', width: 14 },
      { header: 'Sana', key: 'date', width: 18 },
      { header: 'Mahsulot', key: 'product', width: 28 },
      { header: 'Miqdor', key: 'pieces', width: 10 },
      { header: 'Miqdor (kg)', key: 'kg', width: 12 },
      { header: "O'lchov", key: 'unit', width: 8 },
      { header: 'Narx', key: 'price', width: 14 },
      { header: 'Jami', key: 'total', width: 16 },
      { header: 'Zakaz summasi', key: 'orderTotal', width: 16 },
    ];
    sheet.getRow(1).eachCell((cell) => {
      cell.fill = HEADER_FILL;
      cell.font = HEADER_FONT;
    });

    sales.forEach((sale, saleIndex) => {
      sheet.addRow({
        no: saleIndex + 1,
        orderNumber: sale.orderNumber,
        date: formatDate(new Date(sale.soldAt)),
        product: "ZAKAZ MA'LUMOTLARI",
        orderTotal: formatAmount(sale.totalAmount),
      }).font = { bold: true };
      sale.items.forEach((item) => {
        sheet.addRow({
          product: item.product.name,
          pieces: formatAmount(item.quantityPieces),
          kg: formatAmount(item.quantityKg),
          unit: 'dona',
          price: formatAmount(item.pricePerKg),
          total: formatAmount(item.totalAmount),
        });
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const filename = this.buildFilename('haridlar', client.firstName, client.lastName);
    await ctx.replyWithDocument({ source: Buffer.from(buffer), filename }, { caption: 'Haridlaringiz Excel faylda' });
  }

  private async sendPaymentsExcel(ctx: any, clientId: string, companyId: string) {
    const client = await this.prisma.client.findUnique({ where: { id: clientId } });
    if (!client) return;
    const payments = await this.payments.listForClient(clientId, companyId);
    if (payments.length === 0) {
      await ctx.reply("Sizda hali to'lovlar yo'q.");
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("To'lovlarim");
    sheet.columns = [
      { header: '№', key: 'no', width: 6 },
      { header: 'Sana', key: 'date', width: 18 },
      { header: 'Summa', key: 'amount', width: 16 },
      { header: "To'lov turi", key: 'method', width: 16 },
      { header: 'Valyuta', key: 'currency', width: 10 },
      { header: 'Izoh', key: 'note', width: 30 },
    ];
    sheet.getRow(1).eachCell((cell) => {
      cell.fill = HEADER_FILL;
      cell.font = HEADER_FONT;
    });

    payments.forEach((payment, index) => {
      sheet.addRow({
        no: index + 1,
        date: formatDate(new Date(payment.paidAt)),
        amount: formatAmount(payment.amount),
        method: payment.method === PaymentMethod.CASH ? 'Naqd' : "Ko'chirma",
        currency: payment.currency === 'UZS' ? "so'm" : payment.currency,
        note: payment.note ?? '',
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const filename = this.buildFilename('tolovlar', client.firstName, client.lastName);
    await ctx.replyWithDocument({ source: Buffer.from(buffer), filename }, { caption: "To'lovlaringiz Excel faylda" });
  }

  private buildFilename(prefix: string, firstName: string, lastName?: string | null) {
    const name = [firstName, lastName].filter(Boolean).join(' ').toUpperCase().replace(/\s+/g, '_');
    const now = new Date();
    const stamp = `${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
    return `${prefix}_${name}_${stamp}.xlsx`;
  }

  async findByTelegramId(telegramId: string) {
    const user = await this.prisma.user.findUnique({ where: { telegramId } });
    if (user) return { type: 'user' as const, role: user.role, companyId: user.companyId, userId: user.id };
    const client = await this.prisma.client.findUnique({ where: { telegramId } });
    if (client) return { type: 'client' as const, role: Role.CLIENT, companyId: client.companyId, clientId: client.id };
    return null;
  }

  async connectUser(userId: string, telegramId: string, telegramUsername?: string) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { telegramId, telegramUsername, telegramConnected: true },
    });
    await this.audit.write({ userId, companyId: user.companyId, action: 'telegram_connection', entity: 'User', entityId: userId });
    return { id: user.id, telegramConnected: user.telegramConnected };
  }

  async connectClient(clientId: string, telegramId: string, telegramUsername?: string, actor?: any) {
    const client = await this.prisma.client.findUnique({ where: { id: clientId } });
    if (!client) return null;
    if (actor?.role === Role.ADMIN && actor.companyId !== client.companyId) return null;
    const updated = await this.prisma.client.update({ where: { id: clientId }, data: { telegramId, telegramUsername } });
    await this.audit.write({ userId: actor?.id, companyId: updated.companyId, action: 'telegram_connection', entity: 'Client', entityId: clientId });
    return updated;
  }
}
