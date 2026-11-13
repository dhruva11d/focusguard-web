import { backendFetch, errorMessage, jsonBody } from "@/lib/backend/client";
import type { Room, RoomParticipant } from "../types";

export type RoomsResult<T> = { data: T; error?: undefined } | { data?: undefined; error: string };

type RoomDto = {
  id: string;
  code: string;
  name: string;
  hostId: string;
  status: string;
  createdAt: string;
};

function roomFromDto(dto: RoomDto): Room {
  return { ...dto, status: dto.status === "closed" ? "closed" : "open" };
}

export async function createRoom(params: { name: string }): Promise<RoomsResult<Room>> {
  try {
    const dto = await backendFetch<RoomDto>("/api/rooms", { method: "POST", body: jsonBody(params) });
    return { data: roomFromDto(dto) };
  } catch (error) {
    return { error: errorMessage(error, "Could not create the room.") };
  }
}

export async function joinRoom(params: { code: string }): Promise<RoomsResult<string>> {
  try {
    const result = await backendFetch<{ roomId: string }>("/api/rooms/join", {
      method: "POST",
      body: jsonBody(params),
    });
    return { data: result.roomId };
  } catch (error) {
    return { error: errorMessage(error, "Could not join the room.") };
  }
}

export async function listMyRooms(): Promise<RoomsResult<Room[]>> {
  try {
    const rows = await backendFetch<Array<RoomDto & { membershipRole: string }>>("/api/rooms/my");
    return { data: rows.map(roomFromDto) };
  } catch (error) {
    return { error: errorMessage(error, "Could not load your rooms.") };
  }
}

export async function getRoster(roomId: string): Promise<RoomsResult<RoomParticipant[]>> {
  try {
    const rows = await backendFetch<RoomParticipant[]>(`/api/rooms/id/${encodeURIComponent(roomId)}/members`);
    return { data: rows };
  } catch (error) {
    return { error: errorMessage(error, "Could not load the room's roster.") };
  }
}

export async function getRoom(roomId: string): Promise<RoomsResult<Room>> {
  try {
    const dto = await backendFetch<RoomDto>(`/api/rooms/id/${encodeURIComponent(roomId)}`);
    return { data: roomFromDto(dto) };
  } catch (error) {
    return { error: errorMessage(error, "This room isn't available.") };
  }
}
