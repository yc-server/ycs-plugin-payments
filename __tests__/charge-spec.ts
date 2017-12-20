import * as charge from '../src/charge';
import * as db from '@ycs/core/lib/db';

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
    charge.charge({}, {});
  })
});