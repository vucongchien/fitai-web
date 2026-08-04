import {
  type CatalogMetadata,
  type ExerciseFilters,
  type ExerciseSummary,
  filterExercises,
} from "@/features/exercise/domain/exercise";
import { MOCK_CATALOG, MOCK_EXERCISES } from "@/shared/mock";

export type ExerciseSearchRepository = {
  search(filters: ExerciseFilters): Promise<ExerciseSummary[]>;
  getCatalog(): Promise<CatalogMetadata>;
  getById(id: string): Promise<ExerciseSummary | null>;
};

export const mockExerciseSearchRepository: ExerciseSearchRepository = {
  async search(filters) {
    return filterExercises(MOCK_EXERCISES, filters, MOCK_CATALOG);
  },
  async getCatalog() {
    return MOCK_CATALOG;
  },
  async getById(id) {
    return MOCK_EXERCISES.find((exercise) => exercise.id === id) ?? null;
  },
};

// TODO(BE): swap to connectExerciseSearchRepository when ExerciseService is reachable.
// Contract: contracts.supporting.exercise.v1.service.ExerciseService
//   - searchExercises(SearchExercisesRequest)
//   - getCatalogMetadata(GetCatalogMetadataRequest)
//   - getExercise(GetExerciseRequest)
// See src/shared/api/gen/contracts/supporting/exercise/v1/service/exercise_service_pb.ts
export const exerciseSearchRepository: ExerciseSearchRepository = mockExerciseSearchRepository;
