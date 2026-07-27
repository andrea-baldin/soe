<script lang="ts">
  /**
   * ObjectEditor owns the bound root while nodes render paths recursively.
   */
  import {
    objectEntries,
    replaceValueAtPath,
    type EditableValue,
    type ObjectPath
  } from '@soe/core';

  import ObjectNode from './ObjectNode.svelte';

  type ObjectRecord = Record<string, unknown>;

  let { value = $bindable() }: { value: ObjectRecord } = $props();

  const editorId = $props.id();
  const entries = $derived(objectEntries(value));

  function update(path: ObjectPath, nextValue: EditableValue): void {
    value = replaceValueAtPath(value, path, nextValue);
  }

  function entryLabel(key: string | number): string {
    return typeof key === 'number' ? `[${key}]` : key;
  }
</script>

<div class="object-editor" data-soe-editor>
  {#each entries as entry (entry.key)}
    <ObjectNode
      label={entryLabel(entry.key)}
      value={entry.value}
      path={[entry.key]}
      ancestors={[value]}
      {editorId}
      onupdate={update}
    />
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

  .empty-state {
    margin: 0;
    padding: 1rem;
    color: var(--soe-muted, #667085);
    text-align: center;
  }
</style>
