const express = require("express");
const router = express.Router();
const conn = require("../connection");
router.use(express.static('assets'));

function auth(req,res,next) {
    console.log("Proba polaczenia...");
    if(req.query.admin === "true123") {
        console.log("Polaczenie zautoryzowane");
        res.status(200);
        next();
    } else {
        res.status(401);
        console.log("Polaczenie odrzucone");
        res.render('errorPage.ejs',{errorCode: 401,errorTitle: "Permission Denied"});
    }
}

router.get("/", auth,(req,res) => {
    res.status(200);
    res.render("adminPanel.ejs");
});

router.get("/accounts", auth,(req,res) => {
    var sql = "SELECT * FROM konta;";
    conn.query(sql,(error,results)=>{
        if(error) throw error;
        res.status(200);
        res.render("accountAdminPanel.ejs",{test:results});
    });
});

router.post("/accounts",(req,res) => {
    var login = req.body.login;
    var password = req.body.password;
    var sql = `INSERT INTO konta(login,password) VALUES ('${login}','${password}');`;

    conn.query(sql,(err,result)=>{
        if(err) throw err;
        console.log("Dane zostały przesłane");
        res.status(200);
        res.redirect("/administrator/accounts?admin=true123");
    });
});

router.get("/accountdelete",(req,res)=>{
    var id = req.query.id;
    var sql = `DELETE FROM kroki WHERE user_id = ${id}`;
    conn.query(sql,(err)=>{
        if(err) throw err;
        var sql2 = `DELETE FROM konta WHERE id = ${id}`;
        conn.query(sql2,(err2)=>{
            if(err2) throw err2;
            res.redirect("/administrator/accounts?admin=true123");
        });
    });
});

router.get("/steps", auth,(req,res) => {
    var sql = "SELECT user_id,steps,DATE_FORMAT(date, '%Y-%m-%d') AS date FROM kroki;";
    conn.query(sql,(error,results)=>{
        if(error) throw error;
        res.status(200);
        res.render("stepsAdminPanel.ejs",{data:results});
    });
});

router.post("/steps",(req,res) => {
    var id = req.body.user_id;
    var steps = req.body.steps;
    var date = req.body.date;
    var sql = `INSERT INTO kroki VALUES (${id},${steps},'${date}');`;

    conn.query(sql,(err,result)=>{
        if(err) throw err;
        console.log("Dane zostały przesłane");
        res.status(200);
        res.redirect("/administrator/steps?admin=true123");
    });
});

router.get("/stepsdelete",(req,res)=>{
    var id = req.query.user_id;
    var date = req.query.date;
    var sql = `DELETE FROM kroki WHERE user_id = ${id} AND date = '${date}'`;
    conn.query(sql,(err)=>{
        if(err) throw err;
        console.log(sql);
        res.redirect("/administrator/steps?admin=true123");
    });
});

router.get("/stepsthresholds", auth,(req,res) => {
    var sql = "SELECT * FROM progi ORDER BY kroki ASC";
    conn.query(sql,(error,results)=>{
        if(error) throw error;
        res.status(200);
        res.render("thresholdsAdminPanel.ejs",{data:results});
    });
});

router.post("/stepsthresholds",(req,res) => {
    var steps = req.body.steps;
    var sql = `INSERT INTO progi (kroki) VALUES (${steps});`;

    conn.query(sql,(err,result)=>{
        if(err) throw err;
        console.log("Dane zostały przesłane");
        res.status(200);
        res.redirect("/administrator/stepsthresholds?admin=true123");
    });
});

router.get("/thresholddelete",(req,res)=>{
    var id = req.query.id;
    var sql = `DELETE FROM progi WHERE id = ${id}`;
    conn.query(sql,(err)=>{
        if(err) throw err;
        console.log(sql);
        res.redirect("/administrator/stepsthresholds?admin=true123");
    });
});

