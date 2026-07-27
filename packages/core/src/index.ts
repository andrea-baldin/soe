/**
 * The SOE core describes values without knowing how they are rendered.
 */

export {
  formatObjectValue,
  isEditableValue,
  objectValueKind
} from './object-value.js';
export type { EditableValue, ObjectValueKind } from './object-value.js';
export { isEditableContainer, objectEntries } from './object-container.js';
export type { EditableContainer, ObjectEntry } from './object-container.js';
export {
  formatObjectPath,
  replaceValueAtPath,
  valueAtPath
} from './object-path.js';
export type { ObjectPath, ObjectPathSegment } from './object-path.js';
export { applyStructuralOperation } from './structural-operation.js';
export type { StructuralOperation } from './structural-operation.js';
export { ValueHistory } from './value-history.js';
