import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaymentMethod, Prisma, Role } from '@prisma/client';
import * as ExcelJS from 'exceljs';
import { Markup, Telegraf } from 'telegraf';
import { AuditService } from '../audit/audit.service';
import { ClientOrdersService, type ClientOrderFull } from '../client-orders/client-orders.service';
import { PaymentsService } from '../payments/payments.service';
import { PrismaService } from '../prisma/prisma.service';
import { ReportsService } from '../reports/reports.service';
import { SalesService } from '../sales/sales.service';

const BTN_BUYURTMA = '🛍 Buyurtma berish';
const BTN_HARIDLARIM ='🛒 Haridlarim';
const BTN_QARZLARIM = '💰 Qarzlarim';
const BTN_TOLOVLARIM = "💳 To'lovlarim";
const BTN_PROFIL = '👤 Profil';
const BTN_CHIQISH = '🚪 Chiqish';
const BTN_NEW_ORDER = '🛒 Yangi buyurtma';

const BTN_OMBOR = '📦 Ombor';
const BTN_FOYDA = '📊 Foyda';

const MENU_BUTTONS = [[BTN_BUYURTMA], [BTN_HARIDLARIM], [BTN_QARZLARIM], [BTN_TOLOVLARIM], [BTN_PROFIL, BTN_CHIQISH]];
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
  /** Per-chat cart for the client ordering flow (in memory: a restart just empties the cart). */
  private readonly carts = new Map<string, { items: Map<string, number>; pendingProductId?: string }>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly audit: AuditService,
    private readonly sales: SalesService,
    private readonly payments: PaymentsService,
    private readonly reports: ReportsService,
    private readonly clientOrders: ClientOrdersService,
  ) {
    this.clientOrders.onCreated((order) => this.notifyAdminsNewOrder(order));
    this.clientOrders.onDecided((order) => this.notifyClientDecision(order));
  }

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
    this.registerOrderActions(bot);
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
    return Markup.keyboard([[orderButton], [BTN_OMBOR, BTN_FOYDA]]).resize();
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
          case BTN_OMBOR:
            await this.sendStock(ctx, linked.role, linked.companyId);
            return;
          case BTN_FOYDA:
            await this.sendProfit(ctx, linked.role, linked.companyId);
            return;
          default:
            await ctx.reply("Quyidagi menyudan bo'limni tanlang.", this.adminMenu());
        }
        return;
      }

      if (await this.handleQuantityInput(ctx, linked.clientId, text)) return;

      switch (text) {
        case BTN_BUYURTMA:
          await this.showProducts(ctx, linked.companyId);
          return;
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

  /** Admin-only: current stock per product and its value at cost. */
  private async sendStock(ctx: any, role: Role, companyId: string | null) {
    if (role !== Role.ADMIN || !companyId) {
      await ctx.reply("Bu bo'lim faqat kompaniya administratori uchun.");
      return;
    }
    const products = await this.prisma.product.findMany({ where: { companyId }, orderBy: { name: 'asc' } });
    if (products.length === 0) {
      await ctx.reply("Omborda mahsulot yo'q.");
      return;
    }
    let total = new Prisma.Decimal(0);
    const lines = products.map((p) => {
      total = total.add(p.stock.mul(p.purchasePrice));
      const unit = p.unit === 'PIECE' ? 'dona' : 'kg';
      return `${p.stock.lessThanOrEqualTo(0) ? '⚠️' : '•'} ${p.name}: ${formatAmount(p.stock)} ${unit}`;
    });
    await ctx.reply(`📦 Ombor qoldig'i\n\n${lines.join('\n')}\n\nQoldiq qiymati: ${formatAmount(total)}`.slice(0, 4000), this.adminMenu());
  }

  /** Admin-only: revenue, cost and profit for today and for the current month. */
  private async sendProfit(ctx: any, role: Role, companyId: string | null) {
    if (role !== Role.ADMIN || !companyId) {
      await ctx.reply("Bu bo'lim faqat kompaniya administratori uchun.");
      return;
    }
    const user = { role: Role.ADMIN, companyId };
    const now = new Date();
    const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const [today, month] = await Promise.all([
      this.reports.summary(user, dayStart.toISOString(), now.toISOString()),
      this.reports.summary(user, monthStart.toISOString(), now.toISOString()),
    ]);
    const block = (title: string, t: typeof today.totals) =>
      `${title}\nSotuvlar: ${t.salesCount}\nTushum: ${formatAmount(t.revenue)}\nTannarx: ${formatAmount(t.cost)}\nFoyda: ${formatAmount(t.profit)} (${t.marginPercent.toString()}%)`;
    await ctx.reply(
      `📊 Foyda hisoboti\n\n${block('Bugun', today.totals)}\n\n${block('Shu oy', month.totals)}\n\nTo'lanmagan sotuvlar (oy): ${formatAmount(month.totals.unpaidSales)}`,
      this.adminMenu(),
    );
  }

  private unitName(unit: string) {
    return unit === 'PIECE' ? 'dona' : 'kg';
  }

  private async showProducts(ctx: any, companyId: string) {
    const products = await this.clientOrders.availableProducts(companyId);
    if (products.length === 0) {
      await ctx.reply("Hozircha omborda mahsulot yo'q.");
      return;
    }
    const buttons = products.map((p) => [
      Markup.button.callback(`${p.name} — ${formatAmount(p.stock)} ${this.unitName(p.unit)} · ${formatAmount(p.salePrice)}`, `p:${p.id}`),
    ]);
    await ctx.reply('Mahsulotni tanlang:', Markup.inlineKeyboard(buttons));
  }

  private async cartText(items: Map<string, number>) {
    const products = await this.prisma.product.findMany({ where: { id: { in: [...items.keys()] } } });
    const byId = new Map(products.map((p) => [p.id, p]));
    let total = new Prisma.Decimal(0);
    const lines = [...items].map(([id, qty]) => {
      const p = byId.get(id)!;
      total = total.add(p.salePrice.mul(qty));
      return `• ${p.name}: ${formatAmount(qty)} ${this.unitName(p.unit)}`;
    });
    return `🛒 Savat\n\n${lines.join('\n')}\n\nTaxminiy summa: ${formatAmount(total)}`;
  }

  /** Returns true if the text was a quantity for the product the client just picked. */
  private async handleQuantityInput(ctx: any, clientId: string, text: string) {
    const chatId = String(ctx.chat.id);
    const cart = this.carts.get(chatId);
    if (!cart?.pendingProductId) return false;
    if ([BTN_BUYURTMA, BTN_HARIDLARIM, BTN_QARZLARIM, BTN_TOLOVLARIM, BTN_PROFIL, BTN_CHIQISH].includes(text)) {
      cart.pendingProductId = undefined;
      return false;
    }
    const qty = Number(text.replace(',', '.'));
    if (!Number.isFinite(qty) || qty <= 0) {
      await ctx.reply('Miqdorni raqam bilan yuboring, masalan: 5 yoki 2.5');
      return true;
    }
    const product = await this.prisma.product.findUnique({ where: { id: cart.pendingProductId } });
    const client = await this.prisma.client.findUnique({ where: { id: clientId } });
    if (!product || !client || product.companyId !== client.companyId) {
      cart.pendingProductId = undefined;
      return false;
    }
    const already = cart.items.get(product.id) ?? 0;
    if (product.stock.lessThan(already + qty)) {
      await ctx.reply(`Omborda yetarli emas. Mavjud: ${formatAmount(product.stock)}. Boshqa miqdor yuboring.`);
      return true;
    }
    cart.items.set(product.id, already + qty);
    cart.pendingProductId = undefined;
    await ctx.reply(
      await this.cartText(cart.items),
      Markup.inlineKeyboard([
        [Markup.button.callback("➕ Yana qo'shish", 'more')],
        [Markup.button.callback('✅ Yuborish', 'send'), Markup.button.callback('🗑 Bekor qilish', 'cancel')],
      ]),
    );
    return true;
  }

  private registerOrderActions(bot: Telegraf) {
    bot.action(/^p:(.+)$/, async (ctx) => {
      await ctx.answerCbQuery();
      const linked = await this.findByTelegramId(String(ctx.chat?.id));
      if (linked?.type !== 'client') return;
      const product = await this.prisma.product.findUnique({ where: { id: ctx.match[1] } });
      if (!product || product.companyId !== linked.companyId) return;
      const chatId = String(ctx.chat!.id);
      const cart = this.carts.get(chatId) ?? { items: new Map<string, number>() };
      cart.pendingProductId = product.id;
      this.carts.set(chatId, cart);
      await ctx.reply(`${product.name}: necha ${this.unitName(product.unit)} kerak? (mavjud: ${formatAmount(product.stock)})`);
    });

    bot.action('more', async (ctx) => {
      await ctx.answerCbQuery();
      const linked = await this.findByTelegramId(String(ctx.chat?.id));
      if (linked?.type === 'client') await this.showProducts(ctx, linked.companyId!);
    });

    bot.action('cancel', async (ctx) => {
      await ctx.answerCbQuery();
      this.carts.delete(String(ctx.chat?.id));
      await ctx.reply('Buyurtma bekor qilindi.');
    });

    bot.action('send', async (ctx) => {
      await ctx.answerCbQuery();
      const chatId = String(ctx.chat?.id);
      const linked = await this.findByTelegramId(chatId);
      const cart = this.carts.get(chatId);
      if (linked?.type !== 'client' || !cart || cart.items.size === 0) {
        await ctx.reply("Savat bo'sh.");
        return;
      }
      try {
        const order = await this.clientOrders.create(
          linked.clientId,
          linked.companyId!,
          [...cart.items].map(([productId, quantity]) => ({ productId, quantity })),
        );
        this.carts.delete(chatId);
        await ctx.reply(`✅ Buyurtma №${order.number} yuborildi. Administrator tasdiqlashini kuting, sizga xabar beramiz.`);
      } catch (error) {
        await ctx.reply((error as { message?: string }).message ?? "Buyurtmani yuborib bo'lmadi.");
      }
    });

    bot.action(/^o:([cr]):(.+)$/, async (ctx) => {
      const linked = await this.findByTelegramId(String(ctx.chat?.id));
      if (linked?.type !== 'user' || linked.role !== Role.ADMIN) {
        await ctx.answerCbQuery('Faqat administrator uchun');
        return;
      }
      const actor = { id: linked.userId, role: linked.role, companyId: linked.companyId };
      try {
        const order = ctx.match[1] === 'c' ? await this.clientOrders.confirm(ctx.match[2], actor) : await this.clientOrders.reject(ctx.match[2], actor);
        await ctx.answerCbQuery(order.status === 'CONFIRMED' ? 'Tasdiqlandi' : 'Rad etildi');
        const mark = order.status === 'CONFIRMED' ? '✅ Tasdiqlandi' : '❌ Rad etildi';
        await ctx.editMessageText(`${this.orderText(order)}\n\n${mark}`);
      } catch (error) {
        const message = (error as { message?: string }).message ?? 'Xatolik';
        await ctx.answerCbQuery(message.slice(0, 190), { show_alert: true });
      }
    });
  }

  private orderText(order: ClientOrderFull) {
    let total = new Prisma.Decimal(0);
    const lines = order.items.map((i) => {
      total = total.add(i.product.salePrice.mul(i.quantity));
      return `• ${i.product.name}: ${formatAmount(i.quantity)} ${this.unitName(i.product.unit)}`;
    });
    const name = [order.client.firstName, order.client.lastName].filter(Boolean).join(' ');
    return `🆕 Buyurtma №${order.number}\nMijoz: ${name}${order.client.phone ? ` (${order.client.phone})` : ''}\n\n${lines.join('\n')}\n\nTaxminiy summa: ${formatAmount(total)}`;
  }

  private async notifyAdminsNewOrder(order: ClientOrderFull) {
    if (!this.bot) return;
    const admins = await this.prisma.user.findMany({ where: { companyId: order.companyId, role: Role.ADMIN, telegramId: { not: null } } });
    const keyboard = Markup.inlineKeyboard([[Markup.button.callback('✅ Tasdiqlash', `o:c:${order.id}`), Markup.button.callback('❌ Rad etish', `o:r:${order.id}`)]]);
    for (const admin of admins) {
      await this.bot.telegram.sendMessage(admin.telegramId!, this.orderText(order), keyboard).catch((e) => this.logger.warn(`Admin notify failed: ${e}`));
    }
  }

  private async notifyClientDecision(order: ClientOrderFull) {
    if (!this.bot || !order.client.telegramId) return;
    const text =
      order.status === 'CONFIRMED'
        ? `✅ Buyurtma №${order.number} tasdiqlandi. Tez orada yetkaziladi.`
        : `❌ Buyurtma №${order.number} rad etildi. Batafsil ma'lumot uchun administrator bilan bog'laning.`;
    await this.bot.telegram.sendMessage(order.client.telegramId, text).catch((e) => this.logger.warn(`Client notify failed: ${e}`));
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
