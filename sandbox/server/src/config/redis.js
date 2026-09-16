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

subscriber.config("SET", "notify-keyspace-events", "Ex");

subscriber.subscribe("__keyevent@0__:expired");

subscriber.on("message", async (channel, key) => {
    console.log(`Key expired: ${key}`);

    // sandbox: 019ff527-0553-7598-9308-69c821f5687a
    const sandboxId = key.split(":")[1]

    await Promise.all([
        deletePod(sandboxId),
        deleteService(sandboxId)
    ]);


    console.log(`Sandbox ${sandboxId} deleted successfully`);

});

export default { redis, subscriber }