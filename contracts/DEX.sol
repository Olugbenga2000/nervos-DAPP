pragma experimental ABIEncoderV2;
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/math/SafeMath.sol';
contract DEX {
  using SafeMath for uint;
  enum Side{
    BUY,SELL
  }
  struct Token{
    bytes32 ticker;
    address tokenAddress;
  }
  struct Order{
    uint id;
    address trader;
    Side side;
    uint amount;
    uint filled;
    uint price;
    bytes32 ticker;
    uint date;
  }
  mapping(bytes32 => Token) public tokens;
  mapping(address => mapping(bytes32 => uint))public tradersbalances;
  mapping(bytes32 => mapping(uint => Order[])) public orderBook;
  bytes32[] public tokenList;
  address public admin;
  bytes32 DAI = bytes32('DAI');
  uint nextOrderId;
  uint nextTradeId;
  event newTrade(
    uint tradeId,
    uint orderId,
    bytes32 indexed ticker,
    address indexed trader1,
    address indexed trader2,
    uint amount,
    uint price,
    uint date
  );

  constructor() public {
    admin = msg.sender;
  }
   modifier onlyAdmin(){
    require(msg.sender == admin, 'Not an admin address');
    _;
  }
  
  modifier tokenExist(bytes32 _ticker){
    require(tokens[_ticker].tokenAddress != address(0), 'this token does not exist' );
    _;
  }

  modifier tokenIsNotDai(bytes32 _ticker){
      require(_ticker != DAI, 'cannot trade DAI');
      _;
  }

  function addToken(bytes32 _ticker, address _tokenAddress) external onlyAdmin{
    tokens[_ticker] = Token(_ticker, _tokenAddress);
    tokenList.push(_ticker);
  }

  function deposit(uint _amount, bytes32 _ticker) external tokenExist(_ticker) {
    IERC20(tokens[_ticker].tokenAddress).transferFrom(msg.sender, address(this), _amount);
    tradersbalances[msg.sender][_ticker] = tradersbalances[msg.sender][_ticker].add(_amount);
  }

  function withdraw(uint _amount, bytes32 _ticker) external tokenExist(_ticker){
    require(tradersbalances[msg.sender][_ticker] >= _amount, 'balance too low');
    tradersbalances[msg.sender][_ticker] = tradersbalances[msg.sender][_ticker].sub(_amount);
    IERC20(tokens[_ticker].tokenAddress).transfer(msg.sender, _amount);
  }

  function createLimitOrder(bytes32 _ticker, uint _amount,
   uint _price, Side _side) tokenExist(_ticker) external tokenIsNotDai(_ticker) {
     if(_side == Side.SELL){
       require (tradersbalances[msg.sender][_ticker] >= _amount, 'token balance too low');
     }
     else{
       require( tradersbalances[msg.sender][DAI] >= _amount * _price, 'dai balance too low');
     }
     Order[] storage orders = orderBook[_ticker][uint(_side)];
     orders.push(
       Order(nextOrderId,
              msg.sender,
              _side,
              _amount,
              0,
              _price,
              _ticker,
              now
              ));

    uint i = orders.length > 0 ? orders.length - 1 : 0;
    while(i > 0){
      if(_side == Side.BUY && orders[i-1].price > orders[i].price ){
        break;
      }
      if(_side == Side.SELL && orders[i-1].price < orders[i].price){
        break;
      }
      Order memory order = orders[i-1];
      orders[i-1] = orders[i];
      orders[i] = order;
      i--;
    }
    nextOrderId++;
   }

function createMarketOrder(bytes32 _ticker,uint _amount, Side _side) 
tokenExist(_ticker) tokenIsNotDai(_ticker) external{
    if(_side == Side.SELL){
      require(tradersbalances[msg.sender][_ticker] >= _amount, 'token balance too low');
    }
    Order[] storage orders = orderBook[_ticker][uint(_side == Side.BUY ? Side.SELL : Side.BUY )];
    uint i = 0;
    uint remaining = _amount;

    while(i < orders.length && remaining > 0){
      uint available = orders[i].amount.sub(orders[i].filled);
      uint matched = (remaining > available)? available : remaining;
      remaining = remaining.sub(matched);
      orders[i].filled =orders[i].filled.add(matched);
      emit newTrade(  
        nextTradeId,
        orders[i].id,
        _ticker,
        orders[i].trader,
        msg.sender,
        matched,
        orders[i].price,
        now);
      if (_side == Side.SELL){
        tradersbalances[msg.sender][_ticker] = tradersbalances[msg.sender][_ticker].sub(matched);
        tradersbalances[msg.sender][DAI] = tradersbalances[msg.sender][DAI].add(matched.mul(orders[i].price));
        tradersbalances[orders[i].trader][_ticker] = tradersbalances[orders[i].trader][_ticker].add(matched);
        tradersbalances[orders[i].trader][DAI] = tradersbalances[orders[i].trader][DAI].sub(matched * orders[i].price);
      }
      if (_side == Side.BUY){
        require (tradersbalances[msg.sender][DAI] >= matched * orders[i].price, 'dai balance too low');
        tradersbalances[msg.sender][_ticker] = tradersbalances[msg.sender][_ticker].add(matched);
        tradersbalances[msg.sender][DAI] = tradersbalances[msg.sender][DAI].sub(matched.mul(orders[i].price));
        tradersbalances[orders[i].trader][_ticker] = tradersbalances[orders[i].trader][_ticker].sub(matched);
        tradersbalances[orders[i].trader][DAI] = tradersbalances[orders[i].trader][DAI].add(matched * orders[i].price);
      }
      i = i.add(1);
      nextTradeId = nextTradeId.add(1);
    }
    i = 0;
    while(i < orders.length && orders[i].filled == orders[i].amount){
      for(uint j = i; j < orders.length.sub(1); j++){
        orders[j] = orders[j.add(1)]; 
      }
      orders.pop();
      i++;
    }

}
function getOrders(
  bytes32 ticker, 
  Side side) 
  external 
  view
  returns(Order[] memory) {
  return orderBook[ticker][uint(side)];
}

function getTokens() 
      external 
      view 
      returns(Token[] memory) {
      Token[] memory _tokens = new Token[](tokenList.length);
      for (uint i = 0; i < tokenList.length; i++) {
        _tokens[i] = Token(
          tokens[tokenList[i]].ticker,
          tokens[tokenList[i]].tokenAddress
        );
      }
      return _tokens;
    }
} 