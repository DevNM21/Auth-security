//jshint esversion:6
require('dotenv').config();
const crypto = require("crypto");
const nodemailer = require("nodemailer");

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
// const encrypt = require("mongoose-encryption");


const session = require("express-session");
const passport = require("passport");
const pasporLocalMongoose = require("passport-local-mongoose")



const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

app.use(session({
    secret: 'whatthefuckisthis?',
    resave: false,
    saveUninitialized:false,
  }))

app.use(passport.initialize());
app.use(passport.session());


const atlas_link = "mongodb+srv://admin-dev:mongodb@cluster0-rodtm.gcp.mongodb.net/";
mongoose.connect(atlas_link + "user2_todoDB",{useNewUrlParser:true})
mongoose.set('useCreateIndex', true);

  
  
  
  const listSchema = {
    name : String,
    items : [String]
  }

const userSchema = new mongoose.Schema({
    token : {
        code : String,
        stamp : String
    },
    active : Boolean,
    username : String,
    password:String, 
    lists:[listSchema]
});

userSchema.plugin(pasporLocalMongoose);
// userSchema.plugin(encrypt, { secret: process.env.SECRET, encryptedFields:["password"] });

const User = mongoose.model("User",userSchema)

const List = mongoose.model("List",listSchema);

const aList = new List ({
        name : "Today",
        items : ["hi","how are you?"]
})
  
passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());






//nodemailer condig
var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'pydev21@gmail.com',
      pass: 'daTTebayo@21'
    }
  });







/////////////////////////////////////////////////////////HOME ROUTE////////////////////////////////////////////////////

app.get("/",function(req,res){

  if (req.isAuthenticated()){
    User.findOne({username : req.user.username , active : true},function(err,foundUser){
      if(foundUser){
        var foundLists = foundUser.lists;
        foundLists.forEach(list => {
          
          if(list.name === "Today"){
            console.log(list.items);
            
        res.render("list", {listTitle:"Today", newListItems : list.items,log : "Log Out",link: "/logout"})            
          }else{
            console.log("Why the fuck isn't it working?");
            
          }
          
        });
        
      }else{
      console.log(err);
      res.redirect("/secrets")
      
        
        
      }
    })
    
  }else{
    res.redirect("https://tachyon1.herokuapp.com/login")
    
  }


  // res.render("list", {listTitle:"Today", newListItems : FoundUser.lists.items,log : "Log Out",link: "/a/ "})  
})


/////////////////////////////////////////////////////////CRUD Routes///////////////////////////////////////////////////////

    // ADD ITEM

app.post("/add",function(req,res){
  const newItem = req.body.newItem;
  const listName = req.body.list;

  console.log("FROM /add");
  console.log(listName);
  
  
  console.log(req.user.username);
  

  User.findOne({username : req.user.username},function(err,foundUser){
    var foundLists = foundUser.lists;
        foundLists.forEach(list => {
              
          if(list.name === listName){
            // console.log(list);
            
            list.items.push(newItem);
            foundUser.save();
        res.redirect("/")
          }else{
            console.log("Why the fuck isn't it working?");
            
          }
          
        }); 

  })



})

      //Delete Item


app.post("/delete",function(req,res){
  const item = req.body.checkbox;
  const listName = req.body.listName;
  console.log("From /delete");
  console.log(listName);
  
  User.findOne({username : req.user.username},function(err,foundUser){

    var foundLists = foundUser.lists;
        foundLists.forEach(list => {
              
          if(list.name === listName){
            
            
            console.log(list.items);
            
            list.items.remove(item);
            foundUser.save();
        res.redirect("/")
          }else{
            console.log("Why the fuck isn't it working?");
            
          }
          
        }); 

  })  

})

////////////////////////////////////////////////
app.get("/secrets",function(req,res){
    if(req.isAuthenticated()){
      console.log("auth complete");
      
   
      
        User.findOne({username : req.user.username},function(err,FoundUser){
          if(err){
            console.log(err)
          }else{
          // console.log(req.user);
          
          // console.log(FoundUser);
         console.log(FoundUser.lists);
         
          const LIST = FoundUser.lists;
          if(LIST.length===0){
            console.log(FoundUser.lists);
            
           FoundUser.lists = aList;
           console.log(FoundUser.lists);
            FoundUser.save();
            console.log("bbb");
            res.redirect("/")
          }else{
            res.redirect("/")
          }
        }

        })

    }else{
        res.redirect("/login")
    }
})
// app.post("/add",function(req,res){
//     const item = req.body.newItem;
//   const listName = req.body.list;
  
//   const newItem = new Item({
//      name : item
//     });
  
