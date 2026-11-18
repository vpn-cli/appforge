"use client";

import { useOrganization, useUser, UserButton } from "@clerk/nextjs";

export function HomeTopBarSignedIn() {
  const { organization } = useOrganization();
  const { user } = useUser();

  const orgName =
    organization?.name ||
    (user?.fullName ? `${user.fullName}'s Workspace` : "Workspace");
  const orgInitial = (orgName[0] || "A").toUpperCase();

  return (
    <>
      <div className="hidden md:flex items-center gap-2 pl-1.5 pr-3 h-9 rounded-full glass-2-nested text-foreground select-none">
        <span className="w-6 h-6 rounded-full bg-brand-600 text-primary-foreground font-semibold text-[12px] flex items-center justify-center shrink-0">
          {orgInitial}
        </span>
        <span className="truncate max-w-[160px] font-medium text-[14px] text-foreground">
          {orgName}
        </span>
      </div>
      <UserButton
        appearance={{
          elements: {
            userButtonAvatarBox: "w-9 h-9 rounded-full border border-border",
          },
        }}
      />
    </>
  );
}
