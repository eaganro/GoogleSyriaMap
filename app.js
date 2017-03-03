var express = require('express');
var request = require('request');
var cheerio = require('cheerio');
var mysql = require("mysql");
var bodyParser = require('body-parser');
var cronJob = require('cron').CronJob;
var settings = require("./settings.js");


var app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json()); // support json encoded bodies

app.use(express.static(__dirname + '/public'));

app.get('/', function(req, res) {
  res.sendFile(__dirname + '/public/SyriaMap.html');
});

app.post('/mapUpdate', function(req, res) {
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

  con.query('SELECT * FROM syriaMaps WHERE mapDate BETWEEN CAST(\'2013-04-05\' AS DATETIME) AND CAST(\''+year+'-'+month+'-'+day+' '+23+':'+59+':'+59+'\' AS DATETIME) ORDER BY mapDate DESC limit 1;',function(err,rows){
    if(err) throw err;

    console.log('Data received from Db:\n');
    rows[0].mapDate.setHours(rows[0].mapDate.getHours() - 5);
    console.log(rows);
    res.send(rows[0]);
  });
  con.end(function(err) {

  });
});

var job = new cronJob({
  cronTime: '00 00 24 * * *',
  onTick: function() {
    console.log("cron");
    var url = "https://commons.wikimedia.org/wiki/File:Syrian,_Iraqi,_and_Lebanese_insurgencies.png#filehistory";
    var mapURLs = [];
    var mapDates = [];
    var mapDateObjs = [];
    var nullVall = null;
    var lowDate = new Date("06-12-2014");
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

      con.query('DELETE * FROM syriaMaps ORDER BY mapDate DESC limit 1;',function(err,rows){
          if(err) throw err;
        });

      console.log(mapURLs.length);
      for(j=0; j < mapURLs.length; j++){
        mapDates[j].setHours(mapDates[j].getHours() - 5);
        mapDateString = mapDates[j].toISOString().replace("T", " ").replace(".000Z", "");
        
        con.query('INSERT IGNORE INTO syriaMaps VALUES (\''+ mapDateString +'\', \''+mapURLs[j].replace("https:", "")+'\');',function(err,rows){
          if(err) throw err;
        });
        console.log(mapURLs[j].replace("https:", ""));
      }
      con.end(function(err) {
      });
    });
  },
  start: false,
  timeZone: "America/New_York"
});
job.start();

app.listen(3021);
