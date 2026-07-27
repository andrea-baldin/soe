<script lang="ts">
  /**
   * ObjectNode renders one path and delegates all mutations to the root.
   */
  import {
    formatObjectPath,
    formatObjectValue,
    isEditableContainer,
    isEditableValue,
    objectEntries,
    objectValueKind,
    type EditableValue,
    type ObjectPath,
    type StructuralOperation
  } from '@soe/core';

  import AddProperty from './AddProperty.svelte';
  import NodeActions from './NodeActions.svelte';
  import ObjectNode from './ObjectNode.svelte';

  type NullReplacementKind = 'boolean' | 'null' | 'number' | 'string';
  type UpdateHandler = (path: ObjectPath, value: EditableValue) => void;
  type OperationHandler = (operation: StructuralOperation) => void;

  let {
    label,
    value,
    path,
    ancestors,
    editorId,
    parentKind,
    siblingIndex,
    siblingCount,
    siblingKeys,
    onupdate,
    onoperation
  }: {
    label: string;
    value: unknown;
    path: ObjectPath;
    ancestors: readonly object[];
    editorId: string;
    parentKind: 'array' | 'object';
    siblingIndex: number;
    siblingCount: number;
    siblingKeys: readonly string[];
    onupdate: UpdateHandler;
    onoperation: OperationHandler;
  } = $props();

  let expanded = $state(true);

  const container = $derived(isEditableContainer(value));
  const circular = $derived(container && ancestors.includes(value as object));
  const entries = $derived.by(() =>
    isEditableContainer(value) && !circular ? objectEntries(value) : []
  );
  const childKeys = $derived(entries.map((entry) => String(entry.key)));
  const nodePath = $derived(formatObjectPath(path));
  const fieldId = $derived(`${editorId}-field-${encodeURIComponent(nodePath)}`);
  const nextAncestors = $derived(
    container ? [...ancestors, value as object] : ancestors
  );

  function update(nextValue: EditableValue): void {
    onupdate(path, nextValue);
  }

  function updateString(event: Event): void {
    update((event.currentTarget as HTMLInputElement).value);
  }

  function updateNumber(event: Event): void {
    const input = event.currentTarget as HTMLInputElement;
    const nextValue = input.valueAsNumber;

    if (Number.isFinite(nextValue)) update(nextValue);
  }

  function restoreNumber(currentValue: number, event: FocusEvent): void {
    const input = event.currentTarget as HTMLInputElement;

    if (!Number.isFinite(input.valueAsNumber)) {
      input.value = String(currentValue);
    }
  }

  function updateBoolean(event: Event): void {
    update((event.currentTarget as HTMLInputElement).checked);
  }

  function replaceNull(event: Event): void {
    const select = event.currentTarget as HTMLSelectElement;
    const kind = select.value as NullReplacementKind;

    switch (kind) {
      case 'boolean':
        update(false);
        break;
      case 'number':
        update(0);
        break;
      case 'string':
        update('');
        break;
      case 'null':
        break;
    }
  }

  function containerSummary(): string {
    if (Array.isArray(value)) return `Array(${value.length})`;
    return `Object(${entries.length})`;
  }

  function entryLabel(key: string | number): string {
    return typeof key === 'number' ? `[${key}]` : key;
  }

  function appendArrayItem(): void {
    onoperation({ type: 'array.append', path });
  }
</script>

<div
  class="object-node"
  data-soe-node
  data-soe-path={nodePath}
  data-soe-kind={objectValueKind(value)}
  data-soe-editable={isEditableValue(value)}
