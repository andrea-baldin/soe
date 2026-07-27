# The SOE Manifesto

## Simplicity is a responsibility

Simplicity is not the absence of features. It is the result of placing every
responsibility where it belongs.

## The simplest use case is the most important

The fundamental API remains:

```svelte
<ObjectEditor bind:value />
```

If a feature makes this harder to understand, the feature must be redesigned.

## Complexity is absorbed, never transferred

Users should not need to understand the model, resolvers, providers,
capabilities, or renderer to edit an object.

## Concepts have one meaning

Data, knowledge, and behavior do not mix. An object is not a schema, a schema
is not a validator, and a renderer is not a model.

## The core stays small

New needs should first find a home in composition or extension points. A public
API is added only when existing concepts cannot express the requirement.

## Code tells a story

Names are complete, responsibilities are narrow, and comments explain intent.
The IDE should make the API discoverable without requiring a manual.

## Complexity is proportional

Solutions match the problem being solved today, not hypothetical future needs.
Ideas may enter the backlog without entering the core.
