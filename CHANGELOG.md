# Changelog

All notable changes to SOE are documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and the project follows [Semantic Versioning](https://semver.org/).

## [Unreleased]

## [0.3.0] - 2026-07-29

### Added

- Tuple schemas with positional `prefixItems` knowledge.
- Error and warning severity, declarative constraints, localized messages, and
  multiple structured diagnostics.
- Cancellable asynchronous validators, pending state, stale-result protection,
  and external server diagnostics.
- Schema defaults, enum choices, missing-field suggestions, and array item
  templates.
- Structured and fuzzy search with type and validation filters.
- Capability-safe replacement previews and atomic replace-all history.
- Complete schema guide and expanded package documentation.

### Changed

- Closed schemas keep known fields insertable while continuing to reject
  arbitrary property authoring.
- Validation, search, and authoring APIs expose immutable framework-independent
  results for alternate renderers.

## [0.2.0] - 2026-07-28

### Added

- Trusted npm publishing through GitHub Actions and OpenID Connect.
- Release contract validation for package names, versions, tags, dependencies,
  and changelog entries.
- Composable schema rules for runtime value types, wildcard paths, and safe
  semantic predicates.
- One resolved schema shared by rendering, validation, capabilities, and
  plugins.

## [0.1.0] - 2026-07-28

### Added

- Recursive editing of plain objects and arrays with immutable structural
  operations.
- Undo and redo history for value and structural changes.
- Recursive schemas, required fields, synchronous validation, and navigable
  whole-object validation reports.
- Capability, property, context, and plugin composition.
- Safe copy and paste, special-value inspection, custom value editors, and
  search navigation.
- Schema-driven editing policies.
- Framework-independent `@andreabaldin/soe-core` package.
- Svelte 5 `@andreabaldin/soe-svelte` package with a standard-CSS interface.
- Tailwind CSS integration demo without a runtime Tailwind dependency.

[Unreleased]: https://github.com/andrea-baldin/soe/compare/v0.3.0...HEAD
[0.3.0]: https://github.com/andrea-baldin/soe/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/andrea-baldin/soe/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/andrea-baldin/soe/releases/tag/v0.1.0
