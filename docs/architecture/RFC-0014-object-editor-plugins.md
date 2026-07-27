# RFC-0014: ObjectEditor plugin registration

- Status: Accepted
- Date: 2026-07-28

## Context

The core plugin host is useful only when a consumer can register plugins.
`ObjectEditor` already resolves capabilities for every rendered node, so it is
the first concrete consumer.

## Decision

`ObjectEditor` accepts one optional property:

```svelte
<ObjectEditor bind:value {plugins} />
```

The default remains:

```svelte
<ObjectEditor bind:value />
```

`ObjectEditorPlugin` is currently an `ObjectPlugin<Record<string, never>>`.
This intentionally exposes capability contributions while defining no
speculative renderer-property catalog. The editor creates one plugin host and
shares it with every recursive node. Each node uses the resolved context as
the sole source of capabilities.

## Out of scope

UI property providers, global registration, lifecycle hooks, asynchronous
plugins, plugin configuration, and dependency resolution remain excluded.

## Consequences

- Capability plugins can control editing and structural actions by node
  context.
- The zero-configuration API is unchanged.
- The UI no longer bypasses the plugin host.
- A future renderer-property catalog can extend the same public plugin type
  without creating another registration mechanism.
