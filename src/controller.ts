import { IContext } from '@ycs/core/lib/context';
import { IModel, paginate } from '@ycs/core/lib/db';
import { Boom, handleError } from '@ycs/core/lib/errors';
import { response } from '@ycs/core/lib/response';
import { IPayment, IChargeDocument, EChannel } from './charge';
import { Client, TradeAppPayRequest } from '@ycnt/alipay';

export class Controller {
  public webhookPrefix: string;
  constructor(private model: IModel, private payment: IPayment) {}
  // Gets a list of Models
  public index = async (ctx: IContext) => {
    try {
      const paginateResult = await paginate(this.model, ctx);
      response(ctx, 200, paginateResult);
    } catch (e) {
      console.error(e);
      handleError(ctx, e);
    }
  };

  // Creates a new Model in the DB
  public create = async (ctx: IContext) => {
    try {
      const doc: any = await this.payment.charge(ctx);
      delete doc.status;
      delete doc.createdAt;
      delete doc.updatedAt;
      const entity = (await this.model.create(doc)) as any;
      const res = await this.createPayment(entity);
      await entity.save();
      response(ctx, 201, entity);
    } catch (e) {
      handleError(ctx, e);
    }
  };

  public createWebhook = (channel: EChannel) => {
    switch (channel) {
      case EChannel.alipay:
        return this.webhookForAlipay;
      default:
        throw new Error('Unsupported payment channel');
    }
  };

  private webhookForAlipay = async (ctx: IContext) => {
    try {
      const verified = this.payment.alipayClient.verify(ctx.query);
      if (!verified) throw Boom.badData('failed to verify sign');
      if (ctx.request.fields.trade_status === 'TRADE_SUCCESS') {
        const entity: any = await this.model
          .findById(ctx.request.fields.out_trade_no)
          .exec();
        entity.paid = true;
        await entity.save();
        await this.payment.webhook(entity);
      }
      ctx.status = 200;
      ctx.body = 'success';
    } catch (e) {
      handleError(ctx, e);
    }
  };

  private createPayment = (entity: any): Promise<any> => {
    switch (entity.channel) {
      case EChannel.alipay:
        return this.createPaymentForAlipay(entity);
      default:
        throw Boom.badData('Unsupported payment method');
    }
  };

  private createPaymentForAlipay = (entity: any): Promise<any> => {
    const req = new TradeAppPayRequest();
    req.setBizContent({
      subject: entity.subject,
      out_trade_no: entity._id,
      total_amount: entity.amount.toString(),
      body: entity.body,
    });
    req.data.notify_url = this.webhookPrefix + '/pay/' + entity.channel;
    return this.payment.alipayClient.execute(req);
  };
}