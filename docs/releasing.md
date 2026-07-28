# Releasing SOE

SOE publishes two public packages with the same version:

- `@andreabaldin/soe-core`
- `@andreabaldin/soe-svelte`

GitHub Actions publishes Core before Svelte from the exact tarballs verified by
the release workflow.

## One-time npm configuration

Trusted Publishing must be configured separately for both packages on npm:

1. Open the package settings on npmjs.com.
2. Add a GitHub Actions Trusted Publisher.
3. Set the organization or user to `andrea-baldin`.
4. Set the repository to `soe`.
5. Set the workflow filename to `publish.yml`.
6. Leave the environment name empty.
7. Allow `npm publish`.

Do not create an `NPM_TOKEN` GitHub secret. The workflow requests a short-lived
OpenID Connect credential and npm generates provenance automatically.

## Prepare

1. Choose the semantic version and update both package manifests.
2. Move the relevant entries from `Unreleased` into a dated version in
   `CHANGELOG.md`.
3. Verify the release contract and repository:

   ```sh
   pnpm install --frozen-lockfile
   pnpm release:check vX.Y.Z
   pnpm check
   pnpm test
   pnpm package:check
   ```

4. Merge the release commit into `main`.

`release:check` rejects mismatched package names, versions, dependencies, tags,
or changelog entries. `package:check` installs the packed artifacts into an
isolated Svelte consumer and runs its production build.

## Publish

Create and push an annotated tag from the verified `main` commit:

```sh
git tag -a vX.Y.Z -m "SOE X.Y.Z"
git push origin vX.Y.Z
```

Create a GitHub Release for that tag and publish it. The `Publish` workflow
then:

1. confirms the tagged commit belongs to `main`;
2. repeats all repository and package checks;
3. creates the npm tarballs;
4. publishes Core;
5. publishes Svelte.

Publishing a draft release or merely pushing a tag does not publish to npm.

## Verify

Check the workflow result and confirm that both npm packages expose the same
version and provenance. In a clean Svelte 5 project:

```sh
pnpm add @andreabaldin/soe-svelte@X.Y.Z
```

Import `ObjectEditor` and run the project's production build.

## Manual recovery

Use local publishing only when Trusted Publishing is unavailable and the
failure has been understood:

```sh
pnpm --filter @andreabaldin/soe-core publish --access public --no-provenance
pnpm --filter @andreabaldin/soe-svelte publish --access public --no-provenance
```

Local publication requires npm two-factor authentication. Never republish a
version that has already reached the registry.
