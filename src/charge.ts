import { IModel, Model, Schema } from '@ycs/core/lib/db';
import { IDocsDataTypeProperties } from '@ycs/core/lib/docs';
import { IContext } from '@ycs/core/lib/context';
import { Client } from '@ycnt/alipay';

export function createModel(payment: IPayment): IModel {
  const schema = new Schema(
    {
      channel: {
        type: String,
        require: true,
        enum: payment.channels,
      },
      currency: {
        type: String,
        require: true,
        enum: payment.currencies,
      },
      client_ip: {
        type: String,
        require: true,
      },
      subject: {
        type: String,
        require: true,
      },
      body: {
        type: String,
        require: true,
      },
      amount: {
        type: Number,
        require: true,
      },
      extra: {},
      paid: {
        type: Boolean,
        default: false,
      },
    },
    {
      timestamps: {},
    }
  );
  return Model({
    name: '__payments_charge_' + payment.path,
    schema,
    auth: true,
  });
}

export enum EChannel {
  alipay = 'alipay',
}

export enum ECurrency {
  cny = 'cny',
}

export interface IChargeDocument {
  channel: EChannel;
  currency: ECurrency;
  client_ip: string;
  subject: string;
  body: string;
  amount: number;
  extra?: {
    [x: string]: any;
  };
  __auth: string;
}

export interface IPayment {
  path: string;
  channels: EChannel[];
  currencies: ECurrency[];
  parameters: IDocsDataTypeProperties;
  charge: (ctx: IContext) => Promise<IChargeDocument>;
  chargeWebhook: (doc: IChargeDocument) => Promise<void>;
  alipayClient?: Client;
  https?: boolean;
}
