import { API_ETH_MOCK_ADDRESS, ERC20Service, transactionType } from '@aave/contract-helpers';
import { SignatureLike } from '@ethersproject/bytes';
import { JsonRpcProvider, TransactionReceipt, TransactionResponse } from '@ethersproject/providers';
import { BigNumber, PopulatedTransaction, utils } from 'ethers';
import React, { ReactElement, useEffect, useState } from 'react';
import { useIsContractAddress } from 'src/hooks/useIsContractAddress';
import { MOCK_ACCOUNT, useTestModeStore } from 'src/mocks/testModeStore';
import { useRootStore } from 'src/store/root';
import { wagmiConfig } from 'src/ui-config/wagmiConfig';
import { TEST_MODE } from 'src/utils/testMode';
import { hexToAscii } from 'src/utils/utils';
import { UserRejectedRequestError } from 'viem';
import { useAccount, useConnect, useSwitchChain, useWatchAsset } from 'wagmi';
import { useShallow } from 'zustand/shallow';

import { Web3Context } from '../hooks/useWeb3Context';
import { getEthersProvider } from './adapters/EthersAdapter';

export type ERC20TokenType = {
  address: string;
  symbol: string;
  decimals: number;
  image?: string;
  aToken?: boolean;
};

export type Web3Data = {
  currentAccount: string;
  chainId: number;
  switchNetwork: (chainId: number) => Promise<void>;
  getTxError: (txHash: string) => Promise<string>;
  sendTx: (txData: transactionType | PopulatedTransaction) => Promise<TransactionResponse>;
  addERC20Token: (args: ERC20TokenType) => Promise<boolean>;
  signTxData: (unsignedData: string) => Promise<SignatureLike>;
  switchNetworkError: Error | undefined;
  setSwitchNetworkError: (err: Error | undefined) => void;
  readOnlyMode: boolean;
  readOnlyModeAddress: string | undefined;
  provider: JsonRpcProvider | undefined;
  setReadOnlyModeAddress: (address: string | undefined) => void;
};

let didInit = false;
let didAutoConnectForCypress = false;

