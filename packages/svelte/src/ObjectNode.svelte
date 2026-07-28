<script lang="ts">
  /**
   * ObjectNode renders one path and delegates all mutations to the root.
   */
  import {
    formatObjectPath,
    formatObjectValue,
    inspectionEntries,
    isEditableContainer,
    isInspectableContainer,
    missingRequiredFields,
    objectEntries,
    objectValueKind,
    validateField,
    type EditableValue,
    type FieldSchema,
    type ObjectPath,
    type PluginHost,
    type StructuralOperation
  } from '@soe/core';

  import AddProperty from './AddProperty.svelte';
  import NodeActions from './NodeActions.svelte';
  import type { ObjectEditorNodeProperties } from './object-editor-plugin.js';
  import ObjectNode from './ObjectNode.svelte';

  type NullReplacementKind = 'boolean' | 'null' | 'number' | 'string';
  type UpdateHandler = (path: ObjectPath, value: unknown) => void;
  type OperationHandler = (operation: StructuralOperation) => void;

  let {
    label,
    value,
    path,
    ancestors,
    editorId,
    siblingIndex,
    siblingCount,
    siblingKeys,
    root,
    parentValue,
    fieldSchema,
    pluginHost,
    inspectOnly = false,
    matchPaths,
    activeMatchPath,
    searchActive,
    onupdate,
    onoperation
  }: {
    label: string;
    value: unknown;
    path: ObjectPath;
    ancestors: readonly object[];
    editorId: string;
    siblingIndex: number;
    siblingCount: number;
    siblingKeys: readonly string[];
    root: unknown;
    parentValue: unknown;
    fieldSchema?: FieldSchema;
    pluginHost: PluginHost<ObjectEditorNodeProperties>;
    inspectOnly?: boolean;
    matchPaths: readonly string[];
    activeMatchPath?: string;
    searchActive: boolean;
    onupdate: UpdateHandler;
    onoperation: OperationHandler;
  } = $props();

  let expanded = $state(true);

  const editableContainer = $derived(isEditableContainer(value));
  const inspectionContainer = $derived(
    !editableContainer && isInspectableContainer(value)
  );
  const container = $derived(editableContainer || inspectionContainer);
  const circular = $derived(container && ancestors.includes(value as object));
  const entries = $derived.by(() =>
    !circular
      ? editableContainer
        ? objectEntries(value as Record<string, unknown> | readonly unknown[])
        : inspectionEntries(value)
      : []
  );
  const childKeys = $derived(entries.map((entry) => String(entry.key)));
  const nodePath = $derived(formatObjectPath(path));
  const matched = $derived(matchPaths.includes(nodePath));
  const activeMatch = $derived(activeMatchPath === nodePath);
  const containsMatch = $derived(
    matchPaths.some(
      (match) =>
        match === nodePath ||
        match.startsWith(`${nodePath}.`) ||
        match.startsWith(`${nodePath}[`)
    )
  );
  const fieldId = $derived(`${editorId}-field-${encodeURIComponent(nodePath)}`);
  const validationId = $derived(`${fieldId}-validation`);
  const descriptionId = $derived(`${fieldId}-description`);
  const schemaType = $derived(fieldSchema?.type);
  const validationMessage = $derived(
    validateField(value, fieldSchema, { path, root })
  );
  const missingRequired = $derived(
    Array.isArray(value)
      ? []
      : missingRequiredFields(value, fieldSchema?.fields)
  );
  const nodeValidationMessage = $derived(
    [
      validationMessage,
      missingRequired.length
        ? `Required properties missing: ${missingRequired.join(', ')}`
        : undefined
    ]
      .filter(Boolean)
      .join('. ')
  );
  const nodeResolution = $derived(
    pluginHost.resolve({
      root,
      value,
      parent: parentValue,
      path,
      schema: fieldSchema
    })
  );
  const nodeContext = $derived(nodeResolution.context);
  const properties = $derived(nodeResolution.properties);
  const CustomEditor = $derived(properties.editor);
  const displayLabel = $derived(properties.label ?? label);
  const description = $derived(properties.description);
  const capabilities = $derived(
    inspectOnly || inspectionContainer
      ? {
          ...nodeContext.capabilities,
          delete: false,
          editValue: false,
          insert: false,
          move: false,
          paste: false,
          renameKey: false
        }
      : nodeContext.capabilities
  );
  const editable = $derived(capabilities.editValue);
  const nextAncestors = $derived(
    container ? [...ancestors, value as object] : ancestors
  );

  $effect(() => {
    if (searchActive && containsMatch && container && !circular) {
      expanded = true;
    }
  });

  function update(nextValue: EditableValue): void {
    onupdate(path, nextValue);
  }

  function updateString(event: Event): void {
    update((event.currentTarget as HTMLInputElement).value);
  }

  function stringEditorValue(): string {
    if (typeof value === 'string') return value;
    if (value === null || value === undefined) return '';

    try {
      return String(value);
    } catch {
      return '';
    }
  }

  function updateNumber(event: Event): void {
    const input = event.currentTarget as HTMLInputElement;
    const nextValue = input.valueAsNumber;

    if (Number.isFinite(nextValue)) update(nextValue);
  }

  function restoreNumber(
    currentValue: number | undefined,
    event: FocusEvent
  ): void {
    const input = event.currentTarget as HTMLInputElement;

    if (!Number.isFinite(input.valueAsNumber)) {
      input.value = currentValue === undefined ? '' : String(currentValue);
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
    if (editableContainer) return `Object(${entries.length})`;
    return formatObjectValue(value);
  }

  function entryLabel(key: string | number): string {
    return typeof key === 'number' ? `[${key}]` : key;
  }

  function appendArrayItem(): void {
    onoperation({ type: 'array.append', path });
  }

  function childSchema(key: string | number): FieldSchema | undefined {
    return typeof key === 'number'
      ? fieldSchema?.items
      : fieldSchema?.fields?.[key];
  }
</script>

<div
  class="object-node"
  role="group"
  aria-label={`Node ${nodePath}`}
  data-soe-node
  data-soe-path={nodePath}
  data-soe-kind={schemaType ?? objectValueKind(value)}
  data-soe-editable={editable}
  data-soe-valid={!nodeValidationMessage}
  data-soe-match={matched || undefined}
  data-soe-active-match={activeMatch || undefined}
  tabindex="-1"
>
  {#if container && !circular}
    <div class="object-field container-field">
      <span class="node-key">{displayLabel}</span>
      <button
        type="button"
        class="toggle"
        aria-expanded={expanded}
        aria-controls={`${fieldId}-children`}
        aria-label={`${expanded ? 'Collapse' : 'Expand'} ${nodePath}`}
        aria-describedby={[
          description ? descriptionId : undefined,
          nodeValidationMessage ? validationId : undefined
        ]
          .filter(Boolean)
          .join(' ') || undefined}
        onclick={() => (expanded = !expanded)}
      >
        <span aria-hidden="true" class:expanded>›</span>
        {containerSummary()}
      </button>
      <NodeActions
        {path}
        {value}
        {capabilities}
        {siblingIndex}
        {siblingCount}
        {siblingKeys}
        {onoperation}
        onpaste={onupdate}
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
            siblingIndex={index}
            siblingCount={entries.length}
            siblingKeys={childKeys}
            {root}
            parentValue={value}
            fieldSchema={childSchema(entry.key)}
            {pluginHost}
            inspectOnly={inspectOnly || !editableContainer}
            {matchPaths}
            {activeMatchPath}
            {searchActive}
            {onupdate}
            {onoperation}
          />
        {:else}
          <p class="empty-container">
            Empty {Array.isArray(value) ? 'array' : 'object'}
          </p>
        {/each}
        {#if Array.isArray(value) && capabilities.insert}
          <div class="container-add">
            <button
              type="button"
              aria-label={`Append item to ${nodePath}`}
              onclick={appendArrayItem}>+ Item</button
            >
          </div>
        {:else if !Array.isArray(value) && capabilities.insert}
          <AddProperty {path} existingKeys={childKeys} {onoperation} />
        {/if}
      </div>
    {/if}
    {#if nodeValidationMessage}
      <p id={validationId} class="validation-error" role="alert">
        {nodeValidationMessage}
      </p>
    {/if}
    {#if description}
      <p id={descriptionId} class="node-description">{description}</p>
    {/if}
  {:else}
    <div class="object-field">
      <label for={fieldId}>{displayLabel}</label>

      {#if circular}
        <output id={fieldId} class="inspection-value" aria-label={nodePath}
          >Circular reference</output
        >
      {:else if editable}
        {#if CustomEditor}
          <div
            id={fieldId}
            class="custom-editor"
            aria-describedby={[
              description ? descriptionId : undefined,
              validationMessage ? validationId : undefined
            ]
              .filter(Boolean)
              .join(' ') || undefined}
          >
            <CustomEditor
              context={nodeContext}
              commit={(replacement) => onupdate(path, replacement)}
            />
          </div>
        {:else if !schemaType && value === null}
          <select
            id={fieldId}
            aria-label={nodePath}
            aria-invalid={Boolean(validationMessage)}
            aria-describedby={[
              description ? descriptionId : undefined,
              validationMessage ? validationId : undefined
            ]
              .filter(Boolean)
              .join(' ') || undefined}
            value="null"
            onchange={replaceNull}
          >
            <option value="null">null</option>
            <option value="string">Convert to string</option>
            <option value="number">Convert to number</option>
            <option value="boolean">Convert to boolean</option>
          </select>
        {:else if schemaType === 'boolean' || (!schemaType && typeof value === 'boolean')}
          <input
            id={fieldId}
            aria-label={nodePath}
            type="checkbox"
            checked={value === true}
            aria-invalid={Boolean(validationMessage)}
            aria-describedby={[
              description ? descriptionId : undefined,
              validationMessage ? validationId : undefined
            ]
              .filter(Boolean)
              .join(' ') || undefined}
            onchange={updateBoolean}
          />
        {:else if schemaType === 'number' || (!schemaType && typeof value === 'number')}
          <input
            id={fieldId}
            aria-label={nodePath}
            type="number"
            step="any"
            value={typeof value === 'number' && Number.isFinite(value)
              ? value
              : ''}
            aria-invalid={Boolean(validationMessage)}
            aria-describedby={[
              description ? descriptionId : undefined,
              validationMessage ? validationId : undefined
            ]
              .filter(Boolean)
              .join(' ') || undefined}
            oninput={updateNumber}
            onblur={(event) =>
              restoreNumber(
                typeof value === 'number' && Number.isFinite(value)
                  ? value
                  : undefined,
                event
              )}
          />
        {:else}
          <input
            id={fieldId}
            aria-label={nodePath}
            type="text"
            value={stringEditorValue()}
            aria-invalid={Boolean(validationMessage)}
            aria-describedby={[
              description ? descriptionId : undefined,
              validationMessage ? validationId : undefined
            ]
              .filter(Boolean)
              .join(' ') || undefined}
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
        {value}
        {capabilities}
        {siblingIndex}
        {siblingCount}
        {siblingKeys}
        {onoperation}
        onpaste={onupdate}
      />
    </div>
    {#if description}
      <p id={descriptionId} class="node-description">{description}</p>
    {/if}
    {#if validationMessage}
      <p id={validationId} class="validation-error" role="alert">
        {validationMessage}
      </p>
    {/if}
  {/if}
</div>

<style>
  .object-node {
    min-width: 0;
  }

  .object-node[data-soe-match='true'] > .object-field {
    background: var(--soe-match, #fff4cc);
  }

  .object-node[data-soe-active-match='true'] > .object-field {
    outline: 2px solid var(--soe-focus, #155eef);
    outline-offset: -2px;
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

  .custom-editor {
    min-width: 0;
    margin: 0.35rem 0.5rem;
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

  .validation-error {
    margin: 0;
    padding: 0.25rem 0.85rem 0.45rem;
    color: var(--soe-error, #b42318);
    font-size: 0.8rem;
    border-bottom: 1px solid var(--soe-border, #d9dee7);
  }

  .node-description {
    margin: 0;
    padding: 0.35rem 0.85rem;
    color: var(--soe-muted, #667085);
    font-size: 0.75rem;
    border-bottom: 1px solid var(--soe-border, #d9dee7);
  }

  input[aria-invalid='true'],
  select[aria-invalid='true'] {
    border-color: var(--soe-error, #b42318);
  }

  @media (prefers-reduced-motion: reduce) {
    .toggle span {
      transition: none;
    }
  }
</style>
