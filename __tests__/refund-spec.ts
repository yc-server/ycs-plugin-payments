import * as refund from '../src/refund';
import * as webhook from '../src/webhook';
import * as db from '@ycs/core/lib/db';
import * as alipay from '@ycnt/alipay';
import * as charge from '../src/charge';
import { EChannel } from '../src/charge';

jest.mock('@ycnt/alipay', () => {
  return {
    TradeRefundRequest: class {
      setBizContent = jest.fn();
      data = {};
    },
  };
});

(charge as any).getModel = jest
  .fn()
  .mockImplementationOnce(x => {
    return {
      findById: jest.fn().mockImplementationOnce(x => {
        return {
          exec: jest.fn().mockImplementationOnce(x => null),
        };
      }),
    };
  })
  .mockImplementationOnce(x => {
    return {
      findById: jest.fn().mockImplementationOnce(x => {
        return {
          exec: jest.fn().mockImplementationOnce(x => 'ok'),
        };
      }),
    };
  })
  .mockImplementationOnce(x => {
    return {
      findById: jest.fn().mockImplementationOnce(x => {
        return {
          exec: jest.fn().mockImplementationOnce(x => 'ok'),
        };
      }),
    };
  })
  .mockImplementation(x => {
    return {
      findById: jest.fn().mockImplementationOnce(x => {
        return {
          exec: jest.fn().mockImplementationOnce(x =>
            Promise.resolve({
              channel: EChannel.alipay,
            })
          ),
        };
      }),
    };
  });

(db as any).Model = jest.fn();

