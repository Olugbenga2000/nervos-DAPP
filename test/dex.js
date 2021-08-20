const {expectRevert} = require('@openzeppelin/test-helpers')
const { web3 } = require('@openzeppelin/test-helpers/src/setup')
const Dai = artifacts.require('DAI')
const Zrx = artifacts.require('Zrx')
const Bat = artifacts.require('Bat')
const Rep = artifacts.require('Rep')
const Dex = artifacts.require('DEX')
const SIDE={
    BUY:  0,
    SELL: 1
}

contract('DEX', (accounts) => {
    let dai,zrx,bat,rep,dex
    const[,trader1,trader2] = accounts
    const [DAI,ZRX,BAT,REP] = ['DAI','ZRX','BAT','REP'].map(ticker => web3.utils.fromAscii(ticker))
    beforeEach(async() => {(
    [dai,zrx,bat,rep] = await Promise.all([Dai.new(),
        Zrx.new(),
        Bat.new(),
        Rep.new(),]))
    dex = await Dex.new()
    await Promise.all([
        dex.addToken(DAI,dai.address),
        dex.addToken(ZRX,zrx.address),
        dex.addToken(BAT,bat.address),
        dex.addToken(REP,rep.address)
        ])
    const amount = web3.utils.toWei('1000')
    const seedTokenBalance = async(token, trader)=>{
        await token.faucet(trader,amount)
        await token.approve(dex.address,amount, {from:trader})
    }
    await Promise.all([dai,zrx,bat,rep].map(token => seedTokenBalance(token,trader1)))
    await Promise.all([dai,zrx,bat,rep].map(token => seedTokenBalance(token,trader2)))
    })
    it('should be able to deposit tokens', async() => {
        const amount = web3.utils.toWei('100')
        await dex.deposit(amount, DAI,{from:trader1})
        const balance = await dex.tradersbalances(trader1,DAI)
        assert(amount === balance.toString(),'traders balance isnt correct')
    })
    it('shouldnt deposit tokens that are not registered', async() =>{
        await expectRevert(
            dex.deposit(web3.utils.toWei('100'), 
                web3.utils.fromAscii('token-does-not-exist'),
                {from:trader1}),'token does not exist'
        )
    })
    it('should withdraw tokens',async() =>{
        const amount = web3.utils.toWei('100')
        await dex.deposit(amount, DAI,{from:trader1})
        await dex.withdraw(amount, DAI,{from:trader1})
        const balance = await dex.tradersbalances(trader1,DAI)
        const tokenBalance = await dai.balanceOf(trader1)
        assert(balance.isZero(),'withdraw not successful in the contract')
        assert(tokenBalance.toString() == web3.utils.toWei('1000'),'withdraw not reflected in external wallet')
    })
    it('should not withdraw if token does not exist', async() =>{
        await expectRevert(
            dex.withdraw(web3.utils.toWei('100'), 
                web3.utils.fromAscii('token-does-not-exist'),
                {from:trader1}),'token does not exist'
        )
    })

    it('should not withdraw tokens if balance is too low',async() =>{
        const amount = web3.utils.toWei('100')
        await dex.deposit(amount, DAI,{from:trader1})
        await expectRevert(
            dex.withdraw(web3.utils.toWei('1000'), 
                DAI,
                {from:trader1}),'balance too low'
        )
    })

    it('should successfully create a limit order', async() => {
        let amount = web3.utils.toWei('100')
        await dex.deposit(amount, DAI,{from:trader1})
        await dex.createLimitOrder(REP,web3.utils.toWei('10'),
            10,SIDE.BUY,{from:trader1})
        let buyOrders = await dex.getOrders(REP,SIDE.BUY)
        let sellOrders = await dex.getOrders(REP,SIDE.SELL)
        assert(buyOrders.length === 1,'buy orders should have 1 order')
        assert(buyOrders[0].trader === trader1,'the traders address should be trader1')
        assert(buyOrders[0].price === '10','the orders price should be 10')
        assert(buyOrders[0].amount === web3.utils.toWei('10'),'the orders amount should be 10')
        assert(buyOrders[0].ticker === web3.utils.padRight(REP,64),'the traders address should be trader1')
        assert(sellOrders.length === 0,'sell orders should be 0')
        
        amount = web3.utils.toWei('200')
        await dex.deposit(amount, DAI,{from:trader2})
        await dex.createLimitOrder(REP,web3.utils.toWei('10'),
            11,SIDE.BUY,{from:trader2})
        buyOrders = await dex.getOrders(REP,SIDE.BUY)
        sellOrders = await dex.getOrders(REP,SIDE.SELL)
        assert(buyOrders.length === 2,'buy orders should have 2 orders')
        assert(buyOrders[0].trader === trader2,'the first trader address should be trader2')
        assert(buyOrders[1].trader === trader1,'the second trader address should be trader1')
        assert(sellOrders.length === 0,'sell orders should be 0')

        await dex.createLimitOrder(REP,web3.utils.toWei('10'),
            9,SIDE.BUY,{from:trader2})
        buyOrders = await dex.getOrders(REP,SIDE.BUY)
        sellOrders = await dex.getOrders(REP,SIDE.SELL)
        assert(buyOrders.length === 3,'buy orders should have 2 orders')
        assert(buyOrders[0].trader === trader2,'the first trader address should be trader2')
        assert(buyOrders[1].trader === trader1,'the second trader address should be trader1')
        assert(buyOrders[2].trader === trader2,'the third trader address should be trader2')
        assert(buyOrders[2].price === '9','the orders price should be 9')
        assert(sellOrders.length === 0,'sell orders should be 0')
        })

        it('should revert if token does not exist', async() => {
           await expectRevert(dex.createLimitOrder
            (web3.utils.fromAscii('TOKEN-DOES-NOT-EXIST'),web3.utils.toWei('100'),
           9,SIDE.BUY,{from:trader2}),'token does not exist')
        })
        it('should revert if token is DAI', async() => {
            await expectRevert(dex.createLimitOrder
             (DAI,web3.utils.toWei('100'),9,SIDE.BUY,{from:trader2}),'cannot trade DAI')
         })
         it('should revert if token balance is too low', async() =>{
            await dex.deposit(web3.utils.toWei('99'), REP,{from:trader2}) 
            await expectRevert(dex.createLimitOrder(REP,web3.utils.toWei('100'),
            10,SIDE.SELL,{from:trader2}),'token balance too low')
         })

        it('should revert if DAI balance is too low', async() =>{
                await dex.deposit(web3.utils.toWei('99'), DAI,{from:trader2}) 
                await expectRevert(dex.createLimitOrder(REP,web3.utils.toWei('10'),
                10,SIDE.BUY,{from:trader2}),'dai balance too low')
            
         })

        it('should create a market order and match it to a limit order', async() =>{
            await dex.deposit(web3.utils.toWei('100'), DAI,{from:trader1})
            dex.createLimitOrder(REP,web3.utils.toWei('10'),
            10,SIDE.BUY,{from:trader1})
            await dex.deposit(web3.utils.toWei('100'), REP,{from:trader2})
            await dex.createMarketOrder(REP,web3.utils.toWei('5'),
                SIDE.SELL,{from:trader2})
            const balance = await Promise.all([
                dex.tradersbalances(trader1,DAI),
                dex.tradersbalances(trader1,REP),
                dex.tradersbalances(trader2,DAI),
                dex.tradersbalances(trader2,REP)
            ])
            const order = await dex.getOrders(REP,SIDE.BUY)
            assert(order[0].filled === web3.utils.toWei('5'),'Five orders should be matched')
            assert(balance[0].toString() === web3.utils.toWei('50'), 'trader1 DAI balance should be 50')
            assert(balance[1].toString() === web3.utils.toWei('5'), 'trader1 REP balance should be 5')
            assert(balance[2].toString() === web3.utils.toWei('50'), 'trader2 DAI balance should be 50')
            assert(balance[3].toString() === web3.utils.toWei('95'), 'trader2 REP balance should be 95')
        })

        it('should revert if token does not exist', async() => {
            await expectRevert(dex.createMarketOrder
             (web3.utils.fromAscii('TOKEN-DOES-NOT-EXIST'),web3.utils.toWei('100'),
            SIDE.BUY,{from:trader2}),'token does not exist')
         })

         it('should revert if token is DAI', async() => {
            await expectRevert(dex.createMarketOrder
             (DAI,web3.utils.toWei('100'),SIDE.BUY,{from:trader2}),'cannot trade DAI')
         }) 

         it('should revert if token balance is too low', async() =>{
            await dex.deposit(web3.utils.toWei('99'), REP,{from:trader2}) 
            await expectRevert(dex.createMarketOrder(REP,web3.utils.toWei('100'),
            SIDE.SELL,{from:trader2}),'token balance too low')
         })

        it('should revert if DAI balance is too low', async() =>{
                await dex.deposit(web3.utils.toWei('100'), REP,{from:trader1}) 
                await dex.createLimitOrder(REP,web3.utils.toWei('100'),10, SIDE.SELL,{from:trader1})
                await dex.deposit(web3.utils.toWei('99'), DAI,{from:trader2}) 
                await expectRevert(dex.createMarketOrder(REP,web3.utils.toWei('10'),
                SIDE.BUY,{from:trader2}),'dai balance too low')
            
         })

})