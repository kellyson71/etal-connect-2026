"use client";
import { ArrowUpRight, MapPin } from "lucide-react";
import { PlanSvg } from "./principal-plan";
import {
  getRoom,
  roomPreviewBox,
  type IndoorTarget,
} from "../data/principal-model";
export default function RoomPreview({
  target,
  onClick,
}: {
  target: IndoorTarget;
  onClick: () => void;
}) {
  const room = getRoom(target.floor, target.zoneId);
  return (
    <button
      className="room-preview-button"
      onClick={onClick}
      aria-label={`Ver ${room.label} no mapa, ${room.floorLabel}`}
    >
      <span className="room-preview-art" aria-hidden="true">
        <PlanSvg
          floor={room.plan}
          selected={target.zoneId}
          onSelect={() => {}}
          interactive={false}
          viewBox={roomPreviewBox(target)}
        />
        <span className="room-preview-pin">
          <MapPin size={12} />
        </span>
      </span>
      <span>
        <strong>{room.label}</strong>
        <span>
          {room.floorLabel} ·{" "}
          {room.useLabel === "Sala" || room.useLabel === room.label
            ? "Bloco principal"
            : room.useLabel}
        </span>
        <small>
          Ver sala no mapa
          <ArrowUpRight size={11} />
        </small>
      </span>
      <ArrowUpRight size={17} />
    </button>
  );
}
