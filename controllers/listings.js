const Listing=require("../models/listing");

module.exports.index=async (req, res) => {
    const allListings = await Listing.find({});
    res.render("index.ejs", { allListings });
  };

  module.exports.newListing=async (req, res) => {
    res.render("new.ejs");
  };

module.exports.createListing=async (req, res, next) => {
  let url=req.file.path;
  let filename=req.file.filename;
  
  const { title, description, price, country, location } = req.body;
  let newListing = new Listing({
    title,
    description,
    price,
    country,
    location,
  });
  newListing.owner = req.user._id;    //basically its a current user id (req.user help is to get info of curr loggedIn user)
newListing.image={url,filename};
  await newListing.save();
  req.flash("success", "New List Created!");
  res.redirect("/listings");
};

  module.exports.showList=async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id)
      .populate({
        path: "reviews",
        populate: {
          path: "author",
        },
      })
      .populate("owner"); 

    if (!listing) {     // if curr listing is deleted or not available then this message will pop up
      req.flash("error", " Listing Not Exist!");
      return res.redirect("/listings");
    };

    res.render("show.ejs", { listing });
  };

  module.exports.editListing=async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id);
if(!listing){
  req.flash("error","Listing is deleted!");
  res.redirect("/listings")
}

let originalImageUrl=listing.image.url;
originalImageUrl.replace("/upload","/upload/h_300,w_250");
    res.render("edit.ejs", { listing ,originalImageUrl});
  };

  module.exports.updateListing=async (req, res) => {    // wrapAsynk is function used to handle error defined in utils folder
    
    let { id } = req.params;
   let listing= await Listing.findByIdAndUpdate(id, { ...req.body });

   if( typeof req.file !== "undefined"){
   let url=req.file.path;
   let filename=req.file.filename;
   listing.image={url,filename};
   await listing.save();
   }
    req.flash("success", " List Edited!");
    res.redirect(`/listings/${id}`);
  };

  module.exports.deleteListing=async (req, res) => {
    let { id } = req.params.id;
    await Listing.findByIdAndDelete(id);
    req.flash("success", " Listing Deleted Successfully!");
    res.redirect("/listings");
  };