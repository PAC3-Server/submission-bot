import { DiscordTypes } from 'detritus-client-rest';
import { DiscordAbortCodes } from 'detritus-client-rest/lib/constants';
import { SlashCommand, SlashCreator, CommandContext, CommandOptionType } from 'slash-create';
import { discord, EphemeralResponse, hasPermissions, Permissions } from '../util';

const CHANNEL = process.env.SUBMISSION_CHANNEL; // todo: make this non static

export default class RemoveCommand extends SlashCommand {
  constructor(creator: SlashCreator) {
    super(creator, {
      name: 'remove',
      description: 'removes your submission from the showcase channel.',
      deferEphemeral: true,
      options: [
        {
          type: CommandOptionType.STRING,
          name: 'messageid',
          description: 'ID of the message you want to delete (if you have permission)'
        }
      ]
    });
  }

  async run(ctx: CommandContext) {
    if (ctx.options.messageid) {
      try {
        if (!ctx.options.messageid.match(/^\d+$/g)) {
          return EphemeralResponse(
            "That doesn't seem to be a valid messageID, it has to be this format: `263728354782478338`"
          );
        }
        const message = (await discord.fetchMessage(CHANNEL, ctx.options.messageid)) as DiscordTypes.Message;
        const allowed = hasPermissions(ctx, Permissions.MANAGE_MESSAGES) || ctx.user.id === message.mentions[0].id;
        if (allowed) {
          await discord.deleteMessage(CHANNEL, message.id);
          return EphemeralResponse("Ok, I've removed that submission.");
        } else {
          return EphemeralResponse(
            "Sorry, that's not your submission or you don't have enough Permission to remove it."
          );
        }
      } catch (ex) {
        const code = ex.code as DiscordAbortCodes;
        switch (code) {
          case DiscordAbortCodes.INVALID_FORM_BODY:
            return EphemeralResponse("Please check your input, Discord couldn't understand it.");
          case DiscordAbortCodes.UNKNOWN_MESSAGE:
            return EphemeralResponse('Could not find a message with that ID...');
          default: {
            console.error(ex);
            return EphemeralResponse('Something went wrong while getting the Message, try again later...');
          }
        }
      }
    }
    // try deleting the last submission if no message was provided
    try {
      const messages = (await discord.fetchMessages(CHANNEL)) as DiscordTypes.Message[];
      console.log(messages[5].mentions[0].id, ctx.user.id);
      const lastmsg = messages.filter((message) => message.mentions[0]?.id === ctx.user.id)[0];
      if (lastmsg) {
        try {
          await discord.deleteMessage(CHANNEL, lastmsg.id);
          return EphemeralResponse('Ok, I removed your latest submission.');
        } catch (e) {
          console.error(e);
          return EphemeralResponse(
            'Something went wrong while trying to delete your last message from the Submission Channel. Try again later...'
          );
        }
      } else {
        return EphemeralResponse('Could not find your latest submission... (I checked the last 50)');
      }
    } catch (e) {
      console.error(e);
      return EphemeralResponse('Something went wrong while getting the last messages from the Submission Channel...');
    }
  }
}
