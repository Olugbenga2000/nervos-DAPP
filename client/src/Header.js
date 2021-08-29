import React from 'react'
import Dropdown from './Dropdown'

function Header({
    user,
    tokens,
    contracts,
    selectToken,
    gwoken
}){
return(
    <header className = "card">
    <div className="row">
        <div className="col-sm-1 flex">
            <Dropdown 
            items = {tokens.map(token =>({
                label : token.ticker,
                value : token
            }))}
            activeItem = {{
                label : user.selectedToken.ticker,
                value : user.selectedToken}}
            onSelect = {selectToken}/>
        </div>
        <div className = "col-sm-11">
            <h3 className = "header-title">
                Your <span className = "contract-address"> ETH address : <span className="address">
                    {user.accounts[0]}</span><br/>
                    Your Polyjuice address : <span className="address">
                    {gwoken.address}</span>
                    <br/>
                     Nervos layer2 balance : <span className="address">
                    {gwoken.balance} CKB</span><br/>
                     Deployed contract address : <span className="address">
                    {contracts.dex.options.address}</span>
                    <br/>
                     Deployed transaction hash : <span className="address">
                    0x159e3ab237ccf81fc619458deece528a985b6999b531133ef8e4ea6179fcd143</span>
                     </span>
            </h3>
        </div>
    </div></header>
)}
export default Header