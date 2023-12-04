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

//get url input from body/ html when buttom is clicked
// to acces body, we need body parser passed as 2nd param
//then call back

//create an empt object for to send responses
const responseObject = {};

//create a tracker that increment
//by 1 anytime the same url is entered

//to redirect to original url, we need to capture the id param
//then use it to redirect to original url
app.get("/api/shorturl/:shorturl", (req, res) => {
  const id = req.params.shorturl;

  //find the doc in db where inputracker match the id
  UrlDoc.findOne({ inputTracker: id }).then((result) => {
    //find the original url from doc then redirct to that url

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

    // responseObject["inputTracker"] = urlTracker;

    // UrlDoc.findOne({ originalUrl: Url })
    //   .then((result) => {
    //     //  console.log("r", result.originalUrl);
    //     if (result.originalUrl == Url) {
    //       urlTracker = urlTracker + 1;
    //       // console.log("tracker ", urlTracker);
    //       updater(urlTracker);
    //     }
    //   })
    //   .catch((e) => console.log(e));
    // console.log("urltracker ", urlTracker);
    // // assign the url to responseObject

    // const updater = (num) => {
    //   let filter = { originalUrl: Url };
    //   let updated = { originalUrl: Url, inputTracker: num };
    //   let option = { returnOriginal: false };
    //   UrlDoc.findOneAndUpdate(filter, updated, option);
    // };

    //res.json(responseObject);

    //Populate our model with info from user
    //sort in descending order the ulr model so that
    //we can update the tracker anytime the same url is entered

    // res.json({ greading: "hello node js" });

    // UrlDoc.findOne({ originalUrl: Url })

    //   .sort({ inputTracker: "desc" })
    //   .exec()
    //   .then((er, result) => {
    //     if (!er && result != undefined) {
    //       urlTracker = result.inputracker + 1;
    //     }

    //     if (!er) {
    //       UrlDoc.findOneAndUpdate(filter, updated, option).then((e, data) => {
    //         if (!e) {
    //           console.log(responseObject);
    //           responseObject["inputTracker"] = data.inputTracker;

    //           console.log("up", responseObject);
    //           res.json(responseObject);
    //         }
    //       });
    //     }
    //   });

    // UrlDoc.findOneAndUpdate(filter, updated, option).then((e, r) => {
    //   if (!e) console.log("r", r);
    // });
  }
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
