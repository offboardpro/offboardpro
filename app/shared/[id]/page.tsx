"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Image from "next/image";

// Mirrors the same status vocabulary used in the dashboard, so a client
// sees the same words their offboarding manager sees.
function getClientStatusLabel(status?: string) {
  switch (status) {
    case "ending_soon":
      return "Ending Soon";
    case "offboarding":
      return "Offboarding In Progress";
    case "ready_to_close":
      return "Ready to Close";
    case "closed":
      return "Closed";
    default:
      return "Active";
  }
}

function getClientStatusClasses(status?: string) {
  switch (status) {
    case "ending_soon":
      return "bg-brand-green/10 text-[#6d941f] border-brand-green/30";
    case "offboarding":
      return "bg-blue-50 text-blue-700 border-blue-200";
    case "ready_to_close":
      return "bg-brand-green/10 text-[#6d941f] border-brand-green/30";
    case "closed":
      return "bg-slate-100 text-slate-500 border-slate-200";
    default:
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
  }
}

function getTaskStatusLabel(status: string) {
  switch (status) {
    case "removed":
      return "Removed";
    case "in_progress":
      return "In Progress";
    case "not_needed":
      return "Not Needed";
    case "waiting_client":
    case "waiting":
      return "Waiting on You";
    default:
      return "Pending";
  }
}

function getTaskStatusClasses(status: string) {
  switch (status) {
    case "removed":
      return "bg-emerald-50 text-emerald-600 border-emerald-200";
    case "in_progress":
      return "bg-blue-50 text-blue-600 border-blue-200";
    case "not_needed":
      return "bg-slate-100 text-slate-500 border-slate-200";
    case "waiting_client":
    case "waiting":
      return "bg-amber-50 text-amber-600 border-amber-200";
    default:
      return "bg-slate-50 text-slate-500 border-slate-200";
  }
}

function formatToolsDisplay(toolsData: any) {
  if (Array.isArray(toolsData)) return toolsData.join(", ");
  return toolsData || "";
}

function formatDate(value: any) {
  if (!value) return null;
  try {
    // Firestore Timestamp, ISO string, or plain date string are all handled.
    const d = typeof value?.toDate === "function" ? value.toDate() : new Date(value);
    if (isNaN(d.getTime())) return String(value);
    return d.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return String(value);
  }
}

export default function SharedPortalPage() {
  const params = useParams();
  const id = typeof params?.id === "string" ? params.id : Array.isArray(params?.id) ? params.id[0] : "";

  const [client, setClient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [invalid, setInvalid] = useState(false);

  useEffect(() => {
    if (!id) {
      setInvalid(true);
      setLoading(false);
      return;
    }

    const fetchClient = async () => {
      try {
        const snap = await getDoc(doc(db, "clients", id));
        if (snap.exists()) {
          setClient({ id: snap.id, ...snap.data() });
        } else {
          setInvalid(true);
        }
      } catch (error) {
        console.error("Failed to load shared portal:", error);
        setInvalid(true);
      } finally {
        setLoading(false);
      }
    };

    fetchClient();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-brand-navy border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-black uppercase tracking-widest text-slate-400">Loading portal…</p>
        </div>
      </div>
    );
  }

  if (invalid || !client) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-sm text-center bg-white rounded-[2.5rem] border-t-[10px] border-brand-navy p-10 shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-5 text-2xl">
            🔗
          </div>
          <h1 className="text-xl font-black italic text-brand-navy mb-2">
            This link isn't valid
          </h1>
          <p className="text-sm font-semibold text-slate-500">
            It may have expired, or the project it points to no longer exists. Ask whoever sent you this link for a fresh one.
          </p>
        </div>
      </div>
    );
  }

  const checklist = Array.isArray(client.checklist) ? client.checklist : [];
  const completedCount = checklist.filter(
    (task: any) => task.status === "removed" || task.status === "not_needed"
  ).length;
  const totalCount = checklist.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* HEADER */}
      <header className="border-b border-slate-100 bg-white">
        <div className="max-w-3xl mx-auto px-5 sm:px-8 py-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image src="/logo.png" alt="OffboardPro" width={130} height={130} priority unoptimized className="object-contain w-[110px] h-auto" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 border border-slate-200 rounded-full px-3 py-1.5">
            Client Portal
          </span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-5 sm:px-8 py-10 sm:py-14">
        {/* CLIENT + STATUS */}
        <div className="mb-8">
          <span className={`inline-block text-[10px] font-black uppercase tracking-widest border rounded-full px-3 py-1.5 mb-4 ${getClientStatusClasses(client.clientStatus)}`}>
            {getClientStatusLabel(client.clientStatus)}
          </span>
          <h1 className="text-3xl sm:text-4xl font-black italic text-brand-navy tracking-normal mb-2">
            {client.projectName || client.name}
          </h1>
          {client.projectName && client.name && (
            <p className="text-sm font-bold text-slate-500">{client.name}</p>
          )}
        </div>

        {/* PROGRESS */}
        <div className="bg-white rounded-[2rem] border border-slate-100 p-6 sm:p-8 mb-6 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Access Removal Progress
            </span>
            <span className="text-sm font-black text-brand-navy">
              {completedCount}/{totalCount} complete
            </span>
          </div>
          <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-brand-green rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {(client.accessRemovalDeadline || client.accessReviewDate) && (
            <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-slate-100">
              {client.accessRemovalDeadline && (
                <div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-1">
                    Removal Deadline
                  </span>
                  <p className="text-sm font-black text-slate-700">
                    {formatDate(client.accessRemovalDeadline)}
                  </p>
                </div>
              )}
              {client.accessReviewDate && (
                <div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-1">
                    Next Review
                  </span>
                  <p className="text-sm font-black text-slate-700">
                    {formatDate(client.accessReviewDate)}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* TOOLS */}
        {client.tools && (
          <div className="mb-6">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">
              Tools & Access In Scope
            </span>
            <p className="text-sm font-bold text-brand-navy">
              {formatToolsDisplay(client.tools)}
            </p>
          </div>
        )}

        {/* CHECKLIST */}
        {totalCount > 0 && (
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-3">
              Offboarding Checklist
            </span>
            <div className="space-y-2">
              {checklist.map((task: any) => (
                <div
                  key={task.id}
                  className="bg-white rounded-2xl border border-slate-100 p-4 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p
                      className={`text-sm font-bold truncate ${
                        task.status === "removed" || task.status === "not_needed"
                          ? "text-slate-400 line-through"
                          : "text-slate-700"
                      }`}
                    >
                      {task.title}
                    </p>
                    {task.tool && (
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-0.5">
                        {task.tool}
                      </p>
                    )}
                  </div>
                  <span
                    className={`shrink-0 text-[9px] font-black uppercase tracking-wider border rounded-full px-2.5 py-1 ${getTaskStatusClasses(task.status)}`}
                  >
                    {getTaskStatusLabel(task.status)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <footer className="text-center py-8">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">
          Powered by OffboardPro
        </p>
      </footer>
    </div>
  );
}
