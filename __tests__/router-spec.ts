import { setupRouter } from '../src/router';
import * as charge from '../src/charge';
import * as refund from '../src/refund';
import { EChannel } from '../src/charge';

describe('Test router', () => {
  (charge as any).createModel = jest.fn().mockImplementation(x => {
    return {
      docSchema: jest.fn(),
      routes: jest.fn(),
    };
  });
  (refund as any).createModel = jest.fn().mockImplementation(x => {
    return {
      docSchema: jest.fn(),
    };
  });
  it('should create empty routers', async () => {
    const app: any = {
      config: {
        payments: {
          payments: [],
        },
      },
    };
    const routers = await setupRouter(app);
    expect(routers.length).toBe(0);
  });

  it('should create routers', async () => {
    const app: any = {
      config: {
        payments: {
          payments: [
            {
              path: 'order',
              test: true,
              channels: [],
              currencies: [],
              parameters: {},
              charge: jest.fn(),
              chargeWebhook: jest.fn(),
              alipayClient: jest.fn(),
              https: false,
            },
          ],
        },
      },
    };
    const routers = await setupRouter(app);
    expect(routers.length).toBe(1);
  });

  it('should create routers with channels', async () => {
    const app: any = {
      config: {
        payments: {
          payments: [
            {
              path: 'order',
              channels: [EChannel.alipay],
              currencies: [],
              parameters: {},
              charge: jest.fn(),
              chargeWebhook: jest.fn(),
              alipayClient: jest.fn(),
              https: false,
            },
          ],
        },
      },
    };
    const routers = await setupRouter(app);
    expect(routers.length).toBe(1);
  });
  it('should create routers with test channels', async () => {
    const app: any = {
      config: {
        payments: {
          payments: [
            {
              path: 'order',
              test: true,
              channels: [EChannel.alipay],
              currencies: [],
              parameters: {},
              charge: jest.fn(),
              chargeWebhook: jest.fn(),
              alipayClient: jest.fn(),
              https: false,
            },
          ],
        },
      },
    };
    const routers = await setupRouter(app);
    expect(routers.length).toBe(1);
  });

  it('should create routers with refund', async () => {
    const app: any = {
      config: {
        payments: {
          payments: [
            {
              path: 'order',
              test: true,
              channels: [],
              currencies: [],
              parameters: {},
              charge: jest.fn(),
              chargeWebhook: jest.fn(),
              alipayClient: jest.fn(),
              https: false,
              refund: jest.fn(),
            },
          ],
        },
      },
    };
    const routers = await setupRouter(app);
    expect(routers.length).toBe(1);
  });

  it('should create routers with https', async () => {
    const app: any = {
      config: {
        port: 80,
        spdy: {
          port: 443,
        },
        payments: {
          payments: [
            {
              path: 'order',
              test: true,
              channels: [],
              currencies: [],
              parameters: {},
              charge: jest.fn(),
              chargeWebhook: jest.fn(),
              alipayClient: jest.fn(),
              https: true,
            },
          ],
        },
      },
    };
    const routers = await setupRouter(app);
    expect(routers.length).toBe(1);
  });

  it('should create routers with https with custom port', async () => {
    const app: any = {
      config: {
        port: 80,
        spdy: {
          port: 8443,
        },
        payments: {
          payments: [
            {
              path: 'order',
              test: true,
              channels: [],
              currencies: [],
              parameters: {},
              charge: jest.fn(),
              chargeWebhook: jest.fn(),
              alipayClient: jest.fn(),
              https: true,
            },
          ],
        },
      },
    };
    const routers = await setupRouter(app);
    expect(routers.length).toBe(1);
  });

  it('should create routers with 80 port', async () => {
    const app: any = {
      config: {
        port: 80,
        payments: {
          payments: [
            {
              path: 'order',
              test: true,
              channels: [],
              currencies: [],
              parameters: {},
              charge: jest.fn(),
              chargeWebhook: jest.fn(),
              alipayClient: jest.fn(),
              https: false,
            },
          ],
        },
      },
    };
    const routers = await setupRouter(app);
    expect(routers.length).toBe(1);
  });
});