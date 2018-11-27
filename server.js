const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const shortid = require('shortid');
const cors = require('cors')

const mongoose = require('mongoose')
mongoose.connect(process.env.MONGO_URI,{ useNewUrlParser: true });

app.use(cors())

app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())


app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});


// Error Handling middleware
app.use((err, req, res, next) => {
  let errCode, errMessage
  p('error handler here');
  if (err.errors) {
    // mongoose validation error
    errCode = 400 // bad request
    const keys = Object.keys(err.errors)
    // report the first validation error
    errMessage = err.errors[keys[0]].message
  } else {
    // generic or custom error
    errCode = err.status || 500
    errMessage = err.message || 'Internal Server Error'
  }
  res.status(errCode).type('txt')
    .send(errMessage)
})

var Schema = mongoose.Schema;
var userSchema = new Schema({
  username:String,
  userId:String,
  description:String,
  duration:Number,
  date:String  
});

var User = mongoose.model('User',userSchema);
//easy print function
var p = (val)=>{console.log(val)};

// 1. POST /api/exercise/new-user
app.post('/api/exercise/new-user',(req,res)=>{
  // p(req);
  User.find({username:req.body.username},(e,d)=>{
    if(e)p(e);
    p(d.length);
  //if valid username
  if(req.body.username){
  //If username exists
  //return existing username and userId
    var newUser = User({username:req.body.username,userId:shortid.generate()});
    newUser.save((e,d)=>{e?p(e):p(d);});
  }
    
  res.json({username:req.body.username,userId:newUser.userId},(e,d)=>{
    e?p(e):p(d);
  })
  })
  //else create new dataset 
  //and return username and userId
  
});


// 2. POST /api/exercise/add
app.post('/api/exercise/add',(req,res)=>{
  //if required fields missing, return error report
  //if all required fields present, 
  //valid userId? add data
  //invalid userId? return error report
  
  res.json({userId:req.body},(e,d)=>{
    e?p(e):p(d);
  });
});

// 3. GET /api/exercise/log?{userId}[&from][&to][&limit]
app.get('/api/exercise/log',(req,res)=>{
  //invalid userId? return error
  //
  p('id: ');p(req.query);
  res.json({userId:req.query},(e,d)=>{
    e?p(e):p(d);
  });
});

// 4. GET /api/exercise/log?{userId}[&from][&to][&limit]
app.get('/api/exercise/users',(req,res)=>{
  p('id: ');p(req.query);
  res.json({userId:req.query},(e,d)=>{
    e?p(e):p(d);
  });
});

// Not found middleware
app.use((req, res, next) => {
  return next({status: 404, message: 'not found'})
})


const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
