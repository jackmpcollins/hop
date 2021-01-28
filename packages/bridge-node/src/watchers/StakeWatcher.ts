import '../moduleAlias'
import { parseUnits, formatUnits } from 'ethers/lib/utils'
import { wait } from 'src/utils'
import L1BridgeContract from 'src/contracts/L1BridgeContract'
import L2OptimismBridgeContract from 'src/contracts/L2OptimismBridgeContract'
import L2ArbitrumBridgeContract from 'src/contracts/L2ArbitrumBridgeContract'
import Logger from 'src/logger'

const logger = new Logger('[stakeWatcher]', { color: 'green' })

export interface Config {
  chains: any[]
}

class StakeWatcher {
  chains: any[]
  interval: number = 60 * 1000

  constructor (config: Config) {
    this.chains = config.chains
  }

  async start () {
    try {
      while (true) {
        await this.check()
        await wait(this.interval)
      }
    } catch (err) {
      logger.log(`stake watcher error:`, err.message)
    }
  }

  async check () {
    const threshold = 10000
    const amount = 1000000

    for (let { label, contract } of this.chains) {
      try {
        const credit = await this.getCredit(contract)
        const debit = await this.getDebit(contract)
        logger.log(`${label} credit balance:`, credit)
        logger.log(`${label} debit balance:`, debit)

        if (credit < threshold) {
          const parsedAmount = parseUnits(amount.toString(), 18)
          logger.log(`staking ${amount}`)
          const tx = await contract.stake(parsedAmount)
          logger.log(`stake ${label} tx:`, tx?.hash)
        }
      } catch (err) {
        logger.log(`${label} stake tx error:`, err.message)
      }
    }
  }

  async getCredit (contract: any) {
    const credit = (await contract.getCredit()).toString()
    return Number(formatUnits(credit, 18))
  }

  async getDebit (contract: any) {
    const debit = (await contract.getDebit()).toString()
    return Number(formatUnits(debit, 18))
  }
}

export default StakeWatcher