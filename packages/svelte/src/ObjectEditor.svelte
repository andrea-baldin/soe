<script lang="ts">
  /**
   * ObjectEditor owns the bound root while nodes render paths recursively.
   */
  import {
    applyStructuralOperation,
    createPluginHost,
    formatObjectPath,
    missingRequiredFields,
    objectEntries,
    replaceValueAtPath,
    ValueHistory,
    type EditableValue,
    type ObjectSchema,
    type ObjectPath,
    type StructuralOperation
  } from '@soe/core';

  import AddProperty from './AddProperty.svelte';
  import ObjectNode from './ObjectNode.svelte';
  import type { ObjectEditorPlugin } from './object-editor-plugin.js';

  type ObjectRecord = Record<string, unknown>;

  let {
    value = $bindable(),
    schema,
    plugins = []
  }: {
    value: ObjectRecord;
    schema?: ObjectSchema;
    plugins?: readonly ObjectEditorPlugin[];
  } = $props();

  const editorId = $props.id();
  const history = new ValueHistory(value);
  let synchronizedValue = value;
  let historyRevision = $state(0);
  const entries = $derived(objectEntries(value));
  const keys = $derived(entries.map((entry) => String(entry.key)));
  const missingRequired = $derived(
    missingRequiredFields(value, schema?.fields)
  );
  const pluginHost = $derived(
    createPluginHost({
      properties: {},
      plugins
    })
  );
  const rootCapabilities = $derived(
    pluginHost.resolve({
      root: value,
      value,
      parent: undefined,
      path: []
    }).context.capabilities
  );
  const canUndo = $derived.by(() => {
    void historyRevision;
    return history.canUndo;
  });
  const canRedo = $derived.by(() => {
    void historyRevision;
    return history.canRedo;
  });

  function update(path: ObjectPath, nextValue: EditableValue): void {
    commit(replaceValueAtPath(value, path, nextValue), formatObjectPath(path));
  }

  function operate(operation: StructuralOperation): void {
    commit(applyStructuralOperation(value, operation));
  }

  function commit(nextValue: ObjectRecord, group?: string): void {
    if (Object.is(nextValue, value)) return;

    history.record(nextValue, group);
    synchronizedValue = nextValue;
    value = nextValue;
    historyRevision += 1;
  }

  function undo(): void {
    if (!history.canUndo) return;

    synchronizedValue = history.undo();
    value = synchronizedValue;
    historyRevision += 1;
  }

  function redo(): void {
    if (!history.canRedo) return;

    synchronizedValue = history.redo();
    value = synchronizedValue;
    historyRevision += 1;
  }

  function handleKeydown(event: KeyboardEvent): void {
    const modifier = event.ctrlKey || event.metaKey;
    if (!modifier || event.altKey) return;

    const key = event.key.toLowerCase();
    if (key === 'y' && !event.shiftKey) {
      event.preventDefault();
      redo();
      return;
    }
    if (key !== 'z') return;

    event.preventDefault();
    if (event.shiftKey) {
      redo();
    } else {
      undo();
    }
  }

  function entryLabel(key: string | number): string {
    return typeof key === 'number' ? `[${key}]` : key;
  }

  $effect(() => {
    if (value !== synchronizedValue) {
      history.reset(value);
      synchronizedValue = value;
      historyRevision += 1;
    }
  });
</script>

<!-- svelte-ignore a11y_no_noninteractive_element_interactions (shortcuts are delegated from focused descendant controls) -->
<div
  class="object-editor"
  data-soe-editor
  role="group"
  aria-label="Object editor"
  onkeydown={handleKeydown}
>
  <div class="history-controls" data-soe-history>
    <button
      type="button"
      onclick={undo}
      disabled={!canUndo}
      aria-label="Undo"
      aria-keyshortcuts="Control+Z Meta+Z">Undo</button
    >
    <button
      type="button"
      onclick={redo}
      disabled={!canRedo}
      aria-label="Redo"
      aria-keyshortcuts="Control+Shift+Z Meta+Shift+Z Control+Y Meta+Y"
      >Redo</button
    >
  </div>
  {#if missingRequired.length}
    <p class="schema-error" role="alert" data-soe-required>
      Required properties missing: {missingRequired.join(', ')}
    </p>
  {/if}
  <div class="object-content">
    {#each entries as entry, index (entry.key)}
      <ObjectNode
        label={entryLabel(entry.key)}
        value={entry.value}
        path={[entry.key]}
        ancestors={[value]}
        {editorId}
        siblingIndex={index}
        siblingCount={entries.length}
        siblingKeys={keys}
        root={value}
        parentValue={value}
        fieldSchema={schema?.fields[String(entry.key)]}
        {pluginHost}
        onupdate={update}
        onoperation={operate}
      />
    {:else}
      <p class="empty-state">Empty object</p>
    {/each}
    {#if rootCapabilities.insert}
      <AddProperty path={[]} existingKeys={keys} onoperation={operate} />
    {/if}
  </div>
</div>

<style>
  .object-editor {
    box-sizing: border-box;
    display: grid;
    width: 100%;
    color: var(--soe-text, #172033);
    overflow: hidden;
    background: var(--soe-surface, #ffffff);
    border: 1px solid var(--soe-border, #d9dee7);
    border-radius: var(--soe-radius, 0.5rem);
    font:
      0.925rem/1.4 ui-monospace,
      SFMono-Regular,
      Menlo,
      Monaco,
      Consolas,
      monospace;
  }

  .empty-state {
    margin: 0;
    padding: 1rem;
    color: var(--soe-muted, #667085);
    text-align: center;
  }

  .history-controls {
    display: flex;
    gap: 0.25rem;
    justify-content: flex-end;
    padding: 0.35rem 0.5rem;
    border-bottom: 1px solid var(--soe-border, #d9dee7);
  }

  .history-controls button {
    padding: 0.25rem 0.45rem;
    color: var(--soe-muted, #667085);
    font: inherit;
    font-size: 0.8rem;
    cursor: pointer;
    background: transparent;
    border: 1px solid transparent;
    border-radius: 0.25rem;
  }

  .history-controls button:hover:not(:disabled) {
    border-color: var(--soe-border, #d9dee7);
  }

  .history-controls button:focus-visible {
    outline: 2px solid var(--soe-focus-ring, #84adff);
    border-color: var(--soe-focus, #155eef);
  }

  .history-controls button:disabled {
    cursor: not-allowed;
    opacity: 0.35;
  }

  .schema-error {
    margin: 0;
    padding: 0.5rem 0.85rem;
    color: var(--soe-error, #b42318);
    font-size: 0.8rem;
    border-bottom: 1px solid var(--soe-border, #d9dee7);
  }
</style>
