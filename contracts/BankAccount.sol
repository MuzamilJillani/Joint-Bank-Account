// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity >=0.4.0 <=0.9.0;


contract BankAccount{
    event Deposit(address indexed owner, uint indexed accountId, uint amount, uint timestamp);
    event WithdrawRequested(address indexed user, uint indexed accountId, uint indexed withdrawId, uint amount, uint timestamp);
    event WithdrawApproved(uint accountId, uint withdrawId, uint timestamp);
    event Withdraw(address indexed user, uint indexed accountId, uint indexed withdrawId, uint amount, uint timestamp);
    event AccountCreated(address[] owners, uint indexed accountId, uint timestamp);


    struct Account{
        address[] owners;
        uint balance;
        mapping (uint => WithdrawRequest) withdrawRequests;
    }

    struct WithdrawRequest{
        address user;
        uint amount;
        uint approvals;
        mapping (address => bool) approvedUsers;
        bool approved;
    }

    mapping (uint => Account) accounts;
    mapping (address => uint[]) userAccounts;

    uint nextAccountId;
    uint nextWithdrawId;
    
    modifier validOwners(address[] memory owners){
        require(owners.length <= 3, "account can't have more than 4 owners");
        require(owners.length >=1, "account should have minimum of 2 owners");
        for (uint i = 0; i < owners.length ; i++) {
            if(owners[i] == msg.sender){
                revert("no duplicate owners");
            }

            for (uint j = i+1; j < owners.length; j++) {
                if(owners[i] == owners[j]){
                    revert("no duplicare owners");
                }
            }
        }
        //require(msg.value >= 1000 gwei, "should deposit a min of 1000 gwei to create an account");
        _;
    }

    modifier accountOwner(uint accountId){
        bool isOwner;
        for (uint256 idx; idx < accounts[accountId].owners.length; idx++) {
            if (accounts[accountId].owners[idx] == msg.sender) {
                isOwner = true;
                break;
            }
        }
        require(isOwner, "you are not an owner of this account");
        _;
    }

    modifier canApprove(uint accountId, uint withdrawId){
        require(accounts[accountId].withdrawRequests[withdrawId].user != address(0), "this request does not exist!");
        require(!accounts[accountId].withdrawRequests[withdrawId].approved, "this request is already approved");
        require(!accounts[accountId].withdrawRequests[withdrawId].approvedUsers[msg.sender], "you have already approved the request");
        require(accounts[accountId].withdrawRequests[withdrawId].user != msg.sender, "you cannot approve your own request");
        _;
    }

    modifier canWithdraw(uint accountId, uint withdrawId){
        require(accounts[accountId].withdrawRequests[withdrawId].user == msg.sender, "you are not the owner of this request");
        require(accounts[accountId].withdrawRequests[withdrawId].approved, "Request not approved yet");
        _;
    }

    modifier sufficientBalance(uint accountId, uint amount){
        require(accounts[accountId].balance >= amount,"insufficient balance");
        _;
    }

    function createAccount(address[] memory otherOwners) external validOwners(otherOwners) payable{
        address[] memory owners = new address[](otherOwners.length +1);
        nextAccountId++;
        uint id = nextAccountId;
        owners[otherOwners.length] = msg.sender;
        for (uint i = 0; i < owners.length; i++) {
            if(i < owners.length -1){
                owners[i] = otherOwners[i];
            }

            if(userAccounts[owners[i]].length > 2){
                revert("each user can have a max of three accounts");
            }

            userAccounts[owners[i]].push(id);
        }
        
        accounts[id].owners = owners;
        accounts[id].balance = msg.value;
        emit AccountCreated(owners, id, block.timestamp);
    }

    function deposit(uint accountId) external accountOwner(accountId) payable{
        accounts[accountId].balance += msg.value;
        emit Deposit(msg.sender, accountId, msg.value, block.timestamp);
    }

    function withdrawlRequest(uint accountId, uint amount) external accountOwner(accountId) sufficientBalance(accountId, amount){
        nextWithdrawId++;
        uint id =  nextWithdrawId;
        accounts[accountId].withdrawRequests[id].user = msg.sender;
        accounts[accountId].withdrawRequests[id].amount = amount;

        emit WithdrawRequested(msg.sender, accountId, id, amount, block.timestamp);
    }

    function approveRequest(uint accountId, uint withdrawId) external accountOwner(accountId) canApprove(accountId, withdrawId){
        accounts[accountId].withdrawRequests[withdrawId].approvals++;
        accounts[accountId].withdrawRequests[withdrawId].approvedUsers[msg.sender] = true;

        if(accounts[accountId].withdrawRequests[withdrawId].approvals == accounts[accountId].owners.length -1){
            accounts[accountId].withdrawRequests[withdrawId].approved = true;
            emit WithdrawApproved(accountId, withdrawId, block.timestamp);
        }
    }

    function withdraw(uint accountId, uint withdrawId) external canWithdraw(accountId, withdrawId){
        uint amount = accounts[accountId].withdrawRequests[withdrawId].amount;
        require(accounts[accountId].balance >= amount, "insufficient balance");

        accounts[accountId].balance -= amount;
        delete accounts[accountId].withdrawRequests[withdrawId];

        (bool sent, ) = payable(msg.sender).call{value : amount}("");
        require(sent);

        emit Withdraw(msg.sender, accountId, withdrawId, amount, block.timestamp); 
    }

    function getAccountBalance(uint accountId) external accountOwner(accountId) view returns(uint){
        return accounts[accountId].balance;
    }

    function getAccountOwners(uint accountId) external view returns(address[] memory){
        return accounts[accountId].owners;
    }

    function getUserAccounts() external view returns(uint[] memory){
        return userAccounts[msg.sender];
    }
    
    function getWithdrawApprovals(uint accountId, uint withdrawId) external view accountOwner(accountId) returns(uint){
        return accounts[accountId].withdrawRequests[withdrawId].approvals;
    }

    function isApproved(uint accountId, uint withdrawId) external view accountOwner(accountId) returns(bool){
        return accounts[accountId].withdrawRequests[withdrawId].approved;
    }

}