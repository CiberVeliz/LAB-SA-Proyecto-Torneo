module.exports = function(app, session, db, db_bitacora)
{
    const axios = require('axios')

    function getMessage(req)
    {
        let msg;

        if(req.session.msg)
        {
            msg = req.session.msg;
            req.session.msg = '';
        }

        return msg;
    }

    app.get('/', function(req, res)
    {
    
        //se obtiene el secret y id del .env
        
        //se obtiene el token
        axios.get(process.env.TOKEN_URL + '/token?id=3&secret=XcFYyQAj')
        .then((result) => {
            req.session.usersToken = result.data.token;
            
            res.render('index_.html', {msg: getMessage(req)});
            return
        })
        .catch((err) =>{
            console.log(err)
        })
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

    app.get('/torneos', function(req, res)
    {
        const config = {
            headers: { Authorization: `Bearer ${req.session.usersToken}` }
        };

        let isAdmin = req.session.admin;

        if(isAdmin)
        {
            db.all("SELECT *FROM Juego", [], (err, rows ) => {
            
            axios.get(process.env.USERS_URL + '/jugadores', config)
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

    app.get('/users', function(req, res)
    {
        const config = {
            headers: { Authorization: `Bearer ${req.session.usersToken}` }
        };
        let isAdmin = req.session.admin;

        if(isAdmin)
        {
            axios.get(process.env.USERS_URL + '/jugadores', config)
            .then((data) => {
                res.render('users.html', {users: JSON.stringify(data.data), msg: getMessage(req)});
            });
        }
        else
        {
            res.redirect('/');
        }
    });

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

    app.get('/bitacora', function(req, res)
    {
        db_bitacora.all("SELECT *FROM Bitacora ORDER BY fecha DESC", [], (err, rows ) => {
            res.render('bitacora.html', {bitacora: JSON.stringify(rows)});
        })
    })
    return app;
}