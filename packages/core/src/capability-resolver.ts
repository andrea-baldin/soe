/**
 * CapabilityResolver is the sole authority for operations available on a node.
 */

import { isEditableContainer } from './object-container.js';
import type { ObjectPath } from './object-path.js';
import type { FieldSchema } from './object-schema.js';
import { isEditableValue } from './object-value.js';

export interface Capabilities {
  readonly editValue: boolean;
  readonly renameKey: boolean;
  readonly delete: boolean;
  readonly insert: boolean;
  readonly move: boolean;
  readonly copy: boolean;
  readonly paste: boolean;
  readonly inspect: boolean;
}

export interface CapabilityContext {
  readonly root: unknown;
  readonly value: unknown;
  readonly parent: unknown;
  readonly path: ObjectPath;
  readonly schema?: FieldSchema;
}

export interface CapabilityResolver {
  resolve(context: CapabilityContext): Capabilities;
}

export type CapabilityContribution = Partial<Capabilities>;

export interface CapabilityProvider {
  provide(
    context: CapabilityContext,
    current: Readonly<Capabilities>
  ): CapabilityContribution | undefined;
}

export const defaultCapabilityResolver: CapabilityResolver = {
  resolve(context) {
    const segment = context.path.at(-1);
    const container = isEditableContainer(context.value);

    return {
      editValue:
        Boolean(context.schema?.type) || isEditableValue(context.value),
      renameKey: typeof segment === 'string',
      delete: context.path.length > 0,
      insert: container,
      move: Array.isArray(context.parent) && typeof segment === 'number',
      copy: true,
      paste: container,
      inspect: true
    };
  }
};

const safeCapabilities: Capabilities = {
  editValue: false,
  renameKey: false,
  delete: false,
  insert: false,
  move: false,
  copy: true,
  paste: false,
  inspect: true
};

export function resolveCapabilities(
  context: CapabilityContext,
  resolver: CapabilityResolver = defaultCapabilityResolver
): Capabilities {
  try {
    const capabilities = resolver.resolve(context);
    return isCapabilities(capabilities) ? capabilities : safeCapabilities;
  } catch {
    return safeCapabilities;
  }
}

export function createCapabilityResolver(
  providers: readonly CapabilityProvider[],
  baseResolver: CapabilityResolver = defaultCapabilityResolver
): CapabilityResolver {
  const registeredProviders = [...providers];

  return {
    resolve(context) {
      let current = resolveCapabilities(context, baseResolver);

      for (const provider of registeredProviders) {
        try {
          const contribution = provider.provide(
            context,
            Object.freeze({ ...current })
          );
          current = applyContribution(current, contribution);
        } catch {
          continue;
        }
      }

      return current;
    }
  };
}

const capabilityNames = [
  'editValue',
  'renameKey',
  'delete',
  'insert',
  'move',
  'copy',
  'paste',
  'inspect'
] as const;

function applyContribution(
  current: Capabilities,
  contribution: CapabilityContribution | undefined
): Capabilities {
  if (typeof contribution !== 'object' || contribution === null) return current;

  const next = { ...current };
  for (const capability of capabilityNames) {
    const value = contribution[capability];
    if (typeof value === 'boolean') next[capability] = value;
  }
  return next;
}

function isCapabilities(value: unknown): value is Capabilities {
  if (typeof value !== 'object' || value === null) return false;

  return capabilityNames.every(
    (capability) =>
      typeof (value as Record<string, unknown>)[capability] === 'boolean'
  );
}
