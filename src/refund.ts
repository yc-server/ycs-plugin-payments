import { IModel, Model, Schema } from '@ycs/core/lib/db';
import { IDocsDataTypeProperties } from '@ycs/core/lib/docs';
import { IContext } from '@ycs/core/lib/context';
import { IPayment, EChannel, getModel as getChargeModel } from './charge';
import { Boom } from '@ycs/core/lib/errors';
import { TradeRefundRequest } from '@ycnt/alipay';

/**
 * All models
 */
export const models: Array<{
  path: string;
  model: IModel;
}> = [];

/**
 * Creating a model
 * @param payment {IPayment} IPayment
 */
export function createModel(payment: IPayment): IModel {
  const schema = new Schema(
    {
      charge: {
        type: Schema.Types.ObjectId,
        ref: '__payments_charge_' + payment.path,
      },
      amount: {
        type: Number,
        require: true,
      },
      reason: {
        type: String,
        require: true,
      },
      extra: {},
      success: {
        type: Boolean,
        require: true,
      },
    },
    {
      timestamps: {},
    }
  );
  const model = Model({
    name: '__payments_refund_' + payment.path,
    schema,
  });
  models.push({ path: payment.path, model: model });
  return model;
}

/**
 * Get model by given path
 * @param path {string} path
 */
export function getModel(path: string): IModel {
  const model = models.find(x => x.path === path);
  if (model) return model.model;
  return null;
}

/**
 * Refund a charge
 * @param payment {IPayment} payment path
 * @param chargeId {string} charge id
 * @param reason {string} refund reason
 */
export async function refund(
  payment: IPayment,
  chargeId: string,
  reason: string
): Promise<any> {
  if (!payment.refund) throw Boom.badData('Payment disabled');
  const chargeModel = getChargeModel(payment.path);
  const refundModel = getModel(payment.path);
  const charge: any = await chargeModel.findById(chargeId).exec();
  if (!charge) throw Boom.notFound('Charge not found');
  const refund = await createRefund(payment, charge, reason);
  const res = await refundModel.create(refund);
  payment.refund(res);
  return res;
}

async function createRefund(
  payment: IPayment,
  charge: any,
  reason: string
): Promise<any> {
  if (payment.test) {
    return {
      charge: charge._id,
      amount: charge.amount,
      reason: reason,
      success: true,
      extra: { isYcsTest: true },
    };
  }
  switch (charge.channel) {
    case EChannel.alipay:
      return createRefundForAlipay(payment, charge, reason);
    default:
      throw Boom.badData('Unsupported refund method');
  }
}

async function createRefundForAlipay(
  payment: IPayment,
  charge: any,
  reason: string
): Promise<any> {
  const req = new TradeRefundRequest();
  req.setBizContent({
    out_trade_no: charge._id,
    refund_amount: charge.amount,
    refund_reason: reason,
  });
  try {
    const refund = await payment.alipayClient.execute(req);
    const success =
      !!refund.alipay_trade_refund_response &&
      refund.alipay_trade_refund_response.code === '10000';
    return {
      charge: charge._id,
      amount: charge.amount,
      reason: reason,
      success: success,
      extra: refund,
    };
  } catch (e) {
    return {
      charge: charge._id,
      amount: charge.amount,
      reason: reason,
      success: false,
      extra: e,
    };
  }
}
