const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();
const port = process.env.PORT || 5000;







// middleware
app.use(cors());
app.use(express.json());




const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.1ez7hhm.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        // await client.connect();

        const guidesCollection = client.db("finalEffortDb").collection("guides");
        const tourPackagesCollection = client.db("finalEffortDb").collection("tourPackages");
        const wishListCollection = client.db("finalEffortDb").collection("wishList");








        // tour packages related api
        app.get('/tourPackage', async (req, res) => {
            const result = await tourPackagesCollection.find().toArray();
            res.send(result);
        })

        app.get('/tourPackage/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await tourPackagesCollection.findOne(query);
            res.send(result);
        })

        // wish list related api
        app.post('/wishlist', async (req, res) => {
            const wishListItem = req.body;
            const result = await wishListCollection.insertOne(wishListItem);
            res.send(result);
        })



        // guides related api
        app.get('/guide', async (req, res) => {
            const result = await guidesCollection.find().toArray();
            res.send(result);
        })

        app.get('/guide/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await guidesCollection.findOne(query);
            res.send(result);
        })
















        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);




app.get('/', (req, res) => {
    res.send('final effort is ongoing.........')
})

app.listen(port, () => {
    console.log(`final effort is ongoing on port: ${port}`);
})