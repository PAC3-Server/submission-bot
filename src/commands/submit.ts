import {
  SlashCommand,
  SlashCreator,
  CommandContext,
  ComponentType,
  TextInputStyle,
  CommandOptionType,
  MessageInteractionContext,
  Message,
  AttachmentData,
  ModalInteractionContext,
  MessageOptions
} from "slash-create";
import { db } from "..";
import axios from "axios";
import { discord, EphemeralResponse } from "../util";
import { RequestTypes } from "detritus-client-rest";

const ALLOWED_MEDIA_TYPES = [
  // todo set per server?
  "audio/wav",
  "audio/mp3",
  "audio/ogg",
  "audio/flac",
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
          type: CommandOptionType.STRING,
          name: "description",
          description: "the text above the submission"
        },
        {
          type: CommandOptionType.BOOLEAN,
          name: "disable_comments",
          description: "disable comments on your submission"
        }
      ]
    });
  }

  private CreateSubmissionMessage(ctx: MessageInteractionContext, content: string): string {
    return `New Submission from ${ctx.user.mention}:\n${content}`;
  }
  private async SendSubmission(
    ctx: CommandContext | ModalInteractionContext,
    uris?: string,
    description?: string,
    data?: AttachmentData,
    file?: ArrayBuffer,
    disable_comments?: boolean
  ): Promise<MessageOptions> {
    if (!ctx.deferred) await ctx.defer(true);
    const channel = db.get(`sc_${ctx.guildID}`);
    if (!channel) return EphemeralResponse("There is no submission channel set for this server...");
    description = description ?? "";

    const options: RequestTypes.CreateMessage = {
      content: this.CreateSubmissionMessage(ctx, `${description.replace(/^\s+|\s+$/g, "")}\n${uris ?? ""}`),
      allowedMentions: { parse: ["users"] }
    };

    if (data)
      options.file = {
        filename: data.filename,
        contentType: data.content_type,
        value: file
      };

    try {
      const msg: Message = await discord.createMessage(channel, options);
      try {
        const removeme = await discord.request({
          body: {
            name: this.CreateSubmissionMessage(ctx, description.replace(/^\s+|\s+$/g, "")),
            message: {
              content: uris ?? "",
              allowedMentions: { parse: ["users"] },
              files: options.file ? [options.file] : undefined
            }
          },
          route: { method: "POST", path: "/channels/:channelId/threads", params: { channelId: "1051204126643601478" } }
        });
      } catch (e) {
        console.error(e);
      }
      if (!disable_comments) {
        try {
          await discord.createChannelMessageThread(channel, msg.id, {
            name: `Comments for submission from ${ctx.user.username}`,
            autoArchiveDuration: 1440 // this is optional cakedan pls
          });
        } catch {
          return EphemeralResponse("Oh No! looks like something went wrong with adding comments to your post!");
        }
      }
      return EphemeralResponse(`Submission sent!`);
    } catch (err) {
      console.error(err);
      return EphemeralResponse(`Something went wrong trying to send the message to the <#${channel.id}> channel :(`);
    }
  }

  async run(ctx: CommandContext) {
    if (!ctx.guildID) return EphemeralResponse("This command doesn't work here...");

    const guild = await discord.fetchGuild(ctx.guildID);
    if (!db)
      return EphemeralResponse(
        "Oh No! looks like the Server Admins forgot to set the Submission Channel, tell them about this!"
      );

    let uris: string = "";
    let file: ArrayBuffer | undefined;
    let data: AttachmentData | undefined;

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
        const size = attachment.size / 1024 ** 2;
        const allowed_size = guild ? (guild.premium_tier === 2 ? 50 : guild.premium_tier === 3 ? 100 : 8) : 8;
        if (!attachment.content_type || !ALLOWED_MEDIA_TYPES.includes(attachment.content_type)) {
          return EphemeralResponse(
            `Invalid File format \`${
              attachment.content_type
            }\`, current accepted formats are:\`\`\`\n${ALLOWED_MEDIA_TYPES.join(
              ", "
            )}\`\`\`\nIf you think it should be supported contact \`Techbot#1448\` on Discord or \`Techbot121\` on [Github](https://github.com/PAC3-Server/submission-bot/issues/new)`
          );
        }
        if (size > allowed_size) {
          return EphemeralResponse(`Your file was larger than ${allowed_size}mb, try sending a link instead.`);
        }
        const res = await axios.get(attachment.url, { responseType: "arraybuffer" });
        if (!res || !res.data)
          return EphemeralResponse("Something went wrong while downloading your file, please try again.");
        file = res.data;
        data = attachment;
      }
    }

    if (!data && !uris) {
      return EphemeralResponse("Please provide at least an URL!"); // todo: add a setting for this?
    }

    const description: string = ctx.options.description;
    if (!description) {
      await ctx.sendModal(
        {
          title: "Showcase Submission",
          components: [
            {
              type: ComponentType.ACTION_ROW,
              components: [
                {
                  type: ComponentType.TEXT_INPUT,
                  label: "Description",
                  style: TextInputStyle.SHORT,
                  custom_id: "descr",
                  placeholder: "checkout my cool submission!"
                }
              ]
            }
          ]
        },
        async (mctx) => {
          mctx.send(await this.SendSubmission(mctx, mctx.values.descr, uris, data, file, ctx.options.disable_comments));
        }
      );
    } else {
      return await this.SendSubmission(ctx, description, uris, data, file, ctx.options.disable_comments);
    }
  }
}
