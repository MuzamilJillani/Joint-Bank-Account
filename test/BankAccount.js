const {
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");

describe("BankAccount", function () {
  async function deployBankAccount() {
    const [addr0, addr1, addr2, addr3, addr4] = await ethers.getSigners();

    const BankAccount = await ethers.getContractFactory("BankAccount");
    const bankAccount = await BankAccount.deploy();

    return { bankAccount, addr0, addr1, addr2, addr3, addr4};
  }

  async function deployBankAccountWithAccounts(owners = 2, deposit = 0, withdrawAmounts = []){
    const {bankAccount, addr0, addr1, addr2, addr3, addr4} = await loadFixture(deployBankAccount);
    let addresses = [];

    if(owners == 2){
      addresses = [addr1.address];
    }else if(owners == 3){
      addresses = [addr1.address, addr2.address];
    }else if(owners == 4){
      addresses = [addr1.address, addr2.address, addr3.address];
    }

    await bankAccount.connect(addr0).createAccount(addresses, {value : "1000000000000"});

    if(deposit > 0){
      await bankAccount.connect(addr0).deposit(1, {value : deposit.toString()});
    }

    for(const withdrawAmount of withdrawAmounts){
      await bankAccount.connect(addr0).withdrawlRequest(1, withdrawAmount);
    }    

    return {bankAccount, addr0, addr1, addr2, addr3, addr4};
  }  

  describe("Deployment", () => {
    it("should deploy without any errors", async () => {
      await loadFixture(deployBankAccount);
    })
  });

  describe("Creating an account", () => {
    it("should NOT allow creating a single user account", async () => {
      const {bankAccount, addr0} = await loadFixture(deployBankAccount);
      await expect(bankAccount.connect(addr0).createAccount([])).to.be.reverted;
    });

    it("should allow creating a double user account with transaction of 1000 gwei or more", async () => {
      const {bankAccount, addr0, addr1} = await loadFixture(deployBankAccount);
      await bankAccount.connect(addr0).createAccount([addr1.address],{value : "1000000000000"});

      const accounts0 = await bankAccount.connect(addr0).getUserAccounts();
      expect(accounts0.length).to.be.equal(1);

      const accounts1 = await bankAccount.connect(addr1).getUserAccounts();
      expect(accounts1.length).to.be.equal(1);

      const balance = await bankAccount.connect(addr0).getAccountBalance(1);
      expect(balance).to.be.equal(1000000000000);
    });

    it("should NOT allow creating a double user account with transaction of less than 1000 gwei", async () => {
      const {bankAccount, addr0, addr1} = await loadFixture(deployBankAccount);
      await expect(bankAccount.connect(addr0).createAccount([addr1.address], {value : "999999999999"})).to.be.reverted;
    });

    it("should allow creating a tripple user account", async () => {
      const {bankAccount, addr0, addr1, addr2} = await loadFixture(deployBankAccount);
      await bankAccount.connect(addr0).createAccount([addr1.address, addr2.address],{value : "1000000000000"});

      const accounts0 = await bankAccount.connect(addr0).getUserAccounts();
      expect(accounts0.length).to.be.equal(1);

      const accounts1 = await bankAccount.connect(addr1).getUserAccounts();
      expect(accounts1.length).to.be.equal(1);

      const accounts2 = await bankAccount.connect(addr2).getUserAccounts();
      expect(accounts2.length).to.be.equal(1);

      const balance = await bankAccount.connect(addr0).getAccountBalance(1);
      expect(balance).to.be.equal(1000000000000);
    });

    it("should allow creating a quad user account", async () => {
      const {bankAccount, addr0, addr1, addr2, addr3} = await loadFixture(deployBankAccount);
      await bankAccount.connect(addr0).createAccount([addr1.address, addr2.address, addr3.address],{value : "1000000000000"});

      const accounts0 = await bankAccount.connect(addr0).getUserAccounts();
      expect(accounts0.length).to.be.equal(1);

      const accounts1 = await bankAccount.connect(addr1).getUserAccounts();
      expect(accounts1.length).to.be.equal(1);

      const accounts2 = await bankAccount.connect(addr2).getUserAccounts();
      expect(accounts2.length).to.be.equal(1);

      const accounts3 = await bankAccount.connect(addr3).getUserAccounts();
      expect(accounts3.length).to.be.equal(1);

      const balance = await bankAccount.connect(addr0).getAccountBalance(1);
      expect(balance).to.be.equal(1000000000000);
    });

    it("should NOT allow creating a five user account", async () => {
      const {bankAccount, addr0, addr1, addr2, addr3, addr4} = await loadFixture(deployBankAccount);
      await expect(bankAccount.connect(addr0).createAccount([addr1.address, addr2.address, addr3.address, addr4.address],{value : "1000000000000"})).to.be.reverted;
    });

    it("should NOT allow creating an account with duplicate owners", async () => {
      const {bankAccount, addr0} = await loadFixture(deployBankAccount);
      await expect(bankAccount.connect(addr0).createAccount([addr0.address],{value : "1000000000000"})).to.be.reverted;
    });

    it("should allow a user to have two different accounts", async () => {
      const {bankAccount, addr0, addr1, addr2} = await loadFixture(deployBankAccount);
      await bankAccount.connect(addr0).createAccount([addr1.address],{value : "1000000000000"});
      await bankAccount.connect(addr0).createAccount([addr2.address],{value : "1000000000000"});

      const addr0Accounts = await bankAccount.connect(addr0).getUserAccounts();
      expect(addr0Accounts.length).to.be.equal(2);
    });

    it("should allow a user to have three different accounts", async () => {
      const {bankAccount, addr0, addr1, addr2, addr3} = await loadFixture(deployBankAccount);
      await bankAccount.connect(addr0).createAccount([addr1.address],{value : "1000000000000"});
      await bankAccount.connect(addr0).createAccount([addr2.address],{value : "1000000000000"});
      await bankAccount.connect(addr0).createAccount([addr3.address],{value : "1000000000000"})

      const addr0Accounts = await bankAccount.connect(addr0).getUserAccounts();
      expect(addr0Accounts.length).to.be.equal(3);
    });

    it("should NOT allow a user to have four different accounts", async () => {
      const {bankAccount, addr0, addr1, addr2, addr3} = await loadFixture(deployBankAccount);
      await bankAccount.connect(addr0).createAccount([addr1.address],{value : "1000000000000"});
      await bankAccount.connect(addr0).createAccount([addr2.address],{value : "1000000000000"});
      await bankAccount.connect(addr0).createAccount([addr3.address],{value : "1000000000000"})
      await expect(bankAccount.connect(addr0).createAccount([addr1.address],{value : "1000000000000"})).to.be.reverted;
    });
  });

  describe("Depositing", () => {
    it("should allow deposit from account owner", async () => {
      const {bankAccount, addr0} = await deployBankAccountWithAccounts();
      await expect(bankAccount.connect(addr0).deposit(1, {value : "100"})).to.changeEtherBalances([bankAccount, addr0],["100", "-100"]);
    })

    it("should NOT allow deposit from non-account owner", async () => {
      const {bankAccount, addr0, addr2} = await deployBankAccountWithAccounts();
      await expect(bankAccount.connect(addr2).deposit(1, {value : "100"})).to.be.reverted;
    })
  });

  describe("Withdraw", () => {
    describe("Request a withdraw", () => {
      it("should allow a account owner to request a withdraw", async () => {
        const {bankAccount, addr0} = await deployBankAccountWithAccounts();
        await bankAccount.connect(addr0).withdrawlRequest(1, 1000);
      });

      it("should NOT allow non-account owner to request a withdraw", async () => {
        const {bankAccount, addr2} = await deployBankAccountWithAccounts();
        await expect(bankAccount.connect(addr2).withdrawlRequest(1, 1000)).to.be.reverted;
      });

      it("should NOT allow withdrawl request greater than account balance", async () => {
        const {bankAccount, addr0} = await deployBankAccountWithAccounts();
        await expect(bankAccount.connect(addr0).withdrawlRequest(1, 1000000000000000)).to.be.reverted;
      })
    });

    describe("Approve a withdraw", () => {
      it("should allow non-withdraw-requesting account owner to approve request", async () => {
        const {bankAccount,addr0, addr1} = await deployBankAccountWithAccounts(2, 0, [1000]);
        await bankAccount.connect(addr1).approveRequest(1,1);
      })
      it("should NOT allow account owner to approve its own withdraw request", async () => {
        const {bankAccount,addr0, addr1} = await deployBankAccountWithAccounts(2, 0, [1000]);
        await expect(bankAccount.connect(addr0).approveRequest(1,1)).to.be.reverted;
      })
      it("should NOT allow non-account owner to approve request", async () => {
        const {bankAccount,addr0, addr1, addr2} = await deployBankAccountWithAccounts(2, 0, [1000]);
        await expect(bankAccount.connect(addr2).approveRequest(1,1)).to.be.reverted;
      })
      it("should NOT allow multiple approvals from an account owner", async () => {
        const {bankAccount,addr0, addr1} = await deployBankAccountWithAccounts(2, 0, [1000]);
        await bankAccount.connect(addr1).approveRequest(1,1);
        await expect(bankAccount.connect(addr1).approveRequest(1,1)).to.be.reverted;
      })
      it("should NOT allow approval of already approved request", async () => {
        const {bankAccount,addr0, addr1} = await deployBankAccountWithAccounts(2, 0, [1000]);
        await bankAccount.connect(addr1).approveRequest(1,1);
        await expect(bankAccount.connect(addr1).approveRequest(1,1)).to.be.reverted;
      })
      it("should NOT allow approval of an invalid withdraw request", async () => {
        const {bankAccount,addr0, addr1, addr2} = await deployBankAccountWithAccounts(2, 0, [1000]);
        await expect(bankAccount.connect(addr2).approveRequest(1,2)).to.be.reverted;
      })
    })

    describe("Make a withdraw", () => {
      it("should allow creator of request to withdraw an approved request", async () => {
        const {bankAccount, addr0, addr1} = await deployBankAccountWithAccounts(2, 0, [1000]);
        await bankAccount.connect(addr1).approveRequest(1,1);
        await expect(bankAccount.connect(addr0).withdraw(1,1)).to.changeEtherBalances([bankAccount, addr0], ["-1000","1000"]);
      });
      it("should NOT allow other owners to withdraw an approved request", async () => {
        const {bankAccount, addr0, addr1} = await deployBankAccountWithAccounts(2, 0, [1000]);
        await bankAccount.connect(addr1).approveRequest(1,1);
        await expect(bankAccount.connect(addr1).withdraw(1,1)).to.be.reverted;
      });
      it("should NOT allow creator of request to withdraw a non-approved request", async () => {
        const {bankAccount, addr0, addr1} = await deployBankAccountWithAccounts(2, 0, [1000]);
        await expect(bankAccount.connect(addr1).withdraw(1,1)).to.be.reverted;
      });
      it("should NOT allow other owners withdrawl of an approved request", async () => {
        const {bankAccount, addr0, addr1} = await deployBankAccountWithAccounts(2, 0, [1000]);
        await bankAccount.connect(addr1).approveRequest(1,1);
        await expect(bankAccount.connect(addr1).withdraw(1,1)).to.be.reverted;
      });
      it("should NOT allow withdrawl from an account with insufficient balance", async () => {
        const {bankAccount, addr0, addr1} = await deployBankAccountWithAccounts(2, 0, [1000000000000,1000000000000]);
        await bankAccount.connect(addr1).approveRequest(1,1);
        await bankAccount.connect(addr1).approveRequest(1,2);
        await bankAccount.connect(addr0).withdraw(1,1);
        await expect(bankAccount.connect(addr0).withdraw(1,2)).to.be.reverted;
      });
    })
  });
});
