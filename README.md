# Npm package starter

## To start

1. Update general information in `package.json`

- update `name`
- update `description`
- update `keywords`
- update `author`

2. Link repository in `package.json`

```javascript
{
  "repository": {
    "type": "git",
    "url": "git+https://github.com/.../.git"
  },
  "bugs": {
    "url": "https://github.com/.../issues"
  }
}
```

## CI setup

Add `NPM_TOKEN` to github secrets

Go to /Actions/General and set Workflow permissions to `Read and write permissions`

## How to publish

Make some changes to the code

Run `pnpm changeset` and describe your changes

Push your changes to github

Wait for the workflow to finish that will create a pull request with changes

Merge the pull request

Wait for the workflow to finish that will publish the package to npm
