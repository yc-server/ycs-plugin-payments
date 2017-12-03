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
      delete doc.paid;
      delete doc.createdAt;
      delete doc.updatedAt;
      const entity = await this.model.create(doc);
      const res = await this.createPayment(entity);
      response(ctx, 201, res);
    } catch (e) {
      handleError(ctx, e);
    }
  };

  public testChargeWebhook = async (ctx: IContext) => {
    try {
      const entity: any = await this.model.findById(ctx.params.id).exec();
      if (!entity) throw Boom.notFound();
      entity.paid = true;
      await entity.save();
      await this.payment.chargeWebhook(entity);
      ctx.status = 200;
      ctx.body = {
        isYcsTest: true,
        success: true
      };
    } catch (e) {
      handleError(ctx, e);
    }
  };

  public createChargeWebhook = (channel: EChannel) => {
    switch (channel) {
      case EChannel.alipay:
        return this.chargeWebhookForAlipay;
      default:
        throw new Error('Unsupported payment channel');
    }
  };

  private chargeWebhookForAlipay = async (ctx: IContext) => {
    try {
      const verified = this.payment.alipayClient.verify(ctx.query);
      if (!verified) throw Boom.badData('failed to verify sign');
      if (ctx.request.fields.trade_status === 'TRADE_SUCCESS') {
        const entity: any = await this.model
          .findById(ctx.request.fields.out_trade_no)
          .exec();
        entity.paid = true;
        await entity.save();
        await this.payment.chargeWebhook(entity);
      }
      ctx.status = 200;
      ctx.body = 'success';
    } catch (e) {
      handleError(ctx, e);
    }
  };

  private createPayment = async (entity: any): Promise<any> => {
    if (this.payment.test) {
      const webhook =
        this.webhookPrefix + '/pay/' + entity.channel + '/test/' + entity._id;
      return {
        isYcsTest: true,
        webhook: webhook,
        charge: entity,
      };
    }
    switch (entity.channel) {
      case EChannel.alipay:
        return await this.createPaymentForAlipay(entity);
      default:
        throw Boom.badData('Unsupported payment method');
    }
  };

  private createPaymentForAlipay = async (entity: any): Promise<any> => {
    const req = new TradeAppPayRequest();
    req.setBizContent({
      subject: entity.subject,
      out_trade_no: entity._id,
      total_amount: entity.amount.toString(),
      body: entity.body,
    });
    req.data.notify_url = this.webhookPrefix + '/pay/' + entity.channel;
    const charge = this.payment.alipayClient.generateRequestParams(req);
    return {
      isYcsTest: false,
      channel: entity.channel,
      charge: charge,
    };
  };
}
