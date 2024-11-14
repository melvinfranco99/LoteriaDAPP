import React, { Component } from 'react';
import Loteria from '../abis/loteria.json';
import Web3 from 'web3';
import Navigation from './Navbar';
import Swal from 'sweetalert2';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      account: '0x0',
      loading: true,
      loteria: {},
      precioBoleto: '0',
      balanceCuenta: 'undefined',
      numTokens: 0,
      balanceTokens: '0'
    };
  }

  async componentDidMount() {
    // 1. Carga de Web3
    await this.loadWeb3();
    // 2. Carga de datos de la Blockchain
    await this.loadBlockchainData();
  }

  // 1. Carga de Web3
  async loadWeb3() {
    if (window.ethereum) {
      window.web3 = new Web3(window.ethereum);
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      console.log('Accounts: ', accounts);
    } else if (window.web3) {
      window.web3 = new Web3(window.web3.currentProvider);
    } else {
      window.alert('¡Deberías considerar usar Metamask!');
    }
  }

  // 2. Carga de datos de la Blockchain
  async loadBlockchainData() {
    const web3 = window.web3;
    const accounts = await web3.eth.getAccounts();
    this.setState({ account: accounts[0] });
    const networkId = await web3.eth.net.getId();
    console.log('networkid:', networkId);

    const loteriaData = Loteria.networks[networkId];
    if (loteriaData) {
      const loteria = new web3.eth.Contract(Loteria.abi, loteriaData.address);
      this.setState({ loteria });
      const precioBoleto = await loteria.methods.precioBoleto().call();
      this.setState({ precioBoleto: precioBoleto.toString() });

      const balance = await web3.eth.getBalance(this.state.account);
      console.log('Saldo de la cuenta:', web3.utils.fromWei(balance, 'ether'));

      const balanceTokens = await loteria.methods.balanceTokens(this.state.account).call()
      this.setState({balanceTokens: balanceTokens.toString()})

    } else {
      alert("El contrato loteria no se ha desplegado correctamente");
    }
  }

  // Función para comprar tokens
  compraTokens = async () => {
    const { loteria, account, numTokens } = this.state;
    if (numTokens <= 0) {
      Swal.fire('Error', 'Debes ingresar un número de tokens válido', 'error');
      return;
    }
    
    try {
      // Llama a la nueva función pública
      const costoTokens = await loteria.methods.obtenerPrecioTokens(numTokens).call();
      console.log('Costo de tokens:', costoTokens);
  
      const balance = await window.web3.eth.getBalance(account);
      console.log('Saldo de la cuenta:', window.web3.utils.fromWei(balance, 'ether'));
  
      await loteria.methods.compraTokens(numTokens).send({ from: account, value: costoTokens });
      Swal.fire('Éxito', 'Tokens comprados exitosamente', 'success');
    } catch (error) {
      console.error('Error al comprar tokens:', error);
      Swal.fire('Error', error.message || 'Hubo un problema al comprar los tokens', 'error');
    }
  }
  
  

  render() {
    return (
      <div>
        <Navigation account={this.state.account} />
        <div className="container-fluid mt-5">
          <div className="row">
            <main role="main" className="col-lg-12 d-flex justify-content-center">
              <div className="content">
                <h1>Compra de Tokens</h1>
                <input
                  type="number"
                  placeholder="Número de tokens"
                  onChange={(e) => this.setState({ numTokens: e.target.value })}
                />
                <button onClick={this.compraTokens}>Comprar Tokens</button>
              </div>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
              <div className="content">
                <h3>El saldo de la cuenta es: {this.state.balanceTokens} Tokens</h3>
              </div>
            </main>
          </div>
        </div>
      </div>
    );
  }
}

export default App;