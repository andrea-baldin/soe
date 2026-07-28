<script lang="ts">
  /**
   * NodeActions translates explicit user intent into structural operations.
   */
  import {
    formatObjectPath,
    isEditableContainer,
    parseObjectContainer,
    serializeObjectValue,
    type Capabilities,
    type ObjectPath,
    type StructuralOperation
  } from '@andreabaldin/soe-core';

  type OperationHandler = (operation: StructuralOperation) => void;
  type PasteHandler = (path: ObjectPath, value: unknown) => void;

  let {
    path,
    value,
    capabilities,
    siblingIndex,
    siblingCount,
    siblingKeys,
    onoperation,
    onpaste
  }: {
    path: ObjectPath;
    value: unknown;
    capabilities: Capabilities;
    siblingIndex: number;
    siblingCount: number;
    siblingKeys: readonly string[];
    onoperation: OperationHandler;
    onpaste: PasteHandler;
  } = $props();

  let renaming = $state(false);
  let confirmingDelete = $state(false);
  let key = $state('');
  let error = $state('');
  let copyStatus = $state('');

  const nodePath = $derived(formatObjectPath(path));
  const currentKey = $derived(path.at(-1));

  function beginRename(): void {
    if (typeof currentKey !== 'string') return;
    renaming = true;
    confirmingDelete = false;
    key = currentKey;
    error = '';
  }

  function cancelRename(): void {
    renaming = false;
    error = '';
  }

  function rename(event: SubmitEvent): void {
    event.preventDefault();
    const nextKey = key.trim();

    if (!nextKey) {
      error = 'Property name is required';
      return;
    }
    if (nextKey !== currentKey && siblingKeys.includes(nextKey)) {
      error = 'Property already exists';
      return;
    }
    if (nextKey === currentKey) {
      cancelRename();
      return;
    }

    onoperation({
      type: 'object.rename',
      path,
      key: nextKey
    });
    cancelRename();
  }

  function remove(): void {
    onoperation({ type: 'value.remove', path });
  }

  function move(toIndex: number): void {
    onoperation({ type: 'array.move', path, toIndex });
  }

  async function copy(): Promise<void> {
    copyStatus = '';

    try {
      if (typeof navigator === 'undefined' || !navigator.clipboard?.writeText) {
        throw new Error('Clipboard unavailable');
      }

      await navigator.clipboard.writeText(serializeObjectValue(value));
      copyStatus = 'Copied';
    } catch {
      copyStatus = 'Copy failed';
    }
  }

  async function paste(): Promise<void> {
    copyStatus = '';

    try {
      if (
        !isEditableContainer(value) ||
        typeof navigator === 'undefined' ||
        !navigator.clipboard?.readText
      ) {
        throw new Error('Clipboard unavailable');
      }

      const replacement = parseObjectContainer(
        await navigator.clipboard.readText(),
        value
      );
      if (!replacement) {
        copyStatus = `Paste requires a JSON ${
          Array.isArray(value) ? 'array' : 'object'
        }`;
        return;
      }

      onpaste(path, replacement);
      copyStatus = 'Pasted';
    } catch {
      copyStatus = 'Paste failed';
    }
  }
</script>

{#if capabilities.copy || capabilities.paste || capabilities.renameKey || capabilities.move || capabilities.delete}
  <div class="node-actions" data-soe-node-actions>
    {#if renaming}
      <form onsubmit={rename}>
        <input
          aria-label={`New name for ${nodePath}`}
          aria-invalid={Boolean(error)}
          bind:value={key}
        />
        <button type="submit">Save</button>
        <button type="button" onclick={cancelRename}>Cancel</button>
        {#if error}
          <span role="alert">{error}</span>
        {/if}
      </form>
    {:else if confirmingDelete}
      <button type="button" class="danger" onclick={remove}
        >Confirm delete</button
      >
      <button type="button" onclick={() => (confirmingDelete = false)}
        >Cancel</button
      >
    {:else}
      {#if capabilities.copy}
        <button type="button" aria-label={`Copy ${nodePath}`} onclick={copy}
          >Copy</button
        >
      {/if}
      {#if capabilities.paste}
        <button type="button" aria-label={`Paste ${nodePath}`} onclick={paste}
          >Paste</button
        >
      {/if}
      {#if capabilities.renameKey}
        <button
          type="button"
          aria-label={`Rename ${nodePath}`}
          onclick={beginRename}>Rename</button
        >
      {/if}
      {#if capabilities.move}
        <button
          type="button"
          aria-label={`Move ${nodePath} up`}
          disabled={siblingIndex === 0}
          onclick={() => move(siblingIndex - 1)}>↑</button
        >
        <button
          type="button"
          aria-label={`Move ${nodePath} down`}
          disabled={siblingIndex === siblingCount - 1}
          onclick={() => move(siblingIndex + 1)}>↓</button
        >
      {/if}
      {#if capabilities.delete}
        <button
          type="button"
          aria-label={`Delete ${nodePath}`}
          onclick={() => (confirmingDelete = true)}>Delete</button
        >
      {/if}
    {/if}
    {#if copyStatus}
      <span role="status">{copyStatus}</span>
    {/if}
  </div>
{/if}

<style>
  .node-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.2rem;
    align-items: center;
    justify-content: flex-end;
    padding: 0.25rem 0.5rem;
  }

  form {
    display: flex;
    flex-wrap: wrap;
    gap: 0.2rem;
    justify-content: flex-end;
  }

  input,
  button {
    max-width: 10rem;
    padding: 0.25rem 0.35rem;
    color: var(--soe-muted, #667085);
    font: inherit;
    font-size: 0.75rem;
    background: transparent;
    border: 1px solid transparent;
    border-radius: 0.25rem;
  }

  input {
    color: inherit;
    border-color: var(--soe-border, #d9dee7);
  }

  input:focus,
  button:focus-visible {
    outline: 2px solid var(--soe-focus-ring, #84adff);
    border-color: var(--soe-focus, #155eef);
  }

  button {
    cursor: pointer;
  }

  button:hover:not(:disabled) {
    border-color: var(--soe-border, #d9dee7);
  }

  button:disabled {
    cursor: not-allowed;
    opacity: 0.35;
  }

  .danger,
  [role='alert'] {
    color: var(--soe-error, #b42318);
  }

  [role='alert'] {
    flex-basis: 100%;
    font-size: 0.75rem;
    text-align: right;
  }
</style>
