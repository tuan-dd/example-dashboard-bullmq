require("dotenv").config();
const { createBullBoard } = require("@bull-board/api");
const { BullMQAdapter } = require("@bull-board/api/bullMQAdapter");
const { ExpressAdapter } = require("@bull-board/express");
const { Queue: QueueMQ, Worker } = require("bullmq");
const express = require("express");

const sleep = (t) => new Promise((resolve) => setTimeout(resolve, t * 1000));

const redisOptions = {
  port: process.env.REDIS_PORT,
  host: process.env.REDIS_HOST,
  username: process.env.REDIS_USERNAME,
  password: process.env.REDIS_PASSWORD,
};

const readOnlyMode = process.env.READ_ONLY === "true";

const isProduction = process.env.NODE_ENV === "production";

const nameJobs = JSON.parse(process.env.NAME_JOBS);

const createQueueMQ = (name) => new QueueMQ(name, { connection: redisOptions });

function setupBullMQProcessor(queueName) {
  const worker = new Worker(
    queueName,
    async (job) => {
      for (let i = 0; i <= 100; i++) {
        await sleep(Math.random());
        await job.updateProgress(i);
        await job.log(`Processing job at interval ${i}`);

        if (Math.random() * 200 < 1) throw new Error(`Random error ${i}`);
      }

      return { jobId: `This is the return value of job (${job.id})` };
    },
    { connection: redisOptions }
  );

  // Add event listeners for job completion and failure
  worker.on("completed", (job) => {
    console.log(
      `Job ${job.id} has been completed with result:`,
      job.returnvalue
    );
  });

  worker.on("failed", (job, err) => {
    console.error(`Job ${job.id} failed with error:`, err);
  });

  return worker;
}

const run = async () => {
  const app = express();

  const serverAdapter = new ExpressAdapter();
  serverAdapter.setBasePath("/ui");

  /**
   *  Build BullMQAdapter
   */
  const queues = nameJobs.map(
    (name) => new BullMQAdapter(createQueueMQ(name), { readOnlyMode })
  );

  if (!isProduction) {
    const exampleBullMq = createQueueMQ("example");

    setupBullMQProcessor("example");

    app.use("/add", (req, res) => {
      const opts = req.query.opts || {};

      if (opts.delay) {
        opts.delay = +opts.delay * 1000; // delay must be a number
      }

      exampleBullMq.add("Add", { title: req.query.title }, opts);

      res.json({
        ok: true,
      });
    });

    createBullBoard({
      queues: [new BullMQAdapter(exampleBullMq), ...queues],
      serverAdapter,
    });
  } else {
    createBullBoard({
      queues,
      serverAdapter,
    });
  }

  // open dashboard
  app.use("/ui", serverAdapter.getRouter());

  app.listen(3000, () => {
    !isProduction &&
      console.log("  curl http://localhost:3000/add?title=Test&opts[delay]=9");
    console.log("For the UI, open http://localhost:3000/ui");
  });
};

// eslint-disable-next-line no-console
run().catch((e) => console.error(e));
