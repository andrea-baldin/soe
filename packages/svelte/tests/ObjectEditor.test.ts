import { cleanup, fireEvent, render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';

import ObjectEditor from '../src/ObjectEditor.svelte';
import ObjectEditorHarness from './ObjectEditorHarness.svelte';

afterEach(cleanup);

function boundValue(): Record<string, unknown> {
  return JSON.parse(
    screen.getByTestId('bound-value').textContent ?? '{}'
  ) as Record<string, unknown>;
}

describe('ObjectEditor', () => {
  it('updates string, number, and boolean values through the binding', async () => {
    const user = userEvent.setup();

    render(ObjectEditorHarness, {
      initial: {
        active: true,
        age: 36,
        name: 'Ada'
      }
    });

    const name = screen.getByRole('textbox', { name: 'name' });
    await user.clear(name);
    await user.type(name, 'Grace');

    const age = screen.getByRole('spinbutton', { name: 'age' });
    await user.clear(age);
    await user.type(age, '37');

    await user.click(screen.getByRole('checkbox', { name: 'active' }));

    expect(boundValue()).toEqual({
      active: false,
      age: 37,
      name: 'Grace'
    });
  });

  it('keeps the previous number when temporary input is invalid', async () => {
    const user = userEvent.setup();

    render(ObjectEditorHarness, {
      initial: { age: 36 }
    });

    const age = screen.getByRole('spinbutton', { name: 'age' });
    await user.clear(age);

    expect(boundValue()).toEqual({ age: 36 });

    await user.tab();

    expect(age).toHaveValue(36);
    expect(boundValue()).toEqual({ age: 36 });
  });

  it.each([
    ['string', ''],
    ['number', 0],
    ['boolean', false]
  ])(
    'initializes null as %s only after an explicit choice',
    async (kind, expected) => {
      const user = userEvent.setup();

      render(ObjectEditorHarness, {
        initial: { optional: null }
      });

      const typeSelector = screen.getByRole('combobox', { name: 'optional' });
      expect(typeSelector).toHaveValue('null');

      await user.selectOptions(typeSelector, kind);

      expect(boundValue()).toEqual({ optional: expected });
    }
  );

  it('leaves unsupported values inspectable and outside the tab order', () => {
    render(ObjectEditor, {
      value: {
        created: new Date('2025-02-14'),
        settings: new Map()
      }
    });

    expect(screen.getByText('2025-02-14')).toBeVisible();
    expect(screen.getByText('Map(0)')).toBeVisible();
    expect(screen.queryAllByRole('textbox')).toHaveLength(0);
  });

  it('gives every primitive control an accessible name and unique id', () => {
    render(ObjectEditor, {
      value: {
        active: true,
        age: 36,
        name: 'Ada',
        optional: null
      }
    });

    const controls = [
      screen.getByRole('checkbox', { name: 'active' }),
      screen.getByRole('spinbutton', { name: 'age' }),
      screen.getByRole('textbox', { name: 'name' }),
      screen.getByRole('combobox', { name: 'optional' })
    ];

    expect(new Set(controls.map((control) => control.id)).size).toBe(
      controls.length
    );

    for (const control of controls) {
      expect(control).toHaveAccessibleName();
    }

    render(ObjectEditor, {
      value: { name: 'Grace' }
    });

    const textInputs = screen.getAllByRole('textbox', { name: 'name' });
    expect(new Set(textInputs.map((input) => input.id)).size).toBe(
      textInputs.length
    );
  });

  it('restores an invalid number on blur without emitting a change', async () => {
    render(ObjectEditorHarness, {
      initial: { amount: 10 }
    });

    const amount = screen.getByRole('spinbutton', { name: 'amount' });
    await fireEvent.input(amount, { target: { value: '' } });
    await fireEvent.blur(amount);

    expect(amount).toHaveValue(10);
    expect(boundValue()).toEqual({ amount: 10 });
  });

  it('edits nested objects and arrays through immutable paths', async () => {
    const user = userEvent.setup();

    render(ObjectEditorHarness, {
      initial: {
        person: {
          name: 'Ada',
          skills: ['math', 'logic']
        }
      }
    });

    const name = screen.getByRole('textbox', { name: 'person.name' });
    await user.clear(name);
    await user.type(name, 'Grace');

    const firstSkill = screen.getByRole('textbox', {
      name: 'person.skills[0]'
    });
    await user.clear(firstSkill);
    await user.type(firstSkill, 'compilers');

    expect(boundValue()).toEqual({
      person: {
        name: 'Grace',
        skills: ['compilers', 'logic']
      }
    });
    expect(firstSkill.closest('[data-soe-node]')).toHaveAttribute(
      'data-soe-path',
      'person.skills[0]'
    );
  });

  it('collapses and expands containers with a native button', async () => {
    const user = userEvent.setup();

    render(ObjectEditor, {
      value: {
        person: { name: 'Ada' }
      }
    });

    const toggle = screen.getByRole('button', { name: 'Collapse person' });
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('textbox', { name: 'person.name' })).toBeVisible();

    await user.click(toggle);

    expect(
      screen.getByRole('button', { name: 'Expand person' })
    ).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('textbox', { name: 'person.name' })).toBeNull();

    await user.click(screen.getByRole('button', { name: 'Expand person' }));

    expect(screen.getByRole('textbox', { name: 'person.name' })).toBeVisible();
  });

  it('stops at circular references without throwing', () => {
    const recursive: Record<string, unknown> = { name: 'root' };
    recursive.self = recursive;

    render(ObjectEditor, {
      value: recursive
    });

    expect(screen.getByRole('textbox', { name: 'name' })).toHaveValue('root');
    expect(screen.getByText('Circular reference')).toBeVisible();
  });

  it('renders shared references when they are not circular ancestors', () => {
    const shared = { name: 'shared' };

    render(ObjectEditor, {
      value: {
        first: shared,
        second: shared
      }
    });

    expect(screen.getByRole('textbox', { name: 'first.name' })).toHaveValue(
      'shared'
    );
    expect(screen.getByRole('textbox', { name: 'second.name' })).toHaveValue(
      'shared'
    );
    expect(screen.queryByText('Circular reference')).toBeNull();
  });

  it('renders empty nested containers without treating them as primitives', () => {
    render(ObjectEditor, {
      value: {
        children: [],
        options: {}
      }
    });

    expect(screen.getByText('Empty array')).toBeVisible();
    expect(screen.getByText('Empty object')).toBeVisible();
    expect(
      screen.getByRole('button', { name: 'Collapse children' })
    ).toHaveTextContent('Array(0)');
    expect(
      screen.getByRole('button', { name: 'Collapse options' })
    ).toHaveTextContent('Object(0)');
  });

  it('adds root and nested properties as explicit null values', async () => {
    const user = userEvent.setup();

    render(ObjectEditorHarness, {
      initial: {
        person: { name: 'Ada' }
      }
    });

    await user.click(
      screen.getByRole('button', { name: 'Add property to root' })
    );
    await user.type(
      screen.getByRole('textbox', { name: 'New property name in root' }),
      'active'
    );
    await user.click(screen.getByRole('button', { name: 'Add' }));

    await user.click(
      screen.getByRole('button', { name: 'Add property to person' })
    );
    await user.type(
      screen.getByRole('textbox', {
        name: 'New property name in person'
      }),
      'age'
    );
    await user.click(screen.getByRole('button', { name: 'Add' }));

    expect(boundValue()).toEqual({
      active: null,
      person: {
        age: null,
        name: 'Ada'
      }
    });
    expect(screen.getByRole('combobox', { name: 'person.age' })).toHaveValue(
      'null'
    );
  });

  it('keeps add and rename forms open when a key is invalid', async () => {
    const user = userEvent.setup();

    render(ObjectEditorHarness, {
      initial: {
        first: 1,
        second: 2
      }
    });

    await user.click(
      screen.getByRole('button', { name: 'Add property to root' })
    );
    await user.type(
      screen.getByRole('textbox', { name: 'New property name in root' }),
      'first'
    );
    await user.click(screen.getByRole('button', { name: 'Add' }));

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Property already exists'
    );
    expect(boundValue()).toEqual({ first: 1, second: 2 });

    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    await user.click(screen.getByRole('button', { name: 'Rename first' }));

    const rename = screen.getByRole('textbox', {
      name: 'New name for first'
    });
    await user.clear(rename);
    await user.type(rename, 'second');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Property already exists'
    );
    expect(boundValue()).toEqual({ first: 1, second: 2 });
  });

  it('renames and deletes object properties through confirmed operations', async () => {
    const user = userEvent.setup();

    render(ObjectEditorHarness, {
      initial: {
        name: 'Ada',
        obsolete: true
      }
    });

    await user.click(screen.getByRole('button', { name: 'Rename name' }));
    const rename = screen.getByRole('textbox', {
      name: 'New name for name'
    });
    await user.clear(rename);
    await user.type(rename, 'displayName');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    await user.click(screen.getByRole('button', { name: 'Delete obsolete' }));
    await user.click(screen.getByRole('button', { name: 'Confirm delete' }));

    expect(boundValue()).toEqual({ displayName: 'Ada' });
    expect(screen.getByRole('textbox', { name: 'displayName' })).toHaveValue(
      'Ada'
    );
  });

  it('appends, moves, and deletes array items', async () => {
    const user = userEvent.setup();

    render(ObjectEditorHarness, {
      initial: {
        skills: ['math', 'logic']
      }
    });

    await user.click(
      screen.getByRole('button', { name: 'Append item to skills' })
    );
    expect(boundValue()).toEqual({ skills: ['math', 'logic', null] });

    await user.click(screen.getByRole('button', { name: 'Move skills[1] up' }));
    expect(boundValue()).toEqual({ skills: ['logic', 'math', null] });

    await user.click(screen.getByRole('button', { name: 'Delete skills[0]' }));
    await user.click(screen.getByRole('button', { name: 'Confirm delete' }));

    expect(boundValue()).toEqual({ skills: ['math', null] });
    expect(screen.getByRole('combobox', { name: 'skills[1]' })).toHaveValue(
      'null'
    );
  });
});
