const http = require("http");
const crypto = require("crypto");
const amqp = require("amqplib");

const port = process.env.PORT || 3000;
const environment = process.env.APP_ENV || "local";

const rabbitmqHost = process.env.RABBITMQ_HOST || "rabbitmq";
const rabbitmqPort = process.env.RABBITMQ_PORT || "5672";
const rabbitmqUsername = process.env.RABBITMQ_USERNAME;
const rabbitmqPassword = process.env.RABBITMQ_PASSWORD;
const rabbitmqExchange =
  process.env.RABBITMQ_EXCHANGE || "order-exchange";

let rabbitmqConnection;
let rabbitmqChannel;

async function connectRabbitMQ() {
  if (!rabbitmqUsername || !rabbitmqPassword) {
    throw new Error(
      "RABBITMQ_USERNAME and RABBITMQ_PASSWORD are required"
    );
  }

  const connectionUrl =
    `amqp://${encodeURIComponent(rabbitmqUsername)}` +
    `:${encodeURIComponent(rabbitmqPassword)}` +
    `@${rabbitmqHost}:${rabbitmqPort}`;

  rabbitmqConnection = await amqp.connect(connectionUrl);
  rabbitmqChannel = await rabbitmqConnection.createChannel();

  await rabbitmqChannel.assertExchange(
    rabbitmqExchange,
    "topic",
    {
      durable: true,
    }
  );

  console.log(
    `Connected to RabbitMQ at ${rabbitmqHost}:${rabbitmqPort}`
  );
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk;
    });

    req.on("end", () => {
      try {
        resolve(JSON.parse(body));
      } catch {
        reject(new Error("Invalid JSON body"));
      }
    });

    req.on("error", reject);
  });
}

const server = http.createServer(async (req, res) => {
  if (req.method === "GET" && req.url === "/health") {
    res.writeHead(200, {
      "Content-Type": "application/json",
    });

    res.end(
      JSON.stringify({
        status: "ok",
      })
    );

    return;
  }

  if (req.method === "GET" && req.url === "/") {
    res.writeHead(200, {
      "Content-Type": "text/plain",
    });

    res.end(
      `Learning DevOps - Session 11\nEnvironment: ${environment}`
    );

    return;
  }

  if (req.method === "POST" && req.url === "/orders") {
    try {
      const body = await readJsonBody(req);

      if (!body.orderId) {
        res.writeHead(400, {
          "Content-Type": "application/json",
        });

        res.end(
          JSON.stringify({
            error: "orderId is required",
          })
        );

        return;
      }

      const event = {
        eventId: crypto.randomUUID(),
        type: "OrderCreated",
        orderId: body.orderId,
      };

      const routingKey = "order.created";

      rabbitmqChannel.publish(
        rabbitmqExchange,
        routingKey,
        Buffer.from(JSON.stringify(event)),
        {
          persistent: true,
          contentType: "application/json",
          messageId: event.eventId,
          type: event.type,
        }
      );

      console.log(
        `Published ${event.eventId} with routing key ${routingKey}`
      );

      res.writeHead(201, {
        "Content-Type": "application/json",
      });

      res.end(
        JSON.stringify({
          status: "created",
          event,
        })
      );
    } catch (error) {
      res.writeHead(400, {
        "Content-Type": "application/json",
      });

      res.end(
        JSON.stringify({
          error: error.message,
        })
      );
    }

    return;
  }

  res.writeHead(404, {
    "Content-Type": "text/plain",
  });

  res.end("Not Found");
});

async function start() {
  try {
    await connectRabbitMQ();

    server.listen(port, "0.0.0.0", () => {
      console.log(`Server listening on port ${port}`);
    });
  } catch (error) {
    console.error("Failed to start application:", error);
    process.exit(1);
  }
}

start();