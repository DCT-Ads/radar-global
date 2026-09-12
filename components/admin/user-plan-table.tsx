"use client";

import type { AccessPlan } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

type UserRow = {
  id: string;
  name: string;
  email: string;
  role: "USER" | "ADMIN";
  plan: AccessPlan;
};

export function UserPlanTable({
  users,
  labels,
}: {
  users: UserRow[];
  labels: {
    name: string;
    email: string;
    role: string;
    plan: string;
    standard: string;
    premium: string;
    saved: string;
    error: string;
  };
}) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function changePlan(id: string, plan: AccessPlan) {
    setPendingId(id);
    setMessage(null);
    try {
      const response = await fetch(`/api/admin/users/${id}/plan`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      if (!response.ok) {
        throw new Error("failed");
      }
      setMessage(labels.saved);
      router.refresh();
    } catch {
      setMessage(labels.error);
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="space-y-3">
      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-xs uppercase text-muted-foreground">
            <tr>
              <th className="pb-2 pr-4">{labels.name}</th>
              <th className="pb-2 pr-4">{labels.email}</th>
              <th className="pb-2 pr-4">{labels.role}</th>
              <th className="pb-2">{labels.plan}</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-t border-border">
                <td className="py-3 pr-4">{user.name}</td>
                <td className="py-3 pr-4">{user.email}</td>
                <td className="py-3 pr-4">{user.role}</td>
                <td className="py-3">
                  <select
                    className="rounded-md border border-border bg-background px-2 py-1"
                    value={user.plan}
                    disabled={pendingId === user.id}
                    onChange={(event) =>
                      void changePlan(user.id, event.target.value as AccessPlan)
                    }
                  >
                    <option value="STANDARD">{labels.standard}</option>
                    <option value="PREMIUM">{labels.premium}</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
