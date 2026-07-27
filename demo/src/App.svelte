<script lang="ts">
  import { ObjectEditor } from '@soe/svelte';
  import type { ObjectEditorPlugin } from '@soe/svelte';
  import type { ObjectSchema } from '@soe/core';

  let value = $state<Record<string, unknown>>({
    age: 36,
    active: true,
    profile: {
      name: 'Ada Lovelace',
      nickname: null,
      birthday: new Date('1815-12-10')
    },
    skills: ['mathematics', 'computing'],
    tags: new Set(['pioneer', 'programmer'])
  });

  const schema: ObjectSchema = {
    fields: {
      age: {
        type: 'number',
        validate: (value) =>
          Number(value) >= 0 ? undefined : 'Age cannot be negative'
      },
      profile: {
        fields: {
          name: {
            required: true,
            type: 'string',
            validate: (value) =>
              String(value).trim() ? undefined : 'Name is required'
          }
        }
      },
      skills: {
        items: { type: 'string' }
      }
    }
  };

  const plugins: readonly ObjectEditorPlugin[] = [
    {
      capabilities: {
        provide: (context) =>
          context.path.join('.') === 'profile.name'
            ? { delete: false, editValue: false, renameKey: false }
            : undefined
      }
    }
  ];
</script>

<svelte:head>
  <title>SOE — Svelte Object Editor</title>
</svelte:head>

<main
  class="min-h-screen bg-slate-100 px-4 py-12 text-slate-900 sm:px-8 sm:py-20"
>
  <div
    class="mx-auto grid w-full max-w-5xl gap-8 md:grid-cols-[minmax(0,1.2fr)_minmax(18rem,0.8fr)]"
  >
    <header class="max-w-3xl md:col-span-2">
      <p
        class="mb-3 text-xs font-bold tracking-[0.12em] text-blue-700 uppercase"
      >
        Svelte Object Editor
      </p>
      <h1
        class="max-w-2xl text-4xl leading-[0.98] font-bold tracking-[-0.055em] sm:text-6xl lg:text-7xl"
      >
        Editing objects should feel like editing text.
      </h1>
      <p class="mt-6 max-w-2xl text-lg leading-7 text-slate-600">
        Edit primitive values, change object structure, and reverse changes with
        undo and redo. Other JavaScript values remain visible and safe to
        inspect.
      </p>
    </header>

    <section aria-labelledby="editor-heading">
      <h2
        id="editor-heading"
        class="mb-3 text-xs font-bold tracking-[0.08em] uppercase"
      >
        Object editor
      </h2>
      <div
        class="[--soe-border:var(--color-slate-300)] [--soe-focus:var(--color-blue-600)] [--soe-focus-ring:var(--color-blue-300)] [--soe-radius:var(--radius-lg)]"
      >
        <ObjectEditor bind:value {schema} {plugins} />
      </div>
    </section>

    <section aria-labelledby="value-heading">
      <h2
        id="value-heading"
        class="mb-3 text-xs font-bold tracking-[0.08em] uppercase"
      >
        Bound value
      </h2>
      <pre
        class="min-h-full overflow-auto rounded-lg bg-slate-900 p-4 font-mono text-sm leading-6 text-blue-100">{JSON.stringify(
          value,
          null,
          2
        )}</pre>
    </section>
  </div>
</main>
