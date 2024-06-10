# Drew CLI

## Example

### Installation

```sh
npm i -g @drewpackages/cli
```

### Run example
Deployment dry run (remove `--dryRun` for actual deployment and docker containers setup)
```sh
drew deploy drinkius/ERC20dApp  --params "{\"name\": \"Test Token\", \"symbol\": \"TT\", \"totalSupply\": 100000000000000 }" --dryRun
```

Drew will download formula from git, validate it and print its steps

```
Used apis:
        wallet/v1/sign
        hardhat/v1/script
```

## Contributing
```sh
nvm use
pnpm i
pnpm cli deploy drinkius/ERC20dApp  --params "{\"name\": \"Test Token\", \"symbol\": \"TT\", \"totalSupply\": 100000000000000 }" --dryRun
```