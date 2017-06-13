var express = require('express');
var request = require('request');
var cheerio = require('cheerio');
var mysql = require("mysql");
var bodyParser = require('body-parser');
var cronJob = require('cron').CronJob;
var Q = require("q");
var settings = require("./settings.js");
var router = express.Router();



var app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json()); // support json encoded bodies

app.use(express.static(__dirname + '/public'));

router.get('/', function(req, res) {
  res.sendFile(__dirname + '/public/SyriaMap.html');
});

router.post('/mapUpdate', function(req, res) {
  var year = req.body.year;
  var month = req.body.month;
  var day = req.body.day;
  console.log('SELECT * FROM syriaMaps WHERE mapDate BETWEEN CAST(\'2013-04-05\' AS DATE) AND CAST(\''+year+'-'+month+'-'+day+' '+23+':'+59+':'+59+'\' AS DATE) limit 1;');
  console.log(req.body);

  var con = mysql.createConnection({
      host: settings.host,
      user: settings.user,
      password: settings.password,
      database: settings.database
    });

  con.connect(function(err){
      if(err){
        console.log('Error connecting to Db');
        return;
      }
      console.log('Connection established');
  });

  if(req.body.type == "pre"){
    con.query('SELECT * FROM syriaMaps WHERE mapDate < CAST(\''+year+'-'+month+'-'+day+' '+0+':'+0+':'+0+'\' AS DATETIME) ORDER BY mapDate DESC limit 1',function(err,rows){
      if(err) throw err;
      console.log('Data received from Db:\n');
      console.log(rows);
      res.send(rows[0]);
    });
  }

  if(req.body.type == "next"){
    con.query('SELECT * FROM syriaMaps WHERE mapDate > CAST(\''+year+'-'+month+'-'+day+' '+23+':'+59+':'+59+'\' AS DATETIME) ORDER BY mapDate limit 1',function(err,rows){
      if(err) throw err;
      console.log('Data received from Db:\n');
      console.log(rows);
      res.send(rows[0]);
    });
  }

  if(req.body.type == 'change'){
    con.query('SELECT * FROM syriaMaps WHERE mapDate BETWEEN CAST(\'2013-04-05\' AS DATETIME) AND CAST(\''+year+'-'+month+'-'+day+' '+23+':'+59+':'+59+'\' AS DATETIME) ORDER BY mapDate DESC limit 1;',function(err,rows){
      if(err) throw err;
      console.log('Data received from Db:\n');
      console.log(rows);
      res.send(rows[0]);
    });
  }
  
  con.end(function(err) {

  });
});

var job = new cronJob({
  cronTime: '59 59 23 * * *',
  onTick: function() {
    console.log("cron");
    var url = "https://commons.wikimedia.org/w/index.php?title=File:Syrian,_Iraqi,_and_Lebanese_insurgencies.png&dir=prev&offset=20170104023216&limit=500#filehistory";
    var mapURLs = [];
    var mapDates = [];
    request(url, function(error, response, html){
      var $ = cheerio.load(html);

      var links = $("td[style='white-space: nowrap;'] a");


      links.each(function(i, link){
        var mapURL = $(link).attr("href");
        var mapDate = new Date($(link).html().replace(/,/g, ""));
        console.log("\n");
        console.log(mapDate);
        mapURLs.push(mapURL);
        mapDates.push(mapDate);
      });
      var con = mysql.createConnection({
        host: settings.host,
        user: settings.user,
        password: settings.password,
        database: settings.database
    });

      con.connect(function(err){
        if(err){
          console.log('Error connecting to Db');
            return;
        }
        console.log('Connection established');
      });
      function doQuery1(){
        var defered = Q.defer();
        con.query('DELETE FROM syriaMaps ORDER BY mapDate DESC limit 1;',function(err,rows){
            if(err) throw err;
          });
        return defered.promise;
      }

      function doQuery2(){
        console.log(mapURLs.length);
        for(j=0; j < mapURLs.length; j++){
          mapDates[j].setHours(0);
          mapDates[j].setMinutes(0);
          mapDates[j].setSeconds(0);

          mapDateString = mapDates[j].toISOString().replace("T", " ").replace(".000Z", "");
        
          con.query('INSERT IGNORE INTO syriaMaps VALUES (\''+ mapDateString +'\', \''+mapURLs[j].replace("https:", "")+'\');',function(err,rows){
          if(err) throw err;
        });
        console.log(mapURLs[j].replace("https:", ""));
        }
      }

      Q.fcall([doQuery1()]).then(doQuery2());
      
      con.end(function(err) {
      });
    });
  },
  start: false,
  timeZone: "America/New_York"
});
job.start();

app.listen(3021, 'localhost');
