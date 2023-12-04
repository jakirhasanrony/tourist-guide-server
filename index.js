const express = require('express');
const app = express();
const jwt = require('jsonwebtoken');
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
        const userCollection = client.db("finalEffortDb").collection("users");
        const commentCollection = client.db("finalEffortDb").collection("comments");
        const storyCollection = client.db("finalEffortDb").collection("stories");




        // jwt related api

        app.post('/jwt', async (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
            res.send({ token });
        })



        // middlewares
        const verifyToken = (req, res, next) => {
            console.log('inside verify token', req.headers.authorization);
            if (!req.headers.authorization) {
                return res.status(401).send({ message: 'unauthorized access' });
            }
            const token = req.headers.authorization.split(' ')[1];
            jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
                if (err) {
                    return res.status(401).send({ message: 'unauthorized access' })
                }
                req.decoded = decoded;
                next();

            })
        }

        // verify admin
        const verifyAdmin = async (req, res, next) => {
            const email = req.decoded.email;
            const query = { email: email };
            const user = await userCollection.findOne(query);
            const isAdmin = user?.role === 'admin';
            if (!isAdmin) {
                return req.status(403).send({ message: 'forbidden access' });
            }
            next();
        }
        // verify tourGuide
        const verifyTourGuide = async (req, res, next) => {
            const email = req.decoded.email;
            const query = { email: email };
            const user = await userCollection.findOne(query);
            const isTourGuide = user?.role === 'tourGuide';
            if (!isTourGuide) {
                return req.status(403).send({ message: 'forbidden access' });
            }
            next();
        }









        // user related api
        app.post('/users', async (req, res) => {
            const user = req.body;
            const query = { email: user.email }
            const existingUser = await userCollection.findOne(query);
            if (existingUser) {
                return res.send({ message: 'user already exists', insertedId: null })
            }

            const result = await userCollection.insertOne(user);
            res.send(result);
        })



        app.get('/users', verifyToken, verifyAdmin, async (req, res) => {
            const result = await userCollection.find().toArray();
            res.send(result);
        })


        // admin api
        app.patch('/users/admin/:id', verifyToken, verifyAdmin, async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const updatedDoc = {
                $set: {
                    role: 'admin'
                }
            }
            const result = await userCollection.updateOne(filter, updatedDoc);
            res.send(result);

        })

        // check if user admin or not!
        app.get('/users/admin/:email', verifyToken, async (req, res) => {
            const email = req.params.email;
            if (email !== req.decoded.email) {
                return req.status(403).send({ message: 'forbidden access' });
            }
            const query = { email: email };
            const user = await userCollection.findOne(query);
            let admin = false;
            if (user) {
                admin = user?.role === 'admin'
            }
            res.send({ admin });
        })
        // tour guide api
        app.patch('/users/tourGuide/:id', verifyToken, async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const updatedDoc = {
                $set: {
                    role: 'tourGuide'
                }
            }
            const result = await userCollection.updateOne(filter, updatedDoc);
            res.send(result);

        })

        // check if user tourGuide or not!
        app.get('/users/tourGuide/:email', verifyToken, async (req, res) => {
            const email = req.params.email;
            if (email !== req.decoded.email) {
                return req.status(403).send({ message: 'forbidden access' });
            }
            const query = { email: email };
            const user = await userCollection.findOne(query);
            let tourGuide = false;
            if (user) {
                tourGuide = user?.role === 'tourGuide'
            }
            res.send({ tourGuide });

        })








        // tour packages related api
        app.get('/tourPackage', async (req, res) => {
            const result = await tourPackagesCollection.find().toArray();
            res.send(result);
        })
        app.post('/tourPackage', verifyToken, verifyAdmin, async (req, res) => {
            const item = req.body;
            const result = await tourPackagesCollection.insertOne(item);
            res.send(result);
        })

        app.get('/tourPackage/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await tourPackagesCollection.findOne(query);
            res.send(result);
        })

        // tourist comment for tourGuide
        app.post('/comments', async (req, res) => {
            const comment = req.body;
            const result = await commentCollection.insertOne(comment);
            res.send(result);
        })
        // tourist stories
        app.post('/stories', async (req, res) => {
            const story = req.body;
            const result = await storyCollection.insertOne(story);
            res.send(result);
        })
        app.get('/stories', async (req, res) => {
            const result = await storyCollection.find().toArray();
            res.send(result);
        })
        app.get('/stories/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await storyCollection.findOne(query);
            res.send(result);
        })



        // wish list related api
        app.post('/wishlist', async (req, res) => {
            const wishListItem = req.body;
            const result = await wishListCollection.insertOne(wishListItem);
            res.send(result);
        })

        app.get('/wishlist', async (req, res) => {
            const email = req.query.email;
            const query = { email: email };
            const result = await wishListCollection.find(query).toArray();
            res.send(result);
        })

        app.delete('/wishlist/:id', async (req, res) => {
            const id = req.params.id;
            // console.log(id);
            const query = { _id: new ObjectId(id) }
            const result = await wishListCollection.deleteOne(query);
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