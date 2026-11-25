import { AdminExerciseForm } from "@/features/admin/ui/admin-exercise-form";

export const metadata = { title: "New exercise" };

export default function NewAdminExercisePage() {
  return <AdminExerciseForm initialExercise={null} />;
}
