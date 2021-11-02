import { app, uuid, value } from "../utils/helpers";
import * as WebSocket from "ws";
import { Command } from "commander";
import { ExchangeBinanceRepository } from "./exchange_binance_repository";
import express from "express";
import { WithWebsocketMethod } from "express-ws";
import * as ws from "ws";

export default class WebserverRepository {
	express: express.Express & WithWebsocketMethod;

	expressWs: any;

	constructor() {
		this.express = express() as express.Express & WithWebsocketMethod;
		this.expressWs = require("express-ws")(this.express);

		// app.use(function (req, res, next) {
		// 	console.log("middleware");

		// 	(req as any).testing = "testing";

		// 	return next();
		// });

		this.express.get("/", function (req, res, next) {
			// console.log("get route", (req as any).testing);
			res.end();
		});

		this.express.ws("/echo", (ws: ws, req) => {
			// app().register_socket(ws as WebSocketPlus);
			// ws.on("message", function (msg) {
			// 	console.log(msg);
			// 	ws.send("ok");
			// });
			// console.log("socket", (req as any).testing);
		});
	}

	init() {
		const port = 8000;
		this.express.listen(port);
		console.log(`Webserver running of port (${port})...`);
	}
}
