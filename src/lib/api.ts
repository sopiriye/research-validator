// Mock API for IAUE-ITE-PG Research Project Validator
// Structured to mirror the future NestJS backend contract.

export type Programme = "MSc" | "PGD" | "PhD";

export interface Project {
  id: string;
  supervisee: string;
  projectName: string;
  supervisor: string;
  yearOfCompletion: number;
  programme: Programme;
  serialNumber: string;
  abstract: string;
}

export interface ProjectMatch {
  id: string;
  projectTitle: string;
  yearOfCompletion: number;
  programme: Programme;
}

export type ValidationStatus = "DUPLICATE_FOUND" | "SIMILAR_FOUND" | "NO_MATCH";

export interface ValidationResponse {
  status: ValidationStatus;
  exactMatches: ProjectMatch[];
  similarMatches: ProjectMatch[];
}

const seedAbstract = (title: string, programme: Programme, year: number) =>
  `This ${programme} research, completed in ${year}, titled "${title}", investigates the problem within the context of Ignatius Ajuru University of Education, ITE Department. The study adopts a mixed-method approach combining a structured survey of staff and students with an iterative system design process. Data collected were analysed using descriptive statistics, while the prototype was evaluated against defined functional and non-functional requirements.\n\nFindings indicate measurable improvements in accuracy, turnaround time and user satisfaction compared with existing manual practice. The study concludes with recommendations for departmental adoption, integration with existing records, and suggestions for further research on scalability and security.`;

const rawProjects: Omit<Project, "abstract">[] = [
  { id: "1", supervisee: "John Doe", projectName: "Assessment of ICT Usage in Teaching and Learning", supervisor: "Dr. Jane Smith", yearOfCompletion: 2023, programme: "MSc", serialNumber: "ITE-MSC-2023-001" },
  { id: "2", supervisee: "Mary Johnson", projectName: "ICT Usage in Classroom Learning", supervisor: "Prof. Ada Okafor", yearOfCompletion: 2022, programme: "PGD", serialNumber: "ITE-PGD-2022-014" },
  { id: "3", supervisee: "Samuel Green", projectName: "Impact of ICT on Teaching and Learning", supervisor: "Dr. Emeka Obi", yearOfCompletion: 2024, programme: "MSc", serialNumber: "ITE-MSC-2024-007" },
  { id: "4", supervisee: "Grace Peters", projectName: "Design and Implementation of a Student Result Management System", supervisor: "Dr. Jane Smith", yearOfCompletion: 2023, programme: "MSc", serialNumber: "ITE-MSC-2023-018" },
  { id: "5", supervisee: "Peter Nwosu", projectName: "Development of an Online Voting System for Student Union Elections", supervisor: "Prof. Ada Okafor", yearOfCompletion: 2022, programme: "PhD", serialNumber: "ITE-PHD-2022-003" },
  { id: "6", supervisee: "Ruth Bassey", projectName: "A Web-Based Library Management System for IAUE", supervisor: "Dr. Emeka Obi", yearOfCompletion: 2021, programme: "PGD", serialNumber: "ITE-PGD-2021-021" },
  { id: "7", supervisee: "Chika Umeh", projectName: "Implementation of a Computerized Attendance Tracking System", supervisor: "Dr. Jane Smith", yearOfCompletion: 2022, programme: "MSc", serialNumber: "ITE-MSC-2022-032" },
  { id: "8", supervisee: "David Iyke", projectName: "Design of an E-Learning Platform for Distance Education", supervisor: "Prof. Ada Okafor", yearOfCompletion: 2021, programme: "MSc", serialNumber: "ITE-MSC-2021-011" },
  { id: "9", supervisee: "Blessing Ade", projectName: "Development of a School Fees Payment and Verification System", supervisor: "Dr. Emeka Obi", yearOfCompletion: 2021, programme: "PhD", serialNumber: "ITE-PHD-2021-002" },
  { id: "10", supervisee: "Kelvin Otu", projectName: "A Computerized Student Registration and Course Allocation System", supervisor: "Dr. Jane Smith", yearOfCompletion: 2020, programme: "PGD", serialNumber: "ITE-PGD-2020-009" },
  { id: "11", supervisee: "Ada Nnadi", projectName: "Design and Implementation of an Online Examination System", supervisor: "Prof. Ada Okafor", yearOfCompletion: 2020, programme: "MSc", serialNumber: "ITE-MSC-2020-024" },
  { id: "12", supervisee: "Ifeanyi Okoro", projectName: "Development of a Hostel Room Allocation Management System", supervisor: "Dr. Emeka Obi", yearOfCompletion: 2024, programme: "MSc", serialNumber: "ITE-MSC-2024-015" },
  { id: "13", supervisee: "Rose Uche", projectName: "Digital Notice Board System for University Departments", supervisor: "Dr. Jane Smith", yearOfCompletion: 2024, programme: "PGD", serialNumber: "ITE-PGD-2024-006" },
  { id: "14", supervisee: "Michael Eze", projectName: "Cloud-Based Assessment Tool for Higher Institutions", supervisor: "Prof. Ada Okafor", yearOfCompletion: 2023, programme: "PhD", serialNumber: "ITE-PHD-2023-001" },
];

