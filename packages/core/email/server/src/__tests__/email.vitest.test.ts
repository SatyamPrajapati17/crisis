import { describe, expect, it, vi } from 'vitest';
import type { Core } from '@strapi/types';
import emailService from '../services/email';

describe('email service - sendTemplatedEmail', () => {
  it('interpolates nested variables such as user.firstname without syntax errors', async () => {
    const send = vi.fn();
    const strapi = {
      config: {
        get: vi.fn(),
      },
      plugin: vi.fn(() => ({
        provider: { send },
      })),
    } as unknown as Core.Strapi;

    (globalThis as unknown as { strapi: Core.Strapi }).strapi = strapi;

    const service = emailService();
    await service.sendTemplatedEmail(
      { to: 'admin@example.com' },
      {
        subject: 'Reset password',
        text: 'Hi <%= user.firstname %>, reset your password here: <%= url %>',
        html: '<p>Hi <%= user.firstname %>, <a href="<%= url %>">reset your password</a></p>',
      },
      {
        url: 'http://localhost:1337/admin/auth/reset-password?code=123',
        user: { firstname: 'Alice', lastname: 'Smith' },
      }
    );

    expect(send).toHaveBeenCalledWith({
      to: 'admin@example.com',
      subject: 'Reset password',
      text: 'Hi Alice, reset your password here: http://localhost:1337/admin/auth/reset-password?code=123',
      html: '<p>Hi Alice, <a href="http://localhost:1337/admin/auth/reset-password?code=123">reset your password</a></p>',
    });
  });
});
