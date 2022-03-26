import { ApplicationCommandType, CommandContext, SlashCommand, SlashCreator } from 'slash-create';
import { discord, EphemeralResponse, hasPermissions, Permissions } from '../util';

const CHANNEL = process.env.SUBMISSION_CHANNEL; // todo: make this non static
export default class RemoveRightClickCommand extends SlashCommand {
  constructor(creator: SlashCreator) {
    super(creator, {
      type: ApplicationCommandType.MESSAGE,
      name: 'Remove Submission'
    });
  }
  async run(ctx: CommandContext) {
    const message = ctx.targetMessage;
    const allowed =
      hasPermissions(ctx, Permissions.MANAGE_MESSAGES) || ctx.user.id === (message.mentions as object)[0]?.id; // object until upstream is fixed
    if (allowed) {
      await discord.deleteMessage(CHANNEL, message.id);
      return EphemeralResponse("Ok, I've removed that submission.");
    } else {
      return EphemeralResponse("Sorry, that's not your submission or you don't have enough Permission to remove it.");
    }
  }
}
