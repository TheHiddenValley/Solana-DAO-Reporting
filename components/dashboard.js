import React, { useState, useEffect } from 'react'
import {
  Box,
  Grid,
  Stack,
  Typography,
  Button,
  TextField,
  Container,
  Fab
} from '@mui/material'
import CasinoIcon from '@mui/icons-material/Casino'
import AutoModeIcon from '@mui/icons-material/AutoMode';
import PaidIcon from '@mui/icons-material/Paid';
import { styled } from '@mui/system';

import { getOrCreateAssociatedTokenAccount, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { useWallet } from "@solana/wallet-adapter-react";
import { Account, STAKE_CONFIG_ID } from "@solana/web3.js";
import { SOLANA_HOST } from "../utils/const";
import { getProgramInstance } from "../utils/get-program";
import { TokenInstructions } from '@project-serum/serum';

import WinLoseModal from './WinLoseModal'
import Spinner from './Spinner';

const anchor = require('@project-serum/anchor');
const { BN, web3, Program, ProgramError, Provider } = anchor
// const provider = anchor.Provider.local()
// anchor.setProvider(provider);
const utf8 = anchor.utils.bytes.utf8;
const { PublicKey, SystemProgram, Keypair, Transaction } = web3

//Wrapped SOL

export const WRAPPED_SOL_MINT = new PublicKey(
  'EDmXufwcgWuSUnRaFWGbvHehDbWRe5RviEvmbPaws8kE',
);

const defaultAccounts = {
  tokenProgram: TOKEN_PROGRAM_ID,
  clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,
  systemProgram: SystemProgram.programId,
  rent: anchor.web3.SYSVAR_RENT_PUBKEY,
}



export const Dashboard = ({ updateBalance, balance }) => {
  const wallet = useWallet();
  const connection = new anchor.web3.Connection(SOLANA_HOST);

  const program = getProgramInstance(connection, wallet);
  
  //State variables
  const [selected, setSelected] = useState('HEADS')
  const [selectedd, setSelectedd] = useState('BETA')
  const [betType, setBetType] = useState('HEADS')
  const [betAmount, setBetAmount] = useState(0.05)
  const [isWin, setIsWin] = useState(0)
  const [open, setOpen] = React.useState(false)
  const [spinCount, setSpinCount] = useState(0);
  const [claimableAmount, setClaimableAmount] = useState(0);
  const [isClaimable, setIsClaimable] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isClaming, setIsClaming] = useState(false)

  useEffect(() => {
    const init = async () => {
      updateBalance();
      let [userTreasury] = await anchor.web3.PublicKey.findProgramAddress(
        [Buffer.from('coin-flip-user-treasury'), wallet.publicKey.toBuffer(), WRAPPED_SOL_MINT.toBuffer()],
        program.programId
      );

      let userTreasuryAccount

      try {
        userTreasuryAccount = await program.account.userTreasury.fetch(userTreasury);
        console.log("spin count=>", userTreasuryAccount.spinWinCnt.toNumber() + userTreasuryAccount.spinLoseCnt.toNumber())
        setSpinCount(userTreasuryAccount.spinWinCnt.toNumber() + userTreasuryAccount.spinLoseCnt.toNumber());
        setClaimableAmount(userTreasuryAccount.balance.toNumber());
      } catch (e) {
        console.log(e.message);
      }
    }

    init()
  })

  const startBet = () => {
    if (betAmount < 0.05) {
      alert('Bet amount should be at least 0.05 SOL!')
    }
    const isHead = selected === "HEADS" ? true : false;
    processGame(betAmount * 1000000000, isHead, false)
  }
  const freeSpin = () => {
    const isHead = selected === "HEADS" ? true : false;
    processGame(0, isHead, true)
  }

  const createTreasury = async () => {
    let [tradeTreasury] = await anchor.web3.PublicKey.findProgramAddress(
      [Buffer.from('coin-flip-treasury'), WRAPPED_SOL_MINT.toBuffer()],
      program.programId
    );

    let [tradeVault] = await anchor.web3.PublicKey.findProgramAddress(
      [Buffer.from('coin-flip-vault'), WRAPPED_SOL_MINT.toBuffer()],
      program.programId
    );

    let tx = await program.rpc.createTreasury({
      accounts: {
        tradeTreasury: tradeTreasury,
        tradeMint: WRAPPED_SOL_MINT,
        tradeVault: tradeVault,
        authority: wallet.publicKey,
        ...defaultAccounts
      },
    });

    console.log(tx);
  }

  const processGame = async (amount, isHead, isSpin) => {
    let [tradeTreasury] = await anchor.web3.PublicKey.findProgramAddress(
      [Buffer.from('coin-flip-treasury'), WRAPPED_SOL_MINT.toBuffer()],
      program.programId
    );

    let [tradeVault] = await anchor.web3.PublicKey.findProgramAddress(
      [Buffer.from('coin-flip-vault'), WRAPPED_SOL_MINT.toBuffer()],
      program.programId
    );
    console.log(tradeVault.toBase58());

    let [userTreasury] = await anchor.web3.PublicKey.findProgramAddress(
      [Buffer.from('coin-flip-user-treasury'), wallet.publicKey.toBuffer(), WRAPPED_SOL_MINT.toBuffer()],
      program.programId
    );

    let oldUserTreasuryAccount

    try {
      oldUserTreasuryAccount = await program.account.userTreasury.fetch(userTreasury);
      console.log(oldUserTreasuryAccount.generalWinCnt.toNumber(), oldUserTreasuryAccount.generalLoseCnt.toNumber(), oldUserTreasuryAccount.balance.toNumber());
    } catch (e) {
      console.log(e.message);
    }

    const wrappedSolAccount = new Account();
    const transaction = new Transaction();
    const signers = [];

    transaction.add(
      SystemProgram.createAccount({
        fromPubkey: wallet.publicKey,
        lamports: amount + 2.04e6,
        newAccountPubkey: wrappedSolAccount.publicKey,
        programId: TOKEN_PROGRAM_ID,
        space: 165,
      }),
      TokenInstructions.initializeAccount({
        account: wrappedSolAccount.publicKey,
        mint: WRAPPED_SOL_MINT,
        owner: wallet.publicKey,
      }),
      program.instruction.processGame(new BN(amount), isHead, isSpin, {
        accounts: {
          tradeTreasury: tradeTreasury,
          tradeMint: WRAPPED_SOL_MINT,
          tradeVault: tradeVault,
          userTreasury: userTreasury,
          userVault: wrappedSolAccount.publicKey,
          authority: wallet.publicKey,
          ...defaultAccounts
        },
      }),
      TokenInstructions.closeAccount({
        source: wrappedSolAccount.publicKey,
        destination: wallet.publicKey,
        owner: wallet.publicKey,
      }),
    );
    signers.push(wrappedSolAccount);

    try {
      const tx = await program.provider.send(transaction, signers);
      console.log(tx);
    } catch (e) {

    }

    updateBalance();

    let newUserTreasuryAccount
    const isWin = 0;

    setIsLoading(true)
    while (1) {
      try {
        newUserTreasuryAccount = await program.account.userTreasury.fetch(userTreasury);
        setClaimableAmount(newUserTreasuryAccount.balance.toNumber());

        if (oldUserTreasuryAccount) {
          if (isSpin) {
            const oldWins = oldUserTreasuryAccount.spinWinCnt.toNumber();
            const oldLoses = oldUserTreasuryAccount.spinLoseCnt.toNumber();

            const newWins = newUserTreasuryAccount.spinWinCnt.toNumber();
            const newLoses = newUserTreasuryAccount.spinLoseCnt.toNumber();

            setSpinCount(newUserTreasuryAccount.spinWinCnt.toNumber() + newUserTreasuryAccount.spinLoseCnt.toNumber());

            if (oldWins === newWins && oldLoses < newLoses) {
              console.log('User Spin Lose');
              if (selected === "HEADS")
                setBetType("TAILS")
              else
                setBetType("HEADS")

              isWin = 1;

              break;
            } else if (oldWins < newWins && oldLoses === newLoses) {
              console.log('User Spin Win');
              if (selected === "HEADS")
                setBetType("HEADS")
              else
                setBetType("TAILS")

              isWin = 0;

              break;
            }
          } else {
            const oldWins = oldUserTreasuryAccount.generalWinCnt.toNumber();
            const oldLoses = oldUserTreasuryAccount.generalLoseCnt.toNumber();

            const newWins = newUserTreasuryAccount.generalWinCnt.toNumber();
            const newLoses = newUserTreasuryAccount.generalLoseCnt.toNumber();

            if (oldWins === newWins && oldLoses < newLoses) {
              console.log('User Coin Flip Lose');
              if (selected === "HEADS")
                setBetType("TAILS")
              else
                setBetType("HEADS")

              isWin = 0;

              break;
            } else if (oldWins < newWins && oldLoses === newLoses) {
              console.log('User Coin Flip Win');
              if (selected === "HEADS")
                setBetType("HEADS")
              else
                setBetType("TAILS")

              isWin = 1;
              break;
            }
          }

        } else {
          if (newUserTreasuryAccount) {
            const newWins = isSpin ? newUserTreasuryAccount.spinWinCnt.toNumber() : newUserTreasuryAccount.generalWinCnt.toNumber();

            if (newWins === 1) {
              console.log('User Wins');
              if (selected === "HEADS")
                setBetType("HEADS")
              else
                setBetType("TAILS")

              isWin = 1;
            }
            else {
              console.log('User lose');
              if (selected === "HEADS")
                setBetType("TAILS")
              else
                setBetType("HEADS")

              isWin = 0;
            }

            break;
          }
        }


      } catch (e) {
        console.log(e.message);
      }
    }
    setIsLoading(false)

    setIsWin(isWin);
    if (isWin)
      setIsClaimable(true)
    else
      setIsClaimable(false)

    handleClickOpen()
  }

  const claimReward = async () => {
    let [tradeTreasury] = await anchor.web3.PublicKey.findProgramAddress(
      [Buffer.from('coin-flip-treasury'), WRAPPED_SOL_MINT.toBuffer()],
      program.programId
    );

    let [tradeVault] = await anchor.web3.PublicKey.findProgramAddress(
      [Buffer.from('coin-flip-vault'), WRAPPED_SOL_MINT.toBuffer()],
      program.programId
    );
    console.log(tradeVault.toBase58());

    let [userTreasury] = await anchor.web3.PublicKey.findProgramAddress(
      [Buffer.from('coin-flip-user-treasury'), wallet.publicKey.toBuffer(), WRAPPED_SOL_MINT.toBuffer()],
      program.programId
    );

    const wrappedSolAccount = new Account();
    const transaction = new Transaction();
    const signers = [];

    transaction.add(
      SystemProgram.createAccount({
        fromPubkey: wallet.publicKey,
        lamports: 2.04e6,
        newAccountPubkey: wrappedSolAccount.publicKey,
        programId: TOKEN_PROGRAM_ID,
        space: 165,
      }),
      TokenInstructions.initializeAccount({
        account: wrappedSolAccount.publicKey,
        mint: WRAPPED_SOL_MINT,
        owner: wallet.publicKey,
      }),
      program.instruction.claim({
        accounts: {
          tradeTreasury: tradeTreasury,
          tradeMint: WRAPPED_SOL_MINT,
          tradeVault: tradeVault,
          userTreasury: userTreasury,
          userVault: wrappedSolAccount.publicKey,
          authority: wallet.publicKey,
          ...defaultAccounts
        },
      }),
      TokenInstructions.closeAccount({
        source: wrappedSolAccount.publicKey,
        destination: wallet.publicKey,
        owner: wallet.publicKey,
      }),
    );
    signers.push(wrappedSolAccount);

    setIsClaming(true)
    try {
      const tx = await program.provider.send(transaction, signers);
      console.log(tx);
      setClaimableAmount(0)

    } catch (e) {
      alert("Insufficent funds on Smart Contract!")
      console.log(e.message.error);
    }
    setIsClaming(false)

    updateBalance();
  }

  const withdraw = async () => {
    let [tradeTreasury] = await anchor.web3.PublicKey.findProgramAddress(
      [Buffer.from('coin-flip-treasury'), WRAPPED_SOL_MINT.toBuffer()],
      program.programId
    );

    let [tradeVault] = await anchor.web3.PublicKey.findProgramAddress(
      [Buffer.from('coin-flip-vault'), WRAPPED_SOL_MINT.toBuffer()],
      program.programId
    );

    let [userTreasury] = await anchor.web3.PublicKey.findProgramAddress(
      [Buffer.from('coin-flip-user-treasury'), wallet.publicKey.toBuffer(), WRAPPED_SOL_MINT.toBuffer()],
      program.programId
    );

    const wrappedSolAccount = new Account();
    const transaction = new Transaction();
    const signers = [];

    transaction.add(
      SystemProgram.createAccount({
        fromPubkey: wallet.publicKey,
        lamports: 2.04e6,
        newAccountPubkey: wrappedSolAccount.publicKey,
        programId: TOKEN_PROGRAM_ID,
        space: 165,
      }),
      TokenInstructions.initializeAccount({
        account: wrappedSolAccount.publicKey,
        mint: WRAPPED_SOL_MINT,
        owner: wallet.publicKey,
      }),
      program.instruction.claim({
        accounts: {
          tradeTreasury: tradeTreasury,
          tradeMint: WRAPPED_SOL_MINT,
          tradeVault: tradeVault,
          userVault: wrappedSolAccount.publicKey,
          authority: wallet.publicKey,
          ...defaultAccounts
        },
      }),
      TokenInstructions.closeAccount({
        source: wrappedSolAccount.publicKey,
        destination: wallet.publicKey,
        owner: wallet.publicKey,
      }),
    );
    signers.push(wrappedSolAccount);

    try {
      const tx = await program.provider.send(transaction, signers);
      console.log(tx);
    } catch (e) {
      console.log(e.message);
    }

    updateBalance();
  }

  // ~~~~~~~~~~~~~~~~ Game Logic ~~~~~~~~~~~~~~
  // Set Heads or Tails
  const headsSelected = () => {
    setSelected('HEADS')
  }
  const tailsSelected = () => {
    setSelected('TAILS')
  }
  // Set Bet Amount 0.05
  const betaSelected = () => {
    setSelectedd('BETA'), setBetAmount(0.05)
  }  
    // Set Bet Amount 0.1
  const betbSelected = () => {
    setSelectedd('BETB'), setBetAmount(0.1)
  }  
    // Set Bet Amount 0.25
  const betcSelected = () => {
    setSelectedd('BETC'), setBetAmount(0.25)
  }
    // Set Bet Amount 0.5
  const betdSelected = () => {
    setSelectedd('BETD'), setBetAmount(0.5)
  }  
    // Set Bet Amount 1
  const beteSelected = () => {
    setSelectedd('BETE'), setBetAmount(1)
  }
    // Set Bet Amount 2
  const betfSelected = () => {
    setSelectedd('BETF'), setBetAmount(2)
  }

  // Open and Close Win/Lose Modal
  const handleClickOpen = () => {
    setTimeout(() => setOpen(true), 1500)
  }
  // Custom color For Heads and Tails
  const HeadColor = styled(Typography)(({ theme }) => ({
    fontSize: '20px !important',
    textAlign: 'center',
    background:
      '#ffffff',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent'
  }));
  const TailColor = styled(Typography)(({ theme }) => ({
    fontSize: '20px !important',
    textAlign: 'center',
    background:
      '#ffffff',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent'
  }));
  const CustomTextField = styled(TextField)(({ theme }) => ({
    '& .MuiOutlinedInput-root .MuiOutlinedInput-notchedOutline': {
      borderColor: '#ffda6f',
    },
    '& .MuiOutlinedInput-input': {
      color: '#ffffff',
    },
    width: '400px',
  }));
  
  
  return (

    <section className="landing">
      <div className="dark-overlay">
        <div className="container">
<Container maxWidth="lg">
  <Stack
    direction="row"
    mt={5}
    justifyContent="space-evenly"
    flexWrap="wrap"
    sx={{ width: '100%', gap: '2rem' }}
  >
    {/* MOB text */}
    <Stack>
<div style={{ color: 'white', fontSize: '16px' }}>
  <h1 style={{ fontSize: '64px' }}>Fuck it. We MOB</h1>
          <Box
            sx={{
              background: 'rgba(255, 255, 255, 0)',
              borderRadius: '10px',
              height: '40px',
              width: '100%',
            }}
          >
           </Box>
  <h1 style={{ fontSize: '24px' }}>Mob Manifesto</h1>
          <Box
            sx={{
              background: 'rgba(255, 255, 255, 0)',
              borderRadius: '10px',
              height: '20px',
              width: '100%',
            }}
          >
           </Box>
  <p>First of all: The Mob Does Not Compromise.</p>
  <p>The Infected Mob is the stratum of Mob Studios,</p>
  <p>A Web 3 entity with big plans.</p>
  <p>We&apos;re here to better the ecosystem once and for all,</p>
  <p>and we&apos;re not afraid of being ambitious.</p>
  <p>Mob Studios is a team of visionaries,</p>
  <p>all highly competent within their respective fields,</p>
  <p>and combined with a well-organized structure;</p>
  <p>we&apos;re more than confident our impact will not go unnoticed.</p>
  <p>Get ready to be #NFCTD</p>
          <Box
            sx={{
              background: 'rgba(255, 255, 255, 0)',
              borderRadius: '10px',
              height: '40px',
              width: '100%',
            }}
          >
           </Box>
<h1 style={{ fontSize: '24px', transition: 'font-size 0.3s ease' }}>
  <a href="https://the-hidden-valley.gitbook.io/solympusmob/" target="_blank" rel="noreferrer" style={{ textDecoration: 'none', color: 'white' }}
     onMouseOver={(e) => e.currentTarget.style.color = 'red'}
     onMouseOut={(e) => e.currentTarget.style.color = 'white'}>
    SolympusMOB Gitbook or Whitepaper
  </a>
</h1>
</div>
    </Stack>

    <Stack>
<div style={{ height: '544px', maxWidth: '640px', width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column' }}>
  <iframe title="StrawPoll Embed" id="strawpoll_iframe_eNg69oWd4nA" src="https://strawpoll.com/embed/polls/eNg69oWd4nA" style={{ position: 'static', visibility: 'visible', display: 'block', width: '100%', flexGrow: 1 }} frameBorder="0" allowFullScreen allowTransparency>Loading...</iframe>
  <script async src="https://cdn.strawpoll.com/dist/widgets.js" charSet="utf-8"></script>
</div>
    </Stack>
  </Stack>
</Container>
            
                      <Box
            sx={{
              background: 'rgba(255, 255, 255, 0)',
              borderRadius: '10px',
              height: '150',
              width: '100%',
              p: 3,
            }}
          >
            </Box>
            
            
          <Box
            sx={{
              background: 'rgba(255, 255, 255, 0.5)',
              borderRadius: '10px',
              width: '100%',
              height: 'auto',
              p: 3,
            }}
          >
            
            <Container maxWidth="lg">
                <Stack
                  direction="row"
                  mt={5}
                  justifyContent={'space-evenly'}
                  flexWrap="wrap"
                  sx={{ width: '100%' }}
                >
                  {/* Main Pie Chart */}
<Stack>
  <iframe
  title="Main Pie Chart"
  width="403" 
  height="311" 
  frameBorder="0"
  scrolling="no"
  style={{ display: 'block', margin: '0 auto' }}
  src="https://docs.google.com/spreadsheets/d/e/2PACX-1vTenhHYcAY7N4rM6bGeYupReT6yY5DaogD7vMsJa8Jn8DvbDmdEaXIb_n75qzZTltSPD0obpjrVxGsM/pubchart?oid=1855293623&amp;format=interactive"
></iframe>          
</Stack>
                  {/* Sharky.fi Profit Chart */}
                <Stack>
<iframe 
  title="Sharkyfi Chart"
  src="https://docs.google.com/spreadsheets/d/e/2PACX-1vTenhHYcAY7N4rM6bGeYupReT6yY5DaogD7vMsJa8Jn8DvbDmdEaXIb_n75qzZTltSPD0obpjrVxGsM/pubchart?oid=294631629&amp;format=interactive"
  width="403" 
  height="311" 
  frameBorder="0" 
  scrolling="no"
  style={{ display: 'block', margin: '0 auto' }}
></iframe>
              </Stack>
              </Stack>
            </Container>
          </Box>

          <Box
            sx={{
              background: 'rgba(255, 255, 255, 0)',
              borderRadius: '10px',
              height: '300',
              width: '100%',
              p: 3,
            }}
          >
            </Box>


          <Box
            sx={{
              background: 'rgba(255, 255, 255, 0.5)',
              borderRadius: '10px',
              height: 'auto',
              width: '100%',
              p: 3,
            }}
          >
            <Container maxWidth="lg">
                    <iframe width="100%" height="420" src="https://docs.google.com/spreadsheets/d/e/2PACX-1vTenhHYcAY7N4rM6bGeYupReT6yY5DaogD7vMsJa8Jn8DvbDmdEaXIb_n75qzZTltSPD0obpjrVxGsM/pubhtml?gid=0&amp;single=true&amp;widget=true&amp;headers=false"></iframe>
          </Container>
         </Box>


          <Box
            sx={{
              background: 'rgba(255, 255, 255, 0)',
              borderRadius: '10px',
              height: '300',
              width: '100%',
              p: 3,
            }}
          >
            </Box>


          <Box
            sx={{
              background: 'rgba(255, 255, 255, 0.5)',
              borderRadius: '10px',
              height: 'auto',
              width: '100%',
              p: 3,
            }}
          >
            <Container maxWidth="lg">
      <iframe width="100%" height="420" src="https://docs.google.com/spreadsheets/d/e/2PACX-1vTenhHYcAY7N4rM6bGeYupReT6yY5DaogD7vMsJa8Jn8DvbDmdEaXIb_n75qzZTltSPD0obpjrVxGsM/pubhtml?gid=1856558530&amp;single=true&amp;widget=true&amp;headers=false"></iframe>

          </Container>
         </Box>
        </div>
      </div>
<div style={{ position: 'fixed', bottom: 0, width: '100%' }}>
  <iframe src="https://open.spotify.com/embed/track/1KhhvjUPTxexPzPGsfEPbO?utm_source=generator&theme=0&autoplay=true" width="20%" height="80" frameBorder="0" allow="autoplay; encrypted-media" allowtransparency="true"></iframe>
</div>
    </section>
  );
}
