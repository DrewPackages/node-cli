# Drew CLI

## Example

### Installation

Clone Drew repos

```sh
git clone git@github.com:DrewPackages/engine.git
git clone git@github.com:DrewPackages/node-cli.git
```

Build Engine

```sh
cd engine
npm i
npm run build
```

Install CLI deps

```sh
cd ../node-cli
npm i
```

### Run example

```sh
npm run cli -- check DrewPackages/engine/test/formulas/erc20
```

Drew will download formula from git, validate it and print its steps

```
Used apis:
        wallet/v1/sign
        hardhat/v1/script
```