>
  {#if container && !circular}
    <div class="object-field container-field">
      <span class="node-key">{label}</span>
      <button
        type="button"
        class="toggle"
        aria-expanded={expanded}
        aria-controls={`${fieldId}-children`}
        aria-label={`${expanded ? 'Collapse' : 'Expand'} ${nodePath}`}
        onclick={() => (expanded = !expanded)}
      >
        <span aria-hidden="true" class:expanded>›</span>
        {containerSummary()}
      </button>
      <NodeActions
        {path}
        {parentKind}
        {siblingIndex}
        {siblingCount}
        {siblingKeys}
        {onoperation}
      />
    </div>

    {#if expanded}
      <div id={`${fieldId}-children`} class="object-children" data-soe-children>
        {#each entries as entry, index (entry.key)}
          <ObjectNode
            label={entryLabel(entry.key)}
            value={entry.value}
            path={[...path, entry.key]}
            ancestors={nextAncestors}
            {editorId}
            parentKind={Array.isArray(value) ? 'array' : 'object'}
            siblingIndex={index}
            siblingCount={entries.length}
            siblingKeys={childKeys}
            {onupdate}
            {onoperation}
          />
        {:else}
          <p class="empty-container">
            Empty {Array.isArray(value) ? 'array' : 'object'}
          </p>
        {/each}
        {#if Array.isArray(value)}
          <div class="container-add">
            <button
              type="button"
              aria-label={`Append item to ${nodePath}`}
              onclick={appendArrayItem}>+ Item</button
            >
          </div>
        {:else}
          <AddProperty {path} existingKeys={childKeys} {onoperation} />
        {/if}
      </div>
    {/if}
  {:else}
    <div class="object-field">
      <label for={fieldId}>{label}</label>

      {#if circular}
        <output id={fieldId} class="inspection-value" aria-label={nodePath}
          >Circular reference</output
        >
      {:else if isEditableValue(value)}
        {#if value === null}
          <select
            id={fieldId}
            aria-label={nodePath}
            value="null"
            onchange={replaceNull}
          >
            <option value="null">null</option>
            <option value="string">Convert to string</option>
            <option value="number">Convert to number</option>
            <option value="boolean">Convert to boolean</option>
          </select>
        {:else if typeof value === 'boolean'}
          <input
            id={fieldId}
            aria-label={nodePath}
            type="checkbox"
            checked={value}
            onchange={updateBoolean}
          />
        {:else if typeof value === 'number'}
          <input
            id={fieldId}
            aria-label={nodePath}
            type="number"
            step="any"
            {value}
            oninput={updateNumber}
            onblur={(event) => restoreNumber(value, event)}
          />
        {:else}
          <input
            id={fieldId}
            aria-label={nodePath}
            type="text"
            {value}
            oninput={updateString}
          />
        {/if}
      {:else}
        <output
          id={fieldId}
          aria-label={nodePath}
          class="inspection-value"
          title={formatObjectValue(value)}
        >
          {formatObjectValue(value)}
          <span class="kind">{objectValueKind(value)}</span>
        </output>
      {/if}
      <NodeActions
        {path}
        {parentKind}
        {siblingIndex}
        {siblingCount}
        {siblingKeys}
        {onoperation}
      />
    </div>
  {/if}
</div>

<style>
  .object-node {
    min-width: 0;
  }

  .object-field {
    display: grid;
    grid-template-columns:
      minmax(7rem, 0.35fr) minmax(0, 1fr)
      minmax(8rem, auto);
    align-items: center;
    min-height: var(--soe-row-height, 2.75rem);
    border-bottom: 1px solid var(--soe-border, #d9dee7);
  }

  label,
  .node-key {
    min-width: 0;
    padding: 0.7rem 0.85rem;
    overflow: hidden;
    color: var(--soe-muted, #667085);
    text-overflow: ellipsis;
    white-space: nowrap;
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
  select:focus,
  .toggle:focus-visible {
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

  .toggle {
    display: inline-flex;
    gap: 0.45rem;
    align-items: center;
    justify-self: start;
    margin: 0.35rem 0.5rem;
    padding: 0.35rem 0.45rem;
    color: var(--soe-muted, #667085);
    font: inherit;
    cursor: pointer;
    background: transparent;
    border: 1px solid transparent;
    border-radius: 0.25rem;
  }

  .toggle span {
    display: inline-block;
    font-size: 1.1rem;
    transition: transform 120ms ease;
  }

  .toggle span.expanded {
    transform: rotate(90deg);
  }

  .object-children {
    margin-left: var(--soe-indent, 1rem);
    border-left: 1px solid var(--soe-border, #d9dee7);
  }

  .empty-container {
    margin: 0;
    padding: 0.65rem 0.85rem;
    color: var(--soe-muted, #667085);
    border-bottom: 1px solid var(--soe-border, #d9dee7);
  }

  .container-add {
    padding: 0.35rem 0.5rem;
    border-bottom: 1px solid var(--soe-border, #d9dee7);
  }

  .container-add button {
    padding: 0.3rem 0.45rem;
    color: var(--soe-muted, #667085);
    font: inherit;
    cursor: pointer;
    background: transparent;
    border: 1px solid transparent;
    border-radius: 0.25rem;
  }

  .container-add button:focus-visible {
    outline: 2px solid var(--soe-focus-ring, #84adff);
    border-color: var(--soe-focus, #155eef);
  }

  @media (max-width: 40rem) {
    .object-field {
      grid-template-columns: minmax(5rem, 0.35fr) minmax(0, 1fr);
    }

    .object-field :global([data-soe-node-actions]) {
      grid-column: 1 / -1;
    }
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

  @media (prefers-reduced-motion: reduce) {
    .toggle span {
      transition: none;
    }
  }
</style>