const mockProjects: Project[] = rawProjects.map((p) => ({
  ...p,
  abstract: seedAbstract(p.projectName, p.programme, p.yearOfCompletion),
}));

const normalize = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");
const tokenize = (s: string) =>
  new Set(
    normalize(s)
      .replace(/[^a-z0-9 ]/g, "")
      .split(" ")
      .filter((w) => w.length > 3),
  );

function similarity(a: string, b: string): number {
  const ta = tokenize(a);
  const tb = tokenize(b);
  if (!ta.size || !tb.size) return 0;
  let inter = 0;
  ta.forEach((t) => tb.has(t) && inter++);
  const union = new Set([...ta, ...tb]).size;
  return inter / union;
}

// POST /api/projects/validate
export async function validateTitle(projectTitle: string): Promise<ValidationResponse> {
  await new Promise((r) => setTimeout(r, 700 + Math.random() * 400));
  const target = normalize(projectTitle);
  const exactMatches: ProjectMatch[] = [];
  const similarMatches: ProjectMatch[] = [];

  for (const p of mockProjects) {
    const match: ProjectMatch = {
      id: p.id,
      projectTitle: p.projectName,
      yearOfCompletion: p.yearOfCompletion,
      programme: p.programme,
    };
    if (normalize(p.projectName) === target) {
      exactMatches.push(match);
    } else if (similarity(p.projectName, projectTitle) >= 0.35) {
      similarMatches.push(match);
    }
  }

  const status: ValidationStatus =
    exactMatches.length > 0 ? "DUPLICATE_FOUND" : similarMatches.length > 0 ? "SIMILAR_FOUND" : "NO_MATCH";

  return { status, exactMatches, similarMatches: similarMatches.slice(0, 5) };
}

// POST /api/admin/projects
export interface CreateProjectPayload {
  supervisee: string;
  projectName: string;
  supervisor: string;
  yearOfCompletion: number;
  programme: Programme;
  serialNumber: string;
  abstract: string;
}

export async function createProject(payload: CreateProjectPayload): Promise<Project> {
  await new Promise((r) => setTimeout(r, 600));
  const project: Project = { id: String(mockProjects.length + 1), ...payload };
  mockProjects.push(project);
  return project;
}

// GET /api/projects/:id/abstract  (public + admin)
export interface AbstractResponse {
  id: string;
  projectTitle: string;
  yearOfCompletion: number;
  programme: Programme;
  abstract: string;
}

export async function fetchProjectAbstract(id: string): Promise<AbstractResponse> {
  await new Promise((r) => setTimeout(r, 500));
  const p = mockProjects.find((x) => x.id === id);
  if (!p) throw new Error("Abstract not found for this project.");
  return {
    id: p.id,
    projectTitle: p.projectName,
    yearOfCompletion: p.yearOfCompletion,
    programme: p.programme,
    abstract: p.abstract,
  };
}

// GET /api/admin/projects
export async function fetchProjects(search?: string): Promise<Project[]> {
  await new Promise((r) => setTimeout(r, 400));
  const q = search ? normalize(search) : "";
  const list = q
    ? mockProjects.filter(
        (p) =>
          normalize(p.projectName).includes(q) ||
          normalize(p.supervisee).includes(q) ||
          normalize(p.supervisor).includes(q) ||
          normalize(p.serialNumber).includes(q),
      )
    : [...mockProjects];
  return list.sort((a, b) => b.yearOfCompletion - a.yearOfCompletion);
}

