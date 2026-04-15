const express = require("express");
const cors = require("cors");
const axios = require("axios");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

// 🔑 СЮДА ПОТОМ ВСТАВИШЬ СВОИ ДАННЫЕ
const SHOP_ID = "YOUR_SHOP_ID";
const SECRET_KEY = "YOUR_SECRET_KEY";

app.post("/create-payment", async (req, res) => {
  const { amount } = req.body;

  try {
    const response = await axios.post(
      "https://api.yookassa.ru/v3/payments",
      {
        amount: {
          value: amount.toFixed(2),
          currency: "RUB",
        },
        confirmation: {
          type: "redirect",
          return_url: "http://localhost:3000",
        },
        capture: true,
      },
      {
        auth: {
          username: SHOP_ID,
          password: SECRET_KEY,
        },
      }
    );

    res.json({
      url: response.data.confirmation.confirmation_url,
    });
  } catch (error) {
    console.log(error.response?.data || error.message);
    res.status(500).json({ error: "payment error" });
  }
});

app.listen(5000, () => {
  console.log("🔥 Backend running on http://localhost:5000");
});