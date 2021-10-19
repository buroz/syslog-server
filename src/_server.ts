import dgram from "dgram";
import EventEmitter from "events";

const messages = {
  ALREADY_RUNNING: "Server is already running!",
  FAILED_TO_START: "Server failed to start!",
  SERVER_NOT_RUNNING: "Server is not running!"
};

export default class Server extends EventEmitter {
  public port: number;
  public address: string;
  public exclusive: boolean;

  private server: any;
  private status: boolean;

  constructor(port: number, address: string, exclusive: boolean) {
    super();

    this.port = this.port || 514;
    this.address = this.address || "0.0.0.0";
    this.exclusive = this.exclusive || true;

    this.server = dgram.createSocket("udp4");
    this.status = false;
  }

  start(): Promise<any> {
    let options = {
      port: this.port,
      address: this.address,
      exclusive: this.exclusive
    };

    return new Promise((resolve, reject) => {
      if (this.status === true) {
        return reject(
          this.createErrorObject({
            message: messages.ALREADY_RUNNING
          })
        );
      } else {
        this.server.on("listening", () => {
          this.status = true;
          this.emit("start");
        });

        this.server.on("error", (err: any) => this.emit("error", err));

        this.server.on("message", (msg: Buffer, remote: dgram.RemoteInfo) => {
          let info = msg.toString("utf8").split(",");

          /*
            Regexp ile düzenleme gelecek
            Tam olarak toplamamız gereken bilgilerin listesini interface yapacağız
            Sonra ver gülüm yansın
          */
          let message = {
            date: new Date(
              Date.now() - new Date().getTimezoneOffset() * 60 * 1000
            ),
            host: remote.address,
            family: remote.family,
            info: msg.toString("utf-8"),
            mac: info[1].split("src-mac")[1],
            protocol: info[2].split("proto ")[1],
            dest: info[3].split("->")[1]
          };

          this.emit("message", message);
        });

        this.server.on("close", () => {
          this.status = false;
          this.emit("stop");
        });

        this.server.bind(options, (err: any) => {
          if (err) {
            let errorObj = this.createErrorObject(
              err,
              messages.FAILED_TO_START
            );
            return reject(errorObj);
          } else {
            return resolve();
          }
        });
      }
    });
  }

  stop(cb: Function) {
    return new Promise((resolve, reject) => {
      try {
        this.server.close(() => {
          if (cb) return cb();
          return resolve();
        });
      } catch (err) {
        let errorObj = this.createErrorObject(messages.FAILED_TO_START, err);
        return reject(errorObj);
      }
    });
  }

  private createErrorObject(message: any, err?: any) {
    if (err) {
      return {
        date: new Date(),
        error: err,
        message: message
      };
    } else {
      return {
        date: new Date(),
        message: message
      };
    }
  }
}
