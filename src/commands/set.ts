import { SlashCommand, SlashCreator, CommandContext, CommandOptionType } from "slash-create";
import { db } from "..";
import { EphemeralResponse, hasPermissions, Permissions } from "../util";

export default class SetCommand extends SlashCommand {
  constructor(creator: SlashCreator) {
    super(creator, {
      name: "set",
      description: "sets various settings.",
      deferEphemeral: true,
      options: [
        {
          type: CommandOptionType.SUB_COMMAND,
          name: "submission-channel",
          description: "sets the submission channel used by the bot.",
          options: [
            {
              name: "channel",
              description: "the channel",
              type: CommandOptionType.CHANNEL,
              required: true
            }
          ]
        },
        {
          type: CommandOptionType.SUB_COMMAND,
          name: "submission-check-channel",
          description: "sets the submission check channel used by the bot, if you have enabled it.",
          options: [
            {
              name: "channel",
              description: "the channel",
              type: CommandOptionType.CHANNEL,
              required: true
            }
          ]
        }
      ]
    });
  }

  private setChannel(ctx: CommandContext, prefix: string) {
    if (!ctx.guildID) return EphemeralResponse("This command doesn't work here...");
    db.set(`${prefix}_${ctx.guildID}`, ctx.options[ctx.subcommands[0]]["channel"]);
  }

  async run(ctx: CommandContext) {
    if (!hasPermissions(ctx, Permissions.MANAGE_CHANNELS)) {
      return EphemeralResponse("You don't have access to that command, sorry...");
    }
    switch (ctx.subcommands[0]) {
      case "submission-channel":
        this.setChannel(ctx, "sc");
        return EphemeralResponse("Submission Channel set successfully!");
      case "submission-check-channel":
        this.setChannel(ctx, "scc");
        return EphemeralResponse("Submission Check Channel set successfully!");
      default:
    }
  }
}
