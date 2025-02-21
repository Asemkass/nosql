import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import cors from "cors";
import fs from "fs";

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => console.log("MongoDB connected"))
  .catch(err => console.error("MongoDB connection error:", err));

// Boot Schema
const bootSchema = new mongoose.Schema({
    "Размерный ряд": String,
    "Сезонность": String,
    "Фурнитура": String,
    "Верх": String,
    "Мембрана/пропитка": String,
    "Подкладка": String,
    "Стелька": String,
    "Подошва": String,
    "Тип каблука": String,
    "Страна бренда": String
}, { timestamps: true });

const Boot = mongoose.model("Boot", bootSchema);

// User Schema
const userSchema = new mongoose.Schema({
    username: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    orders: [{ type: mongoose.Schema.Types.ObjectId, ref: "Order" }]
});

const User = mongoose.model("User", userSchema);

const orderSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    boots: [{ type: mongoose.Schema.Types.ObjectId, ref: "Boot" }],
    totalPrice: Number,
    createdAt: { type: Date, default: Date.now }
});

const Order = mongoose.model("Order", orderSchema);

// Middleware for authentication
const authMiddleware = (req, res, next) => {
    const token = req.header("Authorization");
    if (!token) return res.status(401).json({ error: "Access denied" });
    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        req.user = verified;
        next();
    } catch (error) {
        res.status(400).json({ error: "Invalid token" });
    }
};

// Middleware for admin authorization
const adminMiddleware = (req, res, next) => {
    if (req.user.role !== "admin") return res.status(403).json({ error: "Admin access required" });
    next();
};

// User Registration
app.post("/register", async (req, res) => {
    const { username, password, role } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: "Username and password are required" });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ username, password: hashedPassword, role });
        await user.save();
        res.json({ message: "User registered successfully" });
    } catch (error) {
        res.status(400).json({ error: "Username already exists" });
    }
});


// User Login
app.post("/login", async (req, res) => {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ error: "Invalid credentials" });
    }
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "1h" });
    res.json({ token });
});

app.post("/orders", authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ error: "User not found" });

        const boots = await Boot.find({ _id: { $in: req.body.boots } });
        if (!boots.length) return res.status(400).json({ error: "No valid boots found" });

        const totalPrice = boots.reduce((sum, boot) => sum + parseFloat(boot.price || 0), 0);
        const order = new Order({ user: user._id, boots, totalPrice });

        await order.save();

        user.orders.push(order._id);
        await user.save();

        res.json({ message: "Order placed successfully", order });
    } catch (error) {
        console.error("Error creating order:", error);
        res.status(500).json({ error: "Failed to create order" });
    }
});

app.get("/orders", authMiddleware, async (req, res) => {
    try {
        const userOrders = await Order.find({ user: req.user.id }).populate("boots");
        res.json(userOrders);
    } catch (error) {
        console.error("Error fetching orders:", error);
        res.status(500).json({ error: "Failed to fetch orders" });
    }
});

// CRUD Operations
app.post("/boots", authMiddleware, adminMiddleware, async (req, res) => {
    const boot = new Boot(req.body);
    await boot.save();
    res.json(boot);
});

app.get("/boots", async (req, res) => {
    const boots = await Boot.find();
    res.json(boots);
});

app.get("/boots/:id", async (req, res) => {
    const boot = await Boot.findById(req.params.id);
    res.json(boot);
});

app.put("/boots/:id", authMiddleware, adminMiddleware, async (req, res) => {
    const boot = await Boot.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(boot);
});

app.delete("/boots/:id", authMiddleware, adminMiddleware, async (req, res) => {
    await Boot.findByIdAndDelete(req.params.id);
    res.json({ message: "Boot deleted" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
