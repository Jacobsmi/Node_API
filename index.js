//load our app server using express
//first import express library
const express = require('express');
const app = express();
var sqlite3 = require('sqlite3').verbose()
const cors = require('cors');
var bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
var corsOptions = {
    crossDomain: true,

}

const db = new sqlite3.Database('./Tracker.db', err=>{
    if (err) {
        return console.error(err.message);
      }
      console.log('Connected to the SQlite database.');
});
//Generic Home Page for the API
app.get("/", cors(),(req, res)=>{
    res.send("<h1>WELCOME TO THE API UPDATED FOR MONTH!");
})
//GET A USER'S ID
app.get('/id/:email', cors(), (req,res)=>{
  let email = req.params.email;
  console.log(email);
  const sql = 'SELECT rowid FROM users WHERE email=?';
  db.get(sql, [email], (err, row) => {
    res.send(row)
  });
});
//SEARCHES RPE FOR A CERTAIN ID
function searchRPE(id, callback){
    var results
    var sql = `SELECT * FROM rpe WHERE id = ?`
    db.all(sql,[id],(err, rows ) => {
        callback(rows);
    });
}


app.get("/getIDE/:email", cors(), (req, res)=>{
    //When the get request is made it takes an email as a parameter from the
    //url that the request is made with
    var email = req.params.email;
    console.log(email)
    //The email is then used to get a user ID through a sql search
    var sql = `SELECT rowid,* FROM users WHERE email = ?;`
    db.get(sql, [email], (err, row) => {
        if (err) {
          res.status(400).json({"error":err.message});
          return;
        }
        if(row == null){
            console.log("Data undefined")
        }else{
            //If data is found then search the RPE table for all their RPE surveys
            searchRPE(row.rowid, function(results){
                res.json(results)
            })
        }
    });
})



//GET USER INFO BASED ON EMAIL
//CHECK IF USER EXISTS
app.get("/useremail/:email", cors(),(req, res)=>{
  console.log("Fetching a user with Email: " + req.params.email);
  const email = req.params.email;
  const sql = `SELECT rowid,* FROM USERS WHERE email = ?`;
  db.get(sql, [email],(err, row) => {
        if (err) {
          res.status(400).json({"error":err.message});
          return;
        }
        if(row == null){
          console.log("Data undefined")
          res.send("undefined")
        }
        res.json(row)
    });
})


//Goes along with the /sports get does some back end processing to create an HTML string to show
function getSportsInfo(rows, callback){
    let html_string = "";
    for(let i =0; i < rows.length; i++){
      var newstring = `<option value='${rows[i].rowid}'>${rows[i].sport}</option>`;
      html_string+= newstring;
    }
    callback(html_string);
}

app.get("/sports", cors(),(req, res) =>{
    var html_string;
    let sql = 'SELECT rowid, sport FROM sports;'
    db.all(sql,[],(err, rows) => {
        getSportsInfo(rows, function(data){
            res.send(data);
        });

    });
})




//GET THE START AND END DATE ASSOCIATED WITH SPORTS
app.get("/sportdates/:id", cors(),(req, res) =>{
    var id = req.params.id;
    let sql = `SELECT startMonth, startDay, startYear,numWeeks FROM sports WHERE rowid = ?`
    console.log(`Searching for a sport with ${id}`)
    db.all(sql,[id],(err, rows) => {
        res.send(rows[0])
    });
})




//DELETES AN RPE SURVEY FROM THE DATABASE
app.get("/deletesurvey/:id", cors(), (req,res)=>{
    //Take in the ID of the survey as a url parameter
    const id = req.params.id;
    //Creating a string with the SQL command
    let sql = `DELETE FROM rpe WHERE rowid = ?;`
    //Creating a parameterized sql function to call to the database
    db.run(sql, [id], function(err) {

    });
    res.send()
});

