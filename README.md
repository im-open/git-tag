# git-tag

An action that can retrieve the current git version tag and optionally increment or push the new version to GitHub.  The action sets the TAG environment variable for subsequent steps and it adds the tag as an output.  If no tags are found for the repo, it defaults to `v1.0.0`.  If this will be used multiple times in one job, use the TAG output rather than the environment variable.  This action expects the git tag to be in the format <prefix><major>.<minor>.<patch> and the output may not be as expected if it is in a different format.

## Inputs
| Parameter               | Is Required | Default | Description                                                                                                                              |
| ----------------------- | ----------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `github-token`          | false       | *N/A*   | Used to create the new tag. Value is generally: secrets.GITHUB_TOKEN.  Required when pushing a new tag.                                  |
| `increment-major`       | false       | `false` | Flag to indicate whether to increment the major version.<br/>When true, the major is incremented and minor/patch are set to 0.           |
| `increment-minor`       | false       | `false` | Flag to indicate whether to increment the minor version.<br/>When true, the minor is incremented and patch is set to 0.                  |
| `increment-patch`       | false       | `false` | Flag to indicate whether to increment the patch version.                                                                                 |
| `push-new-tag-to-repo`  | false       | `false` | Flag to indicate whether to push a new incremented tag to GitHub.  If none of the major/minor/patch flags are set, this will not happen. |
| `separator`             | false       | `.`     | The separator the version tag uses.                                                                                                      |
| `prefix`                | false       | *N/A*   | The prefix of the git tags if it has one.  Commonly used when tags contain the project in addition to the major.minor.patch.             |
| `includePrefixInOutput` | false       | `false` | Flag indicating whether the prefix should be included in the environment variable or output if one is present.                           |

## Outputs
| Output | Description                                                                                                                  |
| ------ | ---------------------------------------------------------------------------------------------------------------------------- |
| `TAG`  | If any of the increment tags are set, it returns the incremented tag otherwise it returns the latest tag for the repository. |

## Usage Examples

Getting the version and using the ENV variable in later steps:
```yml
jobs:
  get-the-version-for-pack:
    runs-on: ubuntu-20.04
    steps:
      - uses: actions/checkout@v2

      - name: Get the current version
        uses: im-open/git-tag@v1.0.1
        
      - name: donet pack with current git version
        run: dotnet pack -p:PackageVersion=${{ env.TAG }}
        
```

Incrementing the version for multiple repositories, pushing the new tag for one and using the outputs in later steps:
```yml
jobs:
  get-the-version-for-pack:
    runs-on: ubuntu-20.04
    steps:
      - uses: actions/checkout@v2

      - name: Increment the current db version and push it
        id: db-version
        uses: im-open/git-tag@v1.0.1
        with:
          increment-minor: true
          separator: '-' 
          prefix: 'DB-' # This project uses git tags like DB-1-0-0 
          includePrefixInOutput: 'false'
          push-new-tag-to-repo: 'true'
          github-token: ${{ secrets.GITHUB_TOKEN }}
      
      - name: Get the current app version
        id: app-version
        uses: im-open/git-tag@v1.0.1
        with:
          increment-patch: true
          prefix: 'BFF-' # This project uses git tags like BFF-1.1.0 
          includePrefixInOutput: 'false'
      
      - name: pack db with current git version
        working-directory: ./src/db
        run: dotnet pack -p:PackageVersion=${{ steps.db-version.outputs.TAG }}
      
      - name: build app with current git version
        working-directory: ./src/app
        run: dotnet build -p:PackageVersion=${{ steps.app-version.outputs.TAG }}
        
```

## Recompiling

If changes are made to the action's code in this repository, or its dependencies, you will need to re-compile the action.

```sh
# Installs dependencies and bundles the code
npm run build

# Bundle the code (if dependencies are already installed)
npm run bundle
```

These commands utilize [esbuild](https://esbuild.github.io/getting-started/#bundling-for-node) to bundle the action and
its dependencies into a single file located in the `dist` folder.

## Code of Conduct

This project has adopted the [im-open's Code of Conduct](https://github.com/im-open/.github/blob/master/CODE_OF_CONDUCT.md).

## License

Copyright &copy; 2021, Extend Health, LLC. Code released under the [MIT license](LICENSE).
