const express = require('express');
const app = express();
var uuid = require('uuid');//uuid.v4()
let fetch = require('node-fetch');
const axios = require('axios')

var bodyParser = require('body-parser');
const session = require('express-session');
app.use(session({secret: 'sa_g1',saveUninitialized: true,resave: true}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));

/*app.use(function(req, res, next) {
  res.setHeader("Content-Type", "text/html");
  next();
});*/

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  
  next();
});

app.use(express.static(__dirname + '/views/'));
app.set('views', __dirname + '/views');
app.engine('html', require('ejs').renderFile);

// ---------------------- DATABASE ---------------------------------------
const sqlite3 = require('sqlite3').verbose();

// open the database
let db = new sqlite3.Database('./database/database.db', (err) => {
  if (err) {
    console.error(err.message);
  }
  console.log('Conexión realizada.');
});

// -------------------------------------------------------------------------

// --------------------- FUNCIONAMIENTO TORNEOS -----------------------------

app.post('/saveGame', function(req, res)
{
  let query = "SELECT COUNT(1) FROM Juego WHERE LOWER(TRIM(nombre)) = LOWER(TRIM($nombre)) OR LOWER(TRIM(ip)) = LOWER(TRIM($ip))";

  db.get(query, {$nombre:req.body.name, $ip: req.body.IP}, (error, row) => {
    if(row['COUNT(1)'] === 0)
    {
      let query = 'INSERT INTO Juego(nombre, ip) VALUES(?, ?)';

      db.run(query, [req.body.name, req.body.IP]);
      req.session.msg = "Juego creado exitosamente."
      res.redirect('/torneos');
      
      return
    }
    else
    {
      req.session.msg = "Ya existe un juego registrado con estos datos."
      res.redirect('/torneos');

      return
    }
  });
});

// ----------paginas

function getMessage(req)
{
  let msg = req.session.msg;
  req.session.msg = '';

  return msg;
}

app.get('/', function(req, res)
{
  
  //se obtiene el secret y id del .env
  //se obtiene el token
  axios.get('http://34.70.148.27:8081/token?id=3&secret=XcFYyQAj')
  .then((result) => {
    req.session.usersToken = result.data.token;
    console.log(result.data.token)
  })
  .catch((err) =>{
    console.log(err)
  })

  res.render('index_.html', {msg: getMessage(req)});
});

app.get('/torneos', function(req, res)
{
  const config = {
    headers: { Authorization: `Bearer ${'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE2MDQ3NjA3OTIsImlkIjoiSEkiLCJpc3MiOiJzYV9nMSJ9.Y1JhwdGnUmYFHNYF5MJX_PqaKyE-CmFoVnAf4P8F1ViAph7c1zZmiJjsPngYmiz_8hRaSHw0hU-Oi2cAAah8_CyvOgiblI0cpXixwBghsEbw42vwgWYtlGmub3YIq7v3y-YivAIy8-5utdDPQXf5JS3dlewLQm42LmDw4tvWStS1MzKfPf1yhZj-1ko-Q5ajDodhlnYY-zyCLEVOMRDpT6uBx3hahw6P1xT1wLvWp6YJAb4D2A5BMvUn-DfOjwQGRSIzrck77tC_hhAd6bbEYq8Cvzgd6My_ApZBk6-HGrJHm76QAlUwvWaaPN2MlXDq94u0Rt1IXl3-PyjwpJXrNQ'}` }
  };

  let isAdmin = req.session.admin;

  if(isAdmin)
  {
    db.all("SELECT *FROM Juego",[],(err, rows ) => {
      
      axios.get('http://18.191.208.8:3050/jugadores', config)
      .then((data) => {
        db.all("SELECT *FROM Torneo WHERE estado = 1 LIMIT 1;",[],(errtor, rowstor ) => {
          
          res.render('torneos.html', {juegos: JSON.stringify(rows), torneoActual: JSON.stringify(rowstor), msg: getMessage(req), users: JSON.stringify(data.data)});

        }) 
      });
    });
  }
  else
  {
    res.redirect('/');
  }
});

app.get('/main', function(req, res)
{
  let user = req.session.mail;
  
  if(user)
  {
    let isAdmin = req.session.admin;

    if(isAdmin)
    {
      res.render('main.html');
    }
    else
    {
      res.render('partidas.html');
    }
  }
  else
  {
    res.redirect('/');
  }
});


