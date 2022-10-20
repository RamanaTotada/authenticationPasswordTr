const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const bcrypt = require("bcrypt");
const app = express();

app.use(express.json());

let db = null;
const dbPath = path.join(__dirname, "userData.db");

const initilazationDbAndServer = async (request, response) => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("server running at http://localhost:3000/");
    });
  } catch (Error) {
    console.log(`Error :db ${Error.messsage}`);
  }
};
initilazationDbAndServer();

//username	TEXT
//name	TEXT
//password	TEXT
//gender
//location

const ConverDbObjectToResponseObject = (DbObject) => {
  return {
    username: DbObject.username,
    name: DbObject.name,
    password: DbObject.password,
    gender: DbObject.gender,
    location: DbObject.location,
  };
};

//api for /register
//User already exists
//Password is too short
//User created successfully
const passwordContainLengthFive = (password) => {
  return password.length > 4;
};

app.post("/register", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const hasedPassword = await bcrypt.hash(request.body.password, 10);

  const selectUserQusery = `SELECT * FROM user WHERE username='${username}';`;
  const dbResposeUser = await db.get(selectUserQusery);
  if (dbResposeUser === undefined) {
    const createQuery = `INSERT INTO user(username,name,password,gender,location)
        VALUES(
            '${username}',
            '${name}',
            '${hasedPassword}',
            '${gender}',
            '${location}'
        ) ;`;
    if (passwordContainLengthFive(password)) {
      await db.run(createQuery);
      response.status(200);
      response.send("User created successfully");
    } else {
      response.status(400);
      response.send("Password is too short");
    }
  } else {
    response.status(400);
    response.send("User already exists");
  }
});

//api for /login

app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const selectUserQuery = `
    SELECT * from user where username = "${username}"
    ;`;
  const dbUser = await db.get(selectUserQuery);

  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const isPasswordMatch = await bcrypt.compare(password, dbUser.password);
    if (isPasswordMatch === true) {
      response.status(200);
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

//upadate Password

app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const selectUserQuery = `SELECT * FROM user WHERE username = '${username}';`;
  const databaseUser = await db.get(selectUserQuery);

  if (databaseUser === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const isPasswordMatched = await bcrypt.compare(
      oldPassword,
      databaseUser.password
    );
    if (isPasswordMatched === true) {
      if (passwordContainLengthFive(newPassword)) {
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        const updatePasswordQuery = `
          UPDATE
            user
          SET
            password = '${hashedPassword}'
          WHERE
            username = '${username}';`;

        const user = await db.run(updatePasswordQuery);

        response.send("Password updated");
      } else {
        response.status(400);
        response.send("Password is too short");
      }
    } else {
      response.status(400);
      response.send("Invalid current password");
    }
  }
});
module.exports = app;
