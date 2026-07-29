import { describe, expect, it, vi } from 'vitest';

import { validateObjectAsync } from './async-validation.js';

describe('validateObjectAsync', () => {
  it('collects nested async diagnostics in traversal order', async () => {
    const issues = await validateObjectAsync(
      { username: 'ada', profile: { code: 'A' } },
      {
        fields: {
          username: {
            validateAsync: async () => ({
              code: 'taken',
              message: 'Username is already used',
              severity: 'error'
            })
          },
          profile: {
            fields: {
              code: {
                severity: 'warning',
                validateAsync: async () => 'Code is unusual'
              }
            }
          }
        }
      }
    );

    expect(issues).toMatchObject([
      { code: 'taken', formattedPath: 'username', severity: 'error' },
      { code: 'invalid', formattedPath: 'profile.code', severity: 'warning' }
    ]);
  });

  it('passes cancellation to validators and discards aborted results', async () => {
    const controller = new AbortController();
    let release!: () => void;
    const waiting = new Promise<void>((resolve) => (release = resolve));
    const validator = vi.fn(async (_value, context) => {
      expect(context.signal).toBe(controller.signal);
      await waiting;
      return 'Stale issue';
    });
    const validation = validateObjectAsync(
      { name: 'Ada' },
      { fields: { name: { validateAsync: validator } } },
      { signal: controller.signal }
    );

    controller.abort();
    release();

    await expect(validation).resolves.toEqual([]);
    expect(validator).toHaveBeenCalledOnce();
  });

  it('isolates async validator failures', async () => {
    await expect(
      validateObjectAsync(
        { name: 'Ada' },
        {
          fields: {
            name: {
              messages: { asyncValidatorFailure: 'Remote check failed' },
              validateAsync: async () => {
                throw new Error('Network');
              }
            }
          }
        }
      )
    ).resolves.toMatchObject([
      {
        code: 'async-validation',
        message: 'Remote check failed',
        formattedPath: 'name'
      }
    ]);
  });
});
