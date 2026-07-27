/**
 * PluginHost composes extension behavior without exposing it to the renderer.
 */

import {
  createCapabilityResolver,
  defaultCapabilityResolver,
  type CapabilityProvider,
  type CapabilityResolver
} from './capability-resolver.js';
import {
  resolveNodeContext,
  type NodeContext,
  type ResolvedNodeContext
} from './node-context.js';
import {
  createPropertyResolver,
  type PropertyProvider
} from './property-provider.js';

export interface ObjectPlugin<TProperties extends object> {
  readonly capabilities?: CapabilityProvider;
  readonly properties?: PropertyProvider<TProperties>;
}

export interface PluginResolution<TProperties extends object> {
  readonly context: ResolvedNodeContext;
  readonly properties: Readonly<TProperties>;
}

export interface PluginHost<TProperties extends object> {
  resolve(context: NodeContext): PluginResolution<TProperties>;
}

export interface PluginHostOptions<TProperties extends object> {
  readonly properties: TProperties;
  readonly plugins?: readonly ObjectPlugin<TProperties>[];
  readonly capabilityResolver?: CapabilityResolver;
}

export function createPluginHost<TProperties extends object>(
  options: PluginHostOptions<TProperties>
): PluginHost<TProperties> {
  const plugins = [...(options.plugins ?? [])];
  const capabilityResolver = createCapabilityResolver(
    plugins.flatMap((plugin) =>
      plugin.capabilities ? [plugin.capabilities] : []
    ),
    options.capabilityResolver ?? defaultCapabilityResolver
  );
  const propertyResolver = createPropertyResolver(
    options.properties,
    plugins.flatMap((plugin) => (plugin.properties ? [plugin.properties] : []))
  );

  return {
    resolve(context) {
      const resolvedContext = resolveNodeContext(context, capabilityResolver);

      return Object.freeze({
        context: resolvedContext,
        properties: propertyResolver.resolve(resolvedContext)
      });
    }
  };
}
