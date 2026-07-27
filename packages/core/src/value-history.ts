/**
 * ValueHistory navigates immutable value revisions without knowing their shape.
 */

const HISTORY_LIMIT = 100;

export class ValueHistory<T> {
  readonly #past: T[] = [];
  readonly #future: T[] = [];
  #present: T;
  #group: string | undefined;

  constructor(initialValue: T) {
    this.#present = initialValue;
  }

  get value(): T {
    return this.#present;
  }

  get canUndo(): boolean {
    return this.#past.length > 0;
  }

  get canRedo(): boolean {
    return this.#future.length > 0;
  }

  record(nextValue: T, group?: string): T {
    if (Object.is(nextValue, this.#present)) return this.#present;

    if (group === undefined || group !== this.#group) {
      this.#past.push(this.#present);
      if (this.#past.length > HISTORY_LIMIT) {
        this.#past.shift();
      }
    }
    this.#present = nextValue;
    this.#future.length = 0;
    this.#group = group;
    return this.#present;
  }

  undo(): T {
    if (!this.canUndo) return this.#present;

    this.#future.push(this.#present);
    this.#present = this.#past.pop() as T;
    this.#group = undefined;
    return this.#present;
  }

  redo(): T {
    if (!this.canRedo) return this.#present;

    this.#past.push(this.#present);
    this.#present = this.#future.pop() as T;
    this.#group = undefined;
    return this.#present;
  }

  reset(value: T): T {
    this.#past.length = 0;
    this.#future.length = 0;
    this.#present = value;
    this.#group = undefined;
    return this.#present;
  }
}
