import { createPublicClient, http, formatUnits } from 'viem';
import { polygon } from 'viem/chains';

const POLYGON_RPC = process.env.POLYGON_RPC_URL || 'https://polygon-bor-rpc.publicnode.com';

const client = createPublicClient({
  chain: polygon,
  transport: http(POLYGON_RPC)
});

// Правильная типизация адресов
const TOKENS = {
  FTMC: {
    address: '0xda517744d51e5028db6624b5048acc9c6be67a7e' as `0x${string}`,
    decimals: 18
  },
  USDT: {
    address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F' as `0x${string}`,
    decimals: 6
  }
};

const erc20ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'owner', type: 'address' }],
    outputs: [{ type: 'uint256' }]
  }
];

export async function fetchBalances(walletAddress: `0x${string}`) {
  // FTMC
  const ftmcRaw = await client.readContract({
    address: TOKENS.FTMC.address,
    abi: erc20ABI,
    functionName: 'balanceOf',
    args: [walletAddress]
  }) as bigint;

  const ftmc = Number(formatUnits(ftmcRaw, TOKENS.FTMC.decimals));

  // USDT
  const usdtRaw = await client.readContract({
    address: TOKENS.USDT.address,
    abi: erc20ABI,
    functionName: 'balanceOf',
    args: [walletAddress]
  }) as bigint;

  const usdt = Number(formatUnits(usdtRaw, TOKENS.USDT.decimals));

  // POL (native MATIC)
  const polRaw = await client.getBalance({
    address: walletAddress
  });

  const pol = Number(formatUnits(polRaw, 18));

  return {
    ftmc,
    usdt,
    pol
  };
}
