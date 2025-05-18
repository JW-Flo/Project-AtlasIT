async run() {
  const worker = new sst.cloudflare.Worker("MyWorker", {
    handler: "./index.ts",
    url: true,
  });

  return {
    api: worker.url,
  };
} 