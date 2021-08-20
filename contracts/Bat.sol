pragma solidity >= 0.6.0 < 0.7.0;
import '@openzeppelin/contracts/token/ERC20/ERC20.sol';
contract Bat is ERC20 {
  constructor() ERC20('BAT', 'Brave Browser token') public {}
  function faucet(address to, uint amount) external {
    _mint(to, amount);
  }
}