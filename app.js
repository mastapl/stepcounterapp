const express = require("express");
const app = express();
var conn = require("./connection");

const bodyParser = require("body-parser");
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));
const defaultRoute = require("./routes/adminRoute");
app.use("/administrator",defaultRoute);

// let stepGoals = [1000,2000,3000,4000];
// let steps = 1444;

//     for(let i=0 ;i < stepGoals.length; i++) {
//         if(steps > stepGoals[i++]) {
//             console.log("Nastepny prog to " + stepGoals[i++]);
//         }
//     } serwer

app.set("view engine","ejs");
app.use(express.static('assets'));

app.get("/",(req,res)=> {
    res.render('index.ejs');
});

app.listen(process.env.PORT || 3001,"0.0.0.0",()=> {
    console.log("Serwer dziala");
});