export const Web3ContextProvider: React.FC<{ children: ReactElement }> = ({ children }) => {
  const { switchChainAsync } = useSwitchChain();
  const { watchAssetAsync } = useWatchAsset();
  const { chainId, address } = useAccount();
  const { connect, connectors } = useConnect();

  const [readOnlyModeAddress, setReadOnlyModeAddress] = useState<string | undefined>();
  const [switchNetworkError, setSwitchNetworkError] = useState<Error>();
  const [setAccount, setConnectedAccountIsContract] = useRootStore(
    useShallow((store) => [store.setAccount, store.setConnectedAccountIsContract])
  );

  const account = address;
  const readOnlyMode = utils.isAddress(readOnlyModeAddress || '');
  let currentAccount = account?.toLowerCase() || '';
  if (TEST_MODE) {
    currentAccount = MOCK_ACCOUNT.toLowerCase();
  } else if (readOnlyMode && readOnlyModeAddress) {
    currentAccount = readOnlyModeAddress;
  }

  const { data: isContractAddress } = useIsContractAddress(account || '', chainId);

  useEffect(() => {
    if (didInit) {
      return;
    }

    if (TEST_MODE) {
      setReadOnlyModeAddress(MOCK_ACCOUNT.toLowerCase());
      didInit = true;
      return;
    }

    // If the app loads in readOnlyMode, then we disconnect the wallet if it auto connected
    const storedReadOnlyAddress = localStorage.getItem('readOnlyModeAddress');
    if (storedReadOnlyAddress && utils.isAddress(storedReadOnlyAddress)) {
      setReadOnlyModeAddress(storedReadOnlyAddress);
    }

    didInit = true;
  }, [readOnlyMode]);

  useEffect(() => {
    // If running cypress tests, then we try to auto connect on app load
    // so it doesn't have to be driven through the UI.
    const isCypressEnabled = process.env.NEXT_PUBLIC_IS_CYPRESS_ENABLED === 'true';
    if (!isCypressEnabled || didAutoConnectForCypress) {
      return;
    }

    const injected = connectors[0];
    connect({ connector: injected });
    didAutoConnectForCypress = true;
  }, [connect, connectors]);

  const applySupply = useTestModeStore((state) => state.applySupply);
  const applyWithdraw = useTestModeStore((state) => state.applyWithdraw);
  const applyBorrow = useTestModeStore((state) => state.applyBorrow);
  const applyRepay = useTestModeStore((state) => state.applyRepay);

  const sendTx = async (
    txData: transactionType | PopulatedTransaction
  ): Promise<TransactionResponse> => {
    if (TEST_MODE) {
      const iface = new utils.Interface([
        'function supply(address,uint256,address,uint16)',
        'function withdraw(address,uint256,address)',
        'function borrow(address,uint256,uint256,uint16,address)',
        'function repay(address,uint256,uint256,address)',
      ]);
      try {
        if (txData.data) {
          const parsed = iface.parseTransaction({ data: txData.data });
          const asset = String(parsed.args?.[0]).toLowerCase();
          const amount = BigInt(String(parsed.args?.[1]));
          if (parsed.name === 'supply') applySupply(asset, amount);
          if (parsed.name === 'withdraw') applyWithdraw(asset, amount);
          if (parsed.name === 'borrow') applyBorrow(asset, amount);
          if (parsed.name === 'repay') applyRepay(asset, amount);
        }
      } catch {
        // ignore decoding errors in test mode
      }
      const hash = `0x${Math.random().toString(16).slice(2).padEnd(64, '0')}`.slice(0, 66);
      const txResponse: TransactionResponse = {
        hash,
        confirmations: 0,
        from: MOCK_ACCOUNT,
        wait: async () => ({ status: 1 } as TransactionReceipt),
      } as TransactionResponse;
      return txResponse;
    }

    const provider = await getEthersProvider(wagmiConfig, { chainId });
    if (provider) {
      const { from, ...data } = txData;
      const signer = provider.getSigner(from);
      const txResponse: TransactionResponse = await signer.sendTransaction({
        ...data,
        value: data.value ? BigNumber.from(data.value) : undefined,
      });
      return txResponse;
    }
    throw new Error('Error sending transaction. Provider not found');
  };

  const signTxData = async (unsignedData: string): Promise<SignatureLike> => {
    if (TEST_MODE) {
      return `0x${'11'.repeat(65)}`;
    }
    const provider = await getEthersProvider(wagmiConfig, { chainId });
    if (provider && account) {
      const signature: SignatureLike = await provider.send('eth_signTypedData_v4', [
        account,
        unsignedData,
      ]);

      return signature;
    }
    throw new Error('Error initializing permit signature');
  };

  const switchNetwork = async (newChainId: number) => {
    try {
      await switchChainAsync({ chainId: newChainId });
      setSwitchNetworkError(undefined);
    } catch (switchError) {
      if (switchError.code === UserRejectedRequestError.code) {
        setSwitchNetworkError(switchError);
      } else {
        setSwitchNetworkError(undefined);
      }
    }
  };

  const getTxError = async (txHash: string): Promise<string> => {
    const provider = await getEthersProvider(wagmiConfig, { chainId });
    if (provider) {
      const tx = await provider.getTransaction(txHash);
      // @ts-expect-error TODO: need think about "tx" type
      const code = await provider.call(tx, tx.blockNumber);
      const error = hexToAscii(code.substr(138));
      return error;
    }
    throw new Error('Error getting transaction. Provider not found');
  };

  const addERC20Token = async ({
    address,
    symbol,
    decimals,
    image,
  }: ERC20TokenType): Promise<boolean> => {
    if (TEST_MODE) return true;
    const provider = await getEthersProvider(wagmiConfig, { chainId });
    if (provider) {
      if (address.toLowerCase() !== API_ETH_MOCK_ADDRESS.toLowerCase()) {
        let tokenSymbol = symbol;
        if (!tokenSymbol) {
          const { getTokenData } = new ERC20Service(provider);
          const { symbol } = await getTokenData(address);
          tokenSymbol = symbol;
        }

        await watchAssetAsync({
          type: 'ERC20',
          options: {
            address,
            symbol: tokenSymbol,
            decimals,
            image,
          },
        });

        return true;
      }
    }
    return false;
  };

  useEffect(() => {
    if (TEST_MODE) {
      setAccount(MOCK_ACCOUNT.toLowerCase());
      return;
    }
    setAccount(account?.toLowerCase());
  }, [account, setAccount]);

  useEffect(() => {
    if (readOnlyModeAddress) {
      setAccount(readOnlyModeAddress.toLowerCase());
    }
  }, [readOnlyModeAddress, setAccount]);

  useEffect(() => {
    if (!account) {
      setConnectedAccountIsContract(false);
      return;
    }

    if (isContractAddress) {
      setConnectedAccountIsContract(true);
    }
  }, [isContractAddress, setConnectedAccountIsContract, account]);

  return (
    <Web3Context.Provider
      value={{
        web3ProviderData: {
          chainId: chainId || 1,
          switchNetwork,
          getTxError,
          sendTx,
          signTxData,
          currentAccount,
          addERC20Token,
          switchNetworkError,
          setSwitchNetworkError,
          readOnlyMode,
          provider: undefined,
          readOnlyModeAddress,
          setReadOnlyModeAddress,
        },
      }}
    >
      {children}
    </Web3Context.Provider>
  );
};
