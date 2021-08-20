import Web3 from "web3";
import ERC20ABI from './ERC20ABI.json'
import BATABI from './contract/Bat.json'
import DAIABI from './contract/DAI.json'
import DEX from './contract/DEX.json'
import { PolyjuiceHttpProvider } from '@polyjuice-provider/web3';
import { CONFIG } from './config';
import {DEFAULT_SEND_OPTIONS} from "./high gas"
const godwokenRpcUrl = CONFIG.WEB3_PROVIDER_URL;
const providerConfig = {
    rollupTypeHash: CONFIG.ROLLUP_TYPE_HASH,
    ethAccountLockCodeHash: CONFIG.ETH_ACCOUNT_LOCK_CODE_HASH,
    web3Url: godwokenRpcUrl
};

const getWeb3 = async() => {
      if (window.ethereum) {
        const godwokenRpcUrl = CONFIG.WEB3_PROVIDER_URL;
        const providerConfig = {
            rollupTypeHash: CONFIG.ROLLUP_TYPE_HASH,
            ethAccountLockCodeHash: CONFIG.ETH_ACCOUNT_LOCK_CODE_HASH,
            web3Url: godwokenRpcUrl
        };

        const provider = new PolyjuiceHttpProvider(godwokenRpcUrl, providerConfig);
        const web3 = new Web3(provider || Web3.givenProvider);
        console.log(web3)

        try {
            // Request account access if needed
            await window.ethereum.enable();
        } catch (error) {
            // User denied account access...
        }

        return web3;
    }

    console.log('Non-Ethereum browser detected. You should consider trying MetaMask!');
    return null;
  };

  const getContract = async web3 => {
      const dex = await new web3.eth.Contract(DEX.abi, 
        '0x44CF40726727582999D506613D6BD541fAdB69c5')
        const user = await window.ethereum.selectedAddress

    
    const tokenContracts = {'DAI': await new web3.eth.Contract(DAIABI.abi, '0xD11F112E3E7F81b2C6D89d2BB6b0C22C1e75C212'),
                        'BAT': await new web3.eth.Contract(BATABI.abi, '0x6a9632569a63b7f212BC668f296Ce1313BcE6325'),
                        'REP': await new web3.eth.Contract(BATABI.abi, '0x4901C2E0fC04C16Fb8cAfa0A2b4d46A4f11b4d4A'),
                        }
     return ({dex,...tokenContracts})
  }
  export {getWeb3,getContract}