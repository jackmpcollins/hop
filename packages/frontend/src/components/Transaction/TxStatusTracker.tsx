import React, { useMemo } from 'react'
import { Div, Flex } from 'src/components/ui'
import useTransactionStatus from 'src/hooks/useTransactionStatus'
import RightArrow from '@material-ui/icons/ArrowRightAlt'
import { TransactionStatus, useTxStatusStyles } from 'src/components/Transaction'
import { useApp } from 'src/contexts/AppContext'
import { findNetworkBySlug } from 'src/utils/networks'

function TxStatusTracker({ tx }) {
  const styles = useTxStatusStyles()
  const { networks } = useApp()
  const { completed, destCompleted, confirmations, networkConfirmations } = useTransactionStatus(
    tx,
    tx.networkName
  )

  const network = useMemo(() => findNetworkBySlug(networks, tx.networkName), [tx, networks])

  return (
    <Div mb={4}>
      <Flex justifyAround alignCenter>
        {network && (
          <Flex column alignCenter textAlign="center" width="5em">
            {/* <Icon src={network?.imageUrl} /> */}
            {/* <Div>{network.name}</Div> */}
            <Div mt={2}>Source</Div>
          </Flex>
        )}
        {tx.destNetworkName !== tx.networkName && (
          <Flex column alignCenter textAlign="center" width="5em">
            {/* <Icon src={destNetwork?.imageUrl} /> */}
            {/* <Div>{destNetwork?.name}</Div> */}
            <Div mt={2}>Destination</Div>
          </Flex>
        )}
      </Flex>

      <Flex justifyContent="space-evenly" alignCenter mt={3}>
        <TransactionStatus
          txConfirmed={completed}
          link={tx.explorerLink}
          networkName={tx.networkName}
          destNetworkName={tx.destNetworkName}
          styles={styles}
          confirmations={confirmations}
          networkWaitConfirmations={networkConfirmations}
        />

        {tx.destNetworkName !== tx.networkName && (
          <>
          <div><RightArrow fontSize="large" color="primary" /></div>
          <TransactionStatus
            srcConfirmed={completed}
            txConfirmed={destCompleted}
            link={tx.destExplorerLink}
            destNetworkName={tx.destNetworkName}
            networkName={tx.networkName}
            destTx
            styles={styles}
          />
      </>
        )}
      </Flex>
    </Div>
  )
}

export default TxStatusTracker
