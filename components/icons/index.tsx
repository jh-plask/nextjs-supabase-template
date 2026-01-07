/**
 * Centralized Icon Module
 *
 * Following HugeIcons best practices:
 * - Import only needed icons (tree-shaking)
 * - Organized by functional domain
 * - Use altIcon + showAlt for stroke/solid toggle
 *
 * @see https://hugeicons.com/docs/integrations/react/best-practices
 */

// Stroke icons (default)
import {
  Add01Icon,
  ArrowDown01Icon,
  ArrowUp01Icon,
  Building03Icon,
  Cancel01Icon,
  Delete02Icon,
  FolderLibraryIcon,
  Home09Icon,
  Logout03Icon,
  PencilEdit01Icon,
  Settings02Icon,
  UnfoldMoreIcon,
  UserGroup02Icon,
  UserIcon,
  UserRemove02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
// Solid icons (for active states)
import {
  FolderLibraryIcon as FolderLibrarySolidIcon,
  Home09Icon as Home09SolidIcon,
  Settings02Icon as Settings02SolidIcon,
  UserGroup02Icon as UserGroup02SolidIcon,
} from "@hugeicons-pro/core-solid-rounded";
import type { ComponentProps } from "react";

// ===========================================
// Icon Wrapper with Project Defaults
// ===========================================

type IconProps = Omit<ComponentProps<typeof HugeiconsIcon>, "icon"> & {
  icon: IconSvgElement;
};

export function Icon({
  icon,
  size = 18,
  strokeWidth = 1.75,
  ...props
}: IconProps) {
  return (
    <HugeiconsIcon
      icon={icon}
      size={size}
      strokeWidth={strokeWidth}
      {...props}
    />
  );
}

// ===========================================
// Navigation Icon (handles active/inactive states)
// ===========================================

interface NavIconProps {
  icon: IconSvgElement;
  altIcon: IconSvgElement;
  isActive?: boolean;
  size?: number;
  className?: string;
}

/**
 * Navigation icon with active state styling:
 * - Inactive: stroke icon, muted-foreground, strokeWidth 1.75
 * - Active: solid icon, default color, strokeWidth 1.5
 */
export function NavIcon({
  icon,
  altIcon,
  isActive = false,
  size = 18,
  className,
}: NavIconProps) {
  return (
    <HugeiconsIcon
      altIcon={altIcon}
      className={
        isActive ? className : `text-muted-foreground ${className ?? ""}`
      }
      icon={icon}
      showAlt={isActive}
      size={size}
      strokeWidth={isActive ? 0 : 1.75}
    />
  );
}

// ===========================================
// Navigation Icons (stroke + solid for active state)
// ===========================================

export const HomeIcon = Home09Icon;
export const HomeSolidIcon = Home09SolidIcon;
export const ProjectsIcon = FolderLibraryIcon;
export const ProjectsSolidIcon = FolderLibrarySolidIcon;
export const MembersIcon = UserGroup02Icon;
export const MembersSolidIcon = UserGroup02SolidIcon;
export const SettingsIcon = Settings02Icon;
export const SettingsSolidIcon = Settings02SolidIcon;

// ===========================================
// Action Icons
// ===========================================

export const AddIcon = Add01Icon;
export const EditIcon = PencilEdit01Icon;
export const DeleteIcon = Delete02Icon;
export const CloseIcon = Cancel01Icon;
export const LogoutIcon = Logout03Icon;

// ===========================================
// User & Org Icons
// ===========================================

export const ProfileIcon = UserIcon;
export const UserRemoveIcon = UserRemove02Icon;
export const OrgIcon = Building03Icon;

// ===========================================
// UI Icons
// ===========================================

export const ChevronUpIcon = ArrowUp01Icon;
export const ChevronDownIcon = ArrowDown01Icon;
export const ChevronsUpDownIcon = UnfoldMoreIcon;

// Re-export HugeiconsIcon for direct usage where needed
export { HugeiconsIcon };
