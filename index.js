const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const app = express();
require("dotenv").config();
const stripe = require("stripe")(process.env.STRIP_SECRET);
const port = process.env.PORT || 3008;

// middle ware ///
app.use(cors());
app.use(express.json());

app.get("/", async (req, res) => {
  res.send("my server running from loacalhost 3008");
});
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.ysfeeva.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

function verifyJWT(req, res, next) {
  // console.log("token", req.headers.authorization);
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send("Unauthorized 401 from verifyJWT func");
  }
  const token = authHeader.split(" ")[1];
  jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
    if (err) {
      return res.status(403).send({ message: "Forbidden access" });
    }
    req.decoded = decoded;
    next();
  });
}

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

    const paymentCollections = client
      .db("used-cars-ass12")
      .collection("payment");

    // for jwt //

    app.get("/jwt", async (req, res) => {
      const email = req.query.email;
      const query = { email: email };

      const user = await usersCollections.findOne(query);
      // console.log(user);
      if (user) {
        const token = jwt.sign({ email }, process.env.ACCESS_TOKEN, {
          expiresIn: "7d",
        });
        return res.send({ accessToken: token });
      }
      res.status(403).send({ accessToken: "please call with email" });
    });

    app.post("/users", async (req, res) => {
      const user = req.body;
      // console.log(user);
      const result = await usersCollections.insertOne(user);
      res.send(result);
    });
    // post category by admin ///
    app.post("/category", async (req, res) => {
      const category = req.body;
      const email = req.query.email;
      // console.log(email);
      const admin = await usersCollections.findOne({ email: email });
      console.log(admin);

      if (admin.role === "Admin") {
        const result = await categoriesCollections.insertOne(category);
        res.send(result);
      }
      // console.log(category);
    });
    // get categories

    // get seller and buyer  for admin //
    app.get("/allseller", async (req, res) => {
      const isAdmin = await usersCollections.findOne({
        email: req.query.email,
      });
      // console.log(isAdmin);
      const sellerType = req.query.type;

      if (sellerType === "seller") {
        const seller = await usersCollections
          .find({ role: "seller" })
          .toArray();
        // console.log(req.query.type,'is his type');
        res.send(seller);
      }
      if (sellerType === "buyer") {
        const buyer = await usersCollections.find({ role: "buyer" }).toArray();
        res.send(buyer);
      }
    });
    // delate a use ///
    app.delete("/deleteUser", async (req, res) => {
      const userId = req.body._id;
      const type = req.query.type;
      console.log(type);
      if (type === "buyer") {
        const buyer = await usersCollections.deleteOne({
          _id: ObjectId(userId),
        });
        res.send(buyer);
        console.log(buyer);
      }
      if (type === "seller") {
        const seller = await usersCollections.deleteOne({
          _id: ObjectId(userId),
        });
        res.send(seller);
      }
    });

    // verify seller //
    app.put("/verify", async (req, res) => {
      const id = req.body._id;
      const filter = { _id: ObjectId(id) };
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          status: "verified",
        },
      };

      const isAdmin = await usersCollections.findOne({
        email: req.query.email,
      });
      const adminrole = isAdmin.role;

      if (adminrole === "Admin") {
        console.log(adminrole);
        console.log(filter);
        const result = await usersCollections.updateOne(filter,updateDoc,options)
          res.send(result);
      }
    })

    app.get("/usersTypes/:email", async (req, res) => {
      const email = req.params.email;
      const user = await usersCollections.findOne({ email });
      const userType = user?.role;
      // console.log(userType);
      res.send({ userType });
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
      // console.log(req.query.email);
      const seller = await usersCollections.findOne({ email: req.query.email });

      // console.log(products);
      if (seller.role === "seller") {
        const result = await productsCollections.insertOne(products);
        // console.log(products);
        res.send(result);
      }
    });

    app.get("/products/:id", async (req, res) => {
      const id = req.params.id;
      const query = { categoryId: id };
      const result = await productsCollections.find(query).toArray();
      res.send(result);
    });

    // delete products ///
    app.delete("/deleteproducts/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: ObjectId(id) };
      const emailQuery = { email: req.query.email };
      const seller = await usersCollections.findOne(emailQuery);
      if (seller.role === "seller") {
        const result = await productsCollections.deleteOne(filter);
        res.send(result);
      }
    });

    app.post("/bookings", async (req, res) => {
      const bookings = req.body;
      // console.log(bookings);
      const result = await bookingsCollections.insertOne(bookings);
      res.send(result);
    });

    app.get("/orders/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const orders = await bookingsCollections.find(query).toArray();
      res.send(orders);
    });

    // for payment //
    app.get("/bookings/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await bookingsCollections.findOne(query);
      res.send(result);
    });

    app.post("/create-payment-intent", async (req, res) => {
      const booking = req.body;

      const price = booking.price;
      const amount = price * 100;

      const paymentIntent = await stripe.paymentIntents.create({
        currency: "usd",
        amount: amount,
        payment_method_types: ["card"],
      });
      res.send({
        clientSecret: paymentIntent.client_secret,
      });
    });

    app.post("/payment", async (req, res) => {
      const payment = req.body;

      const result = await paymentCollections.insertOne(payment);
      const id = payment.bookingId;
      const filter = { _id: ObjectId(id) };

      const updateDoc = {
        $set: {
          paid: true,
          transactionId: payment.transactionId,
        },
      };
      const updatedResult = await bookingsCollections.updateOne(
        filter,
        updateDoc
      );
      res.send(result);
    });

    app.get("/myproducts/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const seller = await productsCollections.find(query).toArray();
      console.log(seller);
      res.send(seller);
    });
  } finally {
  }
}
run().catch(console.dir);

app.listen(port, () => console.log(`my server is running on ${port} ports `));
