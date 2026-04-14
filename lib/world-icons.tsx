import {
  IconBuildingBank,
  IconMapPin,
  IconSparkles,
  IconUsers,
  type IconProps
} from "@tabler/icons-react";
import type { ComponentType } from "react";

const WORLD_ICON_MAP: Record<string, ComponentType<IconProps>> = {
  "building-bank": IconBuildingBank,
  "map-pin": IconMapPin,
  users: IconUsers
};

export function getWorldIcon(iconName: string | null | undefined): ComponentType<IconProps> {
  if (iconName && iconName in WORLD_ICON_MAP) {
    return WORLD_ICON_MAP[iconName];
  }
  return IconSparkles;
}