describe('Test refund', () => {
  it('should create model', () => {
    (db as any).Model.mockImplementationOnce(x => x);
    const model: any = refund.createModel({ path: 'ok' } as any);
    expect(model.name).toBe('__payments_refund_ok');
  });

  it('should get model', () => {
    expect(refund.getModel('ok')).toBeTruthy();
    expect(refund.getModel('not ok')).toBeFalsy();
  });

  it('should generate a test refund', async () => {
    (db as any).Model.mockImplementationOnce(x => {
      return {
        create: jest.fn().mockImplementation(x => x),
      };
    });
    const model: any = refund.createModel({ path: 'order' } as any);
    webhook.addWebhook('order', 'ok');
    let err;
    try {
      await refund.refund(
        {
          path: 'order',
          test: true,
          channels: [],
          currencies: [],
          parameters: {},
          charge: x => x as any,
          chargeWebhook: x => x as any,
        },
        '001',
        'no reason'
      );
    } catch (e) {
      err = e;
    }
    expect(err.message).toBe('Payment disabled');

    try {
      await refund.refund(
        {
          path: 'order',
          test: true,
          channels: [],
          currencies: [],
          parameters: {},
          charge: x => x as any,
          chargeWebhook: x => x as any,
          refund: jest.fn(),
        },
        '001',
        'no reason'
      );
    } catch (e) {
      err = e;
    }
    expect(err.message).toBe('Charge not found');

    const res = await refund.refund(
      {
        path: 'order',
        test: true,
        channels: [],
        currencies: [],
        parameters: {},
        charge: x => x as any,
        chargeWebhook: x => x as any,
        refund: jest.fn(),
      },
      '001',
      'no reason'
    );
    expect(res).toMatchObject({
      amount: undefined,
      charge: undefined,
      extra: {
        isYcsTest: true,
      },
      reason: 'no reason',
      success: true,
    });
  });

  it('should generate a alipay refund', async () => {
    let err;
    try {
      await refund.refund(
        {
          path: 'order',
          channels: [],
          currencies: [],
          parameters: {},
          charge: x => x as any,
          chargeWebhook: x => x as any,
          refund: jest.fn(),
        },
        '001',
        'no reason'
      );
    } catch (e) {
      err = e;
    }
    expect(err.message).toBe('Unsupported refund method');

    const res = await refund.refund(
      {
        path: 'order',
        channels: [EChannel.alipay],
        currencies: [],
        parameters: {},
        charge: x => x as any,
        chargeWebhook: x => x as any,
        refund: jest.fn(),
        alipayClient: {
          execute: jest.fn().mockImplementation(x => 'ok'),
        } as any,
      },
      '001',
      'no reason'
    );
    expect(res).toMatchObject({
      amount: undefined,
      charge: undefined,
      extra: 'ok',
      reason: 'no reason',
      success: false,
    });

    const res2 = await refund.refund(
      {
        path: 'order',
        channels: [EChannel.alipay],
        currencies: [],
        parameters: {},
        charge: x => x as any,
        chargeWebhook: x => x as any,
        refund: jest.fn(),
        alipayClient: {
          execute: jest.fn().mockImplementation(x =>
            Promise.resolve({
              alipay_trade_refund_response: {
                code: '10000',
              },
            })
          ),
        } as any,
      },
      '001',
      'no reason'
    );
    expect(res2).toMatchObject({
      amount: undefined,
      charge: undefined,
      extra: { alipay_trade_refund_response: { code: '10000' } },
      reason: 'no reason',
      success: true,
    });

    const res3 = await refund.refund(
      {
        path: 'order',
        channels: [EChannel.alipay],
        currencies: [],
        parameters: {},
        charge: x => x as any,
        chargeWebhook: x => x as any,
        refund: jest.fn(),
        alipayClient: {
          execute: jest.fn().mockImplementation(x =>
            Promise.resolve({
              alipay_trade_refund_response: {
                code: '10001',
              },
            })
          ),
        } as any,
      },
      '001',
      'no reason'
    );
    expect(res3).toMatchObject({
      amount: undefined,
      charge: undefined,
      extra: { alipay_trade_refund_response: { code: '10001' } },
      reason: 'no reason',
      success: false,
    });

    const res4 = await refund.refund(
      {
        path: 'order',
        channels: [EChannel.alipay],
        currencies: [],
        parameters: {},
        charge: x => x as any,
        chargeWebhook: x => x as any,
        refund: jest.fn(),
        alipayClient: {
          execute: jest.fn().mockImplementation(x => Promise.reject('oops')),
        } as any,
      },
      '001',
      'no reason'
    );
    expect(res4).toMatchObject({
      amount: undefined,
      charge: undefined,
      extra: 'oops',
      reason: 'no reason',
      success: false,
    });
  });

  // it('should generate alipay charge', async () => {
  //   (db as any).Schema.mockImplementationOnce(x => x);
  //   (db as any).Model.mockImplementationOnce(x => {
  //     return {
  //       create: jest.fn().mockImplementationOnce(x => {
  //         return Promise.resolve({
  //           channel: 'alipay',
  //           amount: 0,
  //           _id: '001',
  //         });
  //       }),
  //     };
  //   });
  //   charge.createModel({ path: 'order2' } as any);
  //   webhook.addWebhook('order2', 'ok');
  //   const res = await charge.charge({
  //     path: 'order2',
  //     channels: [charge.EChannel.alipay],
  //     currencies: [],
  //     parameters: {},
  //     charge: x => x as any,
  //     chargeWebhook: x => x as any,
  //     alipayClient: {
  //       generateRequestParams: jest.fn().mockImplementation(x => 'ok'),
  //     } as any,
  //   }, {} as any);
  //   expect(res).toMatchObject({
  //     charge: 'ok',
  //     isYcsTest: false,
  //     channel: 'alipay',
  //   });
  // });

  // it('should throw Unsupported payment method', async () => {
  //   (db as any).Schema.mockImplementationOnce(x => x);
  //   (db as any).Model.mockImplementationOnce(x => {
  //     return {
  //       create: jest.fn().mockImplementationOnce(x => {
  //         return Promise.resolve({
  //           channel: 'alipay2',
  //           amount: 0,
  //           _id: '001',
  //         });
  //       }),
  //     };
  //   });
  //   charge.createModel({ path: 'order3' } as any);
  //   webhook.addWebhook('order3', 'ok');
  //   let err;
  //   try {
  //     const res = await charge.charge({
  //       path: 'order3',
  //       channels: [charge.EChannel.alipay],
  //       currencies: [],
  //       parameters: {},
  //       charge: x => x as any,
  //       chargeWebhook: x => x as any,
  //       alipayClient: {
  //         generateRequestParams: jest.fn().mockImplementation(x => 'ok'),
  //       } as any,
  //     }, {} as any);
  //   } catch (e) {
  //     err = e;
  //   }
  //   expect(err.message).toBe('Unsupported payment method');
  // })
});
