import Redis from "ioredis";

const redis = new Redis(process.env.REDIS_URL); // used to write 

const subscriber = new Redis(process.env.REDIS_URL) // used to listen to events

export async function createSandboxKey(sandboxId) {
    await redis.set(`sandbox:${sandboxId}`, JSON.stringify({
        status: "active"
    }), "EX", 120);
}

subscriber.config("SET", "notify-keyspace-events", "Ex");


subscriber.on("message", (channel, key) => {
    console.log(`Key expired: ${key}`);
});

export default { redis, subscriber }