import { cleanup, fireEvent, render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  composeObjectSchemas,
  schemaForPath,
  schemaForType
} from '@andreabaldin/soe-core';

import ObjectEditor from '../src/ObjectEditor.svelte';
import type { ObjectEditorPlugin } from '../src/object-editor-plugin.js';
import ObjectEditorHarness from './ObjectEditorHarness.svelte';
import UppercaseEditor from './UppercaseEditor.svelte';

afterEach(cleanup);

function boundValue(): Record<string, unknown> {
  return JSON.parse(
    screen.getByTestId('bound-value').textContent ?? '{}'
  ) as Record<string, unknown>;
}

describe('ObjectEditor', () => {
  it('keeps the zero-configuration API unchanged', () => {
    render(ObjectEditor, {
      value: { name: 'Ada' }
    });

    expect(screen.getByRole('textbox', { name: 'name' })).toHaveValue('Ada');
  });

  it('applies capability plugins to matching nodes', async () => {
    const user = userEvent.setup();
    const plugins: ObjectEditorPlugin[] = [
      {
        capabilities: {
          provide(context) {
            return context.path.join('.') === 'profile.name'
              ? {
                  delete: false,
                  editValue: false,
                  renameKey: false
                }
              : undefined;
          }
        }
      }
    ];

    render(ObjectEditorHarness, {
      initial: {
        profile: {
          name: 'Ada',
          title: 'Programmer'
        }
      },
      plugins
    });

    expect(
      screen.queryByRole('textbox', { name: 'profile.name' })
    ).not.toBeInTheDocument();
    expect(screen.getByText('Ada')).toBeVisible();
    expect(
      screen.queryByRole('button', { name: 'Rename profile.name' })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Delete profile.name' })
    ).not.toBeInTheDocument();

    const title = screen.getByRole('textbox', { name: 'profile.title' });
    await user.clear(title);
    await user.type(title, 'Engineer');

    expect(boundValue()).toEqual({
      profile: {
        name: 'Ada',
        title: 'Engineer'
      }
    });
  });

  it('composes renderer properties while preserving canonical paths', () => {
    const plugins: ObjectEditorPlugin[] = [
      {
        properties: {
          provide(context) {
            return context.path.join('.') === 'profile.name'
              ? {
                  description: 'The public name shown on the profile.',
                  label: 'Display name'
                }
              : undefined;
          }
        }
      }
    ];

    render(ObjectEditor, {
      value: {
        profile: {
          name: 'Ada'
        }
      },
      plugins
    });

    const input = screen.getByRole('textbox', { name: 'profile.name' });
    expect(screen.getByText('Display name')).toBeVisible();
    expect(input).toHaveAccessibleDescription(
      'The public name shown on the profile.'
    );
    expect(input.closest('[data-soe-node]')).toHaveAttribute(
      'data-soe-path',
      'profile.name'
    );
  });

  it('copies node values through the clipboard capability', async () => {
    const user = userEvent.setup();
    const writeText = vi
      .fn<(value: string) => Promise<void>>()
      .mockResolvedValue();
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText }
    });

    render(ObjectEditor, {
      value: {
        profile: {
          active: true,
          name: 'Ada'
        }
      }
    });

    await user.click(screen.getByRole('button', { name: 'Copy profile' }));

    expect(writeText).toHaveBeenCalledWith(
      '{\n  "active": true,\n  "name": "Ada"\n}'
    );
    expect(screen.getByText('Copied')).toBeVisible();
  });

  it('isolates clipboard failures', async () => {
    const user = userEvent.setup();
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: vi.fn().mockRejectedValue(new Error('Denied'))
      }
    });

    render(ObjectEditor, {
      value: { name: 'Ada' }
    });

    await user.click(screen.getByRole('button', { name: 'Copy name' }));

    expect(screen.getByText('Copy failed')).toBeVisible();
    expect(screen.getByRole('textbox', { name: 'name' })).toHaveValue('Ada');
  });

  it('pastes matching JSON containers and records history', async () => {
    const user = userEvent.setup();
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        readText: vi.fn().mockResolvedValue('{"name":"Grace","active":true}'),
        writeText: vi.fn()
      }
    });

    render(ObjectEditorHarness, {
      initial: { profile: { name: 'Ada' } }
    });

    await user.click(screen.getByRole('button', { name: 'Paste profile' }));

    expect(boundValue()).toEqual({
      profile: { active: true, name: 'Grace' }
    });
    expect(screen.getByText('Pasted')).toBeVisible();

    await user.click(screen.getByRole('button', { name: 'Undo' }));
    expect(boundValue()).toEqual({ profile: { name: 'Ada' } });
  });

  it('rejects mismatched clipboard containers', async () => {
    const user = userEvent.setup();
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        readText: vi.fn().mockResolvedValue('["not","an","object"]'),
        writeText: vi.fn()
      }
    });

    render(ObjectEditorHarness, {
      initial: { profile: { name: 'Ada' } }
    });

    await user.click(screen.getByRole('button', { name: 'Paste profile' }));

    expect(boundValue()).toEqual({ profile: { name: 'Ada' } });
    expect(screen.getByText('Paste requires a JSON object')).toBeVisible();
  });

  it('hides paste when a plugin removes the capability', () => {
    const plugins: ObjectEditorPlugin[] = [
      {
        capabilities: {
          provide: (context) =>
            context.path.join('.') === 'profile' ? { paste: false } : undefined
        }
      }
    ];

    render(ObjectEditor, {
      value: { profile: { name: 'Ada' } },
      plugins
    });

    expect(
      screen.queryByRole('button', { name: 'Paste profile' })
    ).not.toBeInTheDocument();
  });

  it('applies later renderer property contributions last', () => {
    const plugins: ObjectEditorPlugin[] = [
      {
        properties: {
          provide: () => ({ label: 'First label' })
        }
      },
      {
        properties: {
          provide: (_context, current) => ({
            description: `Resolved from ${current.label}`,
            label: 'Final label'
          })
        }
      }
    ];

    render(ObjectEditor, {
      value: { name: 'Ada' },
      plugins
    });

    expect(screen.getByText('Final label')).toBeVisible();
    expect(
      screen.getByRole('textbox', { name: 'name' })
    ).toHaveAccessibleDescription('Resolved from First label');
  });

  it('renders a plugin-selected custom editor and records its commits', async () => {
    const user = userEvent.setup();
    const plugins: ObjectEditorPlugin[] = [
      {
        properties: {
          provide: (context) =>
            context.path.join('.') === 'name'
              ? { editor: UppercaseEditor }
              : undefined
        }
      }
    ];

    render(ObjectEditorHarness, {
      initial: { name: 'Ada' },
      plugins
    });

    expect(
      screen.queryByRole('textbox', { name: 'name' })
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Uppercase name' }));
    expect(boundValue()).toEqual({ name: 'ADA' });

    await user.click(screen.getByRole('button', { name: 'Undo' }));
    expect(boundValue()).toEqual({ name: 'Ada' });
  });

  it('ignores custom editors when editing is not permitted', () => {
    const plugins: ObjectEditorPlugin[] = [
      {
        capabilities: {
          provide: () => ({ editValue: false })
        },
        properties: {
          provide: () => ({ editor: UppercaseEditor })
        }
      }
    ];

    render(ObjectEditor, {
      value: { name: 'Ada' },
      plugins
    });

    expect(
      screen.queryByRole('button', { name: 'Uppercase name' })
    ).not.toBeInTheDocument();
    expect(screen.getByText('Ada')).toBeVisible();
  });

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

  it('recursively inspects maps, sets, instances, symbols, and accessors', async () => {
    const user = userEvent.setup();
    const secret = Symbol('secret');
    let getterReads = 0;
    const instance = Object.defineProperties(
      new (class Profile {
        name = 'Ada';
      })(),
      {
        [secret]: { enumerable: false, value: 42 },
        computed: {
          enumerable: true,
          get() {
            getterReads += 1;
            return 'unsafe';
          }
        }
      }
    );

    render(ObjectEditor, {
      value: {
        instance,
        map: new Map([['language', { name: 'Analytical Engine' }]]),
        set: new Set(['logic'])
      }
    });

    expect(screen.getByText('Profile(…)')).toBeVisible();
    expect(screen.getByText('Map(1)')).toBeVisible();
    expect(screen.getByText('Set(1)')).toBeVisible();
    expect(screen.getByText('Symbol(secret)')).toBeVisible();
    expect(screen.getByText('[Getter]')).toBeVisible();
    expect(getterReads).toBe(0);

    expect(
      screen.queryByRole('textbox', { name: 'instance.name' })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Delete instance.name' })
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Collapse map' }));
    expect(screen.queryByText('Analytical Engine')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Expand map' }));
    expect(screen.getByText('Analytical Engine')).toBeVisible();
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

  it('searches paths and values and expands matching branches', async () => {
    const user = userEvent.setup();

    render(ObjectEditor, {
      value: {
        profile: {
          name: 'Ada Lovelace'
        }
      }
    });

    await user.click(screen.getByRole('button', { name: 'Collapse profile' }));
    expect(
      screen.queryByRole('textbox', { name: 'profile.name' })
    ).not.toBeInTheDocument();

    await user.type(
      screen.getByRole('searchbox', { name: 'Search object' }),
      'Ada'
    );

    expect(screen.getByText('1 result')).toBeVisible();
    expect(screen.getByRole('textbox', { name: 'profile.name' })).toBeVisible();
    expect(
      screen
        .getByRole('textbox', { name: 'profile.name' })
        .closest('[data-soe-node]')
    ).toHaveAttribute('data-soe-match', 'true');
  });

  it('navigates search results and focuses the active node', async () => {
    const user = userEvent.setup();
    const { container } = render(ObjectEditor, {
      value: {
        first: 'match',
        second: 'match'
      }
    });

    await user.type(
      screen.getByRole('searchbox', { name: 'Search object' }),
      'match'
    );

    expect(screen.getByText('2 results')).toBeVisible();
    await user.click(
      screen.getByRole('button', { name: 'Next search result' })
    );

    const second = container.querySelector<HTMLElement>(
      '[data-soe-path="second"]'
    );
    expect(second).toHaveAttribute('data-soe-active-match', 'true');
    expect(second).toHaveFocus();

    await user.click(
      screen.getByRole('button', { name: 'Previous search result' })
    );
    expect(container.querySelector('[data-soe-path="first"]')).toHaveAttribute(
      'data-soe-active-match',
      'true'
    );
  });

  it('finds values inside read-only inspected containers', async () => {
    const user = userEvent.setup();

    render(ObjectEditor, {
      value: {
        references: new Map([['engine', 'Analytical Engine']])
      }
    });

    await user.click(
      screen.getByRole('button', { name: 'Collapse references' })
    );
    await user.type(
      screen.getByRole('searchbox', { name: 'Search object' }),
      'analytical'
    );

    expect(screen.getByText('Analytical Engine')).toBeVisible();
    expect(screen.getByText('1 result')).toBeVisible();
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

  it('undoes and redoes primitive and structural revisions', async () => {
    const user = userEvent.setup();

    render(ObjectEditorHarness, {
      initial: {
        name: 'Ada',
        skills: ['math']
      }
    });

    const undo = screen.getByRole('button', { name: 'Undo' });
    const redo = screen.getByRole('button', { name: 'Redo' });
    expect(undo).toBeDisabled();
    expect(redo).toBeDisabled();

    const name = screen.getByRole('textbox', { name: 'name' });
    await user.clear(name);
    await user.type(name, 'Grace');
    await user.click(
      screen.getByRole('button', { name: 'Append item to skills' })
    );

    expect(boundValue()).toEqual({ name: 'Grace', skills: ['math', null] });

    await user.click(undo);
    expect(boundValue()).toEqual({ name: 'Grace', skills: ['math'] });

    await user.click(undo);
    expect(boundValue()).toEqual({ name: 'Ada', skills: ['math'] });

    await user.click(redo);
    await user.click(redo);
    expect(boundValue()).toEqual({ name: 'Grace', skills: ['math', null] });
  });

  it('supports keyboard shortcuts and clears redo after a new edit', async () => {
    const user = userEvent.setup();

    render(ObjectEditorHarness, {
      initial: { name: 'Ada' }
    });

    const name = screen.getByRole('textbox', { name: 'name' });
    await user.clear(name);
    await user.type(name, 'Grace');

    await fireEvent.keyDown(name, { ctrlKey: true, key: 'z' });
    expect(boundValue()).toEqual({ name: 'Ada' });

    await fireEvent.keyDown(name, {
      ctrlKey: true,
      key: 'z',
      shiftKey: true
    });
    expect(boundValue()).toEqual({ name: 'Grace' });

    await user.click(screen.getByRole('button', { name: 'Undo' }));
    await user.clear(name);
    await user.type(name, 'Marie');

    expect(screen.getByRole('button', { name: 'Redo' })).toBeDisabled();
    expect(boundValue()).toEqual({ name: 'Marie' });
  });

  it('uses schema types before runtime inference', async () => {
    const user = userEvent.setup();

    render(ObjectEditorHarness, {
      initial: {
        active: 'yes',
        age: null,
        code: 42
      },
      schema: {
        fields: {
          active: { type: 'boolean' },
          age: { type: 'number' },
          code: { type: 'string' }
        }
      }
    });

    expect(screen.getByRole('checkbox', { name: 'active' })).not.toBeChecked();
    expect(screen.getByRole('spinbutton', { name: 'age' })).toHaveValue(null);
    expect(screen.getByRole('textbox', { name: 'code' })).toHaveValue('42');
    expect(screen.getAllByRole('alert')).toHaveLength(3);

    await user.click(screen.getByRole('checkbox', { name: 'active' }));
    await user.type(screen.getByRole('spinbutton', { name: 'age' }), '36');
    const code = screen.getByRole('textbox', { name: 'code' });
    await user.clear(code);
    await user.type(code, 'A-42');

    expect(boundValue()).toEqual({
      active: true,
      age: 36,
      code: 'A-42'
    });
    expect(screen.queryAllByRole('alert')).toHaveLength(0);
  });

  it('applies composed type rules and path overrides recursively', () => {
    const schema = composeObjectSchemas(
      schemaForType('number', {
        readonly: true,
        validate: (value) =>
          Number(value) >= 0 ? undefined : 'Number must be positive'
      }),
      schemaForPath(['metrics', '*'], { readonly: false })
    );

    render(ObjectEditor, {
      value: {
        locked: 10,
        metrics: {
          current: 5,
          previous: -1
        }
      },
      schema
    });

    expect(
      screen.queryByRole('spinbutton', { name: 'locked' })
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('spinbutton', { name: 'metrics.current' })
    ).toHaveValue(5);
    expect(screen.getByText('Number must be positive')).toBeVisible();
  });

  it('renders tuple positions from positional schemas', () => {
    render(ObjectEditor, {
      value: {
        row: [42, 'Ada', true]
      },
      schema: {
        fields: {
          row: {
            items: { readonly: true },
            prefixItems: [
              { type: 'number', readonly: false },
              { type: 'string', readonly: false }
            ]
          }
        }
      }
    });

    expect(screen.getByRole('spinbutton', { name: 'row[0]' })).toHaveValue(42);
    expect(screen.getByRole('textbox', { name: 'row[1]' })).toHaveValue('Ada');
    expect(
      screen.queryByRole('checkbox', { name: 'row[2]' })
    ).not.toBeInTheDocument();
    expect(screen.getByRole('status', { name: 'row[2]' })).toHaveTextContent(
      'true'
    );
  });

  it('enforces recursive readonly schema policies', () => {
    render(ObjectEditor, {
      value: {
        profile: {
          name: 'Ada',
          nested: { title: 'Programmer' }
        }
      },
      schema: {
        fields: {
          profile: { readonly: true }
        }
      }
    });

    expect(
      screen.queryByRole('textbox', { name: 'profile.name' })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('textbox', { name: 'profile.nested.title' })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Add property to profile' })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Delete profile' })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Paste profile' })
    ).not.toBeInTheDocument();
  });

  it('enforces schema key, object, and array structure policies', () => {
    render(ObjectEditor, {
      value: {
        settings: { locale: 'it' },
        values: ['first']
      },
      schema: {
        fields: {
          settings: {
            additionalProperties: false,
            removable: false,
            renameable: false
          },
          values: {
            maximumItems: 1,
            minimumItems: 1,
            items: { type: 'string' }
          }
        }
      }
    });

    expect(
      screen.queryByRole('button', { name: 'Add property to settings' })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Rename settings' })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Delete settings' })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Append item to values' })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Delete values[0]' })
    ).not.toBeInTheDocument();
  });

  it('lets later application plugins refine schema policy', () => {
    const plugins: ObjectEditorPlugin[] = [
      {
        capabilities: {
          provide: (context) =>
            context.path.join('.') === 'name' ? { editValue: true } : undefined
        }
      }
    ];

    render(ObjectEditor, {
      value: { name: 'Ada' },
      schema: {
        fields: {
          name: { readonly: true }
        }
      },
      plugins
    });

    expect(screen.getByRole('textbox', { name: 'name' })).toHaveValue('Ada');
  });

  it('validates nested fields with root and path context', async () => {
    const user = userEvent.setup();

    render(ObjectEditorHarness, {
      initial: {
        minimum: 10,
        order: { price: 5 }
      },
      schema: {
        fields: {
          order: {
            fields: {
              price: {
                type: 'number',
                validate(value, context) {
                  const root = context.root as {
                    minimum: number;
                  };
                  return Number(value) < root.minimum
                    ? `${context.path.join('.')} is too low`
                    : undefined;
                }
              }
            }
          }
        }
      }
    });

    const price = screen.getByRole('spinbutton', { name: 'order.price' });
    expect(price).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('alert')).toHaveTextContent(
      'order.price is too low'
    );

    await user.clear(price);
    await user.type(price, '12');

    expect(price).toHaveAttribute('aria-invalid', 'false');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(boundValue()).toEqual({ minimum: 10, order: { price: 12 } });
  });

  it('summarizes validation issues and navigates to existing fields', async () => {
    const user = userEvent.setup();
    const { container } = render(ObjectEditorHarness, {
      initial: {
        profile: { name: '' }
      },
      schema: {
        fields: {
          profile: {
            fields: {
              name: {
                validate: (value) =>
                  String(value) ? undefined : 'Name is required'
              },
              title: { required: true }
            }
          }
        }
      }
    });

    expect(screen.getByText('2 validation issues')).toBeVisible();
    expect(
      screen.getByRole('button', {
        name: 'profile.name: Name is required'
      })
    ).toBeVisible();

    await user.click(
      screen.getByRole('button', {
        name: 'profile.title: Required property is missing'
      })
    );

    expect(container.querySelector('[data-soe-path="profile"]')).toHaveFocus();
  });

  it('reactively clears the validation report after correction', async () => {
    const user = userEvent.setup();

    render(ObjectEditorHarness, {
      initial: { name: '' },
      schema: {
        fields: {
          name: {
            validate: (value) =>
              String(value) ? undefined : 'Name is required'
          }
        }
      }
    });

    expect(screen.getByText('1 validation issue')).toBeVisible();

    await user.type(screen.getByRole('textbox', { name: 'name' }), 'Ada');

    expect(
      screen.queryByRole('region', { name: 'Validation summary' })
    ).not.toBeInTheDocument();
  });

  it('reports warnings without marking fields invalid', () => {
    const { container } = render(ObjectEditor, {
      value: { score: 4 },
      schema: {
        fields: {
          score: {
            type: 'number',
            severity: 'warning',
            validate: () => 'A score of 5 or more is recommended'
          }
        }
      }
    });

    expect(screen.getByText('0 errors, 1 warning')).toBeVisible();
    expect(
      screen
        .getAllByRole('status')
        .find((status) =>
          status.textContent?.includes('A score of 5 or more is recommended')
        )
    ).toBeVisible();
    expect(screen.getByRole('spinbutton', { name: 'score' })).toHaveAttribute(
      'aria-invalid',
      'false'
    );
    expect(
      container.querySelector(
        '[data-soe-validation-summary] li[data-severity="warning"]'
      )
    ).toBeInTheDocument();
  });

  it('projects declarative constraints onto standard inputs', () => {
    render(ObjectEditor, {
      value: { quantity: 4, code: 'AB' },
      schema: {
        fields: {
          quantity: { type: 'number', minimum: 1, maximum: 10 },
          code: {
            type: 'string',
            minimumLength: 2,
            maximumLength: 5,
            pattern: /^[A-Z]+$/
          }
        }
      }
    });

    expect(
      screen.getByRole('spinbutton', { name: 'quantity' })
    ).toHaveAttribute('min', '1');
    expect(
      screen.getByRole('spinbutton', { name: 'quantity' })
    ).toHaveAttribute('max', '10');
    expect(screen.getByRole('textbox', { name: 'code' })).toHaveAttribute(
      'minlength',
      '2'
    );
    expect(screen.getByRole('textbox', { name: 'code' })).toHaveAttribute(
      'maxlength',
      '5'
    );
    expect(screen.getByRole('textbox', { name: 'code' })).toHaveAttribute(
      'pattern',
      '^[A-Z]+$'
    );
  });

  it('renders composed custom validation messages', () => {
    const schema = composeObjectSchemas(
      schemaForType('number', {
        minimum: 0,
        messages: { minimum: 'Use a positive number' }
      }),
      {
        fields: {
          discount: {
            maximum: 30,
            messages: { maximum: 'Discount cannot exceed 30%' }
          }
        }
      }
    );

    render(ObjectEditor, {
      value: { amount: -1, discount: 40 },
      schema
    });

    expect(screen.getByText('Use a positive number')).toBeVisible();
    expect(screen.getByText('Discount cannot exceed 30%')).toBeVisible();
  });

  it('reports and resolves missing required properties', async () => {
    const user = userEvent.setup();

    render(ObjectEditorHarness, {
      initial: {},
      schema: {
        fields: {
          name: { required: true, type: 'string' }
        }
      }
    });

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Required properties missing: name'
    );

    await user.click(
      screen.getByRole('button', { name: 'Add property to root' })
    );
    await user.type(
      screen.getByRole('textbox', { name: 'New property name in root' }),
      'name'
    );
    await user.click(screen.getByRole('button', { name: 'Add' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Expected string');

    await user.type(screen.getByRole('textbox', { name: 'name' }), 'Ada');

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(boundValue()).toEqual({ name: 'Ada' });
  });

  it('updates nested required validation through delete and undo', async () => {
    const user = userEvent.setup();

    render(ObjectEditorHarness, {
      initial: { profile: { name: 'Ada' } },
      schema: {
        fields: {
          profile: {
            fields: {
              name: { required: true, type: 'string' }
            }
          }
        }
      }
    });

    await user.click(
      screen.getByRole('button', { name: 'Delete profile.name' })
    );
    await user.click(screen.getByRole('button', { name: 'Confirm delete' }));

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Required properties missing: name'
    );

    await user.click(screen.getByRole('button', { name: 'Undo' }));

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(boundValue()).toEqual({ profile: { name: 'Ada' } });
  });
});
