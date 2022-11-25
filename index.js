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
    const productsCollections = client
      .db("used-cars-ass12")
      .collection("products");
    const categoriesCollections = client
      .db("used-cars-ass12")
      .collection("categories");
    const bookingsCollections = client
      .db("used-cars-ass12")
      .collection("bookings");

    app.post("/users", async (req, res) => {
      const user = req.body;
      // console.log(user);
      const result = await usersCollections.insertOne(user);
      res.send(result);
    });

    app.post("/category", async (req, res) => {
      const category = req.body;
      const result = await categoriesCollections.insertOne(category);
      // console.log(category);
      res.send(result);
    });
    // get categories

    app.get("/usersTypes/:email", async (req, res) => {
      const email = req.params.email;
      const user = await usersCollections.findOne({email});
      const userType = user.role;

      res.send(userType)
    });

    app.get("/categories", async (req, res) => {
      const query = {};

      const categories = await categoriesCollections.find(query).toArray();
      res.send(categories);
    });

    app.get("/users", async (req, res) => {
      const query = {};
      const users = await usersCollections.find(query).toArray();
      res.send(users);
    });

    app.post("/products", async (req, res) => {
      const products = req.body;
      // console.log(products);
      const seller = await usersCollections.findOne({ email: req.query.email });
      if (seller.role === "seller") {
        const result = await productsCollections.insertOne(products);
        console.log(seller);
        res.send(result);
      }
    });
    app.get("/products/:name", async (req, res) => {
      const name = req.params.name;
      const query = { category: name };
      const result = await productsCollections.find(query).toArray();
      res.send(result);
    });

    app.post("/bookings", async (req, res) => {
      const bookings = req.body;
      // console.log(bookings);
      const result = await bookingsCollections.insertOne(bookings);
      res.send(result);
    });
  } finally {
  }
}
run().catch(console.dir);

app.listen(port, () => console.log(`my server is running on ${port} ports `));
