import { describe, expect, it } from 'vitest';

import { WorkoutExecutionService } from "@/shared/api/gen/contracts/core/workout_execution/v1/service/workout_execution_service_pb";
import { StartWorkoutSessionRequestSchema } from "@/shared/api/gen/contracts/core/workout_execution/v1/message/workout_execution_messages_pb";

describe("gRPC Generated Code Import", () => {
  it("should correctly import generated Service Descriptor and verify methods", () => {
    expect(WorkoutExecutionService).toBeDefined();
    expect(WorkoutExecutionService.typeName).toBe("contracts.core.workout_execution.v1.service.WorkoutExecutionService");
    expect(WorkoutExecutionService.methods).toBeDefined();
  });

  it("should correctly import generated Messages Schema", () => {
    expect(StartWorkoutSessionRequestSchema).toBeDefined();
    expect(StartWorkoutSessionRequestSchema.typeName).toBe("contracts.core.workout_execution.v1.message.StartWorkoutSessionRequest");
  });
});
