/**
 * Structural operations describe changes without depending on UI or history.
 */

import { isEditableContainer } from './object-container.js';
import {
  replaceValueAtPath,
  valueAtPath,
  type ObjectPath
} from './object-path.js';

export type StructuralOperation =
  | {
      type: 'array.append';
      path: ObjectPath;
      value?: unknown;
    }
  | {
      type: 'array.move';
      path: ObjectPath;
      toIndex: number;
    }
  | {
      type: 'object.insert';
      path: ObjectPath;
      key: string;
      value?: unknown;
    }
  | {
      type: 'object.rename';
      path: ObjectPath;
      key: string;
    }
  | {
      type: 'value.remove';
      path: ObjectPath;
    };

export function applyStructuralOperation<T>(
  root: T,
  operation: StructuralOperation
): T {
  try {
    switch (operation.type) {
      case 'array.append':
        return appendArrayValue(root, operation);
      case 'array.move':
        return moveArrayValue(root, operation);
      case 'object.insert':
        return insertObjectProperty(root, operation);
      case 'object.rename':
        return renameObjectProperty(root, operation);
      case 'value.remove':
        return removeValue(root, operation.path);
    }
  } catch {
    return root;
  }
}

function appendArrayValue<T>(
  root: T,
  operation: Extract<StructuralOperation, { type: 'array.append' }>
): T {
  const container = valueAtPath(root, operation.path);
  if (!Array.isArray(container)) return root;

  const value = Object.hasOwn(operation, 'value') ? operation.value : null;
  return replaceValueAtPath(root, operation.path, [...container, value]);
}

function moveArrayValue<T>(
  root: T,
  operation: Extract<StructuralOperation, { type: 'array.move' }>
): T {
  if (operation.path.length === 0) return root;

  const index = operation.path.at(-1);
  if (typeof index !== 'number') return root;

  const containerPath = operation.path.slice(0, -1);
  const container = valueAtPath(root, containerPath);
  if (
    !Array.isArray(container) ||
    index < 0 ||
    index >= container.length ||
    operation.toIndex < 0 ||
    operation.toIndex >= container.length ||
    index === operation.toIndex
  ) {
    return root;
  }

  const clone = container.slice();
  const [item] = clone.splice(index, 1);
  clone.splice(operation.toIndex, 0, item);
  return replaceValueAtPath(root, containerPath, clone);
}

function insertObjectProperty<T>(
  root: T,
  operation: Extract<StructuralOperation, { type: 'object.insert' }>
): T {
  const container = valueAtPath(root, operation.path);
  if (
    !isEditableObject(container) ||
    operation.key.length === 0 ||
    Object.hasOwn(container, operation.key)
  ) {
    return root;
  }

  const value = Object.hasOwn(operation, 'value') ? operation.value : null;
  const clone = cloneObject(container);
  Object.defineProperty(clone, operation.key, {
    configurable: true,
    enumerable: true,
    value,
    writable: true
  });
  return replaceValueAtPath(root, operation.path, clone);
}

function renameObjectProperty<T>(
  root: T,
  operation: Extract<StructuralOperation, { type: 'object.rename' }>
): T {
  if (operation.path.length === 0 || operation.key.length === 0) return root;

  const currentKey = operation.path.at(-1);
  if (typeof currentKey !== 'string' || currentKey === operation.key) {
    return root;
  }

  const containerPath = operation.path.slice(0, -1);
  const container = valueAtPath(root, containerPath);
  if (
    !isEditableObject(container) ||
    !Object.hasOwn(container, currentKey) ||
    Object.hasOwn(container, operation.key)
  ) {
    return root;
  }

  const renamed = Object.create(Object.getPrototypeOf(container)) as Record<
    string,
    unknown
  >;

  for (const propertyKey of Reflect.ownKeys(container)) {
    const descriptor = Object.getOwnPropertyDescriptor(container, propertyKey);
    if (descriptor) {
      Object.defineProperty(
        renamed,
        propertyKey === currentKey ? operation.key : propertyKey,
        descriptor
      );
    }
  }

  return replaceValueAtPath(root, containerPath, renamed);
}

function removeValue<T>(root: T, path: ObjectPath): T {
  if (path.length === 0) return root;

  const key = path.at(-1);
  const containerPath = path.slice(0, -1);
  const container = valueAtPath(root, containerPath);

  if (Array.isArray(container) && typeof key === 'number') {
    if (key < 0 || key >= container.length) return root;

    const clone = container.slice();
    clone.splice(key, 1);
    return replaceValueAtPath(root, containerPath, clone);
  }

  if (
    isEditableObject(container) &&
    typeof key === 'string' &&
    Object.hasOwn(container, key)
  ) {
    const descriptors = Object.getOwnPropertyDescriptors(container);
    delete descriptors[key];
    const clone = Object.create(
      Object.getPrototypeOf(container),
      descriptors
    ) as Record<string, unknown>;
    return replaceValueAtPath(root, containerPath, clone);
  }

  return root;
}

function cloneObject(value: Record<string, unknown>): Record<string, unknown> {
  return Object.create(
    Object.getPrototypeOf(value),
    Object.getOwnPropertyDescriptors(value)
  ) as Record<string, unknown>;
}

function isEditableObject(value: unknown): value is Record<string, unknown> {
  return isEditableContainer(value) && !Array.isArray(value);
}
