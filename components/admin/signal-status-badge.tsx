import type { SignalStatus } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { signalStatusClassName } from "@/lib/signals/status-style";

export function SignalStatusBadge({ status }: { status: SignalStatus }) {
  return (
    <Badge variant="outline" className={signalStatusClassName(status)}>
      {status}
    </Badge>
  );
}
