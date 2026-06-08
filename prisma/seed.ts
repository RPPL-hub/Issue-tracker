import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Sample issues so the dashboard looks alive on first run. IDs start at 101 so
// they render as RPL-101, RPL-102, ... matching the design mockup.
async function main() {
  console.log("Seeding database...");

  // Clear existing data for a clean, repeatable seed.
  await prisma.comment.deleteMany();
  await prisma.issue.deleteMany();

  const now = Date.now();
  const hoursAgo = (h: number) => new Date(now - h * 60 * 60 * 1000);

  await prisma.issue.create({
    data: {
      id: 101,
      title: "Critical Breakdown on Line A",
      description:
        "Main motor on production Line A tripped and will not restart. Output halted.",
      priority: "Critical",
      department: "Operations",
      status: "Open",
      reportedBy: "John Doe",
      assignedTo: "John Doe",
      createdAt: hoursAgo(2),
    },
  });

  await prisma.issue.create({
    data: {
      id: 102,
      title: "Conveyor Belt B Jammed",
      description:
        "Belt B repeatedly jams under load. Suspected bearing wear on the drive roller.",
      priority: "High",
      department: "Operations",
      status: "In Progress",
      reportedBy: "John Doe",
      assignedTo: "Sarah Jenkins",
      createdAt: hoursAgo(6),
      comments: {
        create: [
          {
            author: "John Doe",
            body: "Inspected Belt B. Bearing replacement needed.",
            createdAt: hoursAgo(5),
          },
          {
            author: "Sarah Jenkins",
            body: "Part arrived. Test cycles underway.",
            createdAt: hoursAgo(3),
          },
        ],
      },
    },
  });

  await prisma.issue.create({
    data: {
      id: 103,
      title: "Logistics request: pallet shortage",
      description: "Outbound dock is short ~40 pallets for tomorrow's dispatch.",
      priority: "Medium",
      department: "Logistics",
      status: "Open",
      reportedBy: "Amina Okello",
      assignedTo: "David Mwangi",
      createdAt: hoursAgo(9),
    },
  });

  await prisma.issue.create({
    data: {
      id: 104,
      title: "Critical Breakdown: cooling pump failure",
      description:
        "Coolant pump #2 failed. Temperatures climbing on the QA test rig.",
      priority: "Critical",
      department: "Operations",
      status: "In Progress",
      reportedBy: "Sarah Jenkins",
      assignedTo: "John Doe",
      createdAt: hoursAgo(12),
      comments: {
        create: [
          {
            author: "John Doe",
            body: "Isolated the rig. Sourcing a replacement pump.",
            createdAt: hoursAgo(11),
          },
        ],
      },
    },
  });

  await prisma.issue.create({
    data: {
      id: 105,
      title: "Logistics request: inbound delivery delayed",
      description: "Supplier truck delayed 24h. Raw material buffer at risk.",
      priority: "Medium",
      department: "Logistics",
      status: "Open",
      reportedBy: "David Mwangi",
      assignedTo: "Amina Okello",
      createdAt: hoursAgo(20),
    },
  });

  await prisma.issue.create({
    data: {
      id: 106,
      title: "Quality check failed on Batch 22",
      description:
        "Batch 22 failed moisture spec. Quarantined pending re-test and root cause.",
      priority: "High",
      department: "Quality",
      status: "Resolved",
      reportedBy: "Grace Nakato",
      assignedTo: "Grace Nakato",
      createdAt: hoursAgo(48),
      comments: {
        create: [
          {
            author: "Grace Nakato",
            body: "Re-tested after drying. Within spec. Released.",
            createdAt: hoursAgo(30),
          },
        ],
      },
    },
  });

  await prisma.issue.create({
    data: {
      id: 107,
      title: "Printer offline in Admin office",
      description: "Shared printer not reachable on the network since this morning.",
      priority: "Low",
      department: "IT",
      status: "Resolved",
      reportedBy: "Peter Otim",
      assignedTo: "Peter Otim",
      createdAt: hoursAgo(72),
    },
  });

  await prisma.issue.create({
    data: {
      id: 108,
      title: "Forklift #3 maintenance overdue",
      description: "Forklift #3 is 200 hours past its scheduled service interval.",
      priority: "Medium",
      department: "Operations",
      status: "In Progress",
      reportedBy: "David Mwangi",
      assignedTo: "Sarah Jenkins",
      createdAt: hoursAgo(28),
    },
  });

  await prisma.issue.create({
    data: {
      id: 109,
      title: "Chemical spill in Aisle 3",
      description:
        "Minor lubricant spill near rack 3B. Area cordoned, needs cleanup crew.",
      priority: "Critical",
      department: "Operations",
      status: "Open",
      reportedBy: "Amina Okello",
      assignedTo: "John Doe",
      createdAt: hoursAgo(1),
    },
  });

  const count = await prisma.issue.count();
  console.log(`Seed complete: ${count} issues created.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
