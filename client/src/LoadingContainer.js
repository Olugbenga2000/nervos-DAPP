import React,{useState,useEffect} from 'react';
import { getWeb3,getContract } from './utils';
import App from './App';

function LoadingContainer(){
    const[web3,setWeb3] = useState(undefined)
    const[accounts,setAccounts] = useState([])
    const[contracts,setContract] = useState(undefined)

    useEffect(() => {
        const init = async() => {
            const web3 = await getWeb3()
            const contracts = await getContract(web3)
            const accounts = await window.ethereum.selectedAddress
            setWeb3(web3)
            setContract(contracts)
            setAccounts([accounts])
        }
        init()
    },[])
    const isReady = () =>{
        return(typeof web3 !== undefined && 
            typeof contracts !== undefined && accounts.length > 0)
    }

    if(!isReady()){
        return <div>Loading ...</div>
    }
    return (<App web3 = {web3}
            accounts = {accounts}
            contracts = {contracts}/>)

}

export default LoadingContainer