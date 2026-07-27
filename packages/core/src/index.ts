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
export { formatObjectPath, replaceValueAtPath } from './object-path.js';
export type { ObjectPath, ObjectPathSegment } from './object-path.js';
