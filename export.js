var path=require('path');
var fs = require('fs');
var readline = require('readline');
const Promise = require('bluebird');
var google = require('googleapis');
var googleAuth = require('google-auth-library');
//var SCOPES = ['https://www.googleapis.com/auth/drive','https://www.googleapis.com/auth/spreadsheets'];
var SCOPES=["https://www.googleapis.com/auth/drive",
"https://www.googleapis.com/auth/spreadsheets",
"https://www.googleapis.com/auth/userinfo.email"]
var TOKEN_DIR = path.join(__dirname, 'google');
var TOKEN_PATH = path.join(TOKEN_DIR , 'token.json');
// Load client secrets from a local file.
var data;

module.exports=class FormulaBuilderToSheets{
    constructor(obj){
      data=obj;
    }
    prepareFormulaSheet(){
      return Promise.coroutine(function *(){
        let credentials=yield readFile();
        let token=yield authorize(credentials);
        let url = yield callAppsScript(token,data,'storeAndRetrieve');
        return url;
      }).apply(this); 
    }
    getResults(params){
      return Promise.coroutine(function*(){
          let credentials=yield readFile();
          let token=yield authorize(credentials);
          let results = yield callAppsScript(token,params,'getResults');
          return results;
      }).apply(this);
    }
    calculateResults(params){
      return Promise.coroutine(function*(){
         let credentials=yield readFile();
          let token=yield authorize(credentials);
          let results = yield callAppsScript(token,params,'calculateResults');
          return results;
      }).apply(this);
    }
}
function readFile(){
      return new Promise((resolve,reject)=>{
           fs.readFile('client_secret.json', function processClientSecrets(err, content) {
            if (err) {
              console.log('Error loading client secret file: ' + err);
              reject("Error loading client secret file");
            }
            console.log(JSON.parse(content));
            resolve(JSON.parse(content));
          });
      })
     
}
function authorize(credentials) {
  return new Promise((resolve,reject)=>{
      var clientSecret = credentials.installed.client_secret;
      var clientId = credentials.installed.client_id;
        var redirectUrl = credentials.installed.redirect_uris[0];
        var auth = new googleAuth();
        var oauth2Client = new auth.OAuth2(clientId, clientSecret, redirectUrl);

        // Check if we have previously stored a token.
        fs.readFile(TOKEN_PATH, function(err, token) {
          if (err) {
              //console.log("Authorize:"+err);
              let oauth=getNewToken(oauth2Client);
              resolve(oauth);
          } else {
              console.log("Token:"+token);
              oauth2Client.credentials = JSON.parse(token);
              resolve(oauth2Client);
          }
        });
  })
  
}
/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 *
 * @param {google.auth.OAuth2} oauth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback to call with the authorized
 *     client.
 */
function getNewToken(oauth2Client) {
    console.log("Entered in getNewToken");
  var authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES
  });
  console.log('Authorize this app by visiting this url: ', authUrl);
  var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  rl.question('Enter the code from that page here: ', function(code) {
    rl.close();
    oauth2Client.getToken(code, function(err, token) {
      if (err) {
        console.log('Error while trying to retrieve access token', err);
        return;
      }
      oauth2Client.credentials = token;
      storeToken(token);
      return oauth2Client;
    });
  });
}
/**
 * Store token to disk be used in later program executions.
 *
 * @param {Object} token The token to store to disk.
 */
function storeToken(token) {
    console.log("Entered in Store token");
  try {
    fs.mkdirSync(TOKEN_DIR);
  } catch (err) {
    if (err.code != 'EEXIST') {
        console.log("Error in store:"+err)
      throw err;
    }
  }
  fs.writeFile(TOKEN_PATH, JSON.stringify(token));
  console.log('Token stored to ' + TOKEN_PATH);
}
/**
 * Call an Apps Script function to list the folders in the user's root
 * Drive folder.
 *
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
function callAppsScript(auth,data,functionName) {
  return new Promise((resolve,reject)=>{
      var scriptId = 'MTZ6zC7WcjVUdFufPe0mLVOpZ0J7u5Cp8';
      var script = google.script('v1');
      
      // Make the API request. The request object is included here as 'resource'.
      script.scripts.run({auth: auth,
        resource: {
          function: functionName,
          parameters:[data],
        },
        scriptId: scriptId
      }, function(err, resp) {
        if (err) {
          console.log('The API returned an error: ' + err + err.errorMessage);
          reject(err);
          return;
        }
        if (resp.error) {
          var error = resp.error.details[0];
          console.log('Script error message: ' + error.errorMessage);
          console.log('Script error stacktrace:');
          if (error.scriptStackTraceElements) {
            for (var i = 0; i < error.scriptStackTraceElements.length; i++) {
              var trace = error.scriptStackTraceElements[i];
              console.log('\t%s: %s', trace.function, trace.lineNumber);
            }
          }
          resolve(resp.error);
        } else {
            console.log(resp.response.result);
            resolve(resp.response.result);
        }

    });
  })
  
}
