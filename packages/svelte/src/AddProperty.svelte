<script lang="ts">
  /**
   * AddProperty collects a key while the core owns insertion semantics.
   */
  import {
    formatObjectPath,
    type ObjectPath,
    type StructuralOperation
  } from '@soe/core';

  type OperationHandler = (operation: StructuralOperation) => void;

  let {
    path,
    existingKeys,
    onoperation
  }: {
    path: ObjectPath;
    existingKeys: readonly string[];
    onoperation: OperationHandler;
  } = $props();

  let adding = $state(false);
  let key = $state('');
  let error = $state('');

  const addId = $props.id();
  const location = $derived(formatObjectPath(path) || 'root');

  function start(): void {
    adding = true;
    key = '';
    error = '';
  }

  function cancel(): void {
    adding = false;
    key = '';
    error = '';
  }

  function insert(event: SubmitEvent): void {
    event.preventDefault();
    const nextKey = key.trim();

    if (!nextKey) {
      error = 'Property name is required';
      return;
    }
    if (existingKeys.includes(nextKey)) {
      error = 'Property already exists';
      return;
    }

    onoperation({
      type: 'object.insert',
      path,
      key: nextKey
    });
    cancel();
  }
</script>

<div class="add-property" data-soe-add-property>
  {#if adding}
    <form onsubmit={insert}>
      <input
        aria-label={`New property name in ${location}`}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${addId}-error` : undefined}
        bind:value={key}
      />
      <button type="submit">Add</button>
      <button type="button" onclick={cancel}>Cancel</button>
      {#if error}
        <span id={`${addId}-error`} role="alert">{error}</span>
      {/if}
    </form>
  {:else}
    <button
      type="button"
      class="start"
      aria-label={`Add property to ${location}`}
      onclick={start}>+ Property</button
    >
  {/if}
</div>

<style>
  .add-property {
    padding: 0.35rem 0.5rem;
    border-bottom: 1px solid var(--soe-border, #d9dee7);
  }

  form {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem;
    align-items: center;
  }

  input,
  button {
    padding: 0.3rem 0.45rem;
    color: inherit;
    font: inherit;
    background: transparent;
    border: 1px solid var(--soe-border, #d9dee7);
    border-radius: 0.25rem;
  }

  input:focus,
  button:focus-visible {
    outline: 2px solid var(--soe-focus-ring, #84adff);
    border-color: var(--soe-focus, #155eef);
  }

  button {
    cursor: pointer;
  }

  .start {
    color: var(--soe-muted, #667085);
    border-color: transparent;
  }

  [role='alert'] {
    flex-basis: 100%;
    color: var(--soe-error, #b42318);
    font-size: 0.8rem;
  }
</style>
