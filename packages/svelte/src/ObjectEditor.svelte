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
    schemaCapabilityProvider,
    searchObject,
    validateObject,
    ValueHistory,
    type ObjectSchema,
    type ObjectPath,
    type StructuralOperation
  } from '@andreabaldin/soe-core';

  import AddProperty from './AddProperty.svelte';
  import ObjectNode from './ObjectNode.svelte';
  import type {
    ObjectEditorNodeProperties,
    ObjectEditorPlugin
  } from './object-editor-plugin.js';

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
  let searchQuery = $state('');
  let activeResultIndex = $state(0);
  let editorElement: HTMLDivElement;
  const entries = $derived(objectEntries(value));
  const keys = $derived(entries.map((entry) => String(entry.key)));
  const missingRequired = $derived(
    missingRequiredFields(value, schema?.fields)
  );
  const validationIssues = $derived(validateObject(value, schema));
  const validationPaths = $derived(
    validationIssues.map((issue) => issue.formattedPath)
  );
  const pluginHost = $derived(
    createPluginHost<ObjectEditorNodeProperties>({
      properties: {},
      plugins: [{ capabilities: schemaCapabilityProvider }, ...plugins]
    })
  );
  const searchResults = $derived(searchObject(value, searchQuery));
  const matchPaths = $derived(
    searchResults.map((result) => result.formattedPath)
  );
  const activeMatchPath = $derived(
    searchResults[activeResultIndex]?.formattedPath
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

  function update(path: ObjectPath, nextValue: unknown): void {
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

  function moveSearchResult(offset: number): void {
    if (!searchResults.length) return;

    const nextIndex =
      (activeResultIndex + offset + searchResults.length) %
      searchResults.length;
    const targetPath = searchResults[nextIndex]?.formattedPath;
    activeResultIndex = nextIndex;

    queueMicrotask(() => {
      if (!editorElement || !targetPath) return;
      const match = [
        ...editorElement.querySelectorAll<HTMLElement>('[data-soe-path]')
      ].find((element) => element.dataset.soePath === targetPath);
      match?.focus();
      match?.scrollIntoView?.({ block: 'nearest' });
    });
  }

  function focusValidationPath(path: ObjectPath): void {
    const target = [...path];

    queueMicrotask(() => {
      if (!editorElement) return;

      while (target.length) {
        const formatted = formatObjectPath(target);
        const match = [
          ...editorElement.querySelectorAll<HTMLElement>('[data-soe-path]')
        ].find((element) => element.dataset.soePath === formatted);
        if (match) {
          match.focus();
          match.scrollIntoView?.({ block: 'nearest' });
          return;
        }
        target.pop();
      }

      editorElement.focus();
    });
  }

  $effect(() => {
    if (value !== synchronizedValue) {
      history.reset(value);
      synchronizedValue = value;
      historyRevision += 1;
    }
  });

  $effect(() => {
    void searchQuery;
    void searchResults.length;
    activeResultIndex = 0;
  });
</script>

<!-- svelte-ignore a11y_no_noninteractive_element_interactions (shortcuts are delegated from focused descendant controls) -->
<div
  class="object-editor"
  data-soe-editor
  role="group"
  aria-label="Object editor"
  tabindex="-1"
  onkeydown={handleKeydown}
  bind:this={editorElement}
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
  <div class="search-controls" data-soe-search>
    <label>
      <span>Search</span>
      <input
        type="search"
        aria-label="Search object"
        placeholder="Path or value"
        bind:value={searchQuery}
      />
    </label>
    <output aria-live="polite">
      {searchQuery
        ? `${searchResults.length} ${
            searchResults.length === 1 ? 'result' : 'results'
          }`
        : ''}
    </output>
    <button
      type="button"
      aria-label="Previous search result"
      disabled={!searchResults.length}
      onclick={() => moveSearchResult(-1)}>↑</button
    >
    <button
      type="button"
      aria-label="Next search result"
      disabled={!searchResults.length}
      onclick={() => moveSearchResult(1)}>↓</button
    >
  </div>
  {#if validationIssues.length}
    <section
      class="validation-summary"
      aria-label="Validation summary"
      data-soe-validation-summary
    >
      <p>
        {validationIssues.length}
        {validationIssues.length === 1
          ? 'validation issue'
          : 'validation issues'}
      </p>
      <ul>
        {#each validationIssues as issue (issue.formattedPath)}
          <li>
            <button
              type="button"
              onclick={() => focusValidationPath(issue.path)}
            >
              <span>{issue.formattedPath}</span>: {issue.message}
            </button>
          </li>
        {/each}
      </ul>
    </section>
  {/if}
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
        {matchPaths}
        {activeMatchPath}
        searchActive={Boolean(searchQuery)}
        {validationPaths}
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

  .search-controls {
    display: grid;
    grid-template-columns: minmax(10rem, 1fr) auto auto auto;
    gap: 0.35rem;
    align-items: center;
    padding: 0.45rem 0.5rem;
    border-bottom: 1px solid var(--soe-border, #d9dee7);
  }

  .search-controls label {
    display: flex;
    gap: 0.5rem;
    align-items: center;
  }

  .search-controls input {
    box-sizing: border-box;
    width: 100%;
    min-width: 0;
    padding: 0.3rem 0.45rem;
    color: inherit;
    font: inherit;
    background: transparent;
    border: 1px solid var(--soe-border, #d9dee7);
    border-radius: 0.25rem;
  }

  .search-controls output {
    color: var(--soe-muted, #667085);
    font-size: 0.75rem;
  }

  .search-controls button {
    padding: 0.25rem 0.45rem;
    color: var(--soe-muted, #667085);
    font: inherit;
    cursor: pointer;
    background: transparent;
    border: 1px solid transparent;
    border-radius: 0.25rem;
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

  .validation-summary {
    padding: 0.5rem 0.85rem;
    color: var(--soe-error, #b42318);
    font-size: 0.8rem;
    border-bottom: 1px solid var(--soe-border, #d9dee7);
  }

  .validation-summary p,
  .validation-summary ul {
    margin: 0;
  }

  .validation-summary ul {
    padding: 0.25rem 0 0 1rem;
  }

  .validation-summary button {
    padding: 0;
    color: inherit;
    font: inherit;
    text-align: left;
    cursor: pointer;
    background: transparent;
    border: 0;
  }
</style>
