export enum StatusInv {
  PENDING = "PENDING",
  ACCEPTED = "ACCEPTED",
  REJECT = "REJECT",
  BLOCKED = "BLOCKED",
}

export enum ChanVisibility {
  PUBLIC = "PUBLIC",
  PROTECTED = "PROTECTED",
  PRIVATE = "PRIVATE",
}

export enum UserStatusMSGs {
  NORMAL = "NORMAL",
  MUTED = "MUTED",
  BLOCKED = "BLOCKED",
  BANNED = "BANNED",
}

export enum ChanUsrRole {
  NORMAL = "NORMAL",
  ADMIN = "ADMIN",
  OWNER = "OWNER",
}

export interface User {
  id: number;
  login: string;
  pseudo: string;
  avatar?: string | null;
  rank: number;
}

export type UserExtended = User & {
  twoFA: boolean;
  createdAt: Date;
  updateAt: Date;
  sentInvites?: Friendship[];
  receivedInvites?: Friendship[];
  asUser1?: Discussion[];
  asUser2?: Discussion[];
  discussionsMsgs?: DiscussionMsg[];
  channelsMsgs?: ChannelMsg[];
  channelMember?: ChanUsr[];
  achievements?: Achievement[];
  leftPlayer?: Game[];
  rightPlayer?: Game[];
};

export interface Friendship {
  id: number;
  inviteStatus: StatusInv;
  sender: User;
  senderId: number;
  receiver: User;
  receiverId: number;
}

export interface Game {
  id: number;
  lhsPlayer: User;
  lhsPlayerId: number;
  lhsScore: number;
  rhsPlayer: User;
  rhsPlayerId: number;
  rhsScore: number;
  texture1: string;
  texture2: string;
}

export interface Achievement {
  id: number;
  title: string;
  desc: string;
  icon: string;
  users?: User[];
}

export interface Discussion {
  id: number;
  createdAt: Date;
  user1: User;
  userId1: number;
  user2: User;
  userId2: number;
  discussionsMsgs?: DiscussionMsg[];
}

export interface DiscussionMsg {
  id: number;
  createdAt: Date;
  updateAt: Date;
  content: string;
  user: User;
  userId: number;
  discussion: Discussion;
  discussionId: number;
}

export interface Channel {
  id: number;
  name: string;
  createdAt: Date;
  updateAt: Date;
  visibility: ChanVisibility;
  hash?: string | null;
}

export type ChannelExtended = Channel & {
  channelUsers: ChanUsr[];
  channelMsgs: ChannelMsg[];
};

export interface ChannelMsg {
  id: number;
  createdAt: Date;
  content: string;
  user: User;
  userId: number;
  channel: Channel;
  channelId: number;
}

export interface ChanUsr {
  id: number;
  createdAt: Date;
  updateAt: Date;
  user: User;
  userId: number;
  chanId: number;
  role: ChanUsrRole;
  status: UserStatusMSGs;
  statusDuration?: Date | null;
}

export type ChanUserExtended = ChanUsr & {
  channel: ChannelExtended;
};
