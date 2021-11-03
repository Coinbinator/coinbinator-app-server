import { app } from "../utils/helpers";
import express, { Request } from "express";
import { WithWebsocketMethod } from "express-ws";
import * as ws from "ws";
import { CoinbinatorDecoratedWebSocket } from "../utils/types";

export default class WebserverRepository {
	express: express.Express & WithWebsocketMethod;

	expressWs: any;

	constructor() {
		this.express = express() as express.Express & WithWebsocketMethod;
		this.expressWs = require("express-ws")(this.express);

		this.express.get("/", function (req, res, next) {
			// console.log("get route", (req as any).testing);
			res.end();
		});

		this.express.ws("/echo", (ws: ws, req: Request) => {
			app().on_client_socket_connect(ws as CoinbinatorDecoratedWebSocket, req);
		});
	}

	init() {
		const port = process.env["WS_PORT"] ?? "8000";
		this.express.listen(port);
		console.log(`Webserver running of port (${port})...`);
	}
}
