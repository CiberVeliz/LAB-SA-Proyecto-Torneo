const express = require('express');
const app = express();
var uuid = require('uuid');//uuid.v4()

app.use(express.static(__dirname + '/public/'));

app.use(
  express.urlencoded({
    extended: true
  })
)

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



// ---------------------------------------------------------------------------

//------------- PARTIDAS ----------------------

//genera un partida
app.get('/generarPartida', function(req, res)
{
  let id = uuid.v4();
  console.log(id);

  res.status(200);
})

//registra una partida
app.put('/partidas/:id', async function (req, res) 
{
  //ab89f0c1-31bb-48d6-84f0-00ff0514780c
    var id = req.params.id;
    var marcador = req.body.marcador;

    if(!id || !isNaN(id) || !marcador)
    {
      res.status(406).send('Parámetros no válidos');
      return;
    }

    let obj_marcador = JSON.parse(marcador);

    await db.get("SELECT COUNT(1) FROM Partida WHERE id = $id", {$id: id}, (error, row) => {
      if(row['COUNT(1)'] === 0)
      {
        res.status(404).send('Partida no encontrada');
        return;
      }
      else
      {
        let query = 'UPDATE Partida SET ganador = ? WHERE id = ?';

        db.run(query, [obj_marcador[0], id]);

        res.status(201).send('Partida registrada correctamente.');
      }
    });
}); 

app.listen('3000', function() {
  console.log('Servidor de torneos escuchando en el puerto 3000');
});