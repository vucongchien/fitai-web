"use client";

import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  FileCode,
  FileJson,
  Mic,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";
import { useEffect, useId, useState } from "react";

import {
  fetchMotionSpecifications,
  fetchMotionSpecificationStats,
  searchMotionSpecifications,
} from "@/features/admin/api/admin-motion-spec-service";
import type { AdminMotionSpecification } from "@/features/admin/domain/admin-motion-spec-types";
import { MotionSpecDialog } from "@/features/admin/ui/motion-spec-dialog";

export default function AdminMotionSpecsPage() {
  const fieldIdBase = useId();
  const [specs, setSpecs] = useState<AdminMotionSpecification[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Stats state (from Workout Execution Service)
  const [stats, setStats] = useState({
    totalExercises: 0,
    activePoseRules: 0,
    activeVoiceFiles: 0,
    readyAiSpecs: 0,
  });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null);
  const [selectedExerciseName, setSelectedExerciseName] = useState<string>("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  async function loadData() {
    setIsLoading(true);
    try {
      const isSearching = Boolean(searchQuery.trim());
      
      const [statsRes, listRes] = await Promise.all([
        fetchMotionSpecificationStats(),
        isSearching
          ? searchMotionSpecifications({
              keyword: searchQuery.trim(),
              page: currentPage,
              pageSize,
            })
          : fetchMotionSpecifications({
              page: currentPage,
              pageSize,
            }),
      ]);

      setStats(statsRes);
      setSpecs(listRes.items);
      setTotalCount(listRes.totalCount);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [currentPage, pageSize, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const validCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (validCurrentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + specs.length, totalCount);

  const handleOpenEdit = (exId: string, exName: string) => {
    setSelectedExerciseId(exId);
    setSelectedExerciseName(exName);
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 text-xs font-bold uppercase tracking-wider mb-1">
            <Sparkles className="size-4" />
            <span>AI Camera Coach & Engine Control (Workout Module)</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight font-display">
            Quản lý File Rule & File Giọng nói AI
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Cấu hình file luật tư thế (`local_rules_url`), kịch bản giọng nói AI Coach (`dialogue_engine_url`) và các mô hình ONNX qua Admin Workout Service.
          </p>
        </div>

        <button
          type="button"
          onClick={loadData}
          disabled={isLoading}
          className="px-4 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`size-3.5 ${isLoading ? "animate-spin" : ""}`} />
          <span>Làm mới dữ liệu Workout</span>
        </button>
      </div>

      {/* Real Statistics Cards (Workout Module API) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Tổng Bài tập DB</span>
            <FileCode className="size-4 text-indigo-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900 font-display">{stats.totalExercises}</p>
          <p className="text-[11px] text-slate-500">Bài tập từ DB Workout Module</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">File Rule Tư thế (.json)</span>
            <FileJson className="size-4 text-amber-600" />
          </div>
          <p className="text-2xl font-bold text-amber-600 font-display">{stats.activePoseRules}</p>
          <p className="text-[11px] text-slate-500">Đã nạp `local_rules_url`</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">File Giọng nói & Audio</span>
            <Mic className="size-4 text-indigo-600" />
          </div>
          <p className="text-2xl font-bold text-indigo-600 font-display">{stats.activeVoiceFiles}</p>
          <p className="text-[11px] text-slate-500">Đã nạp `dialogue_engine_url`</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Sẵn sàng Tập luyện AI</span>
            <CheckCircle2 className="size-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-emerald-600 font-display">{stats.readyAiSpecs}</p>
          <p className="text-[11px] text-slate-500">Đủ cả Rule & Giọng nói</p>
        </div>
      </div>

      {/* Search & Header Pagination Toolbar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[280px]">
          <Search className="size-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id={`${fieldIdBase}-searchQuery`}
            type="text"
            placeholder="Tìm kiếm bài tập theo tên hoặc ID qua API Search Workout Service..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full text-xs pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
          />
        </div>

        <div className="flex items-center gap-3 text-xs flex-wrap">
          <div className="flex items-center gap-1.5 font-semibold text-slate-600">
            <SlidersHorizontal className="size-4 text-slate-400" />
            <span>Kích thước trang:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 font-bold text-indigo-600 focus:outline-hidden cursor-pointer"
            >
              <option value={10}>10 bài tập / trang</option>
              <option value={20}>20 bài tập / trang</option>
              <option value={30}>30 bài tập / trang</option>
              <option value={50}>50 bài tập / trang</option>
            </select>
          </div>

          {/* Top Pagination Buttons Bar */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setCurrentPage(1)}
              disabled={validCurrentPage <= 1}
              className="p-1.5 rounded-lg bg-white hover:bg-slate-200 text-slate-700 disabled:opacity-30 cursor-pointer shadow-2xs"
              title="Trang đầu"
            >
              <ChevronsLeft className="size-4" />
            </button>

            <button
              type="button"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={validCurrentPage <= 1}
              className="p-1.5 rounded-lg bg-white hover:bg-slate-200 text-slate-700 disabled:opacity-30 cursor-pointer shadow-2xs"
              title="Trang trước"
            >
              <ChevronLeft className="size-4" />
            </button>

            <span className="px-3 py-1 font-bold text-indigo-600 text-xs">
              Trang {validCurrentPage} / {totalPages}
            </span>

            <button
              type="button"
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={validCurrentPage >= totalPages}
              className="p-1.5 rounded-lg bg-white hover:bg-slate-200 text-slate-700 disabled:opacity-30 cursor-pointer shadow-2xs"
              title="Trang sau"
            >
              <ChevronRight className="size-4" />
            </button>

            <button
              type="button"
              onClick={() => setCurrentPage(totalPages)}
              disabled={validCurrentPage >= totalPages}
              className="p-1.5 rounded-lg bg-white hover:bg-slate-200 text-slate-700 disabled:opacity-30 cursor-pointer shadow-2xs"
              title="Trang cuối"
            >
              <ChevronsRight className="size-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="py-20 text-center text-xs text-slate-500 space-y-2">
            <Sparkles className="size-8 animate-bounce text-indigo-600 mx-auto" />
            <p>Đang tải danh sách Motion Specs từ Workout Service...</p>
          </div>
        ) : specs.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-500 space-y-2">
            <p className="font-bold text-slate-700">Không tìm thấy bài tập nào khớp từ khóa "{searchQuery}"</p>
            <p>Thử tìm kiếm với từ khóa khác hoặc xóa bộ lọc.</p>
          </div>
        ) : (
          <div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="p-4">Bài Tập</th>
                    <th className="p-4">File Rule Tư Thế</th>
                    <th className="p-4">File Giọng Nói AI</th>
                    <th className="p-4">Góc Camera</th>
                    <th className="p-4">Trạng Thái AI</th>
                    <th className="p-4 text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {specs.map((item) => {
                    const hasRule = Boolean(item.localRulesUrl && item.localRulesUrl.trim().length > 0);
                    const hasVoice = Boolean(item.dialogueEngineUrl && item.dialogueEngineUrl.trim().length > 0);

                    return (
                      <tr key={item.exerciseId} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-4">
                          <div className="font-bold text-slate-900 text-sm font-display">
                            {item.exerciseName && item.exerciseName !== item.exerciseId
                              ? item.exerciseName
                              : "Chưa có dữ liệu"}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono">ID: {item.exerciseId}</div>
                        </td>

                        <td className="p-4 max-w-xs truncate">
                          {hasRule ? (
                            <div className="flex items-center gap-1.5 text-amber-700 font-mono text-[11px]">
                              <FileJson className="size-3.5 shrink-0" />
                              <span className="truncate" title={item.localRulesUrl}>
                                {item.localRulesUrl}
                              </span>
                            </div>
                          ) : (
                            <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-500 font-semibold text-[11px] border border-slate-200">
                              Chưa có dữ liệu
                            </span>
                          )}
                        </td>

                        <td className="p-4 max-w-xs truncate">
                          {hasVoice ? (
                            <div className="flex items-center gap-1.5 text-indigo-700 font-mono text-[11px]">
                              <Mic className="size-3.5 shrink-0" />
                              <span className="truncate" title={item.dialogueEngineUrl}>
                                {item.dialogueEngineUrl}
                              </span>
                            </div>
                          ) : (
                            <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-500 font-semibold text-[11px] border border-slate-200">
                              Chưa có dữ liệu
                            </span>
                          )}
                        </td>

                        <td className="p-4">
                          {item.recommendedCameraAngle ? (
                            <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-semibold text-[11px] border border-slate-200">
                              {item.recommendedCameraAngle}
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-400 font-medium">Chưa có dữ liệu</span>
                          )}
                        </td>

                        <td className="p-4">
                          {hasRule && hasVoice ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-bold border border-emerald-200">
                              <CheckCircle2 className="size-3" /> Ready
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-500 text-[11px] font-medium border border-slate-200">
                              Thiếu dữ liệu
                            </span>
                          )}
                        </td>

                        <td className="p-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(item.exerciseId, item.exerciseName && item.exerciseName !== item.exerciseId ? item.exerciseName : "")}
                            className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-colors shadow-xs inline-flex items-center gap-1.5 cursor-pointer"
                          >
                            <Sparkles className="size-3.5" />
                            <span>Cập nhật Rules & Voice</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Bottom Pagination Controls Bar */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between flex-wrap gap-3 text-xs">
              <div className="text-slate-500 font-medium">
                Hiển thị <span className="font-bold text-slate-900">{totalCount > 0 ? startIndex + 1 : 0}</span> đến{" "}
                <span className="font-bold text-slate-900">{endIndex}</span> trong tổng số{" "}
                <span className="font-bold text-indigo-600">{totalCount}</span> bài tập (Workout Module)
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setCurrentPage(1)}
                  disabled={validCurrentPage <= 1}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 transition-colors disabled:opacity-40 cursor-pointer"
                  title="Trang đầu"
                >
                  <ChevronsLeft className="size-4" />
                </button>

                <button
                  type="button"
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={validCurrentPage <= 1}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 transition-colors disabled:opacity-40 cursor-pointer"
                  title="Trang trước"
                >
                  <ChevronLeft className="size-4" />
                </button>

                <div className="px-3 py-1 font-bold text-slate-700 bg-white border border-slate-200 rounded-lg">
                  Trang {validCurrentPage} / {totalPages}
                </div>

                <button
                  type="button"
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={validCurrentPage >= totalPages}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 transition-colors disabled:opacity-40 cursor-pointer"
                  title="Trang sau"
                >
                  <ChevronRight className="size-4" />
                </button>

                <button
                  type="button"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={validCurrentPage >= totalPages}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 transition-colors disabled:opacity-40 cursor-pointer"
                  title="Trang cuối"
                >
                  <ChevronsRight className="size-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal Dialog Editor */}
      <MotionSpecDialog
        isOpen={isDialogOpen}
        exerciseId={selectedExerciseId}
        exerciseName={selectedExerciseName}
        onClose={() => {
          setIsDialogOpen(false);
          loadData();
        }}
      />
    </div>
  );
}
