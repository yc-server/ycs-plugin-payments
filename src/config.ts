import { IPayment } from './charge';

export interface IConfig {
  roles: string[];
  payments: IPayment[];
}
