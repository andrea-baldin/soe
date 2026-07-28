# Releasing SOE

SOE publishes two public packages with the same version:

- `@andreabaldin/soe-core`
- `@andreabaldin/soe-svelte`

The core package must always be published before the Svelte package.

## Prepare

1. Choose the semantic version and update both package manifests.
2. Move the relevant entries from `Unreleased` into the dated version in
   `CHANGELOG.md`.
3. Install the frozen workspace and run the complete verification:

   ```sh
   pnpm install --frozen-lockfile
   pnpm check
   pnpm test
   pnpm package:check
   ```

4. Confirm the release commit is on `main` and create the matching `vX.Y.Z`
   Git tag.

`package:check` builds the monorepo, creates the exact npm tarballs, installs
them into a temporary consumer project, and runs a production Svelte build.

## Publish

The npm account must own the `@andrea-baldin` scope and have two-factor
authentication or trusted publishing configured.

```sh
pnpm --filter @andreabaldin/soe-core publish --access public --no-provenance
pnpm --filter @andreabaldin/soe-svelte publish --access public --no-provenance
```

These commands are for a local release. Provenance requires a supported CI
provider and will be enabled by the future trusted-publishing workflow. Publish
only from a clean tagged commit. After publication, create the GitHub release
from the same tag and use the matching changelog section as its notes.

## Verify

Check that both registry pages show the same version, repository, license, and
README. In a clean Svelte 5 project, install the public component:

```sh
npm install @andreabaldin/soe-svelte
```

Import `ObjectEditor` and run the project's production build once more.