app.get("/rpesurveys/:id", cors(), (req,res)=>{
    let id = req.params.id;
    let sql = `SELECT rowid, * FROM rpe WHERE id = ?;`
    db.all(sql,[id],(err, rows ) => {
        var html_str = '<h2>Basic HTML Table</h2><table border=1 frame=hsides rules=all style="width:100%"><tr><th style="text-align: left;">Survey ID</th><th style="text-align: left;">Type of Activity<br><small>1 = Practice, 2=Game, 3=Individual, 4= S&C </small></th><th style="text-align: left;">Duration in Minutes</th><th style="text-align: left;">Difficulty(1-10)</th><th style="text-align: left;">Delete</th><th style="text-align: left;">Edit</th></tr>'
        var i;
        for (i of rows){
            var deletep = `<td><button class = 'delete' id='${i.rowid}'>Delete</button></td>`
            let edit = `<td><button class = 'edit' id='${i.rowid}'>Save Changes</button></td>`
            var new_str = (`<tr><td>${i.rowid}</td><td contenteditable='true' id ='${i.rowid}tableans1'>${i.answer1}</td><td contenteditable='true' id ='${i.rowid}tableans2'>${i.answer2}</td><td contenteditable='true' id ='${i.rowid}tableans3'>${i.answer3}</td>${deletep}${edit}</tr>`)
            html_str = html_str.concat(new_str)
        }
        html_str = html_str.concat('</table>')
        res.send(html_str)

    });
});

app.post("/adduser", cors(),(req,res)=>{
    var name= req.body.send_name;
    var email= req.body.send_email;
    var type = req.body.type;
    var sport = req.body.sport;
    const sql = `INSERT INTO users (name,email,type,sport) VALUES (?,?,?,?)`;
    db.run(sql,[name,email,type,sport], function(err) {
        if (err) {
            res.send("0")
            return console.error("Error: " + err.message);
        }else{
          res.send("1")
        }
    });
});
app.post("/editsurvey", cors(),(req,res)=>{
    var id= req.body.id;
    var ans1= req.body.ans1;
    var ans2 = req.body.ans2;
    var ans3 = req.body.ans3;
    let sql = `UPDATE rpe SET answer1 = ?,answer2 = ?,answer3 = ? WHERE rowid = ?`
    db.run(sql, [ans1,ans2,ans3,id], function(err){});
    res.send()
});


app.post("/addcoach", cors(),(req,res)=>{
    console.log("Adding coach")
    var name= req.body.name;
    var email= req.body.email;
    var type = req.body.type;
    const sql = `INSERT INTO users (name,email,type) VALUES (?,?,?)`
    db.run(sql, [name,email,type], function(err) {
        if (err) {
            res.send("0")
            return console.error("Error: " + err.message);
        }
        console.log(`Rows inserted ${this.changes}`);
        res.end("1")
    });
});