//   if(listName === "Today"){
//     newItem.save().then(() => console.log('meow'));    
//     res.redirect("/secrets");
//   }else {
//     List.findOne({name:listName},function(err,foundList){
//       foundList.items.push(newItem);
//       foundList.save();
//       res.redirect("/" + listName);
//     })
//   }
//   });
////////////////////////////////////////////Registring/////////////////////////////////////////

app.route("/register")
.get(function(req,res){
    res.render("register")
}
   
)

.post(
    function(req,res){
        User.register({username:req.body.username,active:false},req.body.password, function(err,user){
            if(err){
                console.log(err);
                res.redirect("/register")
            }else{
                passport.authenticate("local")(req,res,function(){
                    res.redirect("/propose")
                })
            }

        })
    }
    )

app.get("/propose",function(req,res){

var stamp = (new Date()).valueOf().toString();

var random = Math.random().toString();
var code = crypto.createHash('sha1').update(stamp + random).digest('hex');

const token  = {
    code : code,
    stamp:stamp
}
User.findOne({username : req.user.username},function(err,foundUser){
    foundUser.token = token;
    foundUser.save();

const mailOptions = {
    from: 'pydev21@gmail.com',
    to: req.user.username,
    subject: 'Tachyon verification',
    html : "<h2>Please click the below link to verify your Email address with Tachyon</h2> <p>Hey there! Thanks for checking out my app! and by the way the link expires in 15 minutes(if you get an apllication error, you could be registerd then try again loggin in from home page)</p> <br> https://tachyon1.herokuapp.com/verify/" + code +"/" + stamp +"/" + foundUser._id 
    

  };
transporter.sendMail(mailOptions, function(error, info){
    if (error) {
      console.log(error);
    } else {
      console.log('Email sent: ' + info.response);
      res.sendFile(__dirname + "/success.html")
    }
  });
})
})
app.get("/verify/:sentCode/:sentStamp/:sentUser",function(req,res){
    const sentCode = req.params.sentCode;
    const unparsed = (new Date()).valueOf().toString();
    const presentStamp = parseInt(unparsed);
    console.log(presentStamp);
    
    const sentUser = req.params.sentUser;

    User.findOne({_id:sentUser},function(err,foundUser){
        if(err){console.log(err);
        }else{

        
    console.log(foundUser.token);
    
         const regToken = foundUser.token;
        //  console.log(regToken);
         
     const regCode = regToken.code;
    //  console.log(regCode);
     
     const unparsed2 = regToken.stamp;
     const regStamp = parseInt(unparsed2)
    //  console.log(regStamp);
     
        const diff = presentStamp - regStamp;
        console.log(diff);

        if(regCode === sentCode && diff < 1000000){
            foundUser.active = true;
            console.log(foundUser.active);
            foundUser.token = {};
            foundUser.save();
            console.log(foundUser);
            res.redirect("/")
            
            
        }else{
            User.deleteOne({_id:sentUser},function(err){
                if(err){
                    res.send(err)
                }else{
                    res.send("Oops! It seems like the link expired. Please go to back to register page and try again")
                }
            })
            
        }
    }
    
    })
    
})


////////////////////////////////////////////Login//////////////////////////////////////////////
app.route("/login")
.get(function(req,res){
    res.render("login")
})


.post(function(req,res){

    const user = new User({
        username : req.body.username,
        password : req.body.password,
    });
    req.login(user,function(err){
        if(err){
            console.log(err);
            res.redirect("/login")
        }else if(user) {
            passport.authenticate("local")(req,res,function(){
              // console.log(req.user);
              
              
            
                User.findOne({username:req.user.username},function(err,foundUser){
                  if(err){
                    console.log(err);

                  }else{
                  if (foundUser.active===true){
                    console.log("isActive");
                    
                    res.redirect("/secrets");
                  }else {
                    User.findOneAndDelete({username:req.user.username},function(err,res_){
                      if(err){
                        console.log(err);
                      }else{
                        console.log(res_);
                        
                        res.send("User deleted.It seems your email wasn't verified please try to register again and click on confirmation link sent to your registered email")
                        
                      }
                    })
                  }
                    
                  }
                })
            })
        }else if(!user){
          req.send("User not found. PLease check the email/password you entered.")
        }else{
          console.log("something went wrong");
          
        }
    })

})

//////////////////////////////LOG OUT///////////////////////////////////////////////////////

app.get("/logout",function(req,res){
  req.logOut();
  console.log("out");
  
  res.redirect("/")
})





app.listen(process.env.PORT || 3000,function() {
    console.log("App running on port 3000..");
    
})

var current_date = (new Date()).valueOf().toString();
var random = Math.random().toString();
crypto.createHash('sha1').update(current_date + random).digest('hex');