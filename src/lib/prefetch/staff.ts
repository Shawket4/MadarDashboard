import type { QueryClient } from "@tanstack/react-query";

import {
  getAdvancesQueryOptions,
  getAttendanceSummaryQueryOptions,
  getCurrentQueryOptions,
  getDisciplineReportQueryOptions,
  getFairnessAuditsQueryOptions,
  getFairnessQueryOptions,
  getGetAttendanceSettingsQueryKey,
  getGetAttendanceSettingsQueryOptions,
  getGetCoverageQueryOptions,
  getGetMyAuthzQueryKey,
  getGetOrgModulesQueryKey,
  getLabourVsSalesQueryOptions,
  getListAdjustmentsQueryOptions,
  getListAdvancesQueryOptions,
  getListAssignmentsQueryOptions,
  getListAttendanceFlagsQueryOptions,
  getListAttendanceQueryOptions,
  getListBranchRulesQueryOptions,
  getListBranchesQueryOptions,
  getListDepartmentsQueryOptions,
  getListEmployeesQueryOptions,
  getListExpenseAdvancesQueryOptions,
  getListOpenShiftsQueryOptions,
  getListRequestsQueryOptions,
  getListSwapsQueryOptions,
  getListWorkShiftsQueryOptions,
  getPayrollHistoryQueryOptions,
  getRosterQueryOptions,
  getSuggestionsQueryOptions,
  getTeamPresenceQueryOptions,
} from "@/data/api/generated/api";
import type { AttendanceSettings, MyAuthz, OrgModules } from "@/data/api/generated/models";
import { authzFrom } from "@/data/authz/use-authz";
import { useAuthStore } from "@/data/stores/auth.store";
import { periodStartDayOf } from "@/features/dawam/period";
import {
  approvalsCan, approvalsParams, expenseAdvancesParams, scheduleParams, scheduleWeek, staffReportsParams, staffReportsTabs,
} from "@/features/dawam/queries";
import { payrollSearch, scheduleSearch, staffReportsSearch } from "@/features/dawam/search";
import { attendanceParams, employeesListParams, requestsListParams, rulesSettingsParams } from "@/features/staff/queries";
import { attendanceSearch, employeesSearch, requestsSearch, rulesSearch } from "@/features/staff/search";
import { Cap } from "@/generated/capabilities";
import { disciplineParams } from "@/features/reports/staff/queries";
import type { RoutePrefetchMap } from "@/lib/route-prefetch";

/**
 * The person's rights as the app shell last read them (`useAuthz`): Dawam pages
 * read a list only for who may, and a 403 cached by a prefetch would show as
 * the page's error state. Nothing known yet = nothing gated is warmed.
 */
const authzOf = (qc: QueryClient) =>
  authzFrom(qc.getQueryData<MyAuthz>(getGetMyAuthzQueryKey()), { platform: useAuthStore.getState().user?.role === "super_admin" });

/** The set-up checklist's reads (`useSetupData`): Set-up, and the rules banner on Team, Schedule and Payroll. */
const warmSetup = (qc: QueryClient, orgId: string | null) => {
  if (!orgId) return;
  void qc.prefetchQuery(getListBranchesQueryOptions({ org_id: orgId }));
  void qc.prefetchQuery(getListEmployeesQueryOptions({ employment_status: "active" }));
  void qc.prefetchQuery(getListWorkShiftsQueryOptions());
  void qc.prefetchQuery(getGetAttendanceSettingsQueryOptions({}));
};

