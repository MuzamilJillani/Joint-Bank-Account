const provider = new ethers.providers.Web3Provider(window.ethereum);

const abi = [
      "event AccountCreated(address[] users, uint256 indexed accountId, uint256 timestamp)",
      "event Deposit(address indexed user, uint256 indexed accountId, uint256 amount, uint256 timestamp)",
      "event Withdraw(address indexed user, uint256 indexed accountId, uint256 indexed withdrawId, uint256 amount, uint256 timestamp)",
      "event WithdrawApproved(uint256 accountId, uint256 withdrawId, uint256 timestamp)",
      "event WithdrawRequested(address indexed user, uint256 indexed accountId, uint256 indexed withdrawId, uint256 amount, uint256 timestamp)",
      "function approveRequest(uint256 accountId, uint256 withdrawId)",
      "function createAccount(address[] otherOwners) payable",
      "function deposit(uint256 accountId) payable",
      "function getAccountBalance(uint256 accountId) view returns (uint256)",
      "function getAccountOwners(uint256 accountId) view returns (address[])",
      "function getUserAccounts() view returns (uint256[])",
      "function getWithdrawApprovals(uint256 accountId, uint256 withdrawId) view returns (uint256)",
      "function withdraw(uint256 accountId, uint256 withdrawId)",
      "function withdrawlRequest(uint256 accountId, uint256 amount)",
      "function isApproved(uint accountId, uint withdrawId) view returns(bool)"
];

const address = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

let contract = null;

async function deposit(){
  await getAccess();
  const ethAmount = document.getElementsByClassName("amount")[0].value;
  const weiAmount = ethAmount * (10**18);  
  const accountId = (document.getElementsByClassName("accountId")[0].value)/1;
  console.log(weiAmount, accountId);
  await contract.deposit(accountId, {value : weiAmount.toString()}).then( () => alert('success'));
}

async function requestWithdraw(){
  await getAccess();
  const accountId = (document.getElementsByClassName("accountId")[1].value) /1;
  const ethAmount = document.getElementsByClassName("amount")[1].value;
  const weiAmount = ethAmount * (10**18);
  await contract.withdrawlRequest(accountId, weiAmount.toString());
  console.log(weiAmount, accountId);
}

async function approveRequest(){
  await getAccess();
  const accountId = (document.getElementsByClassName("accountId")[2].value) /1;
  const withdrawId = (document.getElementsByClassName("withdrawId")[0].value) /1;
  await contract.approveRequest(accountId, withdrawId);
}

async function withdraw(){
  await getAccess();
  const accountId = (document.getElementsByClassName("accountId")[3].value) /1;
  const withdrawId = (document.getElementsByClassName("withdrawId")[1].value) /1;
  await contract.withdraw(accountId, withdrawId).then(() => alert('amount withdrawn'))
}

async function viewApproval(){
  await getAccess();
  const accountId = (document.getElementsByClassName("accountId")[4].value) /1;
  const withdrawId = (document.getElementsByClassName("withdrawId")[2].value) /1;
  const approved = await contract.isApproved(accountId, withdrawId);
  document.getElementById("approval").innerText = `Approved = ${approved}`;
  console.log(accountId, withdrawId, approved);
}
async function getAccountBalance(){
  await getAccess();
  const accountId = (document.getElementsByClassName("accountId")[5].value)/1;
  const weiAmount = await contract.getAccountBalance(accountId);
  const ethAmount = weiAmount/ (10**18);
  console.log(accountId, ethAmount);
  document.getElementById('balance').innerHTML = "";
  document.getElementById("balance").append(`Account ID : ${accountId}, Balance : ${ethAmount}ETH`);
}

async function viewAccounts(){
  await getAccess();
  const userAccounts = await contract.getUserAccounts();
  document.getElementById("accounts").innerHTML = userAccounts;
}

async function createAccount(){
  await getAccess();
  const otherOwners = document.getElementById("otherOwners").value.split(",").filter(n => n);
  console.log(otherOwners);
  await contract.createAccount(otherOwners).then( () => alert('success'));
}

async function getAccess(){
    if(contract) return;
    await provider.send("eth_requestAccounts", []);
    const signer = await provider.getSigner();
    contract = new ethers.Contract(address, abi, signer);

    let eventLog = document.getElementById("events");
    contract.on("AccountCreated", (owners, id, event) => {
      eventLog.append(`Account Created : Account ID = ${id} , Owners = ${owners}`);
    })
    contract.on("Deposit", (owner , accountId, amount, timestamp, event ) => {
      eventLog.append(`Deposit : Depositing Owner = ${owner}, Account ID = ${accountId}, Amount = ${amount/(10**18)}ETH, Time = ${timestamp}`);
    })
    contract.on("WithdrawRequested",  (owner , accountId, withdrawId, amount, timestamp, event ) => {
      eventLog.append(`Withdraw Requested : Requesting Owner = ${owner}, Account ID = ${accountId}, Withdraw ID = ${withdrawId}, Amount = ${amount/(10**18)}ETH, Time = ${timestamp}`);
    })
    contract.on("WithdrawApproved",  (accountId, withdrawId, timestamp, event ) => {
      eventLog.append(`Withdraw Approved : Account ID = ${accountId}, Withdraw ID = ${withdrawId}, Time = ${timestamp}`);
    })
    contract.on("Withdraw",  (owner , accountId, withdrawId, amount, timestamp, event ) => {
      eventLog.append(`Amount Withdrawn : User = ${owner}, Account ID = ${accountId}, Withdraw ID = ${withdrawId}, Amount = ${amount/(10**18)}ETH, Time = ${timestamp}`);
    })
}