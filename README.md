# Drew CLI

## Example

### Installation
Install CLI deps

```sh
pnpm i
```

### Run example

```sh
pnpm run cli --check DrewPackages/engine/test/formulas/erc20  --params "{\"name\": \"Test Token\", \"symbol\": \"TT\", \"totalSupply\": 100000000000000 }"
```

Drew will download formula from git, validate it and print its steps

```
Used apis:
        wallet/v1/sign
        hardhat/v1/script
```
