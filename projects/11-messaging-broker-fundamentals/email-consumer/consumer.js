const amqp = require('amqplib');

const host = process.env.RABBITMQ_HOST || 'rabbitmq';
const port = process.env.RABBITMQ_PORT || 5672;
const username = process.env.RABBITMQ_USERNAME;
const password = process.env.RABBITMQ_PASSWORD;

async function start (){
    const url = `amqp://${username}:${password}@${host}:${port}`;

    const connection = await amqp.connect(url);

    const channel = await connection.createChannel();

    await channel.prefetch(1);

    console.log('Waiting for messages...');

    await channel.consume(
        "email-queue",
        async (message) => {
        if (!message) return;

        const rawMessage = message.content.toString();

        console.log(`Received message: ${rawMessage}`);

        let payload;

        try {
        payload = JSON.parse(rawMessage);
        } catch (error) {
        console.error("Invalid JSON message");
        channel.nack(message, false, false);
        return;
        }

        if (payload.type === "PoisonMessage") {
        console.error("Poison message detected");
        console.error("NACK sent with requeue=false");

        channel.nack(message, false, false);
        return;
        }

        console.log("processing for 30 seconds before ACK...");

        await new Promise((resolve) => setTimeout(resolve, 30000));

        channel.ack(message);
        console.log("ACK sent");
    },

    {
        noAck: false,
    }
);

}

start().catch((error) => {
  console.error(error);
  process.exit(1);
});

//     await channel.consume(
//         "email-queue",
//         async (message) => {
//             if (!message) return;

//         console.log(`Received message: ${message.content.toString()}`);
//         console.log("processing for 30 seconds before ACK...");

//         await new Promise((resolve) => setTimeout(resolve, 30000));

//         channel.ack(message);
//         console.log("ACK sent")
//         },
//         {
//             noAck: false,
//         }
//     );
// }