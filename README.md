# Drew CLI

## Example

### Installation

```sh
npm i -g @drewpackages/cli
```

### Run example

Deployment dry run (remove `--dryRun` for actual deployment and docker containers setup)

```sh
# EVM
drew deploy DrewPackages/evm-faucet  --params "{\"name\": \"Test Token\", \"symbol\": \"TT\", \"totalSupply\": 100000000000000 }" --dryRun
# ton
drew deploy-ton DrewPackages/tonfaucet  --params "{\"name\": \"Test Token\", \"symbol\": \"TT\", \"totalSupply\": 100000000000000 }" --dryRun
```

Drew will download formula from git, validate it and print its steps

```
Used apis:
        wallet/v1/sign
        hardhat/v1/script
```

#### Dump in halfway and resume

```sh
# ton
drew deploy-ton DrewPackages/tonfaucet  --params "{\"name\": \"Test Token\", \"symbol\": \"TT\", \"totalSupply\": 100000000000000 }" --dumpAfter 1
```

## Contributing

```sh
nvm use
pnpm i
# EVM
pnpm cli deploy DrewPackages/evm-faucet  --params "{\"name\": \"Test Token\", \"symbol\": \"TT\", \"totalSupply\": 100000000000000 }" --dryRun
# Ton
pnpm cli deploy-ton DrewPackages/tonfaucet  --params "{\"name\": \"Test Token\", \"symbol\": \"TT\", \"totalSupply\": 100000000000000 }" --dryRun
```
