import { describe, expect, it } from 'vitest';

import { applyStructuralOperation } from './structural-operation.js';

describe('applyStructuralOperation', () => {
  it('inserts and renames object properties while preserving order', () => {
    const inserted = applyStructuralOperation(
      { first: 1 },
      {
        type: 'object.insert',
        path: [],
        key: 'second'
      }
    );
    const renamed = applyStructuralOperation(inserted, {
      type: 'object.rename',
      path: ['first'],
      key: 'primary'
    });

    expect(renamed).toEqual({ primary: 1, second: null });
    expect(Object.keys(renamed)).toEqual(['primary', 'second']);
  });

  it('removes object properties and array items immutably', () => {
    const source = {
      list: ['first', 'second'],
      nested: { keep: true, remove: false }
    };
    const withoutProperty = applyStructuralOperation(source, {
      type: 'value.remove',
      path: ['nested', 'remove']
    });
    const withoutItem = applyStructuralOperation(withoutProperty, {
      type: 'value.remove',
      path: ['list', 0]
    });

    expect(withoutItem).toEqual({
      list: ['second'],
      nested: { keep: true }
    });
    expect(withoutItem).not.toBe(source);
    expect(withoutItem.list).not.toBe(source.list);
  });

  it('appends and moves array items', () => {
    const appended = applyStructuralOperation(
      { list: ['first', 'second'] },
      {
        type: 'array.append',
        path: ['list']
      }
    );
    const moved = applyStructuralOperation(appended, {
      type: 'array.move',
      path: ['list', 2],
      toIndex: 0
    });

    expect(moved).toEqual({ list: [null, 'first', 'second'] });
  });

  it('rejects duplicate keys and invalid paths', () => {
    const source = { first: 1, list: ['only'] };

    expect(
      applyStructuralOperation(source, {
        type: 'object.insert',
        path: [],
        key: 'first'
      })
    ).toBe(source);
    expect(
      applyStructuralOperation(source, {
        type: 'object.rename',
        path: ['first'],
        key: ''
      })
    ).toBe(source);
    expect(
      applyStructuralOperation(source, {
        type: 'array.move',
        path: ['list', 0],
        toIndex: 2
      })
    ).toBe(source);
  });

  it('preserves object prototypes and property descriptors', () => {
    let getterCalls = 0;
    const source = Object.create(null) as Record<string, unknown>;
    Object.defineProperty(source, 'computed', {
      configurable: true,
      enumerable: true,
      get() {
        getterCalls += 1;
        return 42;
      }
    });

    const renamed = applyStructuralOperation(source, {
      type: 'object.rename',
      path: ['computed'],
      key: 'answer'
    });
    const descriptor = Object.getOwnPropertyDescriptor(renamed, 'answer');

    expect(Object.getPrototypeOf(renamed)).toBeNull();
    expect(descriptor?.get).toBeTypeOf('function');
    expect(getterCalls).toBe(0);
  });
});
