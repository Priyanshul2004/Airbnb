const Listing = require("../models/listing");

module.exports.index = async (req, res) => {
    const allListings = await Listing.find({});
    res.render("listings/index.ejs", { allListings });
  };

  module.exports.renderNewForm = (req, res) => {
    res.render("listings/new.ejs");
  };

  module.exports.showListing = async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id)
    .populate({path: "reviews",
     populate: {
      path: "author",
    },
  })
    .populate("owner");
    if(!listing){
      req.flash("error", "Listing you requested for does not exists");
      res.redirect("/listings");
    }
    console.log(listing);
    res.render("listings/show.ejs", { listing });
  };

  module.exports.createListing =  async (req, res, next) => {
    const newListing = new Listing(req.body.listing);
    newListing.owner = req.user._id;
    // Image URL will be provided in the form as listing[image][url]
    if (req.body.listing.image && req.body.listing.image.url) {
      newListing.image = { url: req.body.listing.image.url, filename: "uploaded_image" };
    }
    await newListing.save();
    req.flash("sucess", "New Listing Created");
    res.redirect("/listings");
  };

  module.exports.renderEditForm = async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id);
    if(!listing){
      req.flash("error", "Listing you requested for does not exists");
      res.redirect("/listings");
    }

    let originalImageUrl = listing.image ? listing.image.url : "";
    res.render("listings/edit.ejs", { listing, originalImageUrl });
  };

  module.exports.updateListing = async (req, res) => {
    let { id } = req.params; 
    let listing = await Listing.findByIdAndUpdate(id, { ...req.body.listing });

    // Update image URL if provided
    if (req.body.listing.image && req.body.listing.image.url) {
      listing.image = { url: req.body.listing.image.url, filename: "uploaded_image" };
      await listing.save();
    }
    req.flash("sucess", " Listing Updated");
    res.redirect(`/listings/${id}`);
  };

  module.exports.destroyListing = async (req, res) => {
    let { id } = req.params;
    let deletedListing = await Listing.findByIdAndDelete(id);
    console.log(deletedListing);
    req.flash("sucess", " Listing Deleted");
    res.redirect("/listings");
  };