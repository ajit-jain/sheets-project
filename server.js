var express=require('express');
var app = express();
var path=require('path');
var Promise=require('bluebird');
const formBuilder=require('./export');
console.log(Array.from([["Questions","values"],["Q1",1],["Q2",2],["Q3",3],["Q4",4]]));
app.post('/data',(req,res,next)=>{
    Promise.coroutine(function*(){
      var data={
        'spreadsheetUrl':'https://docs.google.com/a/venturepact.com/spreadsheets/d/1aPe0Yxxu3KBH-kUWxjLUA1OxG955_90UubFm-hctxZk/edit',
        'title':'outgrow',
        'Questions':[["Questions","values"],["Q1",1],["Q2",2],["Q3",3],["Q4",4]],
        'Results':[["R1","R2","R3"]]
    };
      let url=yield new formBuilder(data).prepareFormulaSheet();
      return url;
    }).apply(this)
    .then((data)=>{
         res.json(data);
    })
})
app.post('/result',(req,res,next)=>{
  Promise.coroutine(function*(){
      var data={
        "url":'https://docs.google.com/spreadsheets/d/1aPe0Yxxu3KBH-kUWxjLUA1OxG955_90UubFm-hctxZk/edit',
        "numberOfResults":3
      };
      let results=yield new formBuilder().getResults(data);
      return results;
  }).apply(this)
  .then((results)=>{
    res.json(results);
  });
})
app.post('/resultQuestion',(req,res,next)=>{
  Promise.coroutine(function*(){
     var data={
        'spreadsheetUrl':'https://docs.google.com/a/venturepact.com/spreadsheets/d/1aPe0Yxxu3KBH-kUWxjLUA1OxG955_90UubFm-hctxZk/edit',
        'title':'outgrow',
        'Questions':[["Q1",5],["Q2",7],["Q3",8],["Q4",6],["Q5",9]],
        'Results':[["R1","R2","R3"]],
        "url":'https://docs.google.com/spreadsheets/d/1aPe0Yxxu3KBH-kUWxjLUA1OxG955_90UubFm-hctxZk/edit',
        "numberOfResults":3
    };
   
      let results=yield new formBuilder().calculateResults(data);
      return results;
  }).apply(this)
  .then((results)=>{
    res.json(results);
  });
})
app.listen(3000,'localhost',()=>{
    console.log("Server Running");
})