import { CommandContext } from 'slash-create';
import { Client } from 'detritus-client-rest';
import { MessageOptions } from 'slash-create';

const MANAGE_CHANNELS = 1n << 4n;
const client = new Client(process.env.DISCORD_BOT_TOKEN);

export { client };
export function EphemeralResponse(content: string): MessageOptions {
  return { content, ephemeral: true };
}
export function hasPermissions(ctx: CommandContext): boolean {
  if (!ctx.member) return; // member is not present in dm's
  const perm = ctx.member.permissions.bitfield as bigint;
  return (perm & MANAGE_CHANNELS) === MANAGE_CHANNELS;
}
