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
  type NullReplacementKind = 'boolean' | 'null' | 'number' | 'string';

  let { value = $bindable() }: { value: ObjectRecord } = $props();

  const editorId = $props.id();
  const entries = $derived(Object.entries(value));

  function update(key: string, nextValue: EditableValue): void {
    value = { ...value, [key]: nextValue };
  }

  function fieldId(index: number): string {
    return `${editorId}-field-${index}`;
  }

  function updateString(key: string, event: Event): void {
    update(key, (event.currentTarget as HTMLInputElement).value);
  }

  function updateNumber(key: string, event: Event): void {
    const input = event.currentTarget as HTMLInputElement;
    const nextValue = input.valueAsNumber;

    if (Number.isFinite(nextValue)) update(key, nextValue);
  }

  function restoreNumber(currentValue: number, event: FocusEvent): void {
    const input = event.currentTarget as HTMLInputElement;

    if (!Number.isFinite(input.valueAsNumber)) {
      input.value = String(currentValue);
    }
  }

  function updateBoolean(key: string, event: Event): void {
    update(key, (event.currentTarget as HTMLInputElement).checked);
  }

  function replaceNull(key: string, event: Event): void {
    const select = event.currentTarget as HTMLSelectElement;
    const kind = select.value as NullReplacementKind;

    switch (kind) {
      case 'boolean':
        update(key, false);
        break;
      case 'number':
        update(key, 0);
        break;
      case 'string':
        update(key, '');
        break;
      case 'null':
        break;
    }
  }
</script>

<div class="object-editor" data-soe-editor>
  {#each entries as [key, currentValue], index (key)}
    <div
      class="object-field"
      data-soe-field
      data-soe-kind={objectValueKind(currentValue)}
      data-soe-editable={isEditableValue(currentValue)}
    >
      <label for={fieldId(index)}>{key}</label>

      {#if isEditableValue(currentValue)}
        {#if currentValue === null}
          <select
            id={fieldId(index)}
            value="null"
            onchange={(event) => replaceNull(key, event)}
          >
            <option value="null">null</option>
            <option value="string">Convert to string</option>
            <option value="number">Convert to number</option>
            <option value="boolean">Convert to boolean</option>
          </select>
        {:else if typeof currentValue === 'boolean'}
          <input
            id={fieldId(index)}
            type="checkbox"
            checked={currentValue}
            onchange={(event) => updateBoolean(key, event)}
          />
        {:else if typeof currentValue === 'number'}
          <input
            id={fieldId(index)}
            type="number"
            step="any"
            value={currentValue}
            oninput={(event) => updateNumber(key, event)}
            onblur={(event) => restoreNumber(currentValue, event)}
          />
        {:else}
          <input
            id={fieldId(index)}
            type="text"
            value={currentValue}
            oninput={(event) => updateString(key, event)}
          />
        {/if}
      {:else}
        <output
          id={fieldId(index)}
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
  input[type='number'],
  select {
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
  input[type='number']:focus,
  select:focus {
    outline: 2px solid var(--soe-focus-ring, #84adff);
    border-color: var(--soe-focus, #155eef);
  }

  input[type='checkbox'] {
    width: 1rem;
    height: 1rem;
    margin-left: 0.85rem;
    accent-color: var(--soe-focus, #155eef);
  }

  select {
    appearance: auto;
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
