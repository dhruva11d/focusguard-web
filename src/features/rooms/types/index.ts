/** Mirrors lib/features/community/domain/entities/room.dart. */
export type RoomStatus = "open" | "closed";

export type Room = {
  id: string;
  /** The 6-digit code participants enter to join once (schema-enforced format). */
  code: string;
  name: string;
  hostId: string;
  status: RoomStatus;
  createdAt: string;
};

/** Mirrors lib/features/community/domain/entities/room_participant.dart. */
export type RoomMemberRole = "host" | "participant";

export type RoomParticipant = {
  userId: string;
  displayName: string;
  role: RoomMemberRole;
  joinedAt: string;
};
