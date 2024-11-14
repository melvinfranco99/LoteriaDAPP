const Loteria = artifacts.require("loteria");

module.exports = async function (deployer, network, accounts) {
  await deployer.deploy(Loteria);
  const loteria = await Loteria.deployed()
};
