import React, { Component, useEffect } from 'react';
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
      balanceTokens: '0',
      cantidadBoletos: '0',
      ganador: 'Aun no ha salido ganador',
      verBalance: '0'
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

      const cantidadBoletos = await loteria.methods.tusBoletos(this.state.account).call()
      console.log("Cantidad de boletos que posees: ", cantidadBoletos.length)
      this.setState({cantidadBoletos: cantidadBoletos.length})

      const ganador = await loteria.methods.ganador().call()
      this.setState({ganador: ganador})

      const verBalance = await loteria.methods.verBalance(this.state.account).call()
      this.setState({verBalance: verBalance.toString()})

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

  async comprarBoleto(_numeroBoletos){
    try{
      await this.state.loteria.methods.compraBoleto(_numeroBoletos).send({from: this.state.account})
      Swal.fire('Éxito', 'Boletos comprados exitosamente', 'success');
    } catch(error){
      Swal.fire('Error', error.message || 'Hubo un problema al comprar los boletos', 'error');
    }
    
  }

  async generarGanador(){
    try{
      await this.state.loteria.methods.generarGanador().send({from: this.state.account})
    }catch(error){
      Swal.fire('Error', error.message || 'Hubo un problema generar el ganador', 'error');
    }
    
  }

  async sacarTokens(_cantidad){
    try{
      await this.state.loteria.methods.devolverTokens(_cantidad).send({from: this.state.account, value: 0})
    }catch(error){
      Swal.fire('Error', error.message || 'Hubo un problema al devolver los tokens')
    }
  }

  async transferir(_direccion, _cantidad){
    let cantidad = _cantidad*10**18
    try{
      await this.state.loteria.methods.transferEther(_direccion).send({from: this.state.account, value: cantidad})
    }catch(error){
      Swal.fire('Error', error.message || 'Hubo un problema al transferir los Ethers')
    }
    
  }

  
  
  

  render() {
    if(this.state.ganador == '0x0000000000000000000000000000000000000000'){
      this.state.ganador = 'Aun no ha salido ganador'
    }
    return (
      <div>
        <Navigation account={this.state.account} />
        <div className='content'>
          <h1>Tu balance actual es: {this.state.verBalance / 10**18} Ethers</h1>
        </div><br></br><br></br>
        
        <div className='content'>
          <h2>Transferir Ethers</h2>
          
          <form onSubmit={async (e) => {
            e.preventDefault()

            let direccion = this.direccion.value
            let cantidad = this.cantidad.value

            await this.transferir(direccion, cantidad)
          }}>
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
            <input
            ref={(direccion) => {this.direccion = direccion}}
            placeholder='0x0...'
            required
            /><br></br><br></br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
            <input
            ref={(cantidad) => {this.cantidad = cantidad}}
            placeholder='0'
            required
            /><br></br><br></br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
            <button type='submit' className='btn btn-primary'>Enviar Ethers</button>
          </form>

        </div>
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
                <h1>Devolución de Tokens</h1>
                <form onSubmit={async (e) => {
                  e.preventDefault()

                  let devolucion = this.devolucion.value
                  await this.sacarTokens(devolucion)
                }}>
                  <input
                  ref={(devolucion) => {this.devolucion = devolucion}}
                  placeholder='0'
                  required
                  />
                  <button type='submit' className='btn btn-success'>Devolver</button>
                </form>
              </div>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
              <div className="content">
                <h3>El saldo de la cuenta es: {this.state.balanceTokens} Tokens</h3>
              </div>
            </main><br></br><br></br><br></br><br></br><br></br><br></br><br></br>
            <main role="main" className="col-lg-12 d-flex justify-content-center">
            <div className="content">
              <h1>Compra de Boletos</h1>
              <form onSubmit={async (e) => {
                e.preventDefault()

                let numeroBoletos = this.numeroBoletos.value

                await this.comprarBoleto(numeroBoletos)
              }}>
                <input
                ref={(numeroBoletos) => {this.numeroBoletos = numeroBoletos}}
                placeholder='Numero de boletos...'
                required
                />
                <button type='submit'>Comprar Boleto</button>
              </form>
              <div className='content'>
                <h4>Tienes {this.state.cantidadBoletos} boletos.</h4> 
              </div>
            </div>
            </main><br></br><br></br><br></br><br></br><br></br><br></br><br></br><br></br><br></br><br></br><br></br><br></br>
            <main role="main" className="col-lg-12 d-flex justify-content-center">
              <div className='content'>
                <button onClick={async (e) => {
                  e.preventDefault()
                  await this.generarGanador()
                } }>Generar Ganador</button>
              </div>
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
              <h1>El ganador es: {this.state.ganador}</h1>
            </main>
          </div>
        </div>
      </div>
    );
  }
}

export default App;