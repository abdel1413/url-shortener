require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const dns = require("dns");

const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
//create a schema
let urlShema = new mongoose.Schema({
  originalUrl: { type: String, require: true, sparse: true },
  inputTracker: Number,
});

//create a model
let UrlDoc = mongoose.model("Url", urlShema);

app.use("/public", express.static(process.cwd() + "/public"));

app.get("/", (req, res) => {
  res.sendFile(process.cwd() + "/views/index.html");
});



//create an empt object to send responses
const responseObject = {};



//to redirect to original url, we need to capture the id param
//then use it to redirect to original url
app.get("/api/shorturl/:shorturl", (req, res) => {
  const id = req.params.shorturl;

  //find the doc in db where inputracker match the id
  UrlDoc.findOne({ inputTracker: id }).then((result) => {
  
    if (result) {
      let original = result.originalUrl;
      res.redirect(original);
    } else {
      res.json({ message: "The url  does not exist" });
    }
  });
});

app.post(
  "/api/shorturl",
  bodyParser.urlencoded({ extended: false }),
  (req, res) => {
    //console.log("reqb", req.body.url);
    let url = req.body.url;

    let urlObject = new URL(url);

    dns.lookup(urlObject.hostname, (error, address, family) => {
      if (!address) {
        res.json({ error: "invalid url" });
      } else {
        
        responseObject["original_url"] = urlObject.href;

        //check that the url already exist in db
        //if exist send it to client side
        UrlDoc.findOne({ originalUrl: responseObject["original_url"] }).then(
          (docUrl) => {
            if (docUrl) {
              res.json({
                original_url: docUrl.originalUrl,
                short_url: docUrl.inputTracker,
              });
            } else {
              //if the url doesn't exist in db,  get the latest input tracker and
              //increment it by one then save the doc in db
              let urlTracker = 1;
              responseObject["short_url"] = urlTracker;

              UrlDoc.findOne({})
                .sort({ inputTracker: -1 })
                .then((data) => {
                  if (data) {
                    urlTracker = parseInt(data.inputTracker + 1);
                    responseObject["short_url"] = urlTracker;
                  }

                  //create an instance of  model
                  const doc = new UrlDoc({
                    originalUrl: responseObject["original_url"],
                    inputTracker: responseObject["short_url"],
                  });
                  doc.save();
                  res.json(responseObject);
                })
                .catch((e) => console.error(e));
            }
          }
        );
      }
    });

    
);

mongoose
  .connect(process.env.DB_URI)
  .then(() => {
    console.log("successfully connected");
    app.listen(PORT, () => {
      console.log(`you're listening to port ${PORT}`);
    });
  })
  .catch((error) => console.error("Oops, there's an error: " + error));
