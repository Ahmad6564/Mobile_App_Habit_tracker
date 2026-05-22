import { Ionicons } from "@expo/vector-icons";
import React from "react";

// Map our semantic habit names to Ionicons.
export const HABIT_ICONS = [
  "spark", "run", "meditate", "water", "book", "stretch",
  "shield", "gym", "walk", "sleep", "journal", "code",
  "flame", "trophy"
] as const;

const MAP: Record<string, React.ComponentProps<typeof Ionicons>["name"]> = {
  spark: "sparkles",
  run: "walk",
  meditate: "leaf",
  water: "water",
  book: "book",
  stretch: "body",
  shield: "shield-checkmark",
  gym: "barbell",
  walk: "footsteps",
  sleep: "moon",
  journal: "journal",
  code: "code-slash",
  flame: "flame",
  trophy: "trophy",
  // chrome
  menu: "menu",
  close: "close",
  plus: "add",
  check: "checkmark",
  edit: "create-outline",
  trash: "trash-outline",
  bell: "notifications-outline",
  user: "person-circle-outline",
  share: "share-social-outline",
  chat: "chatbubbles-outline",
  nutrition: "restaurant-outline",
  habit: "checkmark-done-outline",
  task: "list-outline",
  calendar: "calendar-outline",
  community: "people-outline",
  dashboard: "home-outline",
  refer: "gift-outline",
  settings: "settings-outline",
  sun: "sunny-outline",
  moon: "moon-outline",
  arrowRight: "arrow-forward",
  // community
  heart: "heart-outline",
  heartFilled: "heart",
  repeat: "repeat",
  comment: "chatbubble-outline",
  send: "send",
  message: "chatbubble-ellipses-outline",
  paperPlane: "paper-plane-outline",
  block: "ban-outline",
  more: "ellipsis-horizontal",
  back: "arrow-back",
  search: "search-outline",
  emoji: "happy-outline",
  globe: "globe-outline",
  lock: "lock-closed-outline"
};

export default function Icon({
  name,
  size = 18,
  color = "#eaf0ff"
}: {
  name: keyof typeof MAP | (typeof HABIT_ICONS)[number] | string;
  size?: number;
  color?: string;
}) {
  const ionName = (MAP[name] || "ellipse-outline") as React.ComponentProps<typeof Ionicons>["name"];
  return <Ionicons name={ionName} size={size} color={color} />;
}
