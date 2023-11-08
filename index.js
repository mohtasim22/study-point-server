const express = require('express');
require('dotenv').config()
const cors = require('cors');
const jwt = require('jsonwebtoken');
var cookieParser = require('cookie-parser')
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

app.use(cors({
  
  origin: ['http://localhost:5173', 'https://study-point-auth-1dfbf.web.app'],
  credentials: true,
  optionSucessStatus:200,
  methods: ['GET', 'POST', 'PUT', 'DELETE','PATCH','OPTIONS']
}));
app.use(express.json());
app.use(cookieParser());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.xe6z2zy.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

const verifyToken = async(req,res,next)=>{
  const token = req.cookies?.token;
  console.log('token',token);
  if(!token){
    return res.status(401).send({message:'Not authorized'})

  }
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err,decoded)=>{
    if(err){
      return res.status(401).send({message:'unauthorized'})
    }
    console.log('value in the token', decoded);
    req.user = decoded;
    next();
  })
  
}


async function run() {
  try {

    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect ()

    const assignmentCollection = client.db('assignmentDB').collection('assignments');
    const subAssignmentCollection = client.db('assignmentDB').collection('submittedAssignments');
    // auth related api
    app.post('/jwt', async(req,res) =>{
      const user= req.body;
      console.log(user);
      const token =jwt.sign(user,process.env.ACCESS_TOKEN_SECRET,{expiresIn: '1h'})
      res
      .cookie('token',token,{
        httpOnly: true,
        secure: false,
      })
      .send({success: true});
    })
    // assignments
    app.get('/assignments',async(req,res)=>{
        console.log(req.query);
        const page= parseInt(req.query.page);
        const size= parseInt(req.query.size);
        const difficulty= req.query.difficulty;
        console.log(difficulty);

        if(difficulty=='All'){
          const count = (await assignmentCollection.find().toArray()).length;
          const cursor = assignmentCollection.find()
          .skip(page*size)
          .limit(size);
          const result = await cursor.toArray();
          res.send({result,count});
        }else{
          const query = {difficulty: difficulty};
          const count = (await assignmentCollection.find(query).toArray()).length;
          const cursor = assignmentCollection.find(query)
          .skip(page*size)
          .limit(size);
          const result = await cursor.toArray();
          res.send({result,count});
        }
           
    })
    app.get('/assignmentsCount',async(req,res)=>{
        const count = assignmentCollection.estimatedDocumentCount()
        res.send({count});   
    })
    app.post('/assignments',async(req,res)=>{
      const newAssignment = req.body;
      console.log('User in the valid token',req.user);
      console.log(newAssignment);
      const result = await assignmentCollection.insertOne(newAssignment);
      res.send(result);
    })
    app.get('/assignments/:id', async(req,res)=>{
      const id = req.params.id;
      const query = {_id: new ObjectId(id)}
      const result = await assignmentCollection.findOne(query);
      res.send(result); 
    })
    app.put('/assignments/:id', async(req,res)=>{
      const id = req.params.id;
      const filter = {_id: new ObjectId(id)}
      const options = {upsert: true};
      const updatedAssignment= req.body;
      const assignment = {
          $set: {
              title:updatedAssignment.title,
              image:updatedAssignment.image,
              marks:updatedAssignment.marks,
              difficulty:updatedAssignment.difficulty,
              date:updatedAssignment.date,
              email:updatedAssignment.email,
              description:updatedAssignment.description

          }
      }
      const result = await assignmentCollection.updateOne(filter, assignment, options);
      res.send(result); 
    })
    app.delete('/assignments/:id', async(req,res)=>{
      const id = req.params.id;
      const query = {_id: new ObjectId(id)}
      const result = await assignmentCollection.deleteOne(query);
      res.send(result); 
    })

    // submittedAssignments
    app.get('/submittedAssignments', async(req,res)=>{
      const cursor = subAssignmentCollection.find();
      const result = await cursor.toArray();
      res.send(result);   
    })
    app.post('/submittedAssignments', async(req,res)=>{
      const newSubAssignment = req.body;
      console.log(newSubAssignment);
      const result = await subAssignmentCollection.insertOne(newSubAssignment);
      res.send(result);
    })
    app.patch('/submittedAssignments/:id', async(req,res)=>{
      const id = req.params.id;
      const filter = {_id: new ObjectId(id)}
      const updatedSubAssignment= req.body;
      const updatedAssignment = {
          $set: {
            obtainedMarks:updatedSubAssignment.obtainedMarks,
            feedback:updatedSubAssignment.feedback,
            status:updatedSubAssignment.status,

          }
      }
      const result = await subAssignmentCollection.updateOne(filter, updatedAssignment);
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
    res.send('Study Point server is running')
})

app.listen(port, ()=>{
    console.log(`Fahim gadgets server is running on port: ${port}`)
})