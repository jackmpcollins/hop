import * as addresses from '../'

test('addresses', () => {
  expect(addresses.kovan.USDC.ethereum.l1Bridge).toBeTruthy()
})