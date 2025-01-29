
if(process.env.NODE_ENV != "production"){
  require("dotenv").config();
}

const express = require("express");
const app = express();
const port = 8000;
const User = require("./models/user");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");

const mongoose = require("mongoose");
// const MONGO_URL = "mongodb://127.0.0.1:27017/wanderlust";
const dbUrl=process.env.ATLASDB_URL;
main()
  .then(() => {
    console.log("connected to DB");
  })
  .catch((err) => {
    console.log(err);
  });

async function main() {
  await mongoose.connect(dbUrl);
}


const ExpressError = require("./utils/ExpressError.js");

const listingRouter = require("./routes/listing.js");
const reviewRouter = require("./routes/review.js");
const userRouter = require("./routes/user.js");

const passport = require("passport");
const LocalStrategy = require("passport-local");

const session = require("express-session");
const MongoStore=require("connect-mongo");
const flash = require("connect-flash");


app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: false }));

app.use(methodOverride("_method"));
app.engine("ejs", ejsMate);
app.use(express.static(path.join(__dirname, "/public")));

const store=MongoStore.create({
  mongoUrl:dbUrl,
  crypto:{
    secret:process.env.SECRET,
  
  },
  touchAfter: 24*3600,
});
store.on("error",()=>{
  console.log("ERROR in Mongo-Session store")
})
const sessionOptions = {   //used to store some info of user from current session
  store,
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: true,
  cookie:{
    expires:Date.now()+7*24*60*60*1000,
    maxAge:7*24*60*60*1000,
    httpOnly:true,
  }
  
};



app.use(session(sessionOptions)); //when we open multiple tab in same browser of same website then we need session
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate())); // it generates a fn used in passport LocalStrategy
passport.serializeUser(User.serializeUser()); // used to store Currentuser related data in session
passport.deserializeUser(User.deserializeUser()); // used to delete CurrentUser related data in session

app.use((req, res, next) => {
  //middleware used to print success message
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.currUser = req.user; //we can't access req.body everywhere therefore we use req.locals it can be accessed everywhre in ejs templates
  next();
});

app.use("/listings", listingRouter);
app.use("/listings/:id/reviews", reviewRouter);
app.use("/", userRouter);

//custom error handling
app.all("*", (req, res, next) => {
  next(new ExpressError(404, "page not found"));
});

app.use((err, req, res, next) => {
  let { statusCode } = err;
  res.status(statusCode).render("error.ejs", { err });
});

app.listen(port, () => {
  console.log(`server is listening to: ${port}`);
});
