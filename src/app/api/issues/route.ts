import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  isDepartment,
  isPriority,
  DEPARTMENTS,
  PRIORITIES,
} from "@/lib/constants";
import type { IssueDTO, IssueStats } from "@/lib/types";

export const dynamic = "force-dynamic";

function toDTO(issue: {
  id: number;
  title: string;
  description: string;
  priority: string;
  department: string;
  status: string;
  reportedBy: string;
  assignedTo: string;
  createdAt: Date;
  updatedAt: Date;
  _count?: { comments: number };
}): IssueDTO {
  return {
    id: issue.id,
    title: issue.title,
    description: issue.description,
    priority: issue.priority,
    department: issue.department,
    status: issue.status,
    reportedBy: issue.reportedBy,
    assignedTo: issue.assignedTo,
    createdAt: issue.createdAt.toISOString(),
    updatedAt: issue.updatedAt.toISOString(),
    commentCount: issue._count?.comments ?? 0,
  };
}

// GET /api/issues -> { issues, stats }
export async function GET() {
  const [issues, open, inProgress, resolved, criticalActive] =
    await Promise.all([
      prisma.issue.findMany({
        orderBy: { createdAt: "desc" },
        include: { _count: { select: { comments: true } } },
      }),
      prisma.issue.count({ where: { status: "Open" } }),
      prisma.issue.count({ where: { status: "In Progress" } }),
      prisma.issue.count({ where: { status: "Resolved" } }),
      prisma.issue.count({
        where: { priority: "Critical", status: { not: "Resolved" } },
      }),
    ]);

  const stats: IssueStats = { open, inProgress, resolved, criticalActive };

  return NextResponse.json({ issues: issues.map(toDTO), stats });
}

// POST /api/issues -> create a new issue
export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const title = typeof body.title === "string" ? body.title.trim() : "";
  const description =
    typeof body.description === "string" ? body.description.trim() : "";
  const reportedBy =
    typeof body.reportedBy === "string" ? body.reportedBy.trim() : "";
  const assignedToRaw =
    typeof body.assignedTo === "string" ? body.assignedTo.trim() : "";
  const priority = body.priority;
  const department = body.department;

  if (!title) {
    return NextResponse.json(
      { error: "Issue title is required." },
      { status: 400 },
    );
  }
  if (!description) {
    return NextResponse.json(
      { error: "Description is required." },
      { status: 400 },
    );
  }
  if (!reportedBy) {
    return NextResponse.json(
      { error: '"Reported By" is required.' },
      { status: 400 },
    );
  }
  if (!isPriority(priority)) {
    return NextResponse.json(
      { error: `Priority must be one of: ${PRIORITIES.join(", ")}.` },
      { status: 400 },
    );
  }
  if (!isDepartment(department)) {
    return NextResponse.json(
      { error: `Department must be one of: ${DEPARTMENTS.join(", ")}.` },
      { status: 400 },
    );
  }

  // Sequential IDs starting at 101 so issues read as RPL-101, RPL-102, ...
  const last = await prisma.issue.findFirst({
    orderBy: { id: "desc" },
    select: { id: true },
  });
  const nextId = last ? last.id + 1 : 101;

  const created = await prisma.issue.create({
    data: {
      id: nextId,
      title,
      description,
      priority,
      department,
      reportedBy,
      assignedTo: assignedToRaw || "Unassigned",
      status: "Open",
    },
    include: { _count: { select: { comments: true } } },
  });

  return NextResponse.json({ issue: toDTO(created) }, { status: 201 });
}
