import express from "express";
import morgan from "morgan";
import { sendEmail } from "./email.js";
import channel from "./mq.js";

const app = express();

app.use(morgan('dev'));

app.get('/', (req, res) => {
    console.log('Recieved a request');
    res.send("Notification Service is Running...");
})

// Healthcheck
app.get('/_status/healthz', (req, res) => {
    res.status(200).json({
        status: "ok"
    })
});

//readyz
app.get('/_status/readyz', (req, res) => {
    res.status(200).json({
        status: "ready"
    })
})

// consume from queue
channel.consume('auth_notification_queue', async (msg) => {
    if (msg !== null) {

        const messageContent = msg.content.toString();
        console.log('recived message from queue', messageContent)

        try {
            const { userId, action, timestamp, email } = JSON.parse(messageContent);

            const subject = 'New Login Notifications '
            const text = `A new login was detected for your account at ${timestamp} if it was not you, please change your password and secure your account`
            const html = `<p>A new login was detected for your account at <strong> ${timestamp} </strong> if it was not you, please change your password and secure your account</p>`

            await sendEmail(email, subject, text, html)

            channel.ack(msg) // tells rabbitmq to remove it from queue once it done 

        } catch (error) {

            console.error('Error processing message:', error)
            channel.nack(msg) // tells rabbitmq to requeue the message or send it to dead letter queue

        }

    } else {
        console.log('Recieved null message');
    }
})

export default app;