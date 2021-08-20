# Decentralized-exchange
A decentralized exchange for trading erc-20 tokens.<br> The dex contract is located in the contracts directory. It defines several functions for creating market and limit orders and matching suitable orders. It also uses DAI token as the base currency for trading<br><br>
<b>Directories<b><hr>
The project is a truffle project containing several directories as initialized by truffle. <br>
Contracts - Contains the smart contract solidity code for the dex and the mock tokens.<br>
Migrations - Contains the migration files for deploying the contract<br>
Test - It contains the unit tests written in javascript for testing each functions in the smart contract for errors <br>
 client - it contains the code for running the UI for the dapp<br> 
 To run the user interface, go the client directory, run npm install to install the dependencies <br>
  then run npm start. Go to http://localhost:3000/ on your browser(metamask must be available) to see the frontend interface.
