import React, { useState, useContext } from 'react';

import { AmazonContext } from '../context/AmazonContext';
import Card from './Card';

const styles = {
  container: `h-full w-full flex flex-col ml-[20px] -mt-[50px]`,
  title: `text-xl font-bolder mb-[20px] mt-[30px]  ml-[30px]`,
  cards: `flex items-center ml-[20px] flex-wrap gap-[80px]`,
};

const Cards = () => {
  const { assets } = useContext(AmazonContext);
  // console.log(assets);

  return (
    <div className={styles.container}>
      <div className={styles.title}>New Release</div>
      <div className={styles.cards}>
        {assets.map((item) => (
          <Card key={item.id} item={item.attributes} />
        ))}
      </div>
    </div>
  );
};

export default Cards;
