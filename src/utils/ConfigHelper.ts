import Config from '../models/Config'
import { Logger } from '../lib'
import fs from 'fs'
import { homedir } from 'os'

export declare type ConfigHelperNetworkName =
  | 'mainnet'
  | 'rinkeby'
  | 'development'
  | string

export declare type ConfigHelperNetworkId = 1 | 4 | number

export interface ConfigHelperConfig extends Config {
  networkId: ConfigHelperNetworkId
  network: ConfigHelperNetworkName
}

const configs: ConfigHelperConfig[] = [
  {
    networkId: null,
    network: 'unknown',
    nodeUri: 'http://localhost:8545',
    factoryAddress: null,
    metadataStoreUri: 'http://127.0.0.1:5000',
    providerUri: 'http://127.0.0.1:8030',
    poolFactoryAddress: null,
    fixedRateExchangeAddress: null,
    metadataContractAddress: null
  },
  {
    // barge
    networkId: 8996,
    network: 'development',
    nodeUri: 'http://localhost:8545',
    factoryAddress: null,
    metadataStoreUri: 'http://127.0.0.1:5000',
    providerUri: 'http://127.0.0.1:8030',
    poolFactoryAddress: null,
    fixedRateExchangeAddress: null,
    metadataContractAddress: null
  },
  {
    networkId: 4,
    network: 'rinkeby',
    nodeUri: 'https://rinkeby.infura.io/v3',
    factoryAddress: '0x3fd7A00106038Fb5c802c6d63fa7147Fe429E83a',
    oceanTokenAddress: '0x8967BCF84170c91B0d24D4302C2376283b0B3a07',
    metadataStoreUri: 'https://aquarius.rinkeby.v3.dev-ocean.com',
    providerUri: 'https://provider.rinkeby.v3.dev-ocean.com',
    poolFactoryAddress: '0x53eDF9289B0898e1652Ce009AACf8D25fA9A42F8',
    fixedRateExchangeAddress: '0xeD1DfC5F3a589CfC4E8B91C1fbfC18FC6699Fbde',
    metadataContractAddress: '0x2C63bf697f74C72CFB727Fb5eB8e6266cE341e13'
  },
  {
    networkId: 1,
    network: 'mainnet',
    nodeUri: 'https://mainnet.infura.io/v3',
    factoryAddress: '0x1234',
    oceanTokenAddress: '0x7AFeBBB46fDb47ed17b22ed075Cde2447694fB9e',
    metadataStoreUri: null,
    providerUri: null,
    poolFactoryAddress: null,
    fixedRateExchangeAddress: null,
    metadataContractAddress: null
  }
]

export class ConfigHelper {
  /* Load contract addresses from env ADDRESS_FILE (generated by ocean-contracts) */
  public getAddressesFromEnv(): Partial<ConfigHelperConfig> {
    try {
      const data = JSON.parse(
        fs.readFileSync(
          process.env.ADDRESS_FILE ||
            `${homedir}/.ocean/ocean-contracts/artifacts/address.json`,
          'utf8'
        )
      )

      const { DTFactory, BFactory, FixedRateExchange, Metadata } = data?.ganache

      const configAddresses: Partial<ConfigHelperConfig> = {
        factoryAddress: DTFactory,
        poolFactoryAddress: BFactory,
        fixedRateExchangeAddress: FixedRateExchange,
        metadataContractAddress: Metadata,
        ...(process.env.AQUARIUS_URI && { metadataStoreUri: process.env.AQUARIUS_URI })
      }

      return configAddresses
    } catch (e) {
      console.error(`Could not load local contract address file: ${e.message}`)
      return null
    }
  }

  public getConfig(
    network: ConfigHelperNetworkName | ConfigHelperNetworkId,
    infuraProjectId?: string
  ): Config {
    const filterBy = typeof network === 'string' ? 'network' : 'networkId'
    let config = configs.find((c) => c[filterBy] === network)

    if (!config) {
      Logger.error(`No config found for given network '${network}'`)
      return null
    }

    if (network === 'development') {
      const contractAddressesConfig = this.getAddressesFromEnv()
      config = { ...config, ...contractAddressesConfig }
    }

    const nodeUri = infuraProjectId
      ? `${config.nodeUri}/${infuraProjectId}`
      : config.nodeUri

    return { ...config, nodeUri }
  }
}
