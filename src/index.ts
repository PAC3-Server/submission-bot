import { SlashCreator, FastifyServer } from "slash-create";
import path from "path";
import CatLoggr from "cat-loggr/ts";
import JSONdb from "simple-json-db";

let DBPath = path.join(process.cwd(), "storage.json");
if (path.parse(process.cwd()).name === "dist") DBPath = path.join(process.cwd(), "..", "storage.json");

export const db = new JSONdb(DBPath);

const logger = new CatLoggr().setLevel(process.env.COMMANDS_DEBUG === "true" ? "debug" : "info");
const creator = new SlashCreator({
  applicationID: db.get("discord_app_id"),
  publicKey: db.get("discord_public_key"),
  token: db.get("discord_bot_token"),
  serverPort: db.get("port") ?? 8020,
  serverHost: "0.0.0.0"
});

creator.on("debug", (message) => logger.log(message));
creator.on("warn", (message) => logger.warn(message));
creator.on("error", (error) => logger.error(error));
creator.on("synced", () => logger.info("Commands synced!"));
creator.on("commandRun", (command, _, ctx) =>
  logger.info(`${ctx.user.username}#${ctx.user.discriminator} (${ctx.user.id}) ran command ${command.commandName}`)
);
creator.on("commandRegister", (command) => logger.info(`Registered command ${command.commandName}`));
creator.on("commandError", (command, error) => logger.error(`Command ${command.commandName}:`, error));

creator.withServer(new FastifyServer()).registerCommandsIn(path.join(__dirname, "commands")).startServer();
creator.syncCommands();

console.log(`Starting server at "localhost:${creator.options.serverPort}/interactions"`);
