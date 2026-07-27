<script lang="ts">
  import { formatObjectPath } from '@soe/core';
  import type { ObjectEditorValueEditorProps } from '../src/index.js';

  let { context, commit }: ObjectEditorValueEditorProps = $props();
</script>

<button
  type="button"
  aria-label={`Uppercase ${formatObjectPath(context.path)}`}
  onclick={() => commit(String(context.value).toUpperCase())}
>
  Uppercase
</button>
