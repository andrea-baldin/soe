/**
 * Property providers compose typed node metadata without expanding the core.
 */

import type { ResolvedNodeContext } from './node-context.js';

export interface PropertyProvider<TProperties extends object> {
  provide(
    context: ResolvedNodeContext,
    current: Readonly<TProperties>
  ): Partial<TProperties> | undefined;
}

export interface PropertyResolver<TProperties extends object> {
  resolve(context: ResolvedNodeContext): Readonly<TProperties>;
}

export function createPropertyResolver<TProperties extends object>(
  defaults: TProperties,
  providers: readonly PropertyProvider<TProperties>[]
): PropertyResolver<TProperties> {
  const stableDefaults = Object.freeze({
    ...defaults
  }) as Readonly<TProperties>;
  const registeredProviders = [...providers];

  return {
    resolve(context) {
      let current = { ...stableDefaults } as TProperties;

      for (const provider of registeredProviders) {
        try {
          const contribution = provider.provide(
            context,
            Object.freeze({ ...current }) as Readonly<TProperties>
          );
          if (typeof contribution === 'object' && contribution !== null) {
            current = { ...current, ...contribution };
          }
        } catch {
          continue;
        }
      }

      return Object.freeze({ ...current }) as Readonly<TProperties>;
    }
  };
}
