import { clusterApiUrl, PublicKey } from "@solana/web3.js";
import coin_flip from './coin_flip.json';

export const CLUSTER =
  process.env.REACT_APP_CLUSTER === "mainnet"
    ? "mainnet"
    : process.env.REACT_APP_CLUSTER === "testnet"
    ? "testnet"
    : "devnet";

export const SOLANA_HOST = process.env.REACT_APP_SOLANA_API_URL
  ? process.env.REACT_APP_SOLANA_API_URL
  : CLUSTER === "mainnet"
  ? clusterApiUrl("mainnet-beta")
  : CLUSTER === "testnet"
  ? clusterApiUrl("devnet")
  // : "http://localhost:8899";
  : "https://lingering-floral-county.solana-mainnet.discover.quiknode.pro/14908275e5358062a97b9887bad9e1807f71358d/";

  console.log(SOLANA_HOST)

  export const STABLE_POOL_PROGRAM_ID = new PublicKey(
    '4Qe9somyZaeDio9TpMeUTjEyfpx7aSHYGHp7cBaxB77K',
  );
  
  export const STABLE_POOL_IDL = coin_flip;
