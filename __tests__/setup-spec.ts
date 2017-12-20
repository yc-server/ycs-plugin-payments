import { setup } from '../src/setup';
import * as router from '../src/router';

console.log = jest.fn();
console.error = jest.fn();

it('should setup', async () => {
  process.env.NODE_ENV = 'dev';
  (router as any).setupRouter = jest
    .fn()
    .mockImplementationOnce(x => [])
    .mockImplementationOnce(x => Promise.reject('oops'));
  const app: any = {
    dir: __dirname,
    config: {},
  };
  const res = await setup.pre(app);
  expect(app.config.payments).toBe('ok');
  expect(res.length).toBe(0);
  await setup.pre(app);
});