//ADDS AN RPE SURVEY WITH ANSWER VALUES AND DATE INFORMATION
app.post("/addsurvey", cors(), (req,res)=>{
    var id = req.body.id;
    var ans1 = req.body.q1;
    var ans2 = req.body.q2;
    var ans3 = req.body.q3;
    var d = new Date();
    var day = d.getDay();
    var month = d.getMonth()+1;
    var date = d.getDate();
    var year = d.getFullYear();
    const sql = `INSERT INTO rpe (id, answer1, answer2, answer3, dayOfWeek, month, dayOfMonth, year) VALUES (?,?,?,?,?,?,?,?)`
    db.run(sql, [id,ans1,ans2,ans3,day,month,date,year],function(err) {
        if (err) {
            res.send("0")
            return console.error("Error: " + err.message);
        }
        console.log(`Rows inserted ${this.changes}`);
        res.end("1")
    });
})
//GETS SURVEY DATA BASED ON ID
app.get("/getUserData/:id", cors(), (req,res)=>{
    let id = req.params.id;
    var nameSQL = `SELECT name FROM users WHERE rowid ='${id}'`
    var user_name = "";
    db.all(nameSQL,[],(err, rows ) => {
        rows.forEach((row) => {
            user_name = row.name;
        });
        const sql = `SELECT * FROM rpe WHERE id = ${id}`;
        db.all(sql,[],(err, rows2 ) => {
            res.send({'name':user_name, 'rows': rows2});
        })
    })

})
app.get("/editSports", cors(), (req, res) => {
    const sql = `SELECT rowid, * FROM sports`;
    db.all(sql, [], (err, rows) => {
        var html_str = '<h2>Sports</h2><table border=1 frame=hsides rules=all style="width:100%"><tr><th style="text-align: left;">Sport Name</th><th style="text-align: left;">Start Month</th><th style="text-align: left;">Start Day</th><th style="text-align: left;">Start Year</th><th style="text-align: left;">Num Weeks</th><th style="text-align: left;">Edit</th><th style="text-align: left;">Delete</th></tr>'
        var i;
        for (i of rows) {
            var deletep = `<td><button class = 'delete' id='${i.rowid}'>Delete</button></td>`
            let edit = `<td><button class = 'edit' id='${i.rowid}'>Save Changes</button></td>`
            var new_str = (`<tr><td>${i.sport}</td><td contenteditable='true' id ='${i.rowid}tableans1'>${i.startMonth}</td><td contenteditable='true' id ='${i.rowid}tableans2'>${i.startDay}</td><td contenteditable='true' id ='${i.rowid}tableans3'>${i.startYear}</td><td contenteditable='true' id ='${i.rowid}tableans4'>${i.numWeeks}</td>${edit}${deletep}</tr>`)
            html_str = html_str.concat(new_str)
        }
        html_str = html_str.concat('</table>')
        console.log(html_str)
        res.send(html_str)
    })
});
//GETS ALL PLAYERS BY THE ID OF THE SPORT
app.get("/sportplayers/:id", cors(), (req,res)=>{
    let sportid = req.params.id;
    const sql = `SELECT rowid, * FROM users WHERE sport=?`;
    let ids = new Array();
    db.all(sql, [sportid], (err, rows) => {
        rows.forEach(function(row){
           ids.push(row.rowid);
        });
        res.send(ids);
    })
});
app.post("/addwellness", cors(), (req,res)=>{
  let id = req.body.id;
  let mood = req.body.mood;
  let stress = req.body.stress;
  let energy = req.body.energy;
  let sleep = req.body.sleep;
  let sore = req.body.sore;
  let comment = req.body.comment;
  console.log(comment)
  const sql = 'INSERT INTO wellness(mood,stress,energy,sleep,id, soregroups, comment) VALUES(?,?,?,?,?,?,?)';
  db.run(sql,[mood,stress,energy,sleep,id,sore,comment],function(err){
    if(err){
      res.send("Error");
    }else{
      res.send("Success");
    }
  })
})
app.get("/getWellnessSurvey/:id", cors(), (req,res)=>{
    let id = req.params.id;
    const sql = `SELECT * FROM wellness WHERE id=?`;
    db.all(sql, [id], (err, rows) => {
        let lastSurvey = rows.slice(-1)[0];
        res.send(lastSurvey);
    });
});
app.get("/getNameByID/:id", cors(), (req,res)=>{
    let id = req.params.id;
    const sql = `SELECT name FROM users WHERE rowid=?`;
    db.all(sql, [id], (err, rows) => {
      res.send(rows);
    });
});
app.post("/saveSports" , cors(), (req,res)=>{
  let sm = req.body.startMonth;
  let sd = req.body.startDay;
  let sy = req.body.startYear;
  let nw = req.body.numWeeks;
  let id = req.body.id;
  const sql = `UPDATE sports SET startMonth= ?, startDay = ?, startYear = ?, numWeeks=? WHERE rowid = ?;`;
  db.run(sql, [sm,sd,sy,nw,id], function(err){
    if(err){
      res.send(err)
    }else{
      res.send("Success");
    }
  });
})
app.post("/addSport", cors(), (req,res)=>{
  let sm = req.body.startMonth;
  let sd = req.body.startDay;
  let sy = req.body.startYear;
  let nw = req.body.numWeeks;
  let name = req.body.name;
  const sql = `INSERT INTO sports (sport,startMonth,startDay,startYear,numWeeks) VALUES(?,?,?,?,?);`;
  db.run(sql,[name,sm,sd,sy,nw], function(err){
    if(err){
      res.send(err)
    }else{
      res.send("Success");
    }
  });
})
//DELETES AN RPE SURVEY FROM THE DATABASE
app.post("/deleteSport", cors(), (req,res)=>{
    //Take in the ID of the survey as a parameter
    const id = req.body.id;
    //Creating a string with the SQL command
    let sql = `DELETE FROM sports WHERE rowid = ?;`
    //Creating a parameterized sql function to call to the database
    db.run(sql, [id], function(err) {
    });
    res.send()
});
app.listen(3100, () => {
    console.log("New App is running on port 3100");
});
