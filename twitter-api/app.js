
var express = require('express');
var cfenv = require('cfenv');

var bodyParser = require('body-parser');

// create a new express server
var app = express();

var search = "IBM MEXICO";
var twitter_count = 200;
var consumerKey = 'vsFH1duFcrYciRH6IxChyQDtF';
var consumerSecret = 'Jx1ETnqAqkS0iYa56DYBrT8Ck700TVcnyi2LTH6X2T2KfDo7iS';
var watson_nlu_username = 'e815247a-89cf-4924-a0f0-974ad92c07fb';
var watson_nlu_password = 'Ptc8bjOHvj0E';

// serve the files out of ./public as our main files
app.use(express.static(__dirname + '/public'));
app.use( bodyParser.json() );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
})); 

// get the app environment from Cloud Foundry
var appEnv = cfenv.getAppEnv();

app.get('/twitter', function (req, res) {
 
  var urltoken = "https://api.twitter.com/oauth2/token?grant_type=client_credentials";
  var options = {
    method: 'POST',
    url: urltoken,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
      'Authorization': 'Basic ' + new Buffer(consumerKey + ":" + consumerSecret).toString('base64')  ,
      'oauth_callback':'http:localhost:' + appEnv.port + '/twitterALL'
    }
  };

  var reqtoken = require('request');
  reqtoken(options, function (error, response, body) {
    var token = JSON.parse(body).access_token;

    var urltweets = "https://api.twitter.com/1.1/search/tweets.json?q=%23" + search + "&count=" + twitter_count;
    var optionstweets = {
      method: 'GET',
      url: urltweets,
      headers: {
        'Authorization': 'Bearer ' + token,
        'oauth_callback':'http:localhost:' + appEnv.port + '/twitterALL'
      }
    };
    var reqtweets = require('request');
    reqtweets(optionstweets, function (error, response, body) {
      var data = JSON.parse(body).statuses;
        var jsonResponse = {
                tweets:[]
              };
              var i = 0;
              for(i = 0; i< data.length; i++)
              {
                if (data[i].in_reply_to_status_id ==null && data[i].retweeted_status == null){
                var t = data[i];
                var tweet = {
                  text: data[i].text,
                  date: data[i].created_at,
                  id: data[i].id,
                  user: data[i].user.screen_name
                };
                jsonResponse.tweets.push(tweet);}
              }

              getSentiment(jsonResponse, jsonResponse.tweets.length, 1, res);
    });

  });

});

app.get('/twitter-analysis', function (req, res) {
  
  var urltoken = "https://api.twitter.com/oauth2/token?grant_type=client_credentials";
  var options = {
    method: 'POST',
    url: urltoken,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
      'Authorization': 'Basic ' + new Buffer(consumerKey + ":" + consumerSecret).toString('base64')  ,
      'oauth_callback':'http:localhost:' + appEnv.port + '/twitterALL'
    }
  };

  var reqtoken = require('request');
  reqtoken(options, function (error, response, body) {
    var token = JSON.parse(body).access_token;

    var urltweets = "https://api.twitter.com/1.1/search/tweets.json?q=%23" + search + "&count=" + twitter_count;
    var optionstweets = {
      method: 'GET',
      url: urltweets,
      headers: {
        'Authorization': 'Bearer ' + token,
        'oauth_callback':'http:localhost:' + appEnv.port + '/twitterALL'
      }
    };
    var reqtweets = require('request');
    reqtweets(optionstweets, function (error, response, body) {
      var data = JSON.parse(body).statuses;
        var strWatsonNLU = "";
        var response = {
          data:[]
        };
        var i = 0;
        for(i = 0; i< data.length; i++)
        {
          strWatsonNLU += data[i].text.replace("#" + search,"") + ". ";
          //strWatsonNLU += data[i].text + ". ";
        }

        var NaturalLanguageUnderstandingV1 = require('watson-developer-cloud/natural-language-understanding/v1.js');
        var nlu = new NaturalLanguageUnderstandingV1({
          'username': watson_nlu_username,
          'password': watson_nlu_password,
          'version_date': '2017-02-27'
        });

        var parameters = {
          'text': strWatsonNLU,
          'features': {
            'keywords':{
              'sentiment': false,
              'limit': 20
            },
            'entities': {
              'sentiment': false,
              'limit': 1
            },
            'concepts': {
              'limit': 3
            }
          }
        }

        nlu.analyze(parameters, function(err, nul_res) {
          if (!err)
            {
              //var nul_res = JSON.parse(response);
              for (var i in nul_res.concepts)
              {
                  response.data.push(nul_res.concepts[i].text);
              }
              for (var i in nul_res.entities)
              {
                  response.data.push(nul_res.entities[i].text);
              }
              for (var i in nul_res.keywords)
              {
                  response.data.push(nul_res.keywords[i].text);
              }
              
            }
            response.data.push("#" + search);

            res.setHeader('Content-Type', 'application/json');
            res.send(JSON.stringify(response));
        });
        
        
        
    });

  });

});

function getSentiment(jsonResponse, tot, cont, res)
{
  if(cont<=tot)
  {
    var NaturalLanguageUnderstandingV1 = require('watson-developer-cloud/natural-language-understanding/v1.js');
    var nlu = new NaturalLanguageUnderstandingV1({
      'username': watson_nlu_username,
        'password': watson_nlu_password,
      'version_date': '2017-02-27'
    });

    var parameters = {
      'text': jsonResponse.tweets[cont-1].text,
      'features': {
        'sentiment':{
          "document": true
        }
      }
    }

    nlu.analyze(parameters, function(err, response) {
      if (err)
      {
        jsonResponse.tweets[cont-1].sentiment = "NEUTRAL"
      }
      else
        {
          var sentiment = response.sentiment.document;
          //if(sentiment.score>0.70)
            if(sentiment.label == "positive")
              jsonResponse.tweets[cont-1].sentiment = "POSITIVO"
            else if(sentiment.label == "negative")
              jsonResponse.tweets[cont-1].sentiment = "NEGATIVO"
			else
				jsonResponse.tweets[cont-1].sentiment = "NEUTRAL"
          //else
          //  jsonResponse.tweets[cont-1].sentiment = "NEUTRAL"
        }

        //regressive
        getSentiment(jsonResponse, jsonResponse.tweets.length, cont+1, res);
    });
  }
  else
  {
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(jsonResponse));
  }
}

// start server on the specified port and binding host
app.listen(appEnv.port, '0.0.0.0', function() {
  // print a message when the server starts listening
  console.log("server starting on " + appEnv.url);
});
