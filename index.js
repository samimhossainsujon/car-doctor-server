const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());




//=================================
//mongodb used configuration
//================================

const uri = `mongodb+srv://${process.env.DV_USER}:${process.env.DV_PASS}@cluster0.f7u6kbd.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    },
});


//============================
//JWT verification
//============================

const verifyJWT = (req, res, next) => {
    const authorization = req.headers.authorization;
    if (!authorization) {
        return res.status(401).send({ error: true, message: "Unauthorized access" });
    }

    const token = authorization.split(" ")[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (error, decoded) => {
        if (error) {
            return res.status(401).send({ error: true, message: "Unauthorized access" });
        }

        req.decoded = decoded;
        next();
    });
};





async function run() {
    try {
        await client.connect();

        const serviceCollection = client.db('Car-Doctor').collection('serveises');
        const bookingCollection = client.db('Car-Doctor').collection('bookings');

        //=============================
        //JWT authorization route
        //=============================

        app.post("/jwt", async (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
                expiresIn: "1h",
            });
            res.send({ token });
        });


        //============================
        //services Service section
        //============================

        app.get("/services", async (req, res) => {
            const cursor = serviceCollection.find();
            const result = await cursor.toArray();
            res.send(result);
        });


        app.get("/services/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const options = { projection: { title: 1, name: 1, price: 1, service_id: 1, img: 1 } };
            const result = await serviceCollection.findOne(query, options);
            res.send(result);
        });



        //==============================================
        //bookings Service section
        //==============================================

        app.get("/bookings", verifyJWT, async (req, res) => {
            let query = {};
            if (req.query?.email) {
              query = { email: req.query.email };
            }
            const result = await bookingCollection.find(query).toArray();
            res.send(result);
          });

          app.post("/bookings", async (req, res) => {
            const booking = req.body;
            const result = await bookingCollection.insertOne(booking);
            res.send(result);
          });


        //==============================
        //bookings service update section
        //==============================

        app.patch('/bookings/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const updatedBooking = req.body;
            console.log(updatedBooking);

            const updateDoc = {
                $set: {
                    status: updatedBooking.status
                },
            };
            const result =
                await bookingCollection.updateOne(filter, updateDoc);
            res.send(result);

        })





        //================================
        //bookings service delete section
        //================================

        app.delete('/bookings/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await bookingCollection.deleteOne(query)
            res.send(result);
        })








        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {

        // await client.close();
    }
}
run().catch(console.dir);




//===============================
//mongodb used close









app.get('/', (req, res) => {
    res.send('Doctor is available')
});

app.listen(port, () => {
    console.log(`car doctor listening on port ${port}`);
});