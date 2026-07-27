<script lang="ts">
  /**
   * ObjectEditor renders editable primitives and safe inspection fallbacks.
   */
  import {
    formatObjectValue,
    isEditableValue,
    objectValueKind,
    type EditableValue
  } from '@soe/core';

  type ObjectRecord = Record<string, unknown>;

  let { value = $bindable() }: { value: ObjectRecord } = $props();

  const entries = $derived(Object.entries(value));

  function update(key: string, nextValue: EditableValue): void {
    value = { ...value, [key]: nextValue };
  }

  function updateString(key: string, event: Event): void {
    update(key, (event.currentTarget as HTMLInputElement).value);
  }

  function updateNumber(key: string, event: Event): void {
    const input = event.currentTarget as HTMLInputElement;
    const nextValue = input.valueAsNumber;

    if (!Number.isNaN(nextValue)) update(key, nextValue);
  }

  function updateBoolean(key: string, event: Event): void {
    update(key, (event.currentTarget as HTMLInputElement).checked);
  }
</script>

<div class="object-editor" data-soe-editor>
  {#each entries as [key, currentValue] (key)}
    <div
      class="object-field"
      data-soe-field
      data-soe-kind={objectValueKind(currentValue)}
      data-soe-editable={isEditableValue(currentValue)}
    >
      <label for={`soe-${key}`}>{key}</label>

      {#if isEditableValue(currentValue)}
        {#if typeof currentValue === 'boolean'}
          <input
            id={`soe-${key}`}
            type="checkbox"
            checked={currentValue}
            onchange={(event) => updateBoolean(key, event)}
          />
        {:else if typeof currentValue === 'number'}
          <input
            id={`soe-${key}`}
            type="number"
            value={currentValue}
            oninput={(event) => updateNumber(key, event)}
          />
        {:else}
          <input
            id={`soe-${key}`}
            type="text"
            value={currentValue}
            oninput={(event) => updateString(key, event)}
          />
        {/if}
      {:else}
        <output
          id={`soe-${key}`}
          class="inspection-value"
          title={formatObjectValue(currentValue)}
        >
          {formatObjectValue(currentValue)}
          <span class="kind">{objectValueKind(currentValue)}</span>
        </output>
      {/if}
    </div>
  {:else}
    <p class="empty-state">Empty object</p>
  {/each}
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

  .object-field {
    display: grid;
    grid-template-columns: minmax(7rem, 0.4fr) minmax(0, 1fr);
    align-items: center;
    min-height: var(--soe-row-height, 2.75rem);
    border-bottom: 1px solid var(--soe-border, #d9dee7);
  }

  .object-field:last-child {
    border-bottom: 0;
  }

  label {
    padding: 0.7rem 0.85rem;
    color: var(--soe-muted, #667085);
  }

  input[type='text'],
  input[type='number'] {
    box-sizing: border-box;
    width: calc(100% - 1rem);
    min-width: 0;
    margin: 0.35rem 0.5rem;
    padding: 0.35rem 0.45rem;
    color: inherit;
    font: inherit;
    background: transparent;
    border: 1px solid transparent;
    border-radius: 0.25rem;
  }

  input[type='text']:focus,
  input[type='number']:focus {
    outline: 2px solid var(--soe-focus-ring, #84adff);
    border-color: var(--soe-focus, #155eef);
  }

  input[type='checkbox'] {
    width: 1rem;
    height: 1rem;
    margin-left: 0.85rem;
    accent-color: var(--soe-focus, #155eef);
  }

  .inspection-value {
    min-width: 0;
    padding: 0.7rem 0.85rem;
    overflow: hidden;
    color: var(--soe-muted, #667085);
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .kind {
    margin-left: 0.5rem;
    font-size: 0.75rem;
    opacity: 0.6;
  }

  .empty-state {
    margin: 0;
    padding: 1rem;
    color: var(--soe-muted, #667085);
    text-align: center;
  }
</style>