// GET /api/admin/reports/summary
export interface ReportSummary {
  totalProjects: number;
  projectsByYear: { year: number; total: number }[];
  projectsByProgramme: { programme: Programme; total: number }[];
  projectsByProgrammeAndYear: { year: number; programme: Programme; total: number }[];
}

export async function fetchReportSummary(): Promise<ReportSummary> {
  await new Promise((r) => setTimeout(r, 500));

  const byYear = new Map<number, number>();
  const byProg = new Map<Programme, number>();
  const byBoth = new Map<string, number>();

  for (const p of mockProjects) {
    byYear.set(p.yearOfCompletion, (byYear.get(p.yearOfCompletion) ?? 0) + 1);
    byProg.set(p.programme, (byProg.get(p.programme) ?? 0) + 1);
    const key = `${p.yearOfCompletion}|${p.programme}`;
    byBoth.set(key, (byBoth.get(key) ?? 0) + 1);
  }

  return {
    totalProjects: mockProjects.length,
    projectsByYear: [...byYear.entries()]
      .map(([year, total]) => ({ year, total }))
      .sort((a, b) => a.year - b.year),
    projectsByProgramme: (["MSc", "PGD", "PhD"] as Programme[]).map((programme) => ({
      programme,
      total: byProg.get(programme) ?? 0,
    })),
    projectsByProgrammeAndYear: [...byBoth.entries()]
      .map(([key, total]) => {
        const [year, programme] = key.split("|");
        return { year: Number(year), programme: programme as Programme, total };
      })
      .sort((a, b) => a.year - b.year),
  };
}

// POST /api/admin/login
export type AdminRole = "super_admin" | "admin";

export interface AdminAccount {
  id: string;
  email: string;
  fullName: string;
  role: AdminRole;
  createdAt: string;
}

// In-memory admin store (mock). Replace with NestJS /api/admins.
const mockAdmins: (AdminAccount & { password: string })[] = [
  {
    id: "1",
    email: "admin@iaue.edu.ng",
    fullName: "Super Admin",
    role: "super_admin",
    password: "admin123",
    createdAt: new Date("2025-01-10").toISOString(),
  },
  {
    id: "2",
    email: "staff@iaue.edu.ng",
    fullName: "Department Staff",
    role: "admin",
    password: "staff123",
    createdAt: new Date("2025-03-02").toISOString(),
  },
];

export async function adminLogin(
  email: string,
  password: string,
): Promise<{ success: boolean; account: AdminAccount }> {
  await new Promise((r) => setTimeout(r, 600));
  const found = mockAdmins.find(
    (a) => a.email.toLowerCase() === email.trim().toLowerCase() && a.password === password,
  );
  if (!found) throw new Error("Invalid email or password");
  const { password: _pw, ...account } = found;
  return { success: true, account };
}

// GET /api/admins
export async function fetchAdmins(): Promise<AdminAccount[]> {
  await new Promise((r) => setTimeout(r, 300));
  return mockAdmins.map(({ password: _pw, ...rest }) => rest);
}

// POST /api/admins   — server MUST also re-check role
export interface CreateAdminPayload {
  requesterRole: AdminRole;
  fullName: string;
  email: string;
  password: string;
  role?: AdminRole;
}

export async function createAdmin(payload: CreateAdminPayload): Promise<AdminAccount> {
  await new Promise((r) => setTimeout(r, 500));
  if (payload.requesterRole !== "super_admin") {
    throw new Error("You are not allowed to create another admin. Only the Super Admin can add new admins.");
  }
  const email = payload.email.trim().toLowerCase();
  if (mockAdmins.some((a) => a.email.toLowerCase() === email)) {
    throw new Error("An admin with this email already exists.");
  }
  const created: AdminAccount & { password: string } = {
    id: String(mockAdmins.length + 1),
    email,
    fullName: payload.fullName.trim(),
    role: payload.role === "super_admin" ? "super_admin" : "admin",
    password: payload.password,
    createdAt: new Date().toISOString(),
  };
  mockAdmins.push(created);
  const { password: _pw, ...rest } = created;
  return rest;
}
