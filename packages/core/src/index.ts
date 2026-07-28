/**
 * The SOE core describes values without knowing how they are rendered.
 */

export {
  formatObjectValue,
  isEditableValue,
  objectValueKind,
  serializeObjectValue
} from './object-value.js';
export type { EditableValue, ObjectValueKind } from './object-value.js';
export {
  isEditableContainer,
  objectEntries,
  parseObjectContainer
} from './object-container.js';
export type { EditableContainer, ObjectEntry } from './object-container.js';
export {
  inspectionEntries,
  isInspectableContainer
} from './object-inspection.js';
export type { InspectionEntry } from './object-inspection.js';
export { searchObject } from './object-search.js';
export type { ObjectSearchResult } from './object-search.js';
export {
  formatObjectPath,
  replaceValueAtPath,
  valueAtPath
} from './object-path.js';
export type { ObjectPath, ObjectPathSegment } from './object-path.js';
export { applyStructuralOperation } from './structural-operation.js';
export type { StructuralOperation } from './structural-operation.js';
export { ValueHistory } from './value-history.js';
export {
  fieldSchemaAtPath,
  missingRequiredFields,
  validateField
} from './object-schema.js';
export type {
  FieldSchema,
  FieldValidationContext,
  FieldValidator,
  ObjectSchema,
  SchemaValueType
} from './object-schema.js';
export {
  createCapabilityResolver,
  defaultCapabilityResolver,
  resolveCapabilities
} from './capability-resolver.js';
export type {
  Capabilities,
  CapabilityContribution,
  CapabilityContext,
  CapabilityProvider,
  CapabilityResolver
} from './capability-resolver.js';
export { resolveNodeContext } from './node-context.js';
export type { NodeContext, ResolvedNodeContext } from './node-context.js';
export { createPropertyResolver } from './property-provider.js';
export type {
  PropertyProvider,
  PropertyResolver
} from './property-provider.js';
export { createPluginHost } from './plugin-host.js';
export type {
  ObjectPlugin,
  PluginHost,
  PluginHostOptions,
  PluginResolution
} from './plugin-host.js';
