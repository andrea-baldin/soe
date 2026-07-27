import { describe, expect, it } from 'vitest';

import { ValueHistory } from './value-history.js';

describe('ValueHistory', () => {
  it('navigates recorded immutable values', () => {
    const initial = { count: 0 };
    const first = { count: 1 };
    const second = { count: 2 };
    const history = new ValueHistory(initial);

    history.record(first);
    history.record(second);

    expect(history.value).toBe(second);
    expect(history.undo()).toBe(first);
    expect(history.undo()).toBe(initial);
    expect(history.redo()).toBe(first);
  });

  it('clears redo revisions after a new record', () => {
    const history = new ValueHistory('initial');

    history.record('first');
    history.record('second');
    history.undo();
    history.record('replacement');

    expect(history.canRedo).toBe(false);
    expect(history.redo()).toBe('replacement');
  });

  it('ignores an identical value reference', () => {
    const value = { stable: true };
    const history = new ValueHistory(value);

    history.record(value);

    expect(history.canUndo).toBe(false);
  });

  it('coalesces consecutive records in the same group', () => {
    const history = new ValueHistory('Ada');

    history.record('G', 'name');
    history.record('Gr', 'name');
    history.record('Grace', 'name');

    expect(history.undo()).toBe('Ada');
    expect(history.canUndo).toBe(false);
  });

  it('resets all navigation state for an external value', () => {
    const external = { external: true };
    const history = new ValueHistory<Record<string, boolean>>({
      initial: true
    });

    history.record({ changed: true });
    history.undo();
    history.reset(external);

    expect(history.value).toBe(external);
    expect(history.canUndo).toBe(false);
    expect(history.canRedo).toBe(false);
  });

  it('retains only the latest one hundred revisions', () => {
    const history = new ValueHistory(0);

    for (let value = 1; value <= 101; value += 1) {
      history.record(value);
    }
    for (let count = 0; count < 100; count += 1) {
      history.undo();
    }

    expect(history.value).toBe(1);
    expect(history.canUndo).toBe(false);
  });
});
