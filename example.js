/**
 * @example
 * import { createPublicClient, getContract, http, parseAbi } from 'viem'
 * import { mainnet } from 'viem/chains'
 *
 * const publicClient = createPublicClient({
 *   chain: mainnet,
 *   transport: http(),
 * })
 * const contract = getContract({
 *   address: '0xFBA3912Ca04dd458c843e2EE08967fC04f3579c2',
 *   abi: parseAbi([
 *     'function balanceOf(address owner) view returns (uint256)',
 *     'function ownerOf(uint256 tokenId) view returns (address)',
 *     'function totalSupply() view returns (uint256)',
 *   ]),
 *   client: publicClient,
 * })
 */

// Import required modules
import { mainnet } from 'viem/chains'
import {
  createPublicClient,
  http,
  parseAbiItem
} from 'viem'

// Create a public client, connecting to the custom RPC
const client = createPublicClient({
  chain: mainnet,
  transport: http('https://eth.llamarpc.com')
})

// USDC contract address
const USDC_CONTRACT_ADDRESS = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'

// USDC Transfer event ABI
const transferEventAbi = parseAbiItem('event Transfer(address indexed from, address indexed to, uint256 value)')

// USDC decimals function ABI
const decimalsAbi = parseAbiItem('function decimals() view returns (uint8)')

// Get the latest USDC transfer records
async function getRecentUSDCTransfers() {
  try {
    console.log('start...')

    const decimals = await client.readContract({
      address: USDC_CONTRACT_ADDRESS,
      abi: [decimalsAbi],
      functionName: 'decimals',
    })
    console.log(`USDC decimals: ${decimals}`)

    const latestBlockNumber = await client.getBlockNumber()
    console.log(`latest block number: ${latestBlockNumber}`)

    const blocksToQuery = 100 // query 100 blocks
    const fromBlock = latestBlockNumber - BigInt(blocksToQuery)
    console.log(`query range: from block ${fromBlock} to ${latestBlockNumber}`)

    const logs = await client.getLogs({
      address: USDC_CONTRACT_ADDRESS,
      event: transferEventAbi,
      fromBlock: fromBlock,
      toBlock: latestBlockNumber
    })

    console.log(`total ${logs.length} USDC transfer records found`)

    if (logs.length === 0) {
      console.log('no USDC transfer records found in the recent blocks, this is unusual.')
    } else {
      console.log('USDC transfer records statistics:')
      console.log(`the earliest transfer record is in block: ${logs[0].blockNumber}`)
      console.log(`the latest transfer record is in block: ${logs[logs.length - 1].blockNumber}`)
      
      console.log('\nthe latest 100 USDC transfer records (reverse order):')
      logs.slice(-100).reverse().forEach((log, index) => {
        const { args, transactionHash, blockNumber } = log
        const amount = Number(args.value) / Math.pow(10, decimals)
        console.log(`${index + 1}. block ${blockNumber}: from ${args.from} to ${args.to} ${amount.toFixed(decimals)} USDC, tx: ${transactionHash}`)
      })

      // 计算总转账金额
      const totalAmount = logs.reduce((sum, log) => sum + Number(log.args.value), 0) / Math.pow(10, decimals)
      console.log(`\nin ${blocksToQuery} blocks, total ${totalAmount.toFixed(2)} USDC transferred`)
    }

  } catch (error) {
    console.error('error when getting USDC transfer records:', error)
    console.error('error stack:', error.stack)
    if (error.cause) {
      console.error('error cause:', error.cause)
    }
  }
}

// Call the function to get USDC transfer records
getRecentUSDCTransfers().catch(error => {
  console.error('main function error:', error)
})
