import BaseDb, { KeyFilter } from './BaseDb'
import TimestampedKeysDb from './TimestampedKeysDb'
import chainIdToSlug from 'src/utils/chainIdToSlug'
import { BigNumber } from 'ethers'
import { OneWeekMs, TxError, TxRetryDelayMs } from 'src/constants'
import { normalizeDbItem } from './utils'

export type TransfersDateFilter = {
  fromUnix?: number
  toUnix?: number
}

export type Transfer = {
  transferRootId?: string
  transferRootHash?: string
  transferId?: string
  destinationChainId?: number
  destinationChainSlug?: string
  sourceChainId?: number
  sourceChainSlug?: string
  withdrawalBondSettled?: boolean
  withdrawalBonded?: boolean
  withdrawalBonder?: string
  withdrawalBondedTxHash?: string
  withdrawalBondTxError?: TxError
  withdrawalBondBackoffIndex?: number
  bondWithdrawalAttemptedAt?: number
  isTransferSpent?: boolean
  transferSpentTxHash?: string

  recipient?: string
  amount?: BigNumber
  amountOutMin?: BigNumber
  bonderFee?: BigNumber
  transferNonce?: string
  deadline?: BigNumber
  transferSentTimestamp?: number
  transferSentTxHash?: string
  transferSentBlockNumber?: number
  transferSentIndex?: number

  isBondable?: boolean
  committed?: boolean
  isNotFound?: boolean
}

// these transfer ids are in weird state due to arbitrum forked node
const invalidTransferIds: Record<string, boolean> = {
  '0x8395ab39248878d5defddff3df327b77799edd01f028ba62e16bedd1f372015b': true,
  '0xa92c1740f4ab054cdc09f6e77d232ab2c728bbf1c073cafe708cb7fa9df6526e': true,
  '0x73a5569c26af5b6d4f3f258a22097b7e3721fa77e3ba32d3c596ca9b08b8ab46': true,
  '0x569b9119aef16daf07939bbc8ef1145814be4be4b22c042e947a7c259fa79e17': true,
  '0x2d0d07f92eb66daf9bd5a44a803ee844b9487ee72b55d85618a6a6e56ed4691f': true,
  '0x023e51147d967642f228994c94e60f0c5d1afb524c315ce1c7c571c9cc08a36d': true,
  '0x9d726dc69c3aee3745be3add674c3b148e0816af7d84a6bb8981b59302ce72e3': true,
  '0x85fa8664b6c72862661df1d45cee055f349def548756c94443d4e030aecd9d7e': true,
  '0x67be971e8e8190b08a1c7208ce4ea6f40d6ef7e252a1a1845dbea167dc1b3855': true,
  '0x656765c08c9638c29e10463632321244511a4fa984db9f542dd94f880b436e67': true,
  '0xa255c721a0cf6e4e52bda8b936d869a117e341ab1cdd39bd1dd68a621df46596': true,
  '0x3eaed4ec54370d76be107f1d84857ea603233f384609901e3c8c05784cd49811': true,
  '0x4c4d1c19b469dad3624b0d2c2743bddf7c1222049db02566cfa64a049128f85b': true,
  '0x8e0c9909498017971e64e0d17775a2f3b37512336876bdcdce4bdcc9e237833a': true,
  '0xb634f0ccef80ea6dfba17431f3ab91390cfcb8466663d68f1614458cdaefcfe1': true,
  '0x04ec46f6102c9a365ef44092f95b58f5ac2cc06127865d996e91ef927b1b1d9c': true,
  '0xf8be440ccf9b954579498a3a64583ae9e9a5023fba4ba3423ad0a3c8cc52bc74': true,
  '0x663555a55a31fa11e29b6717b50b807fb756f71b54731aa420387d5fdf52d439': true,
  '0xe31414ee86a02d7ee9b4ba668c4f4b3ba1d74c0c94801dcb21b14550b03c1ab1': true,
  '0xcd8c09d36af2aa630727f7f7235e04e1927b3cb2a32cfe3ab03d4239c5b93cef': true,
  '0x8aa444b26c743223e852e1cad4a0ed9b4daa9a1188fd8f6e3c9114f8c5183c2e': true,
  '0xc9eea07bce28dd2b04fc566238b8b3163f4240aab7f66131cf8ba7a4eac224dc': true,
  '0xdfd2d7c7963060c5876a847f9617007ec0bb07b8b7a32d394d8001d7fff2f368': true,
  '0x984c375707e786505598e93977f79cf9e88cf509181d7e2084e81f84a0016e87': true,
  '0xc8b763bdece230a536c7ea987b62224a39b7ba6212bdc9734ea12f976790f4c7': true,
  '0xffdffa9d6d75952f1868a5ea9ed9e5d27bdc38fac6dd722537e834bebdd21d5b': true,
  '0xad7e47441c1733b884681a934748fb215392f758741c51892991ba987efe006e': true,
  '0x3526b99bec75d866aaf98fb28f5e7c67e76262a306a1a1367e17f8813f21adbb': true,
  '0xa1b035c49c007c15d9b90d55f9af6f49c175b2cec1f45301889140ed1ba2c251': true,
  '0xc71b67e6726793bc1cdb6c0ff10f321efd1c3f4a7176da9ff82df5759a9d74bd': true,
  '0x81a0ca70b9f643f089191e74faa0beadd1979b204d99173828199112e0466ef7': true,
  '0x91d10dc8fbde23d281509df82e13d87f4373be39ff80413100009d65a9fb1840': true,
  '0x2f5dc27ce8dc88e1c41dc4baf51b09282b784058d8e0359268eaf2f22073e82c': true,
  '0x026bb7e5d30055b13ab89bfdd297de734951e8d6a83464b18a16281c80f7407e': true,
  '0x9f56ef8005e3a144ce40f0428950e7da6d3188a496e50a33a4b8c44fc61ec2c6': true,
  '0xba26e75e0bb79622c54ab5e25b92178abbf181cbc359220a4824d1bfffb1934a': true,
  '0x7f3d5d76891d308a7072704fa8a655e153a2b7a1a94bca943a159011500e79da': true,
  '0xfec2d05eac28f889a38b4bc4314390d221202d4066656ecbf2e967f3249b2d78': true,
  '0x0454b6cf9f7e655104acfebd27d79599b5a867fe3488a8e424a91ca29b4595a1': true,
  '0xfa003f1d5c8fecc1c1f6c3bd7e7827227b9013aaa94743720e76fca359a189f0': true,
  '0xbab151edb39867b74cc7e307ed5659481815ed0a673dde4272df872677530c9b': true,
  '0xd96164911baec4413b91be2c44859b54bf6c84dab739723b7a9b864721ffefdc': true,
  '0x7d82df81d192ab9d63efe5a3e13d369efc16c9aa7afa7d33b8278a6f2b7e58b3': true,
  '0x4cd3448843d0cb452682aadba30e333838eddd0d502887efdad86f1130271251': true,
  '0xd9bc333371cf9f57c9b0b7c9981754d9909124ca47a6083b80a7e6d65b48f9c9': true,
  '0x4c131e7af19d7dd1bc8ffe8e937ff8fcdb99bb1f09cc2e041f031e8c48d4d275': true,
  '0x372607f93258c73eb9a7e3298bede2a317ec66708ee542fd9772fae18808b980': true,
  '0xcfd09fc9dca36047347ee31e7580b43071b8ee4aacd7394e46037b10c40d3f98': true
}

class TransfersDb extends TimestampedKeysDb<Transfer> {
  subDbIncompletes: any

  constructor (prefix: string, _namespace?: string) {
    super(prefix, _namespace)
    this.subDbIncompletes = new BaseDb(`${prefix}:incompleteItems`, _namespace)

    this.ready = false
  }

  async updateIncompleteItem (item: Partial<Transfer>) {
    if (!item) {
      this.logger.error('expected item', item)
      return
    }
    const { transferId } = item
    if (!transferId) {
      this.logger.error('expected transferId', item)
      return
    }
    const isIncomplete = this.isItemIncomplete(item)
    const exists = await this.subDbIncompletes.getById(transferId)
    const shouldUpsert = isIncomplete && !exists
    const shouldDelete = !isIncomplete && exists
    if (shouldUpsert) {
      await this.subDbIncompletes._update(transferId, { transferId })
    } else if (shouldDelete) {
      await this.subDbIncompletes.deleteById(transferId)
    }
  }

  async trackTimestampedKey (transfer: Partial<Transfer>) {
    const data = await this.getTimestampedKeyValueForUpdate(transfer)
    if (data != null) {
      const key = data.key
      const transferId = data.value.transferId
      this.logger.debug(`storing timestamped key. key: ${key} transferId: ${transferId}`)
      const value = { transferId }
      await this.subDb._update(key, value)
    }
  }

  async trackTimestampedKeyByTransferId (transferId: string) {
    const transfer = await this.getByTransferId(transferId)
    return await this.trackTimestampedKey(transfer)
  }

