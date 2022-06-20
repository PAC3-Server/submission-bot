import { SlashCommand, SlashCreator } from "slash-create";
import { EphemeralResponse } from "../util";

export default class HelpCommand extends SlashCommand {
  constructor(creator: SlashCreator) {
    super(creator, {
      name: "help",
      description: "displays information about the bot.",
      deferEphemeral: true
    });
  }

  async run() {
    return EphemeralResponse(
      `use \`/submit\` to send a submission!\nmake sure to setup the channels accordingly first using the \`/set submission channel\`!`
    );
  }
}
