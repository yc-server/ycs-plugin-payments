[![Build Status](https://travis-ci.org/yc-server/ycs-plugin-payments.svg?branch=master)](https://travis-ci.org/yc-server/ycs-plugin-payments.svg?branch=master)
[![Coverage Status](https://coveralls.io/repos/github/yc-server/ycs-plugin-payments/badge.svg?branch=master)](https://coveralls.io/github/yc-server/ycs-plugin-payments?branch=master)
[![MIT license](http://img.shields.io/badge/license-MIT-brightgreen.svg)](http://opensource.org/licenses/MIT)

# Installation

```bash
ycs add plugin payments
```

# configurations

```ts
import { IContext } from '@ycs/core/lib/context';
import { IConfig, EChannel, ECurrency, IChargeDocument } from 'ycs-plugin-payments';
import { Client, EClientSignType } from '@ycnt/alipay';

export const development: IConfig = {
  roles: ['payments'],
  payments: [
    {
      path: 'order',
      channels: [EChannel.alipay],
      currencies: [ECurrency.cny],
      charge: async (ctx: IContext): Promise<IChargeDocument> => {
        const order: any = 'xxx';
        return {
          channel: ctx.request.fields.channel,
          currency: ECurrency.cny,
          client_ip: ctx.request.ip,
          subject: order.subject,
          body: order.body,
          amount: order.price,
          extra: {
            orderId: order._id,
          },
          __auth: ctx.request.auth._id,
        };
      },
      webhook: async (doc: IChargeDocument): Promise<void> => {
        const order: any = 'xxx by doc.extra.orderId';
        order.status = 'paid';
        await order.save()
      },
      alipayClient: new Client({
        appId: 'xxx',
        rsaPrivate: 'xxx',
        rsaPublic: 'xxx',
        signType: EClientSignType.RSA2,
        sandbox: true
      }),
      https: false
    },
  ],
};

export const production: IConfig = {
  roles: ['payments'],
  payments: [
    {
      path: 'order',
      channels: [EChannel.alipay],
      currencies: [ECurrency.cny],
      charge: async (ctx: IContext): Promise<IChargeDocument> => {
        const order: any = 'xxx';
        return {
          channel: ctx.request.fields.channel,
          currency: ECurrency.cny,
          client_ip: ctx.request.ip,
          subject: order.subject,
          body: order.body,
          amount: order.price,
          extra: {
            orderId: order._id,
          },
          __auth: ctx.request.auth._id,
        };
      },
      webhook: async (doc: IChargeDocument): Promise<void> => {
        const order: any = 'xxx by doc.extra.orderId';
        order.status = 'paid';
        await order.save()
      },
      alipayClient: new Client({
        appId: 'xxx',
        rsaPrivate: 'xxx',
        rsaPublic: 'xxx',
        signType: EClientSignType.RSA2,
        sandbox: true
      }),
      https: false
    },
  ],
};

```