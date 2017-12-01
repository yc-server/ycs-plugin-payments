import { Ycs } from '@ycs/core';
import { IDocs } from '@ycs/core/lib/docs';
import { Router } from '@ycs/core/lib/routers';
import { IConfig } from './config';
import { Controller } from './controller';
import { createModel as createChargeModel } from './charge';

export async function setupRouter(app: Ycs): Promise<Router[]> {
  const config: IConfig = app.config.payments;
  const routers: Router[] = [];

  for (const payment of config.payments) {
    const chargeModel = createChargeModel(payment);
    const controller = new Controller(chargeModel, payment);
    const prefix = '__payments_' + payment.path;
    const chargePrefix = prefix + '_charge';
    const webhookPrefix = prefix + '_webhook';
    const paths: IDocs[] = [
      {
        path: '/charge',
        methods: ['get'],
        controller: controller.index,
        auth: {
          type: 'hasRoles',
          roles: config.roles,
        },
        tags: [chargePrefix],
        summary: 'List documents',
        description: 'List documents',
        consumes: ['application/json', 'application/xml'],
        produces: ['application/json', 'application/xml'],
        parameters: [chargeModel.docSchema.paginateOptions],
        responses: {
          200: {
            description: 'Successful operation',
            schema: chargeModel.docSchema.paginateResult,
          },
          '4xx': chargeModel.docSchema.response4xx,
          '5xx': chargeModel.docSchema.response5xx,
        },
      },
      {
        path: '/charge',
        methods: ['post'],
        controller: controller.create,
        auth: {
          type: 'isAuthenticated',
        },
        tags: [chargePrefix],
        summary: 'create a charge',
        description: 'create a charge',
        consumes: ['application/json', 'application/xml'],
        produces: ['application/json', 'application/xml'],
        parameters: [chargeModel.docSchema.body],
        responses: {
          200: {
            description: 'Successful operation',
          },
          '4xx': chargeModel.docSchema.response4xx,
          '5xx': chargeModel.docSchema.response5xx,
        },
      },
    ];

    if (payment.https) {
      let url = `https://${app.config.domain}`;
      if (app.config.spdy.port !== 443) {
        url += `:${app.config.spdy.port}`;
      }
      controller.webhookPrefix = `${url}/${prefix}/webhook`;
    } else {
      let url = `http://${app.config.domain}`;
      if (app.config.port !== 80) {
        url += `:${app.config.port}`;
      }
      controller.webhookPrefix = `${url}/${prefix}/webhook`;
    }
    for (const chanel of payment.channels) {
      paths.push({
        path: '/webhook/pay/' + chanel,
        methods: ['post'],
        controller: controller.createWebhook(chanel),
        tags: [webhookPrefix],
        summary: 'webhook for payments',
        description: 'webhook for payments',
        consumes: ['application/json', 'application/xml'],
        produces: ['application/json', 'application/xml'],
        parameters: [],
        responses: {
          200: {
            description: 'Successful operation',
          },
          '4xx': chargeModel.docSchema.response4xx,
          '5xx': chargeModel.docSchema.response5xx,
        },
      });
    }

    routers.push(chargeModel.routes(prefix, ...paths));
  }

  return routers;
}
