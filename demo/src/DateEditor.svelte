<script lang="ts">
  import type { ObjectEditorValueEditorProps } from '@andrea-baldin/soe-svelte';

  let { context, commit }: ObjectEditorValueEditorProps = $props();

  const value = $derived(
    context.value instanceof Date && !Number.isNaN(context.value.getTime())
      ? context.value.toISOString().slice(0, 10)
      : ''
  );

  function change(event: Event): void {
    const input = event.currentTarget as HTMLInputElement;
    if (input.value) commit(new Date(`${input.value}T00:00:00.000Z`));
  }
</script>

<input type="date" aria-label="Profile birthday" {value} onchange={change} />
