# RFC-0003: Primitive editing

- Status: Accepted
- Date: 2026-07-27

## Context

SOE must edit primitive properties without requiring configuration. Runtime
values provide enough information for strings, numbers, and booleans, but
`null` does not identify the type of its future value. Numeric controls also
need to tolerate temporary input states without corrupting the bound object.

Runtime inference is useful as a zero-configuration fallback, but it must not
become the final authority once schemas and validation criteria are available.

## Decision

- Strings use text controls and update the bound object as the user types.
- Booleans use checkboxes and update the bound object when toggled.
- Numbers update the object only when the control contains a finite number.
  Temporary invalid input remains local to the control and restores the last
  valid value on blur.
- Null values remain null until the user explicitly chooses to initialize them
  as a string, number, or boolean.
- Unsupported runtime values remain visible and inspection-only.

Runtime value inference is the lowest-priority source of editor knowledge.
Future schema and validation criteria may override the inferred type, editor,
parsing, and validation behavior. This precedence must not require changes to
the fundamental component API:

```svelte
<ObjectEditor bind:value />
```

## Accessibility

Every primitive control has a visible label, an accessible name, and an
instance-unique identifier. Native controls preserve keyboard interaction and
platform semantics.

## Consequences

- SOE remains immediately useful without a schema.
- Null conversion never relies on an arbitrary inferred type.
- Invalid numeric text never leaks into the object model.
- Schema and validation work can supersede inference without replacing the
  primitive renderer or complicating the default API.
