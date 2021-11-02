import express from "express";
import { WithWebsocketMethod } from "express-ws";
import { register_singleton, value } from "./utils/helpers";
import { App } from "./bootstrap/app";

value(async () => {
	const app = register_singleton(App, new App());
	app.run();
});
