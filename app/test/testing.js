let chai = require('chai');
let chaiHttp = require('chai-http');
const expect = require('chai').expect;

chai.use(chaiHttp);

const url= 'http://localhost:3000';


describe('Registro partida: ',()=>{
    it('No debe permitir por los parametros', (done) => {
    chai.request(url)
    .put('/partidas')
    .end( function(err,res){
    //console.log(res)
    expect(res).to.have.status(404);
    done();
    });
    });
   });


   describe('Login: ',()=>{
    it('Debe de permitir el login del usuario admin', (done) => {
    chai.request(url)
    .post('/login', {user:'admin', password: 'admin'})
    .end( function(err,res){
    //console.log(res)
    expect(res).to.have.status(200);
    done();
    });
    });
   });

   describe('renderizado del index y obtención del token: ',()=>{
    it('debe de renderizar la pagina index y obtener el token del servidor', (done) => {
    chai.request(url)
    .get('/')
    .end( function(err,res){
    //console.log(res)
    expect(res).to.have.status(200);
    done();
    });
    });
   });

   describe('Logout',()=>{
    it('Debe de cerrar sesión y eliminar los datos del usuario', (done) => {
    chai.request(url)
    .get('/logout')
    .end( function(err,res){
    //console.log(res)
    expect(res).to.have.status(404);
    done();
    });
    });
   });

   describe('Endpoint /jugadores: ',()=>{
    it('no debe de permitir el cambio de datos por los datos faltantes', (done) => {
    chai.request(url)
    .get('/jugadores')
    .end( function(err,res){
    //console.log(res)
    expect(res).to.have.status(404);
    done();
    });
    });
   });


   describe('Endpoint /jugadores: ',()=>{
    it('no debe de permitir el cambio de datos por los datos faltantes', (done) => {
    chai.request(url)
    .get('/jugadores')
    .end( function(err,res){
    //console.log(res)
    expect(res).to.have.status(404);
    done();
    });
    });
   });


   describe('renderizado de la pagina principal',()=>{
    it('debe de renderizar la pagina principal y retornar status 200', (done) => {
    chai.request(url)
    .get('/main')
    .end( function(err,res){
    //console.log(res)
    expect(res).to.have.status(200);
    done();
    });
    });
   });
   