import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import type { Room, RoomParticipant } from "../types";

export type RoomsResult<T> = { data: T; error?: undefined } | { data?: undefined; error: string };

const UNIQUE_VIOLATION = "23505";
const MAX_CODE_ATTEMPTS = 5;

function generateCode(): string {
  return String(Math.floor(Math.random() * 1_000_000)).padStart(6, "0");
}

function roomFromRow(row: {
  id: string;
  code: string;
  name: string;
  host_id: string;
  status: string;
  created_at: string;
}): Room {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    hostId: row.host_id,
    status: row.status === "closed" ? "closed" : "open",
    createdAt: row.created_at,
  };
}

function describe(error: PostgrestError, action: string): string {
  return `${action}: ${error.message} (code: ${error.code})`;
}

/**
 * Creates a room with a freshly generated unique 6-digit code, retrying on
 * a collision, then adds the host as a `room_members` row — two writes,
 * not one, because RLS requires the room to exist before that insert can
 * be checked against it. Ported from SupabaseRoomRepository.createRoom.
 */
export async function createRoom(params: {
  name: string;
  hostUserId: string;
}): Promise<RoomsResult<Room>> {
  const supabase = createClient();
  let roomRow: Awaited<ReturnType<typeof insertRoom>>["data"] = null;

  for (let attempt = 0; attempt < MAX_CODE_ATTEMPTS && !roomRow; attempt++) {
    const result = await insertRoom(supabase, params.name, params.hostUserId);
    if (result.error && result.error.code !== UNIQUE_VIOLATION) {
      return { error: describe(result.error, "Could not create the room") };
    }
    roomRow = result.data;
  }
  if (!roomRow) {
    return { error: "Could not generate a unique room code. Try again." };
  }

  const { error: memberError } = await supabase.from("room_members").insert({
    room_id: roomRow.id,
    user_id: params.hostUserId,
    role: "host",
  });
  if (memberError) {
    return { error: describe(memberError, "Could not join your own room") };
  }

  return { data: roomFromRow(roomRow) };
}

async function insertRoom(supabase: SupabaseClient, name: string, hostUserId: string) {
  return supabase
    .from("rooms")
    .insert({ code: generateCode(), name, host_id: hostUserId })
    .select()
    .single();
}

/**
 * Looks up an open room by its 6-digit code. A closed or never-existing
 * code look identical to a joining participant, which is the honest
 * answer either way.
 */
export async function findOpenRoomByCode(code: string): Promise<RoomsResult<Room>> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("find_room_by_code", { p_code: code }).single();
  if (error || !data) {
    return { error: "No open room matches that code." };
  }
  return { data: roomFromRow(data as Parameters<typeof roomFromRow>[0]) };
}

/**
 * Adds the signed-in user to a room as a participant. Already being a
 * member is a harmless no-op — rejoining must never error.
 */
export async function joinRoom(params: {
  roomId: string;
  userId: string;
}): Promise<RoomsResult<void>> {
  const supabase = createClient();
  const { error } = await supabase.from("room_members").insert({
    room_id: params.roomId,
    user_id: params.userId,
    role: "participant",
  });
  if (error && error.code !== UNIQUE_VIOLATION) {
    return { error: describe(error, "Could not join the room") };
  }
  return { data: undefined };
}

/**
 * Every room the signed-in account hosts or belongs to, newest first.
 * Row-level security does the filtering.
 */
export async function listMyRooms(): Promise<RoomsResult<Room[]>> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("rooms")
    .select()
    .order("created_at", { ascending: false });
  if (error) {
    return { error: describe(error, "Could not load your rooms") };
  }
  return { data: data.map(roomFromRow) };
}

function participantFromRow(row: {
  user_id: string;
  role: string;
  joined_at: string;
  profiles: { display_name: string } | { display_name: string }[] | null;
}): RoomParticipant {
  const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
  return {
    userId: row.user_id,
    displayName: profile?.display_name ?? "Unknown",
    role: row.role === "host" ? "host" : "participant",
    joinedAt: row.joined_at,
  };
}

/** The room's current roster (host + participants) — a one-time fetch, same as the Flutter app. */
export async function getRoster(roomId: string): Promise<RoomsResult<RoomParticipant[]>> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("room_members")
    .select("user_id, role, joined_at, profiles(display_name)")
    .eq("room_id", roomId)
    .order("joined_at");
  if (error) {
    return { error: describe(error, "Could not load the room's roster") };
  }
  return { data: data.map(participantFromRow) };
}

export async function getRoom(roomId: string): Promise<RoomsResult<Room>> {
  const supabase = createClient();
  const { data, error } = await supabase.from("rooms").select().eq("id", roomId).single();
  if (error || !data) {
    return { error: "This room isn't available." };
  }
  return { data: roomFromRow(data) };
}
