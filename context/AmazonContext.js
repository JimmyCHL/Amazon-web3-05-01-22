import { createContext, useState, useEffect } from 'react';
import { useMoralis, useMoralisQuery } from 'react-moralis';
import { ethers } from 'ethers';

import { amazonAbi, amazonCoinAddress } from '../lib/constants';

export const AmazonContext = createContext();

export const AmazonProvider = ({ children }) => {
  const [username, setUsername] = useState('');
  const [nickname, setNickname] = useState('');
  const [assets, setAssets] = useState([]);
  const [currentAccount, setCurrentAccount] = useState('');
  const [tokenAmount, setTokenAmount] = useState('');
  const [amountDue, setAmountDue] = useState('');
  const [etherscanLink, setEtherscanLink] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [balance, setBalance] = useState(0);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [ownedItems, setOwnedItems] = useState([]);

  const { authenticate, isAuthenticated, isInitialized, enableWeb3, logout, Moralis, user, isWeb3Enabled } = useMoralis();

  const { data: assetsData, error: assetsDataError, isLoading: assetsDataIsLoading } = useMoralisQuery('assets');

  //load current user
  const { data: userData, error: userDataError, isLoading: userDataIsLoading, fetch:userFetch } = useMoralisQuery('_User');

  useEffect(() => {
    (async () => {
      if (isAuthenticated && isWeb3Enabled) {
        await getBalance();
        const currentUsername = await user?.get('nickname');
        setUsername(currentUsername);
        const account = await user?.get('ethAddress');
        setCurrentAccount(account);
      } else {
        setUsername(''); //manually disconnect the site from metaMask won't change the state of (isAuthenticated) in Moralis
        setCurrentAccount('');
        setBalance(0);
      }
    })();
  }, [isAuthenticated, user, nickname, isWeb3Enabled, currentAccount, isInitialized]);

  useEffect(() => {
    (() => {
      if (!assetsDataIsLoading) {
        getAssets();
      }
    })();
  }, [assetsDataIsLoading]);

  useEffect(() => {
    (async () => {
      if (!userDataIsLoading) {
        await getOwnedAssets();
      }
    })();
  }, [userDataIsLoading]);

  useEffect(() => {
    if (!isInitialized) return;
    (async () => {
      let Transactions = Moralis.Object.extend('EthTransactions');
      let query = new Moralis.Query(Transactions);
      query.descending('createdAt');
      query.limit(20);
      const results = await query.find({ useMasterKey: true });
      // console.log(results);
      setRecentTransactions(results.slice(0, 5));

      await listenToUpdates();
    })();
  }, [isInitialized]);

  const handleSetUsername = () => {
    if (user) {
      if (nickname) {
        user.set('nickname', nickname);
        user.save();
        setNickname('');
      } else {
        console.log('Can not set empty nickname');
      }
    } else {
      console.log('No user');
    }
  };

  const getBalance = async () => {
    try {
      if (!isAuthenticated || !currentAccount) return;

      const options = {
        contractAddress: amazonCoinAddress,
        functionName: 'balanceOf',
        abi: amazonAbi,
        params: {
          account: currentAccount,
        },
      };

      if (isWeb3Enabled) {
        const response = await Moralis.executeFunction(options);
        setBalance(response.toString());
      }
    } catch (error) {
      console.log(error);
    }
  };

  const buyTokens = async () => {
    try {
      if (!isAuthenticated) {
        await authenticate();
      }

      if (!isAuthenticated) {
        return;
      }

      const amount = ethers.BigNumber.from(tokenAmount);
      const price = ethers.BigNumber.from(100000000000000);
      const calcPrice = amount.mul(price);

      let options = {
        contractAddress: amazonCoinAddress,
        functionName: 'mint',
        abi: amazonAbi,
        msgValue: calcPrice,
        params: {
          amount,
        },
      };

      const transaction = await Moralis.executeFunction(options);
      const receipt = await transaction.wait(3);
      setIsLoading(false);
      await getBalance();
      console.log(receipt);
      setEtherscanLink(`https://rinkeby.etherscan.io/tx/${receipt.transactionHash}`);
    } catch (error) {
      console.log(error);
      setIsLoading(false);
    }
  };

  const getAssets = () => {
    try {
      setAssets(assetsData);
    } catch (e) {
      console.log(e);
    }
  };

  const buyAsset = async (price, asset) => {
    try {
      if (!isAuthenticated && !currentAccount) return;
      const options = {
        type: 'erc20',
        amount: price, //need to be wei
        receiver: amazonCoinAddress,
        contractAddress: amazonCoinAddress,
      };
      let transaction = await Moralis.transfer(options);
      const receipt = await transaction.wait(3);
      if (receipt) {
        const res = userData[0].add('ownedAssets', {
          ...asset,
          purchaseDate: Date.now(),
          etherscanLink: `https://rinkeby.etherscan.io/tx/${receipt.transactionHash}`,
        });
        alert('wait...');
        await res.save().then(() => {
          alert("You've successfully purchased this asset");
        });
        await getBalance();
        await userFetch();
        await getOwnedAssets();
      }
    } catch (error) {
      console.log(error);
    }
  };

  const listenToUpdates = async () => {
    let query = new Moralis.Query('EthTransactions');
    let subscription = await query.subscribe();

    subscription.on('update', async (object) => {
      // console.log('new transaction', object);
      setRecentTransactions((pre) => {
        if (pre[0].attributes.hash === object.attributes.hash) return pre; //prevents glitch and update same object twice.
        pre.pop();
        pre.unshift(object);
        return pre;
      });
    });
  };



  const getOwnedAssets = async () => {
    try {
      if (userData[0]) {
        setOwnedItems((prevItems) => [ ...userData[0].attributes.ownedAssets]);
      }
    } catch (e) {
      console.log(e);
    }
  };
  return (
    <AmazonContext.Provider
      value={{
        isAuthenticated,
        isWeb3Enabled,
        nickname,
        setNickname,
        username,
        setUsername,
        handleSetUsername,
        assets,
        balance,
        setTokenAmount,
        tokenAmount,
        amountDue,
        setAmountDue,
        isLoading,
        setIsLoading,
        setEtherscanLink,
        etherscanLink,
        currentAccount,
        buyTokens,
        buyAsset,
        recentTransactions,
        ownedItems,
      }}
    >
      {children}
    </AmazonContext.Provider>
  );
};