router.get("/getthresholds",auth,(req,res)=>{
    var sql = `SELECT kroki FROM progi ORDER BY kroki ASC`;
    conn.query(sql,(err,results)=>{
        if(err) throw err;
        res.json(results);
    })
});

router.get("/getData",(req,res) => {
    const login = req.query.login // query dla GET , body dla POST zebym pamietal
    const password = req.query.password

    getIdSql = `SELECT id FROM konta WHERE login="${login}" AND password="${password}"`;
    conn.query(getIdSql, (error, results) => {
        if (error) {
            throw error;
        }

        if (results.length > 0) {
            const userId = results[0].id;
            const data = {};
            const weeklySql = `SELECT sum(steps) as kroki FROM kroki WHERE user_id = ${userId} AND date >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)`;
            const monthlySql = `SELECT sum(steps) as kroki FROM kroki WHERE user_id = ${userId} AND date >= DATE_SUB(CURDATE(), INTERVAL 29 DAY)`
            conn.query(weeklySql,(err2,results2) =>{
                if(err2) throw err2;
                data.weeklySteps = results2;
                conn.query(monthlySql,(err3,results3) =>{
                    if(err3) throw err3;
                    data.monthlySteps = results3;
                    res.json(data);
                });
            }); 
        } else {
            res.status(401).send("Użytkownik nieznaleziony");
        }
    });
});

router.post("/validatelogin",(req,res) => {
    var login = req.body.login;
    var password = req.body.password;
    var sql = `SELECT * FROM konta WHERE login="${login}" AND password="${password}";`;
    console.log(sql);
    conn.query(sql,(error,results)=>{
        if(error) throw error;
        if(results.length === 0) {
            res.status(401).send("Nieudane logowanie");
        } else {
            var getStepsFromTodaySql = `SELECT * FROM kroki WHERE user_id = ${results[0].id} AND date = CURRENT_DATE()`;
            console.log(getStepsFromTodaySql);
            conn.query(getStepsFromTodaySql, (error2,results2) => {
                if(error2) throw error2;
                if(results2.length === 0) {
                    res.status(200).send(`0`);
                } else {
                    res.status(200).send(`${results2[0].steps}`)
                }
            })
        } 
        //res.status(200).send(`${results[0].step_count}`);   
    });
});

router.post("/uploaddata",(req,res) => {
    var stepCount = parseInt(req.body.stepCount);
    var login = req.body.login;
    var password = req.body.password;
    getIdSql = `SELECT id FROM konta WHERE login="${login}" AND password="${password}"`;
    conn.query(getIdSql, (error, results) => {
        if (error) {
            throw error;
        }
        if (results.length > 0) {
            var userId = results[0].id;

            var searchForUploadedDataTodaySql = `SELECT * FROM kroki WHERE user_id=${userId} AND date=CURRENT_DATE()`
            conn.query(searchForUploadedDataTodaySql, (error2,results2) =>{
                if(error2) throw error2;

                //Jesli pierwszy raz dane sa zapisywane w ciagu dnia tworzy rekord do dnia
                if(results2.length === 0) {
                    var uploadSql = `INSERT INTO kroki(user_id,steps,date) VALUES (${userId},${stepCount},CURRENT_DATE()) `
                    conn.query(uploadSql,(error3,results3) => {
                        if(error3) throw error3;
                        console.log("Data inserted");
                        res.sendStatus(200);
                    });
                } else {
                    //Jesli dane z aktualnego dnia sa, zaktualizuje baze danych 
                    uploadSql = `UPDATE kroki SET steps = ${stepCount} WHERE user_id=${userId} AND date=CURRENT_DATE()`
                    console.log(uploadSql)
                    conn.query(uploadSql,(error3,results3) => {
                        if(error3) throw error3;
                        console.log("Data updated");
                        // res.sendStatus(200);
                        res.status(200).send("Wysłano pomyślnie dane");
                    });
                }
            });
            
        } else {
            console.log("Użytkownik nie znaleziony.");
            res.sendStatus(401);
        }
    });
});

module.exports = router;