# Drew CLI

## Example

### Installation

```sh
npm i -g @drewpackages/cli
```

### Run example

```sh
drew check DrewPackages/engine/test/formulas/erc20  --params "{\"name\": \"Test Token\", \"symbol\": \"TT\", \"totalSupply\": 100000000000000 }"
```

Drew will download formula from git, validate it and print its steps

```
Used apis:
        wallet/v1/sign
        hardhat/v1/script
```
