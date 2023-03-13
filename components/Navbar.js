import React, { Fragment, useState, useEffect } from 'react'
import { Button, Typography, useMediaQuery, Stack, Link } from '@mui/material'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useWallet } from '@solana/wallet-adapter-react';
import * as anchor from "@project-serum/anchor";
import { SOLANA_HOST } from "../utils/const";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import Image from 'next/image';

const connection = new anchor.web3.Connection(SOLANA_HOST);

const Navbar = ({balance}) => {
  const wallet = useWallet();

  // const [balance, setBalance] = useState(0);

  // useEffect(() => {
  //   (async () => {
  //     if (wallet?.publicKey) {
  //       const balance = await connection.getBalance(wallet.publicKey);
  //       setBalance(balance / LAMPORTS_PER_SOL);
  //     }
  //   })();
  // }, [wallet, connection]);

const img1 = 'https://images.pokemontcg.io/base1/24.png'
const img2 = 'https://images.pokemontcg.io/base1/4.png'
const img3 = 'https://images.pokemontcg.io/base1/42.png'
const img4 = 'https://images.pokemontcg.io/base1/2.png'
  
  return (
    <nav className="navbar">
        <div>
     <a href="https://www.mobstudios.io/" target="_blank" rel="noreferrer">
        <img src='https://cdn.discordapp.com/attachments/1075476230637375528/1082941273201197107/logo.png'></img>
      </a>  
        </div>
    
  const ImageToggleOnMouseOver = ({primaryImg, secondaryImg}) => {
  const imageRef = useRef(null);

  return (
    <img 
      onMouseOver={() => {
        imageRef.current.src = secondaryImg;
      }}
      onMouseOut={() => {
        imageRef.current.src= primaryImg;
      }}
      src={primaryImg} 
      alt=""
      ref={imageRef}
    />
  )
}

    
      <Stack direction="row" justifyContent="center" alignItems="center" spacing={1}>
        <div>        
      <a href="https://the-hidden-valley.gitbook.io/solympusmob/" target="_blank" rel="noreferrer">
        <img src='https://avatars.githubusercontent.com/u/7111340?s=280&v=4'></img>
      </a>  
        </div>
          <Typography
          style={{
            color: '#ffffff',
            fontSize: '18px',
            fontWeight: 'bold',
            fontFamily: 'Helvetica-Bold,AdobeInvisFont,MyriadPro-Regular',
          }}
        >
          {
            wallet.connected ? `${balance.toFixed(2)} SOL` : ''
          }
          </Typography>    
    
          <WalletMultiButton />
      </Stack>
    </nav>
  )
}

class App extends Component {
  constructor() {
    super();
    this.state = {
      name: 'React'
    };
  }

  render() {
    return (
      <div>
        <ImageChangeOnMouseOver/>
      </div>
    );
  }
}

render(<App />, document.getElementById('root'));


export default Navbar