/** Sidebar/palette intent prefetch for the staff area: route → its mount-time queries. */
export const routes: RoutePrefetchMap = {
  // The sidebar parent only unfolds its group; Employees is the first page under it.
  "/staff": (qc, ctx) => {
    if (authzOf(qc).can(Cap.hrStaffRead)) routes["/staff/employees"](qc, ctx);
  },
  "/staff/setup": (qc, { orgId }) => {
    if (authzOf(qc).can(Cap.hrRulesEdit)) warmSetup(qc, orgId);
  },
  "/staff/employees": (qc, { orgId, branchId, search }) => {
    void qc.prefetchQuery(getListEmployeesQueryOptions(employeesListParams(employeesSearch.entryValues(branchId, search))));
    void qc.prefetchQuery(getListDepartmentsQueryOptions());
    if (orgId) void qc.prefetchQuery(getListBranchesQueryOptions({ org_id: orgId }));
  },
  "/staff/attendance": (qc, { orgId, branchId, search }) => {
    const params = attendanceParams(branchId, attendanceSearch.entryValues(branchId, search));
    void qc.prefetchQuery(getListAttendanceQueryOptions(params));
    void qc.prefetchQuery(getAttendanceSummaryQueryOptions(params));
    void qc.prefetchQuery(getListEmployeesQueryOptions({}));
    void qc.prefetchQuery(getGetAttendanceSettingsQueryOptions({}));
    if (orgId) void qc.prefetchQuery(getListBranchesQueryOptions({ org_id: orgId }));
  },
  "/staff/shifts": (qc, { orgId }) => {
    void qc.prefetchQuery(getListWorkShiftsQueryOptions());
    if (orgId) void qc.prefetchQuery(getListBranchesQueryOptions({ org_id: orgId }));
    // The weekly grid under the blocks.
    void qc.prefetchQuery(getListEmployeesQueryOptions({ employment_status: "active" }));
    void qc.prefetchQuery(getListAssignmentsQueryOptions({}));
  },
  "/staff/team": (qc, { orgId, branchId }) => {
    if (!authzOf(qc).can(Cap.hrAttendanceRead)) return;
    // Today's records are keyed by the business date the presence answer carries: left to the page.
    void qc.prefetchQuery(getTeamPresenceQueryOptions({ branch_id: branchId ?? undefined }));
    void qc.prefetchQuery(getListAttendanceFlagsQueryOptions({ branch_id: branchId ?? undefined }));
    warmSetup(qc, orgId);
  },
  "/staff/approvals": (qc) => {
    const can = approvalsCan(authzOf(qc));
    const params = approvalsParams();
    if (can.requests) {
      void qc.prefetchQuery(getListRequestsQueryOptions(params.requests));
      void qc.prefetchQuery(getListEmployeesQueryOptions({}));
    }
    if (can.advances) void qc.prefetchQuery(getListAdvancesQueryOptions(params.advances));
    if (can.roster) {
      void qc.prefetchQuery(getListSwapsQueryOptions(params.swaps));
      void qc.prefetchQuery(getListOpenShiftsQueryOptions(params.claims));
    }
    if (can.covers) void qc.prefetchQuery(getListAttendanceQueryOptions(params.covers));
    if (can.overtime) void qc.prefetchQuery(getListAttendanceQueryOptions(params.overtime));
    if (can.payLines) void qc.prefetchQuery(getListAdjustmentsQueryOptions(params.payLines));
  },
  "/staff/schedule": (qc, { orgId, branchId, search }) => {
    const authz = authzOf(qc);
    if (!authz.can(Cap.hrScheduleRead)) return;
    const f = scheduleSearch.entryValues(branchId, search);
    if (orgId) void qc.prefetchQuery(getListBranchesQueryOptions({ org_id: orgId }));
    warmSetup(qc, orgId);
    // With "All branches" and nothing picked, the page opens on the first branch the list answers: left to the page.
    const branch = branchId ?? (f.branch || null);
    const at = scheduleParams(branch ?? "", scheduleWeek(f));
    if (authz.can(Cap.hrRosterSettings)) {
      void qc.prefetchQuery(getFairnessQueryOptions(at.fairness));
      void qc.prefetchQuery(getFairnessAuditsQueryOptions());
    }
    if (!branch) return;
    void qc.prefetchQuery(getRosterQueryOptions(at.roster));
    void qc.prefetchQuery(getRosterQueryOptions(at.upcoming));
    if (authz.can(Cap.hrScheduleEdit)) {
      void qc.prefetchQuery(getSuggestionsQueryOptions(at.suggestions));
      if (f.coverage) void qc.prefetchQuery(getGetCoverageQueryOptions({ branch_id: branch }));
    }
  },
  "/staff/requests": (qc, { branchId, search }) => {
    void qc.prefetchQuery(getListRequestsQueryOptions(requestsListParams(requestsSearch.entryValues(branchId, search))));
    void qc.prefetchQuery(getListEmployeesQueryOptions({}));
  },
  "/staff/payroll": (qc, { orgId, branchId, search }) => {
    if (!authzOf(qc).canAny(Cap.hrPayrollRead, Cap.hrPayrollRun)) return;
    // An older month opened by `month` is found in the current run's answer: left to the page.
    void qc.prefetchQuery(getCurrentQueryOptions());
    void qc.prefetchQuery(getListEmployeesQueryOptions({ employment_status: "active" }));
    warmSetup(qc, orgId);
    const { tab } = payrollSearch.entryValues(branchId, search);
    if (tab === "lines") void qc.prefetchQuery(getListAdjustmentsQueryOptions({}));
    if (tab === "advances") void qc.prefetchQuery(getListAdvancesQueryOptions({}));
    if (tab === "expenses") void qc.prefetchQuery(getListExpenseAdvancesQueryOptions(expenseAdvancesParams(branchId)));
  },
  "/staff/reports": (qc, { orgId, branchId, search }) => {
    const authz = authzOf(qc);
    void qc.prefetchQuery(getGetAttendanceSettingsQueryOptions({}));
    const f = staffReportsSearch.entryValues(branchId, search);
    // This pay period needs the business's start day: warmed only once it is known.
    const settings = qc.getQueryData<AttendanceSettings>(getGetAttendanceSettingsQueryKey({}));
    if (!(f.from && f.to) && !settings) return;
    const params = staffReportsParams(branchId, f, periodStartDayOf(settings?.period_start_day));
    if (params.to < params.from) return;
    const modules = orgId ? qc.getQueryData<OrgModules>(getGetOrgModulesQueryKey(orgId))?.modules ?? [] : [];
    const { tab } = staffReportsTabs(f.tab, {
      attendance: authz.can(Cap.hrAttendanceRead),
      pay: authz.can(Cap.hrPayrollRead),
      pos: modules.includes("pos"),
    });
    if (tab === "attendance") void qc.prefetchQuery(getAttendanceSummaryQueryOptions(params));
    if (tab === "labour") {
      void qc.prefetchQuery(getLabourVsSalesQueryOptions(params));
      if (orgId) void qc.prefetchQuery(getListBranchesQueryOptions({ org_id: orgId }));
    }
    if (tab === "payroll") void qc.prefetchQuery(getPayrollHistoryQueryOptions(params));
    if (tab === "advances") void qc.prefetchQuery(getAdvancesQueryOptions(params));
  },
  "/staff/rules": (qc, { branchId, search }) => {
    const authz = authzOf(qc);
    if (!authz.canAny(Cap.hrRulesEdit, Cap.hrRulesView)) return;
    void qc.prefetchQuery(getListBranchRulesQueryOptions());
    void qc.prefetchQuery(getGetAttendanceSettingsQueryOptions(rulesSettingsParams(rulesSearch.entryValues(branchId, search))));
  },
  "/reports/staff": (qc, { branchId, from, to }) => {
    if (!from || !to || !authzOf(qc).can(Cap.hrAttendanceRead)) return;
    void qc.prefetchQuery(getDisciplineReportQueryOptions(disciplineParams({ branchId, from, to })));
  },
};
