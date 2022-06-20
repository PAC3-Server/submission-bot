import { DiscordAbortCodes } from "detritus-client-rest/lib/constants";
import { ApplicationCommandType, CommandContext, SlashCommand, SlashCreator } from "slash-create";
import { db } from "..";
import { discord, EphemeralResponse, hasPermissions, Permissions } from "../util";

export default class RemoveRightClickCommand extends SlashCommand {
  constructor(creator: SlashCreator) {
    super(creator, {
      type: ApplicationCommandType.MESSAGE,
      name: "Remove Submission"
    });
  }
  async run(ctx: CommandContext) {
    const message = ctx.targetMessage;
    if (!message) return;
    if (!ctx.guildID) return EphemeralResponse("Something went like super wrong, try again.");
    const channel = db.get(`sc_${ctx.guildID}`);
    if (!channel) return EphemeralResponse("This server doesn't seem to have a submission channel yet");
    if (message.channelID !== channel)
      return EphemeralResponse(`I can only remove messages from the <#${channel}> channel...`);
    const allowed = hasPermissions(ctx, Permissions.MANAGE_MESSAGES) || ctx.user.id === message.mentions[0]?.id;
    if (allowed) {
      try {
        await discord.deleteMessage(channel, message.id);
        return EphemeralResponse("Ok, I've removed that submission.");
      } catch (ex) {
        const code = ex as DiscordAbortCodes;
        switch (code) {
          case DiscordAbortCodes.UNKNOWN_MESSAGE:
            return EphemeralResponse("This message is not from the Submission Channel.");
          case DiscordAbortCodes.INVALID_PERMISSIONS:
            return EphemeralResponse("Sorry, I don't have enough permissions to remove that message.");
          default: {
            console.error(ex);
            return EphemeralResponse("Something went wrong while trying to remove the Message, try again later...");
          }
        }
      }
    } else {
      return EphemeralResponse("Sorry, that's not your submission or you don't have enough Permission to remove it.");
    }
  }
}
