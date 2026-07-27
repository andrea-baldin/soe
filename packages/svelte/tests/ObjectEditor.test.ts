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
});
