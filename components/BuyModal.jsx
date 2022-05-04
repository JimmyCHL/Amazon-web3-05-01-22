import React, { useContext, useEffect } from 'react';
import { IoIosClose } from 'react-icons/io';
import Link from 'next/link';
import { HashLoader } from 'react-spinners';

import { AmazonContext } from '../context/AmazonContext';

const styles = {
  container: `h-full w-full flex flex-col `,
  closeX: `w-full h-[50px] flex items-center justify-end mb-[20px]`,
  title: `text-3xl font-bold flex flex-1 items-center mt-[20px] justify-center mb-[40px]`,
  content: `flex w-full mb-[30px] text-xl justify-center`,
  input: `w-[50%] h-[50px] bg-[#f7f6f2] rounded-lg p-[10px] flex mx-auto`,
  inputBox: `w-full h-full flex items-center justify-center bg-[#f7f6f2] focus:outline-none`,
  price: `w-full h-full flex justify-center items-center mt-[20px] font-bold text-3xl`,
  buyBtn: `w-[20%] h-[50px] bg-[#000] mt-[40px] rounded-lg p-[10px] flex mx-auto text-white justify-center items-center cursor-pointer disabled:cursor-not-allowed`,
  loaderContainer: `w-full h-[500px] flex items-center justify-center`,
  loader: `w-full h-full flex items-center justify-center`,
  etherscan: `w-full h-full flex items-center justify-center text-green-500 text-2xl mt-[20px] font-bold cursor-pointer`,
  success: `w-full h-full flex items-center justify-center text-xl mt-[20px] font-bolder`,
};

export const BuyModal = ({ close }) => {
  const { amountDue, setAmountDue, tokenAmount, currentAccount, setTokenAmount, isLoading, setIsLoading, etherscanLink, setEtherscanLink, buyTokens } =
    useContext(AmazonContext);
  console.log(currentAccount);
  useEffect(() => {
    calculatePrice();
  }, [tokenAmount]);

  const calculatePrice = () => {
    const price = parseFloat(tokenAmount) * 0.0001;
    price = price.toFixed(4);
    setAmountDue(price);
  };

  return (
    <div className={styles.container}>
      {isLoading ? (
        <>
          <div className={styles.loaderContainer}>
            <HashLoader size={80} />
          </div>
        </>
      ) : (
        <>
          <div className={styles.closeX}>
            <IoIosClose
              onClick={() => {
                close();
                setAmountDue('');
                setTokenAmount('');
                setEtherscanLink('');
              }}
              fontSize={50}
              className="cursor-pointer"
            />
          </div>
          <div className={styles.title}>Buy More Amazon Coins Here</div>
          <div className={styles.content}>Input how many tokens would you like to buy.</div>
          <div className={styles.input}>
            <input type="text" placeholder="Amount..." className={styles.inputBox} onChange={(e) => setTokenAmount(e.target.value)} value={tokenAmount} />
          </div>
          <div className={styles.price}>
            Total Due: {''}
            {tokenAmount && parseFloat(tokenAmount) > 0 ? amountDue + 'ETH' : '0 ETH'}
          </div>
          <button
            className={styles.buyBtn}
            disabled={!tokenAmount || parseFloat(tokenAmount) <= 0 || !currentAccount}
            onClick={() => {
              setIsLoading(true);
              buyTokens();
            }}
          >
            Buy
          </button>
          {etherscanLink && (
            <>
              <div className={styles.success}>Transaction Successful! Checkout your receipt for your transaction.</div>
              <Link href={`${etherscanLink}`}>
                <a className={styles.etherscan} target="_blank">
                  Transaction Receipt
                </a>
              </Link>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default BuyModal;
