const express = require("express");
const cors = require("cors");
const app = express();
require("dotenv").config();
const port = process.env.PORT || 3008;

// middle ware ///
app.use(cors());
app.use(express.json());

app.get("/", async (req, res) => {
  res.send("my server running from loacalhost 3008");
});
const { MongoClient, ServerApiVersion } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.ysfeeva.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

async function run() {
  try {
    const usersCollections = client.db("used-cars-ass12").collection("users");
    const categoriesCollections = client.db("used-cars-ass12").collection("categories");




    app.post("/users", async (req, res) => {
      const user = req.body;
      // console.log(user);
      const result = await usersCollections.insertOne(user);
      res.send(result)
    });

    app.post('category',async(req,res)=>{
      const category = req.body
      const result = await categoriesCollections.insertOne(category)
    })
    


  } finally {
  }
}
run().catch(console.dir);

app.listen(port, () => console.log(`my server is running on ${port} ports `));
