import Redis from "ioredis";

const redis = new Redis(); // Connects to 127.0.0.1:6379 by default

redis.on("connect", () => {
    console.log("Connected to Redis");
});

redis.on("error", (err) => {
    console.error("Redis error:", err);
});

export default redis;
