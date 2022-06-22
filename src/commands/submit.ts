import {
  SlashCommand,
  SlashCreator,
  CommandContext,
  ComponentType,
  TextInputStyle,
  CommandOptionType,
  MessageInteractionContext,
  DiscordHTTPError,
  Message,
  AttachmentData
} from "slash-create";
import { db } from "..";
import fetch from "node-fetch";

import { discord, EphemeralResponse } from "../util";
import { RequestTypes } from "detritus-client-rest";

const ALLOWED_MEDIA_TYPES = [
  // todo set per server?
  "audio/wav",
  "audio/mp3",
  "audio/ogg",
  "video/mp4",
  "video/mpeg",
  "video/webm",
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp"
];

export default class SubmitCommand extends SlashCommand {
  constructor(creator: SlashCreator) {
    super(creator, {
      name: "submit",
      description: "submits media to the showcase channel.",
      deferEphemeral: true,
      options: [
        {
          type: CommandOptionType.STRING,
          name: "url",
          description: "url of your submission, for example a youtube link"
        },
        {
          type: CommandOptionType.ATTACHMENT,
          name: "file",
          description: "use this if you want to upload a file you have saved"
        },
        {
          type: CommandOptionType.BOOLEAN,
          name: "with_comments",
          description: "enables comments (adds a thread) to your submission"
        }
      ]
    });
  }

  private CreateSubmissionMessage(ctx: MessageInteractionContext, content: string): string {
    return `New Submission from ${ctx.user.mention}:\n${content}`;
  }

  async run(ctx: CommandContext) {
    if (!ctx.guildID) return EphemeralResponse("This command doesn't work here...");
    const channel = db.get(`sc_${ctx.guildID}`);
    if (!db)
      return EphemeralResponse(
        "Oh No! looks like the Server Admins forgot to set the Submission Channel, tell them about this!"
      );
    let uris: string = "";
    let extra: string = "";
    let data: Buffer;
    let originalAttachment: AttachmentData;
    const with_comments = ctx.options.with_comments;

    if (ctx.options.url) {
      const isUrl = ctx.options.url.match(/^https?:\/\/.+\..+$/g);
      if (!isUrl) return EphemeralResponse("This doesn't seem to be a valid URL...");
      uris += ctx.options.url + "\n";
    }

    if (ctx.options.file) {
      // afaik you can only send one attachment atm?
      if (ctx.attachments.size > 0) {
        const attachment: AttachmentData | undefined = ctx.attachments.first();
        if (!attachment) return EphemeralResponse("File missing???");
        const size = attachment.size;
        if (!attachment.content_type || !ALLOWED_MEDIA_TYPES.includes(attachment.content_type)) {
          return EphemeralResponse(
            `Invalid File format \`${
              attachment.content_type
            }\`, current accepted formats are:\`\`\`\n${ALLOWED_MEDIA_TYPES.join(
              ", "
            )}\`\`\`\nIf you think it should be supported contact \`Techbot#1448\` on Discord or \`Techbot121\` on [Github](https://github.com/PAC3-Server/submission-bot/issues/new)`
          );
        }
        if (size > 50000000) {
          extra = "Your file was larger than 50mb, it might not embed!";
        }
        const res = await fetch(attachment.url);
        if (!res.ok) EphemeralResponse("Something went wrong while downloading your file, please try again.");
        data = await res.buffer();
        originalAttachment = attachment;
      }
    }
    ctx.sendModal(
      {
        title: "Showcase Submission",
        components: [
          {
            type: ComponentType.ACTION_ROW,
            components: [
              {
                type: ComponentType.TEXT_INPUT,
                label: "Description",
                style: TextInputStyle.PARAGRAPH,
                custom_id: "descr",
                placeholder: "checkout my cool submission!"
              }
            ]
          }
        ]
      },
      async (mctx) => {
        if (!originalAttachment && !mctx.values.descr.match(/https?:\/\/.+\..+/g)) {
          mctx.send(EphemeralResponse("Please provide at least an URL!")); // todo: add a setting for this?
          return;
        }
        try {
          const options: RequestTypes.CreateMessage = {
            content: this.CreateSubmissionMessage(ctx, `${mctx.values.descr.replace(/^\s+|\s+$/g, "")}\n${uris}`),
            allowedMentions: { parse: ["users"] }
          };
          if (ctx.options.file)
            options.file = {
              filename: originalAttachment.filename,
              contentType: originalAttachment.content_type,
              value: data
            };
          const msg: Message = await discord.createMessage(channel, options);
          if (with_comments) {
            try {
              await discord.createChannelMessageThread(channel, msg.id, {
                name: `Comments for submission from ${mctx.user.mention}`,
                reason: "comments requested",
                autoArchiveDuration: 1440 // this is optional cakedan pls
              });
            } catch {
              mctx.send(EphemeralResponse("Oh No! looks like something went wrong with adding comments to your post!"));
            }
          }
          mctx.send(EphemeralResponse(`Submission sent!\n${extra ?? ""}`));
        } catch (ex) {
          const error = ex as DiscordHTTPError;
          switch (error.code) {
            case 10003:
              mctx.send(
                EphemeralResponse(
                  "Oh No! looks like the Server Admins forgot to set the Submission Channel, tell them about this!"
                )
              );
              break;
            case 50013:
            case 50001:
              mctx.send(
                EphemeralResponse(
                  "Oh No! looks like I can't send messages to the Submission Channel, tell the Server Admins about this!"
                )
              );
              break;
            default: {
              console.error(ex);
              mctx.send(
                EphemeralResponse("Oh No! Something went wrong while sending your Submission, please try again.")
              );
            }
          }
        }
      }
    );
  }
}
