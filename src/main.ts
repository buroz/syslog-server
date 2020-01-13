import os from "os";
import cluster from "cluster";

import SyslogServer from "./_server";

const cores = os.cpus().length - 1;

const LogServer = new SyslogServer(514, "0.0.0.0", true);

if (cluster.isMaster) {
  for (let i = 0; i < cores; i++) cluster.fork();
} else {
  LogServer.start();
  LogServer.on("message", value => console.log(value));
}

cluster.on("online", (worker: cluster.Worker) =>
  console.info(worker.process.pid + " is online")
);

cluster.on("exit", (code, signal) => cluster.fork());
