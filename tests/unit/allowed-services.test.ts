

import { isAllowedRpcPath } from "@/shared/api/bff/allowed-services";

describe(isAllowedRpcPath, () => {
  it("allows user-facing coaching methods", () => {
    expect(
      isAllowedRpcPath("contracts.core.coaching.v1.service.CoachingService/GetActiveRoadmap"),
    ).toBeTruthy();
  });

  it("blocks admin services", () => {
    expect(
      isAllowedRpcPath(
        "contracts.core.workout_execution.v1.service.AdminWorkoutExecutionService/GetHistory",
      ),
    ).toBeFalsy();
  });

  it("blocks malformed nested paths", () => {
    expect(
      isAllowedRpcPath("contracts.core.coaching.v1.service.CoachingService/GetRoadmap/extra"),
    ).toBeFalsy();
  });
});
