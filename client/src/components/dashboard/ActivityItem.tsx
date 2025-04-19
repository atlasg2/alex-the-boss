import { ActivityItem as ActivityItemType } from "@/lib/types";

interface ActivityItemProps {
  activity: ActivityItemType;
}

export function ActivityItem({ activity }: ActivityItemProps) {
  const { message, time } = activity;

  return (
    <li className="relative flex gap-x-4">
      <div className="absolute left-0 top-0 flex w-6 justify-center -bottom-6">
        <div className="w-px bg-slate-200"></div>
      </div>
      <div className="relative flex h-6 w-6 flex-none items-center justify-center bg-white">
        <div className="h-1.5 w-1.5 rounded-full bg-primary ring-1 ring-primary ring-offset-1"></div>
      </div>
      <div className="flex-auto">
        <div className="font-medium text-sm leading-6 text-slate-900">{message}</div>
        <div className="text-xs text-slate-500">{time}</div>
      </div>
    </li>
  );
}
