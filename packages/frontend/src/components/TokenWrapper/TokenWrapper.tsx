import React, { FC, ChangeEvent, useEffect } from 'react'
import { BigNumber } from 'ethers'
import { makeStyles } from '@material-ui/core/styles'
import Typography from '@material-ui/core/Typography'
import Card from '@material-ui/core/Card'
import MuiButton from '@material-ui/core/Button'
import Button from 'src/components/buttons/Button'
import Box from '@material-ui/core/Box'
import MenuItem from '@material-ui/core/MenuItem'
import { useApp } from 'src/contexts/AppContext'
import Alert from 'src/components/alert/Alert'
import AmountSelectorCard from 'src/components/AmountSelectorCard'
import RaisedSelect from 'src/components/selects/RaisedSelect'
import SelectOption from 'src/components/selects/SelectOption'
import { usePools } from 'src/pages/Pools/PoolsContext'
import SendButton from 'src/pages/Pools/SendButton'
import { commafy, normalizeNumberInput, toTokenDisplay } from 'src/utils'
import { useTokenWrapper } from './TokenWrapperContext'
import Network from 'src/models/Network'
import Expandable from './Expandable'

const useStyles = makeStyles(theme => ({
  root: {
    marginBottom: theme.padding.thick
  },
  tokenWrapper: {
    marginTop: '1rem',
    marginBottom: '2rem'
  },
  buttons: {
    marginTop: theme.padding.default,
    marginBottom: theme.padding.default,
  },
  button: {
    margin: `0 ${theme.padding.light}`,
    width: '17.5rem'
  }
}))

export type Props = {
  network: Network | undefined
}

const TokenWrapper: FC<Props> = (props: Props) => {
  const styles = useStyles()
  const {
    setSelectedNetwork,
    canonicalToken,
    wrappedToken,
    amount,
    setAmount,
    wrap,
    unwrap,
    canonicalTokenBalance,
    wrappedTokenBalance,
    isWrapping,
    isUnwrapping,
    error,
    setError,
    isNativeToken
  } = useTokenWrapper()

  useEffect(() => {
    if (props.network) {
      setSelectedNetwork(props.network)
    }
  }, [props.network])

  const handleWrapClick = (event: any) => {
    event.preventDefault()
    wrap()
  }

  const handleUnwrapClick = (event: any) => {
    event.preventDefault()
    unwrap()
  }

  const hasWrappedToken = wrappedTokenBalance?.gt(0)
  const hasNativeToken = canonicalTokenBalance?.gt(0)
  const loadingBalance = !(canonicalTokenBalance && wrappedTokenBalance)

  if (!isNativeToken) {
    return null
  }

  return (
    <Expandable title="Wrap/Unwrap">
      <Box display="flex" alignItems="center" className={styles.tokenWrapper}>
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          className={styles.root}
        >
          <AmountSelectorCard
            secondaryToken={canonicalToken}
            secondaryBalance={canonicalTokenBalance}
            loadingSecondaryBalance={loadingBalance}
            secondaryBalanceLabel={`${canonicalToken?.symbol}:`}
            value={amount}
            token={wrappedToken}
            onChange={setAmount}
            titleIconUrl={canonicalToken?.image}
            title={'Amount'}
            balance={wrappedTokenBalance}
            balanceLabel={`${wrappedToken?.symbol}:`}
            loadingBalance={loadingBalance}
            hideSymbol
            decimalPlaces={2}
          />
          <Box className={styles.buttons} display="flex" flexDirection="row" alignItems="center">
            <Button
              className={styles.button}
              large
              highlighted={hasNativeToken}
              disabled={isWrapping || !hasNativeToken}
              onClick={handleWrapClick}
              loading={isWrapping}
            >
              Wrap
            </Button>
            <Button
              className={styles.button}
              large
              highlighted={hasWrappedToken}
              disabled={isUnwrapping || !hasWrappedToken}
              onClick={handleUnwrapClick}
              loading={isUnwrapping}
            >
              Unwrap
            </Button>
          </Box>
          <Box display="flex" flexDirection="row" alignItems="center">
            <Alert severity="error" onClose={() => setError(null)} text={error} />
          </Box>
        </Box>
      </Box>
    </Expandable>
  )
}

export default TokenWrapper