import { SlashCommand, SlashCreator, CommandContext, CommandOptionType } from 'slash-create';
import { hasPermissions } from '../util';

export default class SetCommand extends SlashCommand {
  constructor(creator: SlashCreator) {
    super(creator, {
      name: 'set',
      description: 'sets various settings.',
      deferEphemeral: true,
      options: [
        {
          type: CommandOptionType.SUB_COMMAND,
          name: 'submission-channel',
          description: 'sets the submission channel used by the bot.',
          options: [
            {
              name: 'channel',
              description: 'the channel',
              type: CommandOptionType.CHANNEL,
              required: true
            }
          ]
        },
        {
          type: CommandOptionType.SUB_COMMAND,
          name: 'submission-check-channel',
          description: 'sets the submission check channel used by the bot, if you have enabled it.',
          options: [
            {
              name: 'channel',
              description: 'the channel',
              type: CommandOptionType.CHANNEL,
              required: true
            }
          ]
        }
      ]
    });
  }

  async run(ctx: CommandContext) {
    if (!hasPermissions(ctx)) {
      return { content: "You don't have access to that command, sorry...", ephemeral: true };
    }
    return { content: 'sorry, not implemented yet...' };
  }
}
