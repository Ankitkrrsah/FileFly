import redis from "../redis.js";

const RATE_LIMIT_WINDOW = 60 * 60; // 60 minutes 
const MAX_DOWNLOADS = 30;

export const downloadRateLimiter = async (req, res, next) => {
    try {
        const ip = req.ip || req.connection.remoteAddress;
        const key = `rate_limit:download:${ip}`;

        const currentCount = await redis.incr(key);

        if (currentCount === 1) {
            await redis.expire(key, RATE_LIMIT_WINDOW);
        }

        if (currentCount > MAX_DOWNLOADS) {
            const ttl = await redis.ttl(key);
            return res.status(429).json({
                error: "Rate limit exceeded",
                message: `You have exceeded the download limit of ${MAX_DOWNLOADS} files per hour. Please try again in ${Math.ceil(ttl / 60)} minutes.`
            });
        }

        next();
    } catch (error) {
        console.error("Rate Limiter Error:", error);
        next();
    }
};