  getTimestampedKey (transfer: Partial<Transfer>) {
    if (transfer.transferSentTimestamp && transfer.transferId) {
      const key = `transfer:${transfer.transferSentTimestamp}:${transfer.transferId}`
      return key
    }
  }

  async getTimestampedKeyValueForUpdate (transfer: Partial<Transfer>) {
    if (!transfer) {
      this.logger.warn('expected transfer object for timestamped key')
      return
    }
    const transferId = transfer.transferId
    const key = this.getTimestampedKey(transfer)
    if (!key) {
      this.logger.warn('expected timestamped key. incomplete transfer:', JSON.stringify(transfer))
      return
    }
    if (!transferId) {
      this.logger.warn(`expected transfer id for timestamped key. key: ${key} incomplete transfer: `, JSON.stringify(transfer))
      return
    }
    const item = await this.subDb.getById(key)
    const exists = !!item
    if (!exists) {
      const value = { transferId }
      return { key, value }
    }
  }

  async update (transferId: string, transfer: Partial<Transfer>) {
    const logger = this.logger.create({ id: transferId })
    logger.debug('update called')
    transfer.transferId = transferId
    const timestampedKv = await this.getTimestampedKeyValueForUpdate(transfer)
    const promises: Array<Promise<any>> = []
    if (timestampedKv) {
      logger.debug(`storing timestamped key. key: ${timestampedKv.key} transferId: ${transferId}`)
      promises.push(this.subDb._update(timestampedKv.key, timestampedKv.value).then(() => {
        logger.debug(`updated db item. key: ${timestampedKv.key}`)
      }))
    }
    promises.push(this._update(transferId, transfer).then(async () => {
      const entry = await this.getById(transferId)
      logger.debug(`updated db transfer item. ${JSON.stringify(entry)}`)
      await this.updateIncompleteItem(entry)
    }))
    await Promise.all(promises)
  }

  normalizeItem (item: Partial<Transfer>) {
    if (!item) {
      return null
    }
    if (item.destinationChainId) {
      item.destinationChainSlug = chainIdToSlug(item.destinationChainId)
    }
    if (item.sourceChainId) {
      item.sourceChainSlug = chainIdToSlug(item.sourceChainId)
    }
    if (item.deadline !== undefined) {
      // convert number to BigNumber for backward compatibility reasons
      if (typeof item.deadline === 'number') {
        item.deadline = BigNumber.from((item.deadline as number).toString())
      }
    }
    return normalizeDbItem(item)
  }

  async getByTransferId (transferId: string): Promise<Transfer> {
    const item: Transfer = await this.getById(transferId)
    return this.normalizeItem(item)
  }

  private readonly filterTimestampedKeyValues = (x: any) => {
    return x?.value?.transferId
  }

  private readonly filterOutTimestampedKeys = (key: string) => {
    return !key.startsWith('transfer:')
  }

  async getTransferIds (dateFilter?: TransfersDateFilter): Promise<string[]> {
    // return only transfer-id keys that are within specified range (filter by timestamped keys)
    if (dateFilter?.fromUnix || dateFilter?.toUnix) { // eslint-disable-line @typescript-eslint/prefer-nullish-coalescing
      const filter: KeyFilter = {}
      if (dateFilter.fromUnix) {
        filter.gte = `transfer:${dateFilter.fromUnix}`
      }
      if (dateFilter.toUnix) {
        filter.lte = `transfer:${dateFilter.toUnix}~` // tilde is intentional
      }
      const kv = await this.subDb.getKeyValues(filter)
      return kv.map(this.filterTimestampedKeyValues).filter(this.filterExisty)
    }

    // return all transfer-id keys if no filter is used (filter out timestamped keys)
    const keys = (await this.getKeys()).filter(this.filterOutTimestampedKeys)
    return keys
  }

  sortItems = (a: any, b: any) => {
    /* eslint-disable @typescript-eslint/no-non-null-assertion */
    /* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
    if (a.transferSentBlockNumber! > b.transferSentBlockNumber!) return 1
    if (a.transferSentBlockNumber! < b.transferSentBlockNumber!) return -1
    if (a.transferSentIndex! > b.transferSentIndex!) return 1
    if (a.transferSentIndex! < b.transferSentIndex!) return -1
    /* eslint-enable @typescript-eslint/no-non-null-assertion */
    /* eslint-enable @typescript-eslint/no-unnecessary-type-assertion */
    return 0
  }

  async getItems (dateFilter?: TransfersDateFilter): Promise<Transfer[]> {
    const transferIds = await this.getTransferIds(dateFilter)
    this.logger.debug(`transferIds length: ${transferIds.length}`)
    const batchedItems = await this.batchGetByIds(transferIds)
    const transfers = batchedItems.map(this.normalizeItem)

    // sort explainer: https://stackoverflow.com/a/9175783/1439168
    const items = transfers
      .sort(this.sortItems)

    this.logger.info(`items length: ${items.length}`)
    return items
  }

  async getTransfers (dateFilter?: TransfersDateFilter): Promise<Transfer[]> {
    await this.tilReady()
    return await this.getItems(dateFilter)
  }

  // gets only transfers within range: now - 1 week ago
  async getTransfersFromWeek () {
    await this.tilReady()
    const fromUnix = Math.floor((Date.now() - OneWeekMs) / 1000)
    return await this.getTransfers({
      fromUnix
    })
  }

  async getUncommittedTransfers (
    filter: Partial<Transfer> = {}
  ): Promise<Transfer[]> {
    const transfers: Transfer[] = await this.getTransfersFromWeek()
    return transfers.filter(item => {
      if (filter.sourceChainId) {
        if (filter.sourceChainId !== item.sourceChainId) {
          return false
        }
      }

      return (
        item.transferId &&
        !item.transferRootId &&
        item.transferSentTxHash &&
        !item.committed
      )
    })
  }

  async getUnbondedSentTransfers (
    filter: Partial<Transfer> = {}
  ): Promise<Transfer[]> {
    const transfers: Transfer[] = await this.getTransfersFromWeek()
    return transfers.filter(item => {
      if (!item?.transferId) {
        return false
      }
      if (invalidTransferIds[item.transferId]) {
        return false
      }

      if (filter.sourceChainId) {
        if (filter.sourceChainId !== item.sourceChainId) {
          return false
        }
      }

      let timestampOk = true
      if (item.bondWithdrawalAttemptedAt) {
        if (TxError.BonderFeeTooLow === item.withdrawalBondTxError) {
          const delay = TxRetryDelayMs + ((1 << item.withdrawalBondBackoffIndex!) * 60 * 1000) // eslint-disable-line
          // TODO: use `sentTransferTimestamp` once it's added to db

          // don't attempt to bond withdrawals after a week
          if (delay > OneWeekMs) {
            return false
          }
          timestampOk = item.bondWithdrawalAttemptedAt + delay < Date.now()
        } else {
          timestampOk = item.bondWithdrawalAttemptedAt + TxRetryDelayMs < Date.now()
        }
      }

      return (
        item.transferId &&
        item.transferSentTimestamp &&
        !item.withdrawalBonded &&
        item.transferSentTxHash &&
        item.isBondable &&
        !item.isTransferSpent &&
        timestampOk
      )
    })
  }

  async getBondedTransfersWithoutRoots (
    filter: Partial<Transfer> = {}
  ): Promise<Transfer[]> {
    const transfers: Transfer[] = await this.getTransfersFromWeek()
    return transfers.filter(item => {
      if (filter.sourceChainId) {
        if (filter.sourceChainId !== item.sourceChainId) {
          return false
        }
      }

      return item.withdrawalBonded && !item.transferRootHash
    })
  }

  isItemIncomplete (item: Partial<Transfer>) {
    if (!item?.transferId) {
      return false
    }

    // skip any items that cannot be found on-chain
    // if (item.isNotFound) {
    // return false
    // }

    if (invalidTransferIds[item.transferId]) {
      return false
    }

    return (
      /* eslint-disable @typescript-eslint/prefer-nullish-coalescing */
      !item.sourceChainId ||
      !item.destinationChainId ||
      !item.transferSentBlockNumber ||
      (item.transferSentBlockNumber && !item.transferSentTimestamp) ||
      (item.withdrawalBondedTxHash && !item.withdrawalBonder)
      /* eslint-enable @typescript-eslint/prefer-nullish-coalescing */
    )
  }

  async getIncompleteItems (
    filter: Partial<Transfer> = {}
  ) {
    const kv = await this.subDbIncompletes.getKeyValues()
    const transferIds = kv.map(this.filterTimestampedKeyValues).filter(this.filterExisty)
    if (!transferIds.length) {
      return []
    }
    const batchedItems = await this.batchGetByIds(transferIds)
    const transfers = batchedItems.map(this.normalizeItem)

    return transfers.filter((item: any) => {
      if (filter.sourceChainId && item.sourceChainId) {
        if (filter.sourceChainId !== item.sourceChainId) {
          return false
        }
      }

      return this.isItemIncomplete(item)
    })
  }
}

export default TransfersDb
