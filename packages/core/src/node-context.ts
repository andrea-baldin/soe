/**
 * NodeContext gives extensions one stable, renderer-independent node view.
 */

import {
  defaultCapabilityResolver,
  resolveCapabilities,
  type Capabilities,
  type CapabilityResolver
} from './capability-resolver.js';
import type { ObjectPath } from './object-path.js';
import type { FieldSchema } from './object-schema.js';

export interface NodeContext<T = unknown> {
  readonly root: unknown;
  readonly value: T;
  readonly parent: unknown;
  readonly parentSchema?: FieldSchema;
  readonly path: ObjectPath;
  readonly schema?: FieldSchema;
}

export interface ResolvedNodeContext<T = unknown> extends NodeContext<T> {
  readonly capabilities: Capabilities;
}

export function resolveNodeContext<T>(
  context: NodeContext<T>,
  resolver: CapabilityResolver = defaultCapabilityResolver
): ResolvedNodeContext<T> {
  const stableContext: NodeContext<T> = {
    ...context,
    path: Object.freeze([...context.path])
  };
  const capabilities = resolveCapabilities(stableContext, resolver);

  return Object.freeze({
    ...stableContext,
    capabilities: Object.freeze({ ...capabilities })
  });
}
