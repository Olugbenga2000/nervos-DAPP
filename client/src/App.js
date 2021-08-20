import React, {useState,useEffect} from "react";
import Header from "./Header";
import Wallet from "./Wallet";
import NewOrder from "./NewOrder";
import AllOrders from "./AllOrders";
import MyOrders from "./MyOrders";
import AllTrades from "./AllTrades";
import {DEFAULT_SEND_OPTIONS} from "./high gas"
const SIDE = {
  BUY : 0,
  SELL : 1
}

function App({web3,contracts,accounts}) {
  const [user,setUser] = useState({
    accounts : [],
    balances : {tokenWallet : 0,
                tokenDex : 0
              },
    selectedToken : undefined
  })
  const [tokens, setTokens] = useState([])
  const [orders, setOrders] = useState({
    buy : [],
    sell : []
  })
   const [balance, setbalance] = useState(undefined)
  const [trades, setTrades] = useState([])
  const [listener, setListener] = useState(undefined)
  const getBalances = async (account, token) => {
    const tokenDex = await contracts.dex.methods.tradersbalances(
      account,web3.utils.fromAscii(token.ticker)).call()
    const tokenWallet = await contracts[token.ticker].methods.balanceOf(account).call()
    return {tokenWallet, tokenDex}
  }

  const getOrders = async token =>{
    const order = await Promise.all([
      contracts.dex.methods.getOrders(web3.utils.fromAscii(token.ticker),SIDE.BUY).call(),
      contracts.dex.methods.getOrders(web3.utils.fromAscii(token.ticker),SIDE.SELL).call()])
      return ({buy : order[0],
               sell : order[1]})
  }

  const listenToTrades = token =>{
    const tradeIds = new Set()
     setTrades([])
     const listener = contracts.dex.events.newTrade({
      filter : {ticker : web3.utils.fromAscii(token.ticker)},
      fromBlock : 0
    }).on('data', newTrade => {
      if (tradeIds.has(newTrade.returnValues.tradeId)){
        return
      }
      tradeIds.add(newTrade.returnValues.tradeId)
      setTrades(trades => ([...trades,newTrade.returnValues]))
    })
    setListener(listener)
  }

  const selectToken = async token => {
    const [balances, orders] = await Promise.all([
      getBalances(accounts[0],token),getOrders(token)])
    setUser({accounts,balances,selectedToken : token})
    setOrders(orders)
    listenToTrades(token)
    listener.unsubscribe()
  }
  
  const deposit = async amount => {
    await contracts[user.selectedToken.ticker].methods.approve(
      contracts.dex.options.address,amount
    ).send({...DEFAULT_SEND_OPTIONS,from : user.accounts[0]})
    await contracts.dex.methods.deposit
    (amount, web3.utils.fromAscii(user.selectedToken.ticker)).send({ ...DEFAULT_SEND_OPTIONS,from : user.accounts[0]})
    const balances = await getBalances(user.accounts[0],user.selectedToken)
    setUser(user => ({...user,balances}))
  }

  const withdraw = async amount => {
    await contracts.dex.methods.withdraw
    (amount, web3.utils.fromAscii(user.selectedToken.ticker)).send({...DEFAULT_SEND_OPTIONS,from : user.accounts[0]})
    const balances = await getBalances(user.accounts[0],user.selectedToken)
    setUser(user => ({...user,balances}))
  }

  const createMarketOrder = async (amount,side) => {
    await contracts.dex.methods.createMarketOrder(
      web3.utils.fromAscii(user.selectedToken.ticker),amount,side
      ).send({...DEFAULT_SEND_OPTIONS,from: user.accounts[0]})
    const orders = await getOrders(user.selectedToken)
     const balances = await getBalances(user.accounts[0],user.selectedToken)
    setOrders(orders)
     setUser(user => ({...user,balances}))
    listenToTrades(user.selectedToken)
  }

  const createLimitOrder = async (amount,price,side) => {
    await contracts.dex.methods.createLimitOrder(
      web3.utils.fromAscii(user.selectedToken.ticker),amount,price,side
    ).send({...DEFAULT_SEND_OPTIONS,from: user.accounts[0]})
    const orders = await getOrders(user.selectedToken)
    setOrders(orders)
   
  }
  
  useEffect(() =>{
    const init = async() =>{
      const rawTokens = await contracts.dex.methods.getTokens().call()
      const tokens = await rawTokens.map(token => ({
        ...token,
        ticker : web3.utils.hexToUtf8(token.ticker)
      }))
      const [balances,orders] = await Promise.all([getBalances(accounts[0],tokens[0]),
                                  getOrders(tokens[0])])
      const nerbalance = (await web3.eth.getBalance(accounts[0]))/100000000
      setbalance(nerbalance)
      setOrders(orders)
      listenToTrades(tokens[0])
      setTokens(tokens)
      setUser({
        accounts,
        balances,
        selectedToken : tokens[0]
      })
    }
    init()
  },[])

  if(typeof user.selectedToken === 'undefined'){
    return(
      <div>
        Loading ...
      </div>
    )
  }
  return (
    <div id ="app">
      <Header
      user = {user}
      tokens = {tokens}
      contracts = {contracts}
      selectToken = {selectToken}
      balance = {balance}/>
      <main className = 'container-fluid'>
        <div className = 'row'>
          <div className = 'col-sm-4 first-col'>
      <Wallet deposit = {deposit}
              withdraw = {withdraw}
              user = {user} />
      {user.selectedToken.ticker !== 'DAI'? (
      <NewOrder 
        createMarketOrder = {createMarketOrder}
        createLimitOrder = {createLimitOrder}/>)
        :null}
              </div>
      {user.selectedToken.ticker !== 'DAI'?
        <div className = "col-sm-8">
          <AllTrades trades = {trades}/>
          <AllOrders orders = {orders}/>
          <MyOrders orders = {{
              buy : orders.buy.filter(
                order => order.trader.toLowerCase() === user.accounts[0].toLowerCase()
              ),
              sell : orders.sell.filter(
                order => order.trader.toLowerCase() === user.accounts[0].toLowerCase()
              )
          }}/>
        </div> :null}
              </div>
      </main>
    </div>
  );
}

export default App;
