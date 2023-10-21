const express = require('express');
require('dotenv').config()
const cors = require('cors');
const app = express();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');



//middleware
// const corsConfig = {
//   origin: '*',
//   credentials: true,
//   optionSucessStatus:200,
//   methods: ['GET', 'POST', 'PUT', 'DELETE','PATCH','OPTIONS']
// }
// app.use(cors(corsConfig))
// app.options("", cors(corsConfig))

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.xe6z2zy.mongodb.net/?retryWrites=true&w=majority`;

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
    // await client.connect ()

    const productCollection = client.db('productDB').collection('product');
    const myCartProductsCollection = client.db('productDB').collection('myCartProducts');
    const brandCollection = client.db('productDB').collection('brands');

    app.get('/product',async(req,res)=>{
        const cursor = productCollection.find();
        const result = await cursor.toArray();
        res.send(result);   
    })
    app.get('/product/:id', async(req,res)=>{
        const id = req.params.id;
        const query = {_id: new ObjectId(id)}
        const result = await productCollection.findOne(query);
        res.send(result); 
    })
    app.get('/products/:brand', async(req,res)=>{
        const brand = req.params.brand;
        console.log(brand);
        const query = {brand: brand};
        const cursor = productCollection.find(query);
        const result = await cursor.toArray();
        res.send(result); 
    })

    app.post('/product',async(req,res)=>{
        const newProduct = req.body;
        console.log(newProduct);
        const result = await productCollection.insertOne(newProduct);
        res.send(result);
    })
    app.put('/product/:id', async(req,res)=>{
      const id = req.params.id;
      const filter = {_id: new ObjectId(id)}
      const options = {upsert: true};
      const updatedProduct= req.body;
      const product = {
          $set: {
              name:updatedProduct.name,
              image:updatedProduct.image,
              brand:updatedProduct.brand,
              type:updatedProduct.type,
              price:updatedProduct.price,
              rating:updatedProduct.rating

          }
      }
      const result = await productCollection.updateOne(filter, product, options);
      res.send(result); 
  })
    ///myCart
    app.get('/myCartProducts',async(req,res)=>{
      const cursor = myCartProductsCollection.find();
      const result = await cursor.toArray();
      res.send(result);   
    })
    app.post('/myCartProducts',async(req,res)=>{
        const newProduct = req.body;
        console.log(newProduct);
        const result = await myCartProductsCollection.insertOne(newProduct);
        res.send(result);
    })
    app.delete('/myCartProducts/:id', async(req,res)=>{
      const id = req.params.id;
      const query = {_id: new ObjectId(id)}
      const result = await myCartProductsCollection.deleteOne(query);
      res.send(result); 
    })
    ///Brands
    app.get('/brands',async(req,res)=>{
      const cursor = brandCollection.find();
      const resultx = await cursor.toArray();
      res.send(resultx);   
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



app.get('/', (req,res) =>{
    res.send('Fahim gadgets server is running')
})

app.listen(port, ()=>{
    console.log(`Fahim gadgets server is running on port: ${port}`)
})