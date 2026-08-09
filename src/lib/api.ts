import axios, { type AxiosError } from "axios";

const defaultApiBaseUrl = "http://localhost:3000";

export const apiBaseUrl = (
  import.meta.env.VITE_API_BASE_URL ?? defaultApiBaseUrl
).replace(/\/+$/, "");

const accessTokenStorageKey = "iaue_admin_access_token";
const adminStorageKey = "iaue_admin_account";
export const authExpiredEvent = "iaue-auth-expired";

export type Programme = "MSc" | "PGD" | "PhD";
export type AdminRole = "ADMIN" | "SUPER_ADMIN";
export type AdminStatus = "ACTIVE" | "DISABLED" | "SUSPENDED";

export interface AdminAccount {
  id: string;
  fullName: string;
  email: string;
  role: AdminRole;
  status?: AdminStatus;
  createdAt?: string;
  updatedAt?: string;
  lastLoginAt?: string | null;
}

export interface ProjectReference {
  id: string;
  projectTitle: string;
  yearOfCompletion: number;
  programme: Programme;
  hasAbstract?: boolean;
}

export interface ProjectMatch extends ProjectReference {
  matchType: "EXACT" | "SIMILAR";
  algorithmScores?: {
    levenshtein: number;
    trigram: number;
    tokenSimilarity: number;
  };
  deterministicScore?: number;
  classification?: "HIGH_SIMILARITY" | "REVIEW" | "WEAK_MATCH";
}

export interface Project {
  id: string;
  supervisee: string;
  projectName: string;
  supervisor: string;
  yearOfCompletion: number;
  programme: Programme;
  serialNumber: string;
  abstract?: string;
  normalizedProjectName?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProjectListResponse {
  records: Project[];
  pagination: Pagination;
}

export interface Pagination {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
}

export interface ProjectQuery {
  page?: number;
  limit?: number;
  search?: string;
  programme?: Programme;
  yearOfCompletion?: number;
  supervisor?: string;
  serialNumber?: string;
}

export interface CreateProjectPayload {
  supervisee: string;
  projectName: string;
  supervisor: string;
  yearOfCompletion: number;
  programme: Programme;
  serialNumber: string;
  abstract: string;
}

export interface CreateAdminPayload {
  fullName: string;
  email: string;
  password: string;
  role: AdminRole;
}

export interface AdminQuery {
  page?: number;
  limit?: number;
  search?: string;
  role?: AdminRole;
  status?: AdminStatus;
}

export interface AdminListResponse {
  admins: AdminAccount[];
  pagination: Pagination;
}

export type ValidationStatus =
  | "DUPLICATE_FOUND"
  | "SIMILAR_MATCHES_FOUND"
  | "NO_MATCH_FOUND";

export interface ValidationResponse {
  status: ValidationStatus;
  message: string;
  query: string;
  normalizedQuery: string;
  exactMatches: ProjectMatch[];
  similarMatches: ProjectMatch[];
}

export interface AbstractResponse {
  projectId: string;
  abstract: string | null;
  message: string;
}

export interface ReportSummary {
  totalProjects: number;
  projectsByYear: { year: number; total: number }[];
  projectsByProgramme: { programme: Programme; total: number }[];
  projectsByProgrammeAndYear: {
    year: number;
    programme: Programme;
    total: number;
  }[];
}

interface ApiEnvelope<T> {
  success: boolean;
  message?: string;
  data: T;
}

interface ApiErrorEnvelope {
  message?: string;
  errors?: string[];
}

interface ValidationData {
  query: string;
  normalizedQuery: string;
  exactMatches: ProjectMatch[];
  similarMatches: ProjectMatch[];
}

interface ValidationEnvelope extends ApiEnvelope<ValidationData> {
  status: ValidationStatus;
  message: string;
}

interface BackendReportSummary {
  totalProjects: number;
  totalPGDProjects: number;
  totalMScProjects: number;
  totalPhDProjects: number;
}

interface BackendYearTotal {
  yearOfCompletion: number;
  totalProjects: number;
}

interface BackendProgrammeTotal {
  programme: Programme;
  totalProjects: number;
}

interface BackendProgrammeYearTotal extends BackendProgrammeTotal {
  yearOfCompletion: number;
}

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status?: number,
    readonly errors?: string[],
  ) {
    super(message);
    this.name = "ApiError";
  }
}

const api = axios.create({
  baseURL: apiBaseUrl,
  headers: { "Content-Type": "application/json" },
  timeout: 15_000,
});

api.interceptors.request.use((config) => {
  const accessToken = getAccessToken();
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorEnvelope>) => {
    const status = error.response?.status;
    const payload = error.response?.data;
    const message =
      payload?.message ??
      (error.code === "ECONNABORTED"
        ? "The request timed out. Please try again."
        : error.message || "Unable to reach the server. Please try again.");

    if (status === 401) {
      clearAdminSession();
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event(authExpiredEvent));
      }
    }

    return Promise.reject(new ApiError(message, status, payload?.errors));
  },
);

export function getAccessToken(): string | null {
  return typeof window === "undefined"
    ? null
    : sessionStorage.getItem(accessTokenStorageKey);
}

export function getCurrentAdmin(): AdminAccount | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = sessionStorage.getItem(adminStorageKey);
    return raw ? (JSON.parse(raw) as AdminAccount) : null;
  } catch {
    clearAdminSession();
    return null;
  }
}

export function setAdminSession(accessToken: string, admin: AdminAccount): void {
  sessionStorage.setItem(accessTokenStorageKey, accessToken);
  sessionStorage.setItem(adminStorageKey, JSON.stringify(admin));
}

export function clearAdminSession(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(accessTokenStorageKey);
  sessionStorage.removeItem(adminStorageKey);
}

export function toProjectReference(project: Project): ProjectReference {
  return {
    id: project.id,
    projectTitle: project.projectName,
    yearOfCompletion: project.yearOfCompletion,
    programme: project.programme,
    hasAbstract: true,
  };
}

export function getApiErrorMessage(
  error: unknown,
  fallback = "Something went wrong. Please try again.",
): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

export async function validateTitle(
  projectTitle: string,
): Promise<ValidationResponse> {
  const response = await api.post<ValidationEnvelope>("/projects/validate", {
    projectTitle,
  });
  const { data } = response.data;

  return {
    status: response.data.status,
    message: response.data.message,
    query: data.query,
    normalizedQuery: data.normalizedQuery,
    exactMatches: data.exactMatches,
    similarMatches: data.similarMatches,
  };
}

export async function fetchProjectAbstract(
  id: string,
): Promise<AbstractResponse> {
  const response = await api.get<ApiEnvelope<{ projectId: string; abstract: string | null }>>(
    `/projects/${id}/abstract`,
  );

  return {
    ...response.data.data,
    message: response.data.message ?? "Project abstract retrieved successfully.",
  };
}

export async function adminLogin(
  email: string,
  password: string,
): Promise<AdminAccount> {
  const response = await api.post<
    ApiEnvelope<{ accessToken: string; admin: AdminAccount }>
  >("/auth-admin/login", { email, password });
  const { accessToken, admin } = response.data.data;
  setAdminSession(accessToken, admin);
  return admin;
}

export async function fetchCurrentAdmin(): Promise<AdminAccount> {
  const response = await api.get<ApiEnvelope<AdminAccount>>("/auth-admin/me");
  const accessToken = getAccessToken();
  if (accessToken) {
    setAdminSession(accessToken, response.data.data);
  }
  return response.data.data;
}

export async function adminLogout(): Promise<void> {
  try {
    await api.post("/auth-admin/logout");
  } finally {
    clearAdminSession();
  }
}

export async function createProject(
  payload: CreateProjectPayload,
): Promise<Project> {
  const response = await api.post<ApiEnvelope<Project>>("/admin/projects", payload);
  return response.data.data;
}

export async function fetchProjects(
  query: ProjectQuery = {},
): Promise<ProjectListResponse> {
  const response = await api.get<ApiEnvelope<ProjectListResponse>>(
    "/admin/projects",
    { params: query },
  );
  return response.data.data;
}

export async function fetchReportSummary(): Promise<ReportSummary> {
  const [summaryResponse, byYearResponse, byProgrammeResponse, byProgrammeYearResponse] =
    await Promise.all([
      api.get<ApiEnvelope<BackendReportSummary>>("/admin/reports/summary"),
      api.get<ApiEnvelope<BackendYearTotal[]>>("/admin/reports/projects-by-year"),
      api.get<ApiEnvelope<BackendProgrammeTotal[]>>(
        "/admin/reports/projects-by-programme",
      ),
      api.get<ApiEnvelope<BackendProgrammeYearTotal[]>>(
        "/admin/reports/projects-by-programme-year",
      ),
    ]);

  const summary = summaryResponse.data.data;
  const programmeTotals = byProgrammeResponse.data.data;

  return {
    totalProjects: summary.totalProjects,
    projectsByYear: byYearResponse.data.data.map((item) => ({
      year: item.yearOfCompletion,
      total: item.totalProjects,
    })),
    projectsByProgramme: programmeTotals.map((item) => ({
      programme: item.programme,
      total: item.totalProjects,
    })),
    projectsByProgrammeAndYear: byProgrammeYearResponse.data.data.map(
      (item) => ({
        year: item.yearOfCompletion,
        programme: item.programme,
        total: item.totalProjects,
      }),
    ),
  };
}

export async function fetchAdmins(
  query: AdminQuery = {},
): Promise<AdminListResponse> {
  const response = await api.get<ApiEnvelope<AdminListResponse>>(
    "/admin-management/admins",
    { params: query },
  );
  return response.data.data;
}

export async function createAdmin(
  payload: CreateAdminPayload,
): Promise<AdminAccount> {
  const response = await api.post<ApiEnvelope<AdminAccount>>(
    "/admin-management/admins",
    payload,
  );
  return response.data.data;
}
