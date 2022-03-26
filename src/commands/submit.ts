import {
  SlashCommand,
  SlashCreator,
  CommandContext,
  ComponentType,
  TextInputStyle,
  CommandOptionType,
  MessageInteractionContext,
  DiscordHTTPError
} from 'slash-create';

import { discord, EphemeralResponse } from '../util';

const ALLOWED_MEDIA_TYPES = [
  'video/mp4',
  'video/mpeg',
  'video/webm',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp'
];

export default class SubmitCommand extends SlashCommand {
  constructor(creator: SlashCreator) {
    super(creator, {
      name: 'submit',
      description: 'submits media to the showcase channel.',
      deferEphemeral: true,
      options: [
        {
          type: CommandOptionType.STRING,
          name: 'url',
          description: 'url of your submission, for example a youtube link'
        },
        {
          type: CommandOptionType.ATTACHMENT,
          name: 'file',
          description: 'use this if you want to upload a file you have saved'
        }
      ]
    });
  }

  private CreateSubmissionMessage(ctx: MessageInteractionContext, content: string): string {
    return `New Submission from ${ctx.user.mention}:\n${content}`;
  }

  async run(ctx: CommandContext) {
    let uris: string = '';
    let extra: string = undefined;
    const no_extra = Object.keys(ctx.options).length === 0;

    if (ctx.options.url) {
      const isUrl = ctx.options.url.match(/^https?:\/\/.+\..+$/g);
      if (!isUrl) return EphemeralResponse("This doesn't seem to be a valid URL...");
      uris += ctx.options.url + '\n';
    }

    if (ctx.options.file) {
      // afaik you can only send one attachment atm?
      const attachment = ctx.attachments.first();
      const size = attachment.size;
      if (!ALLOWED_MEDIA_TYPES.includes(attachment.content_type)) {
        return EphemeralResponse(
          `Invalid File format \`${
            attachment.content_type
          }\`, current accepted formats are:\`\`\`\n${ALLOWED_MEDIA_TYPES.join(
            ', '
          )}\`\`\`\nIf you think it should be supported contact \`Techbot#1448\` on Discord or \`Techbot121\` on [Github](https://github.com/PAC3-Server/submission-bot/issues/new)`
        );
      }
      if (size > 50000000) {
        extra = 'Your file was larger than 50mb, it might not embed!';
      }
      uris += attachment.url;
    }
    ctx.sendModal(
      {
        title: 'Showcase Submission',
        components: [
          {
            type: ComponentType.ACTION_ROW,
            components: [
              {
                type: ComponentType.TEXT_INPUT,
                label: 'Description',
                style: TextInputStyle.PARAGRAPH,
                custom_id: 'descr',
                placeholder: 'checkout my cool submission!'
              }
            ]
          }
        ]
      },
      async (mctx) => {
        if (no_extra && !mctx.values.descr.match(/https?:\/\/.+\..+/g)) {
          mctx.send(EphemeralResponse('Please provide at least an URL!')); // todo: add a setting for this?
          return;
        }
        try {
          await discord.createMessage(process.env.SUBMISSION_CHANNEL, {
            content: this.CreateSubmissionMessage(ctx, `${mctx.values.descr.replace(/^\s+|\s+$/g, '')}\n${uris}`),
            allowedMentions: { parse: ['users'] }
          }); // todo make the channel non-static
          mctx.send(EphemeralResponse(`Submission sent!\n${extra ?? ''}`));
        } catch (ex) {
          const error = ex as DiscordHTTPError;
          switch (error.code) {
            case 10003:
              mctx.send(
                EphemeralResponse(
                  'Oh No! looks like the Server Admins forgot to set the Submission Channel, tell them about this!'
                )
              );
              break;
            case 50013:
              mctx.send(
                EphemeralResponse(
                  "Oh No! looks like I can't send messages to the Submission Channel, tell the Server Admins about this!"
                )
              );
              break;
            default: {
              console.error(ex);
              mctx.send(
                EphemeralResponse('Oh No! Something went wrong while sending your Submission, please try again.')
              );
            }
          }
        }
      }
    );
  }
}
