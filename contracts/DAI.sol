pragma solidity >= 0.6.0 < 0.7.0;
import '@openzeppelin/contracts/token/ERC20/ERC20.sol';
contract DAI is ERC20 {
  constructor() ERC20('DAI', 'Dai stablecoin') public {}
  function faucet(address to, uint amount) external {
    _mint(to, amount);
  }
}