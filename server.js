const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const shortid = require('shortid');
const cors = require('cors')
const moment = require('moment')
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
  data:[{
    date:String,
    description:String,
    duration:Number
  }]
});

var User = mongoose.model('User',userSchema);
//easy print function
var p = (val)=>{console.log(val)};


//==================================
// 1. POST /api/exercise/new-user
//==================================


app.post('/api/exercise/new-user',(req,res)=>{
  // p(req);
  //if invalid username
  if(req.body.username.length==0){
    return res.json({error:'invalid username'});
  }
  //if valid username
  //find if username exists
  User.find({username:req.body.username},(e,d)=>{
    if(e)p(e);
    //if username doesn't exist in db
    if(d.length==0){
      //create a new user in db and return username and userId
      var newUser = User({username:req.body.username,userId:shortid.generate()});
      newUser.save((e,d)=>{
        if(e)p(e);
        res.json({username:d.username,userId:d.userId},(e,d)=>{
          e?p(e):p(d);
        });
      });
    }
    //If username exists
    else{
      //return existing username and userId from db
      res.send('Username already taken!',(e,d)=>{
        e?p(e):p(d);
      });
    }
  });
});


//==================================
// 2. POST /api/exercise/add
//==================================


app.post('/api/exercise/add',(req,res)=>{
  //if required fields missing, 
  //return error report
  if(req.body.userId.length==0){
    return res.send('unknown ID',(e,d)=>{
      e?p(e):p(d);
    });
  }
  if(req.body.description.length==0){
    return res.send("'Description' is required",(e,d)=>{
      e?p(e):p(d);
    });
  }
  if(req.body.description.length>=16){
    return res.send("'Description' is too long",(e,d)=>{
      e?p(e):p(d);
    });
  }
  if(req.body.duration.length==0){
    return res.send("'Duration' is required",(e,d)=>{
      e?p(e):p(d);
    });
  }
  //if all required fields present, 
  //find user by ID
  User.find({userId:req.body.userId},(e,d)=>{
    //user not found? 
    if(d.length==0){
      //return error report
      return res.send('unknown user ID',(e,d)=>{
      e?p(e):p(d);
    });
    }
    //user found:
    else{
      
        var oldUser = User(d[0]);
      //if date not present  
      if(req.body.date.length==0){
        //init date
        var date = moment().year().toString()+'-'+moment().add(1,'M').month().toString()+'-'+moment().date().toString();
        p(date);
        //push data to file with present date
        oldUser.data.push({date:date,description:req.body.description,duration:req.body.duration});
      }
      //if date given and valid
      else if(req.body.date.match(/\d{4}-\d{1,2}-\d{1,2}/g)){
        //push all given data to file
        oldUser.data.push({date:req.body.date, description:req.body.description, duration:req.body.duration});
      }
      //save file and return details
      oldUser.save((e,d)=>{
        if(e)return p(e);
        return res.send({userId:oldUser.userId,data:{date:date,description:req.body.description,duration:req.body.duration}},(e,d)=>{
          e?p(e):p(d);
        });
      });
    }
  });
});


//==================================
// 3. GET /api/exercise/log?{userId}[&from][&to][&limit]
//==================================


app.get('/api/exercise/log',(req,res)=>{
  //invalid userId?
  //return error
  if(!req.query.userId){
    return res.send('please submit valid userId',(e,d)=>{
      e?p(e):p(d);
    });
  }
  //valid userId? find user
  User.find({userId:req.query.userId},(e,d)=>{
    if(e)p(e);
    //user not found? 
    if(d.length==0){
      //return error report
      return res.send('unknown userId',(e,d)=>{
        e?p(e):p(d);
      });
    }
    //user found
    else{
      var from,to,limit;
      //verify from date
      if(req.query.from){
        if(moment(req.query.from, 'YYYY-MM-DD').isBefore(moment())){
          from = req.query.from;
        }
        else{
          return res.send("'from' date cannot be ahead of today",(e,d)=>{
            e?p(e):p(d);
          });
        }
      }
      //if no from date given
      else{
        //set from date to the beginning
        from = '2018-01-01';
      }
      
      //verify to date
      if(req.query.to){
        if(moment(req.query.to, 'YYYY-MM-DD').isBefore(moment(from, 'YYYY-MM-DD'))){
          return res.send("'to' date cannot be behind 'from' date",(e,d)=>{
            e?p(e):p(d);
          });
        }
        else{
          to = req.query.to;
        }
      }
      //verify limit
      if(req.query.limit){
        //if limit value less than zero
        if(req.query.limit<=0){
          return res.send('Nothing to display',(e,d)=>{
            e?p(e):p(d);
          });
        }
        else{
          limit = req.query.limit;
        }
      }
      else{
       limit = 50;
      }
      
      // return data based on finalized parameters
      var details = [];
      // d[0].data.forEach((x,i)=>{
      for(const [i,x] of d[0].data.entries()){
        details.push({date:x.date,description:x.description,duration:x.duration});
        limit--;
        if(limit==0){
          break;
        }
      }
      //Display user details
      return res.json({username:d[0].username,userId:d[0].userId,details:details},(e,d)=>{
        e?p(e):p(d);
      });
    }
  });
});


//==================================
// 4. GET /api/exercise/users
//==================================


app.get('/api/exercise/users',(req,res)=>{
  //get all users
  User.find({},(e,d)=>{
    if(e)p(e);
    var users=[];
    for(const [i,x] of d.entries()){
      users.push({No:i+1,username:x.username});
    }
    return res.json(users,(e,d)=>{
      e?p(e):p(d);
    });
  });
});

// Not found middleware
app.use((req, res, next) => {
  return next({status: 404, message: 'not found'})
})


const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
