import Redis from "ioredis";
import { deletePod } from "../kubernetes/pod.js";
import { deleteService } from "../kubernetes/service.js";

const redis = new Redis(process.env.REDIS_URL); // used to write 

const subscriber = new Redis(process.env.REDIS_URL) // used to listen to events

export async function createSandboxKey(sandboxId) {
    await redis.set(`sandbox:${sandboxId}`, JSON.stringify({
        status: "active"
    }), "EX", 120);
}

// Enable key-event expiration notifications (configured via the main client)
redis.config("SET", "notify-keyspace-events", "Ex").catch(err => {
    console.error("Failed to set notify-keyspace-events config:", err.message);
});

subscriber.subscribe("__keyevent@0__:expired");

subscriber.on("message", async (channel, key) => {
    console.log(`Key expired: ${key}`);

    const parts = key.split(":");
    if (parts[0] !== "sandbox") return;

    const sandboxId = parts[1];
    if (!sandboxId) return;

    try {
        console.log(`Deleting resources for Sandbox: ${sandboxId}`);
        await Promise.all([
            deletePod(sandboxId),
            deleteService(sandboxId)
        ]);
        console.log(`Sandbox ${sandboxId} deleted successfully`);
    } catch (error) {
        console.error(`Error deleting sandbox ${sandboxId} resources:`, error.message || error);
    }
});

export default { redis, subscriber }