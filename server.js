const express = require("express");
const cors = require("cors");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// In-memory user database
const users = {};

// test route
app.get("/", (req, res) => {
    res.send("InvestWise Backend Running");
});

// register route
app.post("/register", (req, res) => {
    const name = req.body.name;

    if (!name) {
        return res.status(400).json({ error: "Name is required" });
    }

    if (users[name]) {
        return res.status(400).json({ error: "Username already exists!" });
    }

    users[name] = {
        name: name,
        wallet: 100000,
        portfolio: {
            gold: 0,
            stocks: 0,
            crypto: 0,
            fd: 0
        }
    };

    res.json(users[name]);
});

// login route
app.post("/login", (req, res) => {
    const name = req.body.name;

    if (!name) {
        return res.status(400).json({ error: "Name is required" });
    }

    if (!users[name]) {
        return res.status(404).json({ error: "User not found. Please register!" });
    }

    res.json(users[name]);
});

// buy route
app.post("/buy", (req, res) => {
    const { name, asset, price } = req.body;

    if (!users[name]) {
        return res.status(404).json({ error: "User not found." });
    }

    if (users[name].wallet < price) {
        return res.status(400).json({ error: "Insufficient wallet balance." });
    }

    if (users[name].portfolio[asset] === undefined) {
         return res.status(400).json({ error: "Invalid asset." });
    }

    // Process the purchase
    users[name].wallet -= price;
    users[name].portfolio[asset] += price;

    res.json(users[name]);
});

// sell route
app.post("/sell", (req, res) => {
    const { name, asset, investedAmountToDeduct, walletAmountToAdd } = req.body;

    if (!users[name]) {
        return res.status(404).json({ error: "User not found." });
    }

    if (users[name].portfolio[asset] < investedAmountToDeduct) {
         return res.status(400).json({ error: "Not enough asset to sell." });
    }

    // Process the sale
    users[name].portfolio[asset] -= investedAmountToDeduct;
    if (Math.abs(users[name].portfolio[asset]) < 0.01) {
        users[name].portfolio[asset] = 0;
    }
    users[name].wallet += walletAmountToAdd;

    res.json(users[name]);
});

// start server
app.listen(5000, () => {
    console.log("Server started on http://localhost:5000");
});