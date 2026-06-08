import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isStatus, STATUSES } from "@/lib/constants";
import type { IssueDTO } from "@/lib/types";

export const dynamic = "force-dynamic";

function fullDTO(issue: {
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
  comments: { id: number; body: string; author: string; createdAt: Date }[];
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
    commentCount: issue.comments.length,
    comments: issue.comments.map((c) => ({
      id: c.id,
      body: c.body,
      author: c.author,
      createdAt: c.createdAt.toISOString(),
    })),
  };
}

function parseId(raw: string): number | null {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

// GET /api/issues/:id -> single issue with its comment thread
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: rawId } = await params;
  const id = parseId(rawId);
  if (id === null) {
    return NextResponse.json({ error: "Invalid issue id." }, { status: 400 });
  }

  const issue = await prisma.issue.findUnique({
    where: { id },
    include: { comments: { orderBy: { createdAt: "asc" } } },
  });

  if (!issue) {
    return NextResponse.json({ error: "Issue not found." }, { status: 404 });
  }

  return NextResponse.json({ issue: fullDTO(issue) });
}

// PATCH /api/issues/:id -> update status (advances the workflow) or assignee
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: rawId } = await params;
  const id = parseId(rawId);
  if (id === null) {
    return NextResponse.json({ error: "Invalid issue id." }, { status: 400 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const data: { status?: string; assignedTo?: string } = {};

  if (body.status !== undefined) {
    if (!isStatus(body.status)) {
      return NextResponse.json(
        { error: `Status must be one of: ${STATUSES.join(", ")}.` },
        { status: 400 },
      );
    }
    data.status = body.status;
  }

  if (typeof body.assignedTo === "string" && body.assignedTo.trim()) {
    data.assignedTo = body.assignedTo.trim();
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json(
      { error: "Nothing to update." },
      { status: 400 },
    );
  }

  const existing = await prisma.issue.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Issue not found." }, { status: 404 });
  }

  const updated = await prisma.issue.update({
    where: { id },
    data,
    include: { comments: { orderBy: { createdAt: "asc" } } },
  });

  return NextResponse.json({ issue: fullDTO(updated) });
}
