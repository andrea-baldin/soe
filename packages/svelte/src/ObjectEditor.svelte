<script lang="ts">
  /**
   * ObjectEditor owns the bound root while nodes render paths recursively.
   */
  import {
    applyObjectReplacements,
    applyStructuralOperation,
    createPluginHost,
    formatObjectPath,
    hasAsyncValidation,
    mergeValidationIssues,
    missingRequiredFields,
    objectEntries,
    planObjectReplacements,
    replaceValueAtPath,
    resolveFieldSchema,
    schemaCapabilityProvider,
    searchObject,
    validateObject,
    validateObjectAsync,
    valueAtPath,
    ValueHistory,
    type ObjectSchema,
    type ObjectPath,
    type ObjectSearchMode,
    type ObjectSearchScope,
    type ObjectSearchValidationFilter,
    type ObjectValueKind,
    type StructuralOperation,
    type ValidationIssue,
    type ValidationIssueInput
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
    diagnostics = [],
    plugins = []
  }: {
    value: ObjectRecord;
    schema?: ObjectSchema;
    diagnostics?: readonly ValidationIssueInput[];
    plugins?: readonly ObjectEditorPlugin[];
  } = $props();

  const editorId = $props.id();
  const history = new ValueHistory(value);
  let synchronizedValue = value;
  let historyRevision = $state(0);
  let searchQuery = $state('');
  let searchMode = $state<ObjectSearchMode>('contains');
  let searchScope = $state<ObjectSearchScope>('all');
  let searchValidation = $state<ObjectSearchValidationFilter>('all');
  let searchKind = $state<ObjectValueKind | 'all'>('all');
  let searchAdvanced = $state(false);
  let replacementValue = $state('');
  let asyncValidationIssues = $state<readonly ValidationIssue[]>([]);
  let validationPending = $state(false);
  let activeResultIndex = $state(0);
  let editorElement: HTMLDivElement;
  const entries = $derived(objectEntries(value));
  const keys = $derived(entries.map((entry) => String(entry.key)));
  const rootSchema = $derived(resolveFieldSchema(schema, value, value, []));
  const missingRequired = $derived(
    missingRequiredFields(value, rootSchema?.fields)
  );
  const missingRequiredHasError = $derived(
    missingRequired.some(
      (key) => rootSchema?.fields?.[key]?.severity !== 'warning'
    )
  );
  const validationIssues = $derived(
    mergeValidationIssues(
      validateObject(value, schema),
      asyncValidationIssues,
      diagnostics
    )
  );
  const validationErrors = $derived(
    validationIssues.filter((issue) => issue.severity === 'error')
  );
  const validationWarnings = $derived(
    validationIssues.filter((issue) => issue.severity === 'warning')
  );
  const validationPaths = $derived(
    validationIssues.map((issue) => issue.formattedPath)
  );
  const validationErrorPaths = $derived(
    validationIssues
      .filter((issue) => issue.severity === 'error')
      .map((issue) => issue.formattedPath)
  );
  const pluginHost = $derived(
    createPluginHost<ObjectEditorNodeProperties>({
      properties: {},
      plugins: [{ capabilities: schemaCapabilityProvider }, ...plugins]
    })
  );
  const searchResults = $derived(
    searchObject(value, {
      query: searchQuery,
      mode: searchMode,
      scope: searchScope,
      kinds: searchKind === 'all' ? undefined : [searchKind],
      validation: searchValidation,
      validationIssues
    })
  );
  const replacementPlan = $derived(
    planObjectReplacements(
      value,
      searchResults,
      searchQuery,
      replacementValue,
      { canReplace: canReplaceResult }
    )
  );
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
      path: [],
      schema: rootSchema
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

  function entrySchema(key: string | number, entryValue: unknown) {
    return resolveFieldSchema(schema, value, entryValue, [key], rootSchema);
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

  function schemaAtPath(path: ObjectPath) {
    let parent = rootSchema;
    for (let length = 1; length <= path.length; length += 1) {
      const currentPath = path.slice(0, length);
      parent = resolveFieldSchema(
        schema,
        value,
        valueAtPath(value, currentPath),
        currentPath,
        parent
      );
    }
    return parent;
  }

  function canReplaceResult(result: (typeof searchResults)[number]): boolean {
    if (typeof result.value !== 'string') return false;
    const parentPath = result.path.slice(0, -1);
    return pluginHost.resolve({
      root: value,
      value: result.value,
      parent:
        result.path.length > 0 ? valueAtPath(value, parentPath) : undefined,
      path: result.path,
      schema: schemaAtPath(result.path)
    }).context.capabilities.editValue;
  }

  function replaceCurrentResult(): void {
    const current = searchResults[activeResultIndex];
    if (!current) return;
    const plan = planObjectReplacements(
      value,
      [current],
      searchQuery,
      replacementValue,
      { canReplace: canReplaceResult }
    );
    if (!plan.length) return;
    commit(applyObjectReplacements(value, plan), 'search-replace');
  }

  function replaceAllResults(): void {
    if (!replacementPlan.length) return;
    commit(applyObjectReplacements(value, replacementPlan), 'search-replace');
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
    const currentValue = value;
    const currentSchema = schema;

    if (!hasAsyncValidation(currentSchema)) {
      asyncValidationIssues = [];
      validationPending = false;
      return;
    }

    const controller = new AbortController();
    asyncValidationIssues = [];
    validationPending = true;
    void validateObjectAsync(currentValue, currentSchema, {
      signal: controller.signal
    }).then((issues) => {
      if (controller.signal.aborted) return;
      asyncValidationIssues = issues;
      validationPending = false;
    });

    return () => controller.abort();
  });

  $effect(() => {
    void searchQuery;
    void searchMode;
    void searchScope;
    void searchValidation;
    void searchKind;
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
  <details
    class="search-advanced"
    data-soe-search-advanced
    bind:open={searchAdvanced}
  >
    <summary>Search and replace</summary>
    {#if searchAdvanced}
      <div class="search-options">
        <label>
          <span>Scope</span>
          <select aria-label="Search scope" bind:value={searchScope}>
            <option value="all">Path and value</option>
            <option value="path">Path only</option>
            <option value="value">Value only</option>
          </select>
        </label>
        <label>
          <span>Type</span>
          <select aria-label="Search type" bind:value={searchKind}>
            <option value="all">All types</option>
            <option value="string">String</option>
            <option value="number">Number</option>
            <option value="boolean">Boolean</option>
            <option value="null">Null</option>
          </select>
        </label>
        <label>
          <span>Validation</span>
          <select aria-label="Search validation" bind:value={searchValidation}>
            <option value="all">All values</option>
            <option value="issues">Any issue</option>
            <option value="errors">Errors only</option>
            <option value="warnings">Warnings only</option>
          </select>
        </label>
        <label class="fuzzy-option">
          <input
            type="checkbox"
            aria-label="Fuzzy search"
            checked={searchMode === 'fuzzy'}
            onchange={(event) =>
              (searchMode = event.currentTarget.checked ? 'fuzzy' : 'contains')}
          />
          <span>Fuzzy</span>
        </label>
      </div>
      <div class="replace-controls">
        <label>
          <span>Replace with</span>
          <input
            type="text"
            aria-label="Replacement value"
            bind:value={replacementValue}
          />
        </label>
        <output aria-live="polite">
          {searchQuery
            ? `${replacementPlan.length} ${
                replacementPlan.length === 1 ? 'replacement' : 'replacements'
              } available`
            : ''}
        </output>
        <button
          type="button"
          onclick={replaceCurrentResult}
          disabled={!searchResults[activeResultIndex] ||
            !replacementPlan.some(
              (replacement) => replacement.formattedPath === activeMatchPath
            )}
        >
          Replace current
        </button>
        <button
          type="button"
          onclick={replaceAllResults}
          disabled={!replacementPlan.length}
        >
          Replace all
        </button>
      </div>
      {#if replacementPlan.length}
        <ul class="replacement-preview" aria-label="Replacement preview">
          {#each replacementPlan.slice(0, 5) as replacement (replacement.formattedPath)}
            <li>
              <span>{replacement.formattedPath}</span>:
              <del>{replacement.previousValue}</del>
              <span aria-hidden="true">→</span>
              <ins>{replacement.nextValue}</ins>
            </li>
          {/each}
        </ul>
      {/if}
    {/if}
  </details>
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
      <p class="validation-counts">
        {validationErrors.length}
        {validationErrors.length === 1 ? 'error' : 'errors'},
        {validationWarnings.length}
        {validationWarnings.length === 1 ? 'warning' : 'warnings'}
      </p>
      <ul>
        {#each validationIssues as issue, index (`${issue.formattedPath}:${issue.code}:${index}`)}
          <li data-severity={issue.severity}>
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
  {#if validationPending}
    <p
      class="validation-pending"
      role="status"
      aria-live="polite"
      data-soe-validation-pending
    >
      Validating…
    </p>
  {/if}
  {#if missingRequired.length}
    <p
      class:schema-error={missingRequiredHasError}
      class:schema-warning={!missingRequiredHasError}
      role={missingRequiredHasError ? 'alert' : 'status'}
      data-soe-required
    >
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
        parentSchema={rootSchema}
        fieldSchema={entrySchema(entry.key, entry.value)}
        objectSchema={schema}
        {pluginHost}
        {matchPaths}
        {activeMatchPath}
        searchActive={Boolean(searchQuery)}
        {validationPaths}
        {validationErrorPaths}
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

  .search-advanced {
    padding: 0.45rem 0.5rem;
    color: var(--soe-muted, #667085);
    font-size: 0.8rem;
    border-bottom: 1px solid var(--soe-border, #d9dee7);
  }

  .search-advanced summary {
    cursor: pointer;
    user-select: none;
  }

  .search-options,
  .replace-controls {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 0.5rem;
    align-items: end;
    margin-top: 0.5rem;
  }

  .search-options label,
  .replace-controls label {
    display: grid;
    gap: 0.2rem;
  }

  .search-options select,
  .replace-controls input,
  .replace-controls button {
    box-sizing: border-box;
    min-width: 0;
    padding: 0.3rem 0.45rem;
    color: inherit;
    font: inherit;
    background: transparent;
    border: 1px solid var(--soe-border, #d9dee7);
    border-radius: 0.25rem;
  }

  .fuzzy-option {
    display: flex !important;
    grid-auto-flow: column;
    justify-content: start;
    align-items: center;
    align-self: center;
  }

  .replace-controls output {
    align-self: center;
  }

  .replace-controls button {
    cursor: pointer;
  }

  .replace-controls button:disabled {
    cursor: not-allowed;
    opacity: 0.4;
  }

  .replacement-preview {
    display: grid;
    gap: 0.2rem;
    margin: 0.5rem 0 0;
    padding-left: 1.25rem;
  }

  .replacement-preview del {
    color: var(--soe-error, #b42318);
  }

  .replacement-preview ins {
    color: var(--soe-success, #067647);
    text-decoration: none;
  }

  @media (max-width: 42rem) {
    .search-options,
    .replace-controls {
      grid-template-columns: 1fr 1fr;
    }
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

  .schema-warning {
    margin: 0;
    padding: 0.5rem 0.85rem;
    color: var(--soe-warning, #a15c00);
    font-size: 0.8rem;
    border-bottom: 1px solid var(--soe-border, #d9dee7);
  }

  .validation-summary {
    padding: 0.5rem 0.85rem;
    color: var(--soe-muted, #667085);
    font-size: 0.8rem;
    border-bottom: 1px solid var(--soe-border, #d9dee7);
  }

  .validation-pending {
    margin: 0;
    padding: 0.4rem 0.85rem;
    color: var(--soe-muted, #667085);
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

  .validation-counts {
    color: var(--soe-muted, #667085);
  }

  .validation-summary li[data-severity='error'] {
    color: var(--soe-error, #b42318);
  }

  .validation-summary li[data-severity='warning'] {
    color: var(--soe-warning, #a15c00);
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
