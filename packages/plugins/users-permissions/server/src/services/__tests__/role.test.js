'use strict';

const roleService = require('../role');

describe('Role Service - findOne', () => {
  let strapi;
  let service;

  beforeEach(() => {
    strapi = {
      plugins: {
        'users-permissions': {
          services: {
            'users-permissions': {
              getActions: jest.fn(() => ({
                'api::restaurant': {
                  controllers: {
                    restaurant: {
                      find: { enabled: false, policy: '' },
                      findOne: { enabled: false, policy: '' },
                    },
                  },
                },
              })),
            },
          },
        },
      },
      db: {
        query: jest.fn(() => ({
          findOne: jest.fn().mockResolvedValue({
            id: 1,
            name: 'Public',
            permissions: [
              { id: 10, action: 'api::restaurant.restaurant.find' },
              { id: 11, action: 'api::restaurant.restaurant.findOne' },
            ],
          }),
        })),
      },
    };

    global.strapi = strapi;
    service = roleService({ strapi });
  });

  afterEach(() => {
    delete global.strapi;
  });

  it('marks enabled permissions on their controllers and actions correctly', async () => {
    const result = await service.findOne(1);

    expect(result.permissions['api::restaurant'].controllers.restaurant.find.enabled).toBe(true);
    expect(result.permissions['api::restaurant'].controllers.restaurant.findOne.enabled).toBe(true);
  });
});
