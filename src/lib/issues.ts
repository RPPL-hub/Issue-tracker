import { prisma } from "./prisma";

export interface NewIssueData {
  title: string;
  description: string;
  priority: string;
  department: string;
  reportedBy: string;
  assignedTo: string;
  source?: string; // "web" (default) | "whatsapp"
}

// Shared by the REST API and the WhatsApp pipeline. Sequential IDs start at
// 101 so issues read as RPL-101, RPL-102, ...
export async function createIssue(data: NewIssueData) {
  const last = await prisma.issue.findFirst({
    orderBy: { id: "desc" },
    select: { id: true },
  });
  const nextId = last ? last.id + 1 : 101;

  return prisma.issue.create({
    data: {
      id: nextId,
      title: data.title,
      description: data.description,
      priority: data.priority,
      department: data.department,
      reportedBy: data.reportedBy,
      assignedTo: data.assignedTo || "Unassigned",
      source: data.source ?? "web",
      status: "Open",
    },
    include: { _count: { select: { comments: true } } },
  });
}
