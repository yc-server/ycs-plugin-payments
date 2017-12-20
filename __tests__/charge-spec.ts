import * as charge from '../src/charge';
import * as webhook from '../src/webhook';
import * as db from '@ycs/core/lib/db';
import * as alipay from '@ycnt/alipay';

jest.mock('@ycnt/alipay', () => {
  return {
    TradeAppPayRequest: class {
      setBizContent = jest.fn();
      data = {};
    },
  };
});

jest.mock('@ycs/core/lib/db', () => {
  return {
    Schema: jest.fn(),
    Model: jest.fn(),
  };
});

describe('Test charge', () => {
  it('should create model', () => {
    (db as any).Schema.mockImplementationOnce(x => x);
    (db as any).Model.mockImplementationOnce(x => x);
    const model: any = charge.createModel({ path: 'ok' } as any);
    expect(model.auth).toBe(true);
    expect(model.name).toBe('__payments_charge_ok');
  });

  it('should get model', () => {
    expect(charge.getModel('ok')).toBeTruthy();
    expect(charge.getModel('not ok')).toBeFalsy();
  });

  it('should generate test charge', async () => {
    (db as any).Schema.mockImplementationOnce(x => x);
    (db as any).Model.mockImplementationOnce(x => {
      return {
        create: jest.fn().mockImplementationOnce(x => {
          return Promise.resolve({
            channel: 'alipay',
            _id: '001',
          });
        }),
      };
    });
    charge.createModel({ path: 'order' } as any);
    webhook.addWebhook('order', 'ok');
    const res = await charge.charge(
      {
        path: 'order',
        test: true,
        channels: [],
        currencies: [],
        parameters: {},
        charge: x => x as any,
        chargeWebhook: x => x as any,
      },
      {} as any
    );
    expect(res).toMatchObject({
      charge: {
        channel: 'alipay',
        _id: '001',
      },
      isYcsTest: true,
      webhook: 'ok/pay/alipay/test/001',
    });
  });

  it('should generate alipay charge', async () => {
    (db as any).Schema.mockImplementationOnce(x => x);
    (db as any).Model.mockImplementationOnce(x => {
      return {
        create: jest.fn().mockImplementationOnce(x => {
          return Promise.resolve({
            channel: 'alipay',
            amount: 0,
            _id: '001',
          });
        }),
      };
    });
    charge.createModel({ path: 'order2' } as any);
    webhook.addWebhook('order2', 'ok');
    const res = await charge.charge(
      {
        path: 'order2',
        channels: [charge.EChannel.alipay],
        currencies: [],
        parameters: {},
        charge: x => x as any,
        chargeWebhook: x => x as any,
        alipayClient: {
          generateRequestParams: jest.fn().mockImplementation(x => 'ok'),
        } as any,
      },
      {} as any
    );
    expect(res).toMatchObject({
      charge: 'ok',
      isYcsTest: false,
      channel: 'alipay',
    });
  });

  it('should throw Unsupported payment method', async () => {
    (db as any).Schema.mockImplementationOnce(x => x);
    (db as any).Model.mockImplementationOnce(x => {
      return {
        create: jest.fn().mockImplementationOnce(x => {
          return Promise.resolve({
            channel: 'alipay2',
            amount: 0,
            _id: '001',
          });
        }),
      };
    });
    charge.createModel({ path: 'order3' } as any);
    webhook.addWebhook('order3', 'ok');
    let err;
    try {
      const res = await charge.charge(
        {
          path: 'order3',
          channels: [charge.EChannel.alipay],
          currencies: [],
          parameters: {},
          charge: x => x as any,
          chargeWebhook: x => x as any,
          alipayClient: {
            generateRequestParams: jest.fn().mockImplementation(x => 'ok'),
          } as any,
        },
        {} as any
      );
    } catch (e) {
      err = e;
    }
    expect(err.message).toBe('Unsupported payment method');
  });
});
