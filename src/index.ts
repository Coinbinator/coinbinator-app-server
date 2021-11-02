import express from "express";
import { WithWebsocketMethod } from "express-ws";
import { register_singleton, value } from "./utils/helpers";
import { App } from "./bootstrap/App";

value(async () => {
	const app_repository = register_singleton(App, new App());

	app_repository.run();
});
