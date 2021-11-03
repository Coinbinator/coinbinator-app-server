import { register_singleton, value } from "./utils/helpers";
import { App } from "./bootstrap/app";

require("dotenv").config();

value(async () => {
	const app = register_singleton(App, new App());
	app.run();
});
