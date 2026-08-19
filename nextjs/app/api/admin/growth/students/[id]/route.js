import { prisma } from '@/lib/prisma';
import { getSessionUser, isManager } from '@/lib/auth';
import { ok, fail } from '@/lib/growthApi';
import { getHabitStats, getLastActivity } from '@/lib/growth';

export async function GET(request, { params }) {
  const user = await getSessionUser();
  if (!user) return fail('ابتدا وارد شوید.', 401);
  if (!isManager(user)) return fail('دسترسی لازم را ندارید.', 403);
  const { id } = await params;

  const student = await prisma.user.findFirst({
    where: { id, role: 'student' },
    select: {
      id: true, displayName: true, phone: true, courseTitle: true, photoUrl: true,
      classGroupId: true, classGroup: { select: { id: true, name: true } },
    },
  });
  if (!student) return fail('هنرجو یافت نشد.', 404);

  const [goals, habits, tasks, assignments, journalEntries, assessments, notes, lastActivityAt] = await Promise.all([
    prisma.growthGoal.findMany({
      where: { userId: id },
      include: { milestones: { orderBy: { order: 'asc' } } },
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    }),
    prisma.habit.findMany({ where: { userId: id }, orderBy: [{ active: 'desc' }, { createdAt: 'desc' }] }),
    prisma.growthTask.findMany({ where: { userId: id }, orderBy: { createdAt: 'desc' } }),
    prisma.assignment.findMany({
      where: { userId: id },
      include: { submissions: { orderBy: { submittedAt: 'desc' } } },
      orderBy: { createdAt: 'desc' },
    }),
    // خصوصیِ Journal هرگز برای مدیر قابل مشاهده نیست — فیلتر در همین کوئری سرور، نه در UI
    prisma.journalEntry.findMany({ where: { userId: id, visibility: 'shared' }, orderBy: { createdAt: 'desc' } }),
    prisma.assessment.findMany({ where: { userId: id }, include: { items: true }, orderBy: { createdAt: 'desc' } }),
    prisma.mentorNote.findMany({ where: { userId: id }, orderBy: { createdAt: 'desc' } }),
    getLastActivity(id),
  ]);

  let habitLogs = [];
  if (habits.length) {
    habitLogs = await prisma.habitLog.findMany({
      where: { habitId: { in: habits.map((h) => h.id) } },
      select: { habitId: true, logDate: true },
    });
  }
  const logsByHabit = {};
  for (const l of habitLogs) (logsByHabit[l.habitId] ||= []).push(l);

  return ok({
    student,
    lastActivityAt: lastActivityAt ? lastActivityAt.toISOString() : null,
    goals: goals.map((g) => ({
      id: g.id, title: g.title, description: g.description, priority: g.priority,
      status: g.status, progress: g.progress,
      startDate: g.startDate ? g.startDate.toISOString() : null,
      endDate: g.endDate ? g.endDate.toISOString() : null,
      milestones: g.milestones.map((m) => ({
        id: m.id, title: m.title, status: m.status, progress: m.progress,
        dueDate: m.dueDate ? m.dueDate.toISOString() : null,
      })),
    })),
    habits: habits.map((h) => ({
      id: h.id, title: h.title, frequencyType: h.frequencyType, frequencyConfig: h.frequencyConfig,
      active: h.active, stats: getHabitStats(h, logsByHabit[h.id] || []),
    })),
    tasks: tasks.map((t) => ({
      id: t.id, title: t.title, status: t.status, priority: t.priority,
      dueDate: t.dueDate ? t.dueDate.toISOString() : null,
    })),
    assignments: assignments.map((a) => ({
      id: a.id, title: a.title, description: a.description, status: a.status,
      dueDate: a.dueDate ? a.dueDate.toISOString() : null,
      submissions: a.submissions.map((s) => ({
        id: s.id, content: s.content, fileUrl: s.fileUrl, status: s.status,
        feedback: s.feedback, submittedAt: s.submittedAt.toISOString(),
      })),
    })),
    journalEntries: journalEntries.map((e) => ({
      id: e.id, content: e.content, createdAt: e.createdAt.toISOString(),
    })),
    assessments: assessments.map((a) => ({
      id: a.id, generalComment: a.generalComment, createdAt: a.createdAt.toISOString(),
      items: a.items.map((it) => ({ id: it.id, skill: it.skill, score: it.score, comment: it.comment })),
    })),
    notes: notes.map((n) => ({ id: n.id, content: n.content, createdAt: n.createdAt.toISOString() })),
  });
}
