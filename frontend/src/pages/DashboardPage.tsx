import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import { useAuth } from "../contexts/AuthContext";
import { CLIENT_ID } from "../utils/clientId";
import { ApiErrorHandler, numericHelpers } from "../utils/apiHelpers";
import type { AnalyticsSummary, TimeSeriesData } from "../types/api";

// 타입은 별도 파일에서 import

export default function DashboardPage() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // 인증되지 않은 사용자는 로그인 페이지로 리다이렉트
  if (!isAuthenticated) {
    navigate('/login');
    return (
      <div className="max-w-5xl mx-auto p-4 text-center">
        <h1 className="text-2xl font-bold text-gray-600">로그인이 필요합니다</h1>
        <p className="mt-2 text-gray-500">잠시 후 로그인 페이지로 이동합니다...</p>
      </div>
    );
  }

  const [summary, setSummary] = useState<AnalyticsSummary>({});
  const [series, setSeries] = useState<TimeSeriesData["items"]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const load = async () => {
    try {
      setLoading(true);
      setErr("");

      // 요약 데이터 가져오기 (로그인된 사용자 기반)
      const summaryResponse = await fetch(
        `/api/analytics/summary`, // user_id는 백엔드에서 자동으로 처리
        {
          method: "GET",
          credentials: "include", // 세션 쿠키 포함
        }
      );
      const summaryData =
        await ApiErrorHandler.handleResponse<AnalyticsSummary>(summaryResponse);
      setSummary(summaryData);

      // 시계열 데이터 가져오기 (로그인된 사용자 기반)
      const timeseriesResponse = await fetch(
        `/api/analytics/timeseries?bucket=day`, // user_id는 백엔드에서 자동으로 처리
        {
          method: "GET",
          credentials: "include", // 세션 쿠키 포함
        }
      );
      const timeseriesData =
        await ApiErrorHandler.handleResponse<TimeSeriesData>(
          timeseriesResponse
        );
      setSeries(
        (timeseriesData.items || []).map((r) => ({
          bucket: String(r.bucket),
          sessions: numericHelpers.toNumber(r.sessions),
          accuracy: numericHelpers.toNumber(r.accuracy),
        }))
      );
    } catch (error) {
      setErr(ApiErrorHandler.formatError(error));
    } finally {
      setLoading(false);
    }
  };

  const topicData = useMemo(
    () =>
      (summary.perTopic || []).map((r) => ({
        ...r,
        accuracy: numericHelpers.toNumber(r.accuracy),
        sessions: numericHelpers.toNumber(r.sessions),
      })),
    [summary.perTopic]
  );

  useEffect(() => {
    load();
  }, []); // 첫 진입시 자동 로딩

  return (
    <div className="max-w-5xl mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">학습 통계 대시보드</h1>
        <div className="text-sm text-gray-600">
          <span className="font-semibold text-blue-600">{user?.username}</span>님의 학습 통계
        </div>
      </div>

      <div className="mt-2">
        <button
          onClick={load}
          disabled={loading}
          className="h-9 border rounded px-3 font-semibold hover:bg-gray-50 disabled:opacity-60"
        >
          {loading ? "불러오는 중..." : "새로고침"}
        </button>
        <span className="ml-3 text-xs text-gray-500">
          사용자 ID: {user?.id} | 백업 Client: {CLIENT_ID}
        </span>
      </div>

      {err && (
        <div className="mt-3 text-sm text-red-600 whitespace-pre-wrap">
          에러: {err}
        </div>
      )}

      {/* 핵심 지표 */}
      <section className="mt-6">
        <h2 className="text-xl font-bold mb-2">핵심 지표</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card
            title="세션 수"
            value={numericHelpers.toNumber(summary.totals?.sessions)}
          />
          <Card
            title="평균 정확도(%)"
            value={numericHelpers.toFixed(summary.totals?.avg_accuracy, 1)}
          />
          <Card
            title="평균 소요(ms)"
            value={Math.round(
              numericHelpers.toNumber(summary.totals?.avg_duration_ms)
            )}
          />
          <Card
            title="정답/전체(blank)"
            value={`${numericHelpers.toNumber(summary.totals?.blanks_correct)}/${numericHelpers.toNumber(summary.totals?.blanks_total)}`}
          />
        </div>
      </section>

      {/* 정확도 추이(일별) */}
      <section className="mt-6">
        <h2 className="text-xl font-bold mb-2">정확도 추이(일별)</h2>
        <div className="h-64 border rounded">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={series}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="bucket" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="accuracy"
                stroke="#8884d8"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* 약점 진단(주제별 정확도) */}
      <section className="mt-6">
        <h2 className="text-xl font-bold mb-2">약점 진단(주제별 정확도)</h2>
        <div className="h-64 border rounded">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topicData.slice(0, 8)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="topic" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Bar dataKey="accuracy" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}

function Card({ title, value }: { title: string; value: any }) {
  return (
    <div className="border rounded p-3">
      <div className="text-sm text-gray-600">{title}</div>
      <div className="text-xl font-bold">{String(value)}</div>
    </div>
  );
}
