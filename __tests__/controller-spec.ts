import { Controller } from '../src/controller';
import * as db from '@ycs/core/lib/db';
import * as charge from '../src/charge';
import * as refund from '../src/refund';
import { EChannel } from '../src/charge';

jest.mock('@ycs/core/lib/response', () => {
  return {
    response: jest.fn().mockImplementation((x, y, z) => {
      return { x, y, z };
    }),
  };
});

// console.error = jest.fn();
// console.log = jest.fn();

describe('test controller', () => {
  it('should test index', async () => {
    const ctrl = new Controller('' as any, '' as any);
    (db as any).paginate = jest
      .fn()
      .mockImplementationOnce(x => 'ok')
      .mockImplementationOnce(x => Promise.reject('oops'));
    let err;
    try {
      await ctrl.index('' as any);
      await ctrl.index('' as any);
    } catch (e) {
      let err = e;
    }
    expect(err).toBeUndefined();
  });

  it('should test create', async () => {
    const ctrl = new Controller(
      '' as any,
      {
        charge: jest.fn().mockImplementation(x => ''),
      } as any
    );
    (charge as any).charge = jest
      .fn()
      .mockImplementationOnce(x => 'ok')
      .mockImplementationOnce(x => Promise.reject('oops'));
    let err;
    try {
      await ctrl.create('' as any);
      await ctrl.create('' as any);
    } catch (e) {
      let err = e;
    }
    expect(err).toBeUndefined();
  });

  it('should test refund', async () => {
    const ctrl = new Controller(
      '' as any,
      {
        charge: jest.fn(),
      } as any
    );
    (refund as any).refund = jest
      .fn()
      .mockImplementationOnce(x => 'ok')
      .mockImplementationOnce(x => Promise.reject('oops'));
    let err;
    try {
      await ctrl.refund({
        request: {
          fields: {},
        },
      } as any);
      await ctrl.refund({
        request: {
          fields: {},
        },
      } as any);
    } catch (e) {
      let err = e;
    }
    expect(err).toBeUndefined();
  });

  it('should test testChargeWebhook', async () => {
    const ctrl = new Controller(
      {
        findById: jest
          .fn()
          .mockImplementationOnce(() => {
            return {
              exec: jest.fn().mockImplementation(x => Promise.resolve(false)),
            };
          })
          .mockImplementationOnce(() => {
            return {
              exec: jest.fn().mockImplementation(x =>
                Promise.resolve({
                  save: jest
                    .fn()
                    .mockImplementation(x => Promise.resolve('ok')),
                })
              ),
            };
          })
          .mockImplementationOnce(() => {
            return {
              exec: jest.fn().mockImplementation(x =>
                Promise.resolve({
                  save: jest.fn().mockImplementation(x => Promise.resolve()),
                })
              ),
            };
          })
          .mockImplementationOnce(() => {
            return {
              exec: jest.fn().mockImplementation(x =>
                Promise.resolve({
                  save: jest
                    .fn()
                    .mockImplementation(x => Promise.resolve('ok')),
                })
              ),
            };
          }),
      } as any,
      {
        chargeWebhook: jest
          .fn()
          .mockImplementationOnce(x => 'ok')
          .mockImplementationOnce(x => 'ok')
          .mockImplementationOnce(x => 'ok')
          .mockImplementationOnce(x => Promise.reject('oops')),
      } as any
    );
    let err;
    try {
      await ctrl.testChargeWebhook({ params: '' } as any);
      await ctrl.testChargeWebhook({ params: '' } as any);
      await ctrl.testChargeWebhook({ params: '' } as any);
      await ctrl.testChargeWebhook({ params: '' } as any);
    } catch (e) {
      let err = e;
    }
    expect(err).toBeUndefined();
  });

  it('should test createChargeWebhook', async () => {
    const ctrl = new Controller('' as any, '' as any);
    let err;
    try {
      await ctrl.createChargeWebhook('' as any);
    } catch (e) {
      let err = e;
    }
    expect(err).toBeUndefined();
    const res = await ctrl.createChargeWebhook(EChannel.alipay);
    expect(res).toBeTruthy();
  });

  it('should test chargeWebhookForAlipay', async () => {
    const ctrl = new Controller(
      {
        findById: jest.fn().mockImplementation(() => {
          return {
            exec: jest.fn().mockImplementation(x =>
              Promise.resolve({
                save: jest.fn(),
              })
            ),
          };
        }),
      } as any,
      {
        alipayClient: {
          verify: jest
            .fn()
            .mockImplementationOnce(x => false)
            .mockImplementation(x => true),
        },
        chargeWebhook: jest.fn(),
      } as any
    );
    let err;
    try {
      await (ctrl as any).chargeWebhookForAlipay({});
      await (ctrl as any).chargeWebhookForAlipay({
        request: {
          fields: {
            trade_status: 'TRADE_SUCCESS',
          },
        },
      });
      await (ctrl as any).chargeWebhookForAlipay({
        request: {
          fields: {
            trade_status: 'TRADE_SUCCESS',
          },
        },
      });
      await (ctrl as any).chargeWebhookForAlipay({
        request: {
          fields: {
            trade_status: 'TRADE_FAIL',
          },
        },
      });
    } catch (e) {
      let err = e;
    }
    expect(err).toBeUndefined();
  });
});
