const express = require('express');
const app = express();
var uuid = require('uuid');//uuid.v4()
const axios = require('axios')
require('dotenv').config(); //env file

const session = require('express-session');
app.use(session({secret: process.env.SECRET_SESSION, saveUninitialized: true, resave: true}));

var bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));


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

// open database - bitacora
let db_bitacora = new sqlite3.Database('./database/bitacora.db', (err) => {
  if (err) {
    console.error(err.message);
  }
  console.log('Conexión a bitacora realizada.');
});

// -------------------------------------------------------------------------

require('./modules/views')(app, session, db, db_bitacora);

// --------------------- FUNCIONAMIENTO TORNEOS -----------------------------

function registrarBitacora(accion, descripcion)
{
  let query = 'INSERT INTO Bitacora(accion, descripcion) VALUES(?, ?)';

  db_bitacora.run(query, [accion, descripcion]);
}

app.post('/saveGame', function(req, res)
{
  let query = "SELECT COUNT(1) FROM Juego WHERE LOWER(TRIM(nombre)) = LOWER(TRIM($nombre)) OR LOWER(TRIM(ip)) = LOWER(TRIM($ip))";

  db.get(query, {$nombre:req.body.name, $ip: req.body.IP}, (error, row) => {
    if(row['COUNT(1)'] === 0)
    {
      registrarBitacora("Guardar Juego", "Se guardo el juego " + req.body.name)

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

// ---------- endpoints -----------------

app.post('/logout', function(req, res)
{
  registrarBitacora("Logout", "El usuario " + req.session.userid + " cerro sesión");

  req.session.admin = null;
  req.session.mail = null;
  req.session.userid = null;

  res.redirect('/');
});

app.post('/jugadores', function(req, res)
{
  if(!req.body)
  {
    res.status(404);
    return
  }

  const config = {
    headers: { Authorization: `Bearer ${req.session.usersToken}` }
  };

  let body = req.body;
  let type = body.type;
  let tempId = body.id;
  let endpoint = process.env.USERS_URL + '/jugadores/'

  body.id = 0;
  body.administrador = body.administrador == 'on';
  delete body["type"];

  if(type == "POST")
  {
    axios.post(endpoint, body, config).then((result) => {
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
    axios.put(endpoint + tempId, body, config).then((result) => {
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
    headers: { Authorization: `Bearer ${req.session.usersToken}` }
  };

  let username = req.body.user;
  let password = req.body.password;

  axios.get( process.env.USERS_URL + '/login?email=' + username + '&password=' + password, config)
  .then((result) => {
    if(result.status === 400)
    {
      req.session.msg = "Credenciales Inválidas.";
      return res.redirect('/');
    }

    let data = result.data;
    
    req.session.admin = data.administrador;
    req.session.mail = data.email;
    req.session.userid = data.id;

    registrarBitacora("Login", "Ingreso del usuario " + data.id + " al sistema.")

    res.redirect('/main');
  })
  .catch((error) => {
    console.log(error)
    if(error.response.status === 400)
    {
      req.session.msg = "Credenciales Inválidas.";
    }
    else
    {
      req.session.msg = "Error al verificar los datos del usuario.";
    }
    return res.redirect('/');
  })

});


// ---------------------------------------------------------------------------

//------------- PARTIDAS ----------------------

//simula una partida
app.get( '/simularPartida', async function(req, res)
{
    let params = req.query;

    let data = {id: params.id, jugadores: [params.j1, params.j2]}

    registrarBitacora("Inicio partida", "Se inicio la partida " + params.id)

    axios.post(process.env.JUEGOS_URL  + '/simular', data).then((result) => {

      registrarBitacora("Consulta", "consulta al endpoint " + process.env.JUEGOS_URL  + '/simular')

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

        registrarBitacora("Registro", "Se registro la partida " + id)

        //se registra al ganador
        let idPartida = uuid.v4();

        let jugador;
        
        if(marcador === '1')
        {
          jugador = "SELECT jugador1 FROM partida WHERE id= '" + id + "'";
        }
        else
        {
          jugador = "SELECT jugador2 FROM partida WHERE id= '" + id + "'";
        }

        let query2 = "INSERT INTO Partida(id, jugador1, nivel, idTorneo) VALUES(?, (" + jugador + "), (SELECT (nivel + 1) FROM Partida WHERE id = '" + id + "'), (SELECT COUNT(1) FROM Torneo))";

        db.run(query2, [idPartida]);

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

    axios.post( process.env.JUEGOS_URL + '/generar', data).then((result) => {

      if (result.status === 201)
      {
        //se almacena la partida en la base
        let query = 'INSERT INTO Partida(id, jugador1, jugador2) VALUES(?, ?, ?)';

        registrarBitacora("Registro", "Se registro la partida " + idPartida)

        db.run(query, [idPartida, 3, 5]);

        let url = 'http://34.70.148.27:3100/jugar/' + idPartida + '/' + req.session.userid + '/' + req.session.admin + '/1/1'

        registrarBitacora("Redirect", "Se redireccionó hacia la url " + url)

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

function getNormalUsers(users)
{
  let regularUsers = [];
  
  for(let i = 0; i < users.length; i++)
  {
    if(users[i].administrador === 0)
    {
      regularUsers.push(users[i]);
    }
  }

  return regularUsers;
}

function shakeUsers(array)
{
    var currentIndex = array.length, temporaryValue, randomIndex;

    while (0 !== currentIndex) 
    {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;

        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }

    return array;
}

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
      const config = {
        headers: { Authorization: `Bearer ${req.session.usersToken}` }
      };

      //se obtiene a todos los usuarios
      axios.get(process.env.USERS_URL + '/jugadores', config)
      .then((result) => {
        let users = result.data;
        let normalUsers = getNormalUsers(users);
        normalUsers = shakeUsers(normalUsers);

        const selectedUsers = normalUsers.slice(0, parseInt(data.cantidad) * 2)//grupos * 2 = 2 jugadores por grupo
        
        //se guarda el juego
        let query = 'INSERT INTO Torneo(nombre, cantidad_grupos, ip_juego, estado) VALUES(?, ?, ?, ?)';

        db.run(query, [data.name, data.cantidad, data.games, 1]);

        // se crean las llaves
        for(let i = 0; i < selectedUsers.length; i+=2)
        {
          let id_j1 = selectedUsers[i].id;
          let id_j2 = selectedUsers[i + 1].id;
          let idPartida = uuid.v4();

          let query = 'INSERT INTO Partida(id, jugador1, jugador2, nivel, idTorneo) VALUES(?, ?, ?, ?, (SELECT COUNT(1) FROM Torneo))';

          registrarBitacora("Registro", "Se registro la partida " + idPartida)
  
          db.run(query, [idPartida, id_j1, id_j2, 1]);

        }

        req.session.msg = "Torneo creado exitosamente.";

        registrarBitacora("Registro", "Se registró el torneo " + data.name)
        res.redirect('/torneos');
        return
      });
    }
  });
});

app.post('/verTorneo', function(req, res){
  req.session.idTorneo = req.body.idTorneo;
  
  res.redirect('/torneo');
})

app.get('/torneo', function(req, res)
{
  let user = req.session.mail;
        
  if(user)
  {
    let idTorneo = req.session.idTorneo;

    //se obtienen las partidas asociadas a ese torneo
    db.all("SELECT *FROM Partida WHERE idTorneo = ?", [idTorneo], (err, rows ) => {
  
      res.render('torneo.html', {partidas: JSON.stringify(rows), adminUser: req.session.admin, idTorneo: idTorneo});
      return
    });
  }
  else
  {
      res.redirect('/');
  }
})

app.post('/terminarTorneo', function(req, res)
{
  let idTorneo = req.body.idTorneo;

  let query = 'UPDATE Torneo SET estado = ? WHERE id = ?';

  db.run(query, [2, idTorneo]);

  req.session.msg = "Torneo finalizado exitosamente.";

  res.redirect('/torneos');
})

app.listen('3000', function() {
  console.log('Servidor de torneos escuchando en el puerto 3000');
});