//----------- options -------------------
app.get('/users', function(req, res)
{
  const config = {
    headers: { Authorization: `Bearer ${'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE2MDQ3NjA3OTIsImlkIjoiSEkiLCJpc3MiOiJzYV9nMSJ9.Y1JhwdGnUmYFHNYF5MJX_PqaKyE-CmFoVnAf4P8F1ViAph7c1zZmiJjsPngYmiz_8hRaSHw0hU-Oi2cAAah8_CyvOgiblI0cpXixwBghsEbw42vwgWYtlGmub3YIq7v3y-YivAIy8-5utdDPQXf5JS3dlewLQm42LmDw4tvWStS1MzKfPf1yhZj-1ko-Q5ajDodhlnYY-zyCLEVOMRDpT6uBx3hahw6P1xT1wLvWp6YJAb4D2A5BMvUn-DfOjwQGRSIzrck77tC_hhAd6bbEYq8Cvzgd6My_ApZBk6-HGrJHm76QAlUwvWaaPN2MlXDq94u0Rt1IXl3-PyjwpJXrNQ'}` }
  };
  let isAdmin = req.session.admin;

  if(isAdmin)
  {
    //fetch
    axios.get('http://18.191.208.8:3050/jugadores', config)
    .then((data) => {
      res.render('users.html', {users: JSON.stringify(data.data), msg: getMessage(req)});
    });
  }
  else
  {
    res.redirect('/');
  }
});


// ---------------------------------------

app.get('/administrar', function(req, res)
{
  let isAdmin = req.session.admin;

  if(isAdmin)
  {
    res.render('administrar.html');
  }
  else
  {
    res.redirect('/');
  }
});

app.post('/logout', function(req, res)
{
  req.session.admin = null;
  req.session.mail = null;

  res.redirect('/');
});

app.post('/jugadores', function(req, res)
{
  let body = req.body;
  let type = body.type;
  let tempId = body.id;
  let endpoint = 'http://18.191.208.8:3050/jugadores/'

  body.id = 0;
  body.administrador = body.administrador == 'on';
  delete body["type"];

  if(type == "POST")
  {
    axios.post(endpoint, body).then((result) => {
      if (result.status === 201)
      {
        req.session.msg = 'Usuario creado exitosamente.'
      }
      else if(result.status === 404)
      {
        req.session.msg = 'Usuario no encontrado.'
      }
      else if(result.status === 406)
      {
        req.session.msg = 'Datos invalidos';
      }

      res.redirect('/users');
      return

    }).catch((error) => {
      req.session.msg = 'Error al crear al usuario.';
      res.redirect('/users');

      return
    })
  }
  else
  {
    axios.put(endpoint + tempId, body).then((result) => {
      if (result.status === 201)
      {
        req.session.msg = 'Usuario modificado exitosamente.'
      }
      else if(result.status === 404)
      {
        req.session.msg = 'Usuario no encontrado.'
      }
      else if(result.status === 406)
      {
        req.session.msg = 'Datos invalidos';
      }

      res.redirect('/users');
      return
    
    }).catch((error) => {
      req.session.msg = 'Error al modificar al usuario';
      res.redirect('/users');

      return
    })
  }

});


// ---------------------------

app.post('/login', function(req, res)
{
  const config = {
    headers: { Authorization: `Bearer ${'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE2MDQ3NjA3OTIsImlkIjoiSEkiLCJpc3MiOiJzYV9nMSJ9.Y1JhwdGnUmYFHNYF5MJX_PqaKyE-CmFoVnAf4P8F1ViAph7c1zZmiJjsPngYmiz_8hRaSHw0hU-Oi2cAAah8_CyvOgiblI0cpXixwBghsEbw42vwgWYtlGmub3YIq7v3y-YivAIy8-5utdDPQXf5JS3dlewLQm42LmDw4tvWStS1MzKfPf1yhZj-1ko-Q5ajDodhlnYY-zyCLEVOMRDpT6uBx3hahw6P1xT1wLvWp6YJAb4D2A5BMvUn-DfOjwQGRSIzrck77tC_hhAd6bbEYq8Cvzgd6My_ApZBk6-HGrJHm76QAlUwvWaaPN2MlXDq94u0Rt1IXl3-PyjwpJXrNQ'}` }
  };

  let username = req.body.user;
  let password = req.body.password;

  axios.get('http://18.191.208.8:3050/login?email=' + username + '&password=' + password, config)
  .then((result) => {
    if(!result.data.email/*result.status === 400*/)//----------------------------------------- CAMBIAR EL CODIGO DE ERROR
    {
      req.session.msg = "Credenciales Inválidas.";
      return res.redirect('/');
    }

    let data = result.data;
    
    req.session.admin = data.administrador;
    req.session.mail = data.email;
    req.session.userid = data.id;

    res.redirect('/main');
  })
  .catch((error) => {
    console.log(error);
    req.session.msg = "Error al verificar los datos del usuario.";
    return res.redirect('/');
  })

});


// ---------------------------------------------------------------------------

//------------- PARTIDAS ----------------------

//genera un partida
/*app.get('/generarPartida', function(req, res)
{
  let id = uuid.v4();
  console.log(id);

  res.status(200).send('YEAH');
})*/

//genera un partida
app.get('/simularPartida', async function(req, res)
{
    let idPartida = uuid.v4();
    let data = {id: idPartida, jugadores: [3, 5]};

    //se almacena la partida en la base
    let query = 'INSERT INTO Partida(id, jugador1, jugador2) VALUES(?, ?, ?)';

    db.run(query, [idPartida, 3, 5]);

    axios.post('http://34.70.148.27:5000/simular', data).then((result) => {

      console.log(result);
      if (result.status === 201)
      {
        req.session.msg = 'Partida simulada.'

        res.redirect('/torneo');
        return
      }
      else if(result.status === 404)
      {
        req.session.msg = 'Jugador no encontrado'
      }
      else if(result.status === 406)
      {
        req.session.msg = 'Parametros no validos';
      }

    }).catch((error) => {
      //console.log(error)
      res.redirect('/torneo');

      return
    })
})

//registra una partida
app.put('/partidas/:id', function (req, res) 
{
    var id = req.params.id;
    var marcador = req.body.marcador;

    if(!id || !isNaN(id) || !marcador)
    {
      res.status(406).send('Parámetros no válidos');
      console.log('Parámetros no válidos')
      return;
    }

    db.get("SELECT COUNT(1) FROM Partida WHERE id = $id", {$id: id}, (error, row) => {
      if(row['COUNT(1)'] === 0)
      {
        res.status(404).send('Partida no encontrada');
        console.log('Partida no encontrada');
        return;
      }
      else
      {
        let query = 'UPDATE Partida SET ganador = ? WHERE id = ?';

        db.run(query, [marcador[0], id]);
        console.log('Partida registrada correctamente.');
        res.status(201).send('Partida registrada correctamente.');
      }
    });
}); 


//genera una partida
//registra una partida
app.get('/generarPartida', function (req, res) 
{
    let idPartida = uuid.v4();
 
    let data = {id: idPartida, jugadores: [3, 5]};

    axios.post('http://34.70.148.27:5000/generar', data).then((result) => {

      if (result.status === 201)
      {
        //se almacena la partida en la base
        let query = 'INSERT INTO Partida(id, jugador1, jugador2) VALUES(?, ?, ?)';

        db.run(query, [idPartida, 3, 5]);

        let url = 'http://34.70.148.27:3100/jugar/' + idPartida + '/' + req.session.userid + '/' + req.session.admin + '/1/1'
        res.redirect(url);
        return
      }
      else if(result.status === 404)
      {
        req.session.msg = 'Jugador no encontrado'
      }
      else if(result.status === 406)
      {
        req.session.msg = 'Parametros no validos';
      }

    }).catch((error) => {
      //console.log(error)
      res.redirect('/torneo');

      return
    })
}); 


app.post('/crearTorneo', function(req, res)
{
  let data = req.body;

  db.get("SELECT COUNT(1) FROM Torneo WHERE TRIM(LOWER(nombre)) = TRIM(LOWER($nombre))", {$nombre: data.name}, (error, row) => {
    if(row['COUNT(1)'] !== 0)
    {
      req.session.msg = "Ya existe un torneo con este nombre.";
      res.redirect('/torneos');
      return;
    }
    else
    {
      //se guarda el juego
      let query = 'INSERT INTO Torneo(nombre, cantidad_grupos, ip_juego, estado) VALUES(?, ?, ?, ?)';

      db.run(query, [data.name, data.cantidad, data.games, 1]);

      // se crean las llaves
      req.session.msg = "Torneo creado exitosamente.";
      res.redirect('/torneos');
      return
    }
  });
});

app.post('/verTorneo', function(req, res){
  req.session.idTorneo = req.body.idTorneo;
  
  res.redirect('/torneo');
})

app.get('/torneo', function(req, res)
{
  let idTorneo = req.session.idTorneo;

  let partidas = [
                  {id_j1: 1, nombre_j1: 'temp1', id_j2: 2, nombre_j2: 'temp2'},
                  {id_j1: 3, nombre_j1: 'temp3', id_j2: 4, nombre_j2: 'temp4'},
                  {id_j1: 5, nombre_j1: 'temp5', id_j2: 6, nombre_j2: 'temp6'},
                  {id_j1: 7, nombre_j1: 'temp7', id_j2: 8, nombre_j2: 'temp8'}
                  ]

  //se obtienen las partidas asociadas a ese torneo
  res.render('torneo.html', {partidas: JSON.stringify(partidas)});
})

app.listen('3000', function() {
  console.log('Servidor de torneos escuchando en el puerto 3000');
});