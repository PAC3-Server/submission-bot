import { CommandContext } from 'slash-create';
import { Client } from 'detritus-client-rest';
import { MessageOptions } from 'slash-create';

const client = new Client(process.env.DISCORD_BOT_TOKEN);
export { client as discord };

export const Permissions = {
  MANAGE_CHANNELS: 1n << 4n,
  MANAGE_MESSAGES: 1n << 13n
};

export function hasPermissions(ctx: CommandContext, permission: bigint): boolean {
  if (!ctx.member) return; // member is not present in dm's
  const all_permissions = ctx.member.permissions.bitfield as bigint;
  return (all_permissions & permission) === permission;
}

export function EphemeralResponse(content: string): MessageOptions {
  return { content, ephemeral: true };
}
