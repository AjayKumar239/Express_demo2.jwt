import express from "express";
import { MongoClient } from "mongodb";
import bcrypt from "bcrypt";
import "dotenv/config";
import jwt from "jsonwebtoken";
// import { expressjwt } from 'express-jwt';

// import jwt from ' jsonwebtoken';

const app = express();

// Middleware for parsing JSON request bodies
app.use(express.json());

// custom middleware for parsing admin authentication

function authenticateAdminToken(req, res, next) {
  const token = req.headers["authorization"];
  if (token == null) return res.status(401).send("Access Denied. No token provided.");

  try {
    const decoded = jwt.verify(token, process.env.ADMIN_SECRET, (err) => {
      if (err) return res.send("admin eep token" + err.message);
      /// req.user = user;
      next();
    });
  } catch (err) {
    res.status(400).send("Invalid token.");
  }
}

const PORT = process.env.PORT || 3000;

// Connection URL
const url = process.env.MONGO_URL;

const client = new MongoClient(url);

async function ConnectDB() {
  try {
    await client.connect();
    console.log("✔✔ Connected to the database ✔✔");
    return client;
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    throw error; // Re-throw to crash the application for now
  }
}


// async function ConnectDB() {
//   try {
//     await client.connect();
//     console.log("✔✔ Connected to the database ✔✔");
//     return client;
//   } catch (error) {
//     if (error instanceof MongoServerError) {
//       console.log(`Error worth logging: ${error}`); // special case for some reason
//     }
//     throw error; // still want to crash
//   }
// }

await ConnectDB();

// Database Name and collection setup
const dbName = "users";
const db = client.db(dbName);
const collection = db.collection("users");

// home get method
app.get("/", function (req, res) {
  res.send("Hello World");
});

//post signup
app.post("/signup", async (req, res) => {
  const { username, email, password, role } = req.body;

  const saltRounds = 10;
  const myPlaintextPassword = password;



  try {
    // check if email already exists
    const findResult = await collection.find({ email: email }).toArray();
    if (findResult.length > 0) {
      return res.status(400).send("Email already exists");
    }
    //if not, hash the password

    const salt = await bcrypt.genSalt(saltRounds);
    const hash = await bcrypt.hash(myPlaintextPassword, salt);

    //if yes send a response
    // if no , add the user to db and then send response

    const insertResult = await collection.insertOne({
      username,
      email,
      password: hash,
      role,
    });
    res.status(201).send("User created successfully");
  } catch (error) {
    console.log(error);
    res.status(500).send(error.message);
  }
});

app.post("/login", async (req, res) => {
  try {

    const { email, password } = req.body;

    const user = await collection.findOne({ email });

    if (!user) {
      return res.status(404).send("User not found");
    }
    // const match = await user.bcrypt.compare(password,user.password);
    const match = await bcrypt.compare(password, user.password);

    if (match) {
      const role = user.role;
      let token;


//      const token = jwt.sign(payload, secret, { expiresIn: '1h' });
// console.log(token);
//       console.log(user);
    
   console.log(token);



      switch (role) {
        case "admin":
          token = jwt.sign(
            {
              data: "admin data",
            },
            "adminSecret",
            {
              expiresIn: "1200s"
            }
          )

          break;

        case "user":

          token = jwt.sign(
            {
              data: "admin data",
            },
            "usersecret",
            {
              expiresIn: "1200s"
            }
          );
          break;
        default:
          token = "not applicable - in default case";
          break;
      }


      res.status(200).send({ msg: "Welcome to dashboard", token });


    }
    else {
      return res.status(401).send({ msg: "Invalid cardentials", token: token });
    }
  } catch (error) {
    console.log(error);
    res.send(error);

  }
});


app.get("/admin", authenticateAdminToken, async (req, res) => {
  try {

    //some admin data

    const adminData = "admin secific data";

    res.send(adminData);


  } catch (error) {
    console.log(error);
    res.send(error);
  }
});


app.get("/user", async (req, res) => {
  try {
    const { token } = req.body;

    jwt.verify(token, "userSecret", (err, decoded) => {
      res.send(decoded.data)
    });
  } catch (error) {
    console.log(error);
    res.send(error);
  }
});


// user routes 

app.delete("/", async () => { });

//callback function to our app for feedback
app.listen(PORT, () => {
  console.log("Server running on port 3000 🎉🎉🎉");
});
