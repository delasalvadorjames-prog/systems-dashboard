import React, { useState, useEffect } from "react";
import axios from "axios";
import Modal from "../components/Modal";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface TeacherSubmission {
  id: number;
  teacher_name: string;
  subject: string;
  class_section: string;
  date: string;
  hours_taught: number;
  status: string;
}

interface Alert {
  id: number;
  type: string;
  message: string;
  related_to: string;
}

interface AdminDashboardProps {
  activeTab?: string;
  onLogout: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ activeTab = "dashboard", onLogout }) => {
  const [submissions, setSubmissions] = useState<TeacherSubmission[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(false);
  const [teachers, setTeachers] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
    fetchTeachers();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [submissionsRes, alertsRes] = await Promise.all([
        axios.get("http://localhost:4000/api/attendance"),
        axios.get("http://localhost:4000/api/notifications")
      ]);

      if (submissionsRes.data.success) {
        setSubmissions(submissionsRes.data.data);
      }
      if (alertsRes.data.success) {
        setAlerts(alertsRes.data.data.slice(0, 5)); // Get latest 5 alerts
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    }
    setLoading(false);
  };

  const fetchTeachers = async () => {
    try {
      const response = await axios.get("http://localhost:4000/api/teachers");
      if (response.data.success) {
        setTeachers(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching teachers:", error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("adminId");
    onLogout();
  };

  return (
    <div 
      className="min-h-screen relative overflow-hidden"
      style={{
        backgroundImage: `url(${require('../images/bg.png')})`,
        backgroundSize: '110%',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }}
    >
      {/* Blurred Background Overlay */}
      <div className="absolute inset-0 backdrop-blur-md bg-black/35"></div>
      
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animation: 'float 8s ease-in-out infinite' }}></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animation: 'float 8s ease-in-out infinite 2s' }}></div>
      </div>

      {/* Content */}
      <div className="relative z-10 px-6 py-8 min-h-screen">
        {loading && <p className="text-center text-white text-lg font-semibold animate-pulse">Loading...</p>}

        {activeTab === "dashboard" && <Dashboard submissions={submissions} alerts={alerts} />}
        {activeTab === "verify" && <VerifyAttendance submissions={submissions} onRefresh={fetchData} />}
        {activeTab === "compute" && <ComputeSalary />}
        {activeTab === "teachers" && <ManageTeachers teachers={teachers} onRefresh={fetchTeachers} />}
        {activeTab === "teaching_load" && <ManageTeachingLoad teachers={teachers} />}
        {activeTab === "reports" && <Reports alerts={alerts} submissions={submissions} />}
        {activeTab === "messages" && <AdminMessages />}
        {activeTab === "settings" && <AdminSettings />}
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

const Dashboard: React.FC<{ submissions: TeacherSubmission[]; alerts: Alert[] }> = ({
  submissions,
  alerts,
}) => {
  const [selectedTeacher, setSelectedTeacher] = useState<string>(""); // "" means all teachers

  // Get unique teacher names for dropdown
  const uniqueTeachers = Array.from(new Set(submissions.map((s) => s.teacher_name))).sort();

  // Filter submissions based on selected teacher
  const filteredSubmissions = selectedTeacher
    ? submissions.filter((s) => s.teacher_name === selectedTeacher)
    : submissions;

  const pendingCount = filteredSubmissions.filter((s) => s.status === "Submitted").length;
  const verifiedCount = filteredSubmissions.filter((s) => s.status === "Verified").length;

  // Process data for monthly bar chart (hours worked per day)
  const monthlyData: { [key: string]: number } = {};
  filteredSubmissions.forEach((s) => {
    if (s.date) {
      const date = new Date(s.date);
      const monthDay = `${date.getDate()}-${date.toLocaleString('default', { month: 'short' })}`;
      const hoursVal = typeof s.hours_taught === 'string' ? parseFloat(s.hours_taught) : s.hours_taught || 0;
      monthlyData[monthDay] = (monthlyData[monthDay] || 0) + hoursVal;
    }
  });

  const chartData = Object.entries(monthlyData)
    .map(([date, hours]) => ({ date, hours }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Process data for pie chart (hours by teacher)
  const hoursData: { [key: string]: number } = {};
  filteredSubmissions.forEach((s) => {
    const hoursVal = typeof s.hours_taught === 'string' ? parseFloat(s.hours_taught) : s.hours_taught || 0;
    hoursData[s.teacher_name] = (hoursData[s.teacher_name] || 0) + hoursVal;
  });

  const hoursChartData = Object.entries(hoursData)
    .map(([teacher, hours]) => ({ name: teacher, value: hours }))
    .slice(0, 5); // Top 5 teachers

  const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'];
  const totalHours = filteredSubmissions.reduce((sum, s) => sum + (typeof s.hours_taught === 'string' ? parseFloat(s.hours_taught) : s.hours_taught || 0), 0);

  return (
    <div className="space-y-6">
      {/* Teacher Selector Header */}
      <div className="bg-white/10 backdrop-blur-sm rounded-lg shadow-lg p-6 border border-white/20 hover:bg-white/20 transition-all duration-300" style={{ animation: 'slideIn 0.6s ease-out' }}>
        <div className="flex items-center gap-4">
          <label htmlFor="teacher-select" className="text-lg font-semibold text-white">
            🎯 Filter by Teacher:
          </label>
          <select
            id="teacher-select"
            value={selectedTeacher}
            onChange={(e) => setSelectedTeacher(e.target.value)}
            className="px-4 py-2 border border-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white/20 text-white backdrop-blur-sm cursor-pointer hover:bg-white/30 transition-all"
          >
            <option value="">📊 All Teachers</option>
            {uniqueTeachers.map((teacher) => (
              <option key={teacher} value={teacher}>
                👤 {teacher}
              </option>
            ))}
          </select>
          {selectedTeacher && (
            <button
              onClick={() => setSelectedTeacher("")}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition"
            >
              ✕ Reset
            </button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500/30 to-blue-600/20 backdrop-blur-sm p-6 rounded-lg shadow-lg border border-blue-400/50 hover:from-blue-500/40 hover:to-blue-600/30 transition-all duration-300 transform hover:scale-105" style={{ animation: 'slideIn 0.6s ease-out 0.1s backwards' }}>
          <p className="text-sm text-white/80">📊 Total Submissions</p>
          <p className="text-3xl font-bold text-white">{submissions.length}</p>
        </div>
        <div className="bg-gradient-to-br from-yellow-500/30 to-yellow-600/20 backdrop-blur-sm p-6 rounded-lg shadow-lg border border-yellow-400/50 hover:from-yellow-500/40 hover:to-yellow-600/30 transition-all duration-300 transform hover:scale-105" style={{ animation: 'slideIn 0.6s ease-out 0.2s backwards' }}>
          <p className="text-sm text-white/80">⏳ Pending Verification</p>
          <p className="text-3xl font-bold text-white">{pendingCount}</p>
        </div>
        <div className="bg-gradient-to-br from-green-500/30 to-green-600/20 backdrop-blur-sm p-6 rounded-lg shadow-lg border border-green-400/50 hover:from-green-500/40 hover:to-green-600/30 transition-all duration-300 transform hover:scale-105" style={{ animation: 'slideIn 0.6s ease-out 0.3s backwards' }}>
          <p className="text-sm text-white/80">✓ Verified Submissions</p>
          <p className="text-3xl font-bold text-white">{verifiedCount}</p>
        </div>
        <div className="bg-gradient-to-br from-purple-500/30 to-purple-600/20 backdrop-blur-sm p-6 rounded-lg shadow-lg border border-purple-400/50 hover:from-purple-500/40 hover:to-purple-600/30 transition-all duration-300 transform hover:scale-105" style={{ animation: 'slideIn 0.6s ease-out 0.4s backwards' }}>
          <p className="text-sm text-white/80">⏱️ Total Hours</p>
          <p className="text-3xl font-bold text-white">{totalHours.toFixed(1)}h</p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-2 gap-6">
        {/* Bar Chart - Monthly Completed Work (Hours) */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg shadow-lg p-6 border border-white/20 hover:bg-white/20 transition-all duration-300" style={{ animation: 'slideIn 0.6s ease-out 0.5s backwards' }}>
          <h2 className="text-xl font-bold mb-4 text-white">📈 Hours Worked by Date & Month</h2>
          {chartData.length === 0 ? (
            <p className="text-white/60">No data available</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.2)" />
                <XAxis dataKey="date" angle={-45} textAnchor="end" height={80} stroke="rgba(255,255,255,0.5)" />
                <YAxis label={{ value: 'Hours', angle: -90, position: 'insideLeft', fill: 'rgba(255,255,255,0.5)' }} stroke="rgba(255,255,255,0.5)" />
                <Tooltip formatter={(value) => `${value}h`} contentStyle={{ backgroundColor: 'rgba(0,0,0,0.7)', border: '1px solid rgba(255,255,255,0.2)' }} />
                <Bar dataKey="hours" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Pie Chart - Hours Worked by Teacher */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg shadow-lg p-6 border border-white/20 hover:bg-white/20 transition-all duration-300" style={{ animation: 'slideIn 0.6s ease-out 0.6s backwards' }}>
          <h2 className="text-xl font-bold mb-4 text-white">🎓 Teaching Hours by Teacher (Top 5)</h2>
          {hoursChartData.length === 0 ? (
            <p className="text-white/60">No data available</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={hoursChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry: any) => {
                    const entryName = typeof entry?.name === "string" ? entry.name : "";
                    const labelText = entryName.split(" ")[0] || "Unknown";
                    const entryValue = entry?.value ?? 0;
                    return `${labelText}: ${entryValue}h`;
                  }}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {hoursChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Alerts Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold mb-4">Recent Alerts</h2>
        {alerts.length === 0 ? (
          <p className="text-gray-600">No alerts</p>
        ) : (
          <div className="space-y-2">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-4 border-l-4 rounded ${alert.type === "Alert" ? "border-red-500 bg-red-50" : alert.type === "Warning" ? "border-yellow-500 bg-yellow-50" : "border-blue-500 bg-blue-50"}`}
              >
                <p className="font-semibold">{alert.type}</p>
                <p className="text-sm text-gray-700">{alert.message}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Links */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold mb-4">Quick Links</h2>
        <div className="grid grid-cols-2 gap-4">
          <button className="p-4 bg-blue-100 hover:bg-blue-200 rounded text-left">
            📋 View All Submissions
          </button>
          <button className="p-4 bg-green-100 hover:bg-green-200 rounded text-left">
            ✓ Verify Attendance
          </button>
          <button className="p-4 bg-purple-100 hover:bg-purple-200 rounded text-left">
            💰 Compute Salaries
          </button>
          <button className="p-4 bg-orange-100 hover:bg-orange-200 rounded text-left">
            📊 Generate Reports
          </button>
        </div>
      </div>
    </div>
  );
};

const VerifyAttendance: React.FC<{ submissions: TeacherSubmission[]; onRefresh: () => void }> = ({
  submissions,
  onRefresh,
}) => {
  const [localSubmissions, setLocalSubmissions] = useState(submissions);
  const [approving, setApproving] = useState<number | null>(null);

  const handleApprove = async (id: number) => {
    setApproving(id);
    try {
      const response = await axios.patch(
        `http://localhost:4000/api/attendance/${id}/approve`
      );
      if (response.data.success) {
        setLocalSubmissions(
          localSubmissions.map((s) =>
            s.id === id ? { ...s, status: "Verified" } : s
          )
        );
        onRefresh();
      }
    } catch (error) {
      console.error("Error approving attendance:", error);
      alert("Error approving attendance");
    }
    setApproving(null);
  };

  const handleAdjust = async (id: number) => {
    const hoursInput = prompt("Enter corrected hours:");
    if (hoursInput) {
      try {
        const submission = localSubmissions.find((s) => s.id === id);
        if (submission) {
          const response = await axios.put(
            `http://localhost:4000/api/attendance/${id}`,
            {
              ...submission,
              hours_taught: parseFloat(hoursInput),
              status: "Verified",
            }
          );
          if (response.data.success) {
            setLocalSubmissions(
              localSubmissions.map((s) =>
                s.id === id
                  ? { ...s, hours_taught: parseFloat(hoursInput), status: "Verified" }
                  : s
              )
            );
            onRefresh();
          }
        }
      } catch (error) {
        console.error("Error adjusting attendance:", error);
        alert("Error adjusting attendance");
      }
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-4">Verify Attendance Submissions</h2>

      {localSubmissions.length === 0 ? (
        <p className="text-center text-gray-600">No submissions to verify</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 text-left">Teacher Name</th>
                <th className="px-4 py-2 text-left">Class</th>
                <th className="px-4 py-2 text-left">Hours</th>
                <th className="px-4 py-2 text-left">Date</th>
                <th className="px-4 py-2 text-left">Status</th>
                <th className="px-4 py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {localSubmissions.map((submission) => (
                <tr key={submission.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-2">{submission.teacher_name}</td>
                  <td className="px-4 py-2">{submission.class_section}</td>
                  <td className="px-4 py-2">{submission.hours_taught} hrs</td>
                  <td className="px-4 py-2">{submission.date}</td>
                  <td className="px-4 py-2">
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold ${submission.status === "Verified" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}
                    >
                      {submission.status}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApprove(submission.id)}
                        disabled={submission.status === "Verified" || approving === submission.id}
                        className="px-3 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600 disabled:bg-gray-400 whitespace-nowrap"
                      >
                        {approving === submission.id ? "..." : "Approve"}
                      </button>
                      <button
                        onClick={() => handleAdjust(submission.id)}
                        className="px-3 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 whitespace-nowrap"
                      >
                        Adjust
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const ComputeSalary: React.FC = () => {
  const [teachers, setTeachers] = useState<any[]>([]);
  const [selectedTeacher, setSelectedTeacher] = useState("");
  const [salaryData, setSalaryData] = useState({
    period_start: "",
    period_end: "",
    hourly_rate: 500,
    allowances: 0,
    deductions: 0,
  });
  const [loading, setLoading] = useState(false);
  const [computing, setComputing] = useState(false);

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    setLoading(true);
    try {
      const response = await axios.get("http://localhost:4000/api/teachers");
      if (response.data.success) {
        setTeachers(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching teachers:", error);
    }
    setLoading(false);
  };

  const handleComputeSalary = async () => {
    if (!selectedTeacher || !salaryData.period_start || !salaryData.period_end) {
      alert("Please fill all fields");
      return;
    }

    setComputing(true);
    try {
      const response = await axios.post("http://localhost:4000/api/salary/compute", {
        teacher_id: parseInt(selectedTeacher),
        ...salaryData,
      });

      if (response.data.success) {
        alert("Salary computed successfully!");
        setSalaryData({
          period_start: "",
          period_end: "",
          hourly_rate: 500,
          allowances: 0,
          deductions: 0,
        });
        setSelectedTeacher("");
      }
    } catch (error) {
      console.error("Error computing salary:", error);
      alert("Error computing salary");
    }
    setComputing(false);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-4">Compute Salary</h2>

      {loading ? (
        <p className="text-center text-gray-600">Loading teachers...</p>
      ) : (
        <div className="space-y-4 max-w-md">
          <div>
            <label className="block text-sm font-medium text-gray-700">Teacher</label>
            <select
              value={selectedTeacher}
              onChange={(e) => setSelectedTeacher(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Teacher</option>
              {teachers.map((teacher) => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Period Start</label>
            <input
              type="date"
              value={salaryData.period_start}
              onChange={(e) =>
                setSalaryData({ ...salaryData, period_start: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Period End</label>
            <input
              type="date"
              value={salaryData.period_end}
              onChange={(e) =>
                setSalaryData({ ...salaryData, period_end: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Hourly Rate</label>
            <input
              type="number"
              value={salaryData.hourly_rate}
              onChange={(e) =>
                setSalaryData({ ...salaryData, hourly_rate: parseFloat(e.target.value) })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Allowances</label>
            <input
              type="number"
              value={salaryData.allowances}
              onChange={(e) =>
                setSalaryData({ ...salaryData, allowances: parseFloat(e.target.value) })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Deductions</label>
            <input
              type="number"
              value={salaryData.deductions}
              onChange={(e) =>
                setSalaryData({ ...salaryData, deductions: parseFloat(e.target.value) })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            onClick={handleComputeSalary}
            disabled={computing}
            className="w-full bg-purple-600 text-white py-2 rounded-md hover:bg-purple-700 disabled:bg-gray-400"
          >
            {computing ? "Computing..." : "Compute Salary"}
          </button>
        </div>
      )}
    </div>
  );
};

const Reports: React.FC<{ alerts: Alert[]; submissions: TeacherSubmission[] }> = ({ alerts, submissions }) => {
  const [salaries, setSalaries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmSendId, setConfirmSendId] = useState<number | null>(null);
  const [sendingPayslipId, setSendingPayslipId] = useState<number | null>(null);

  useEffect(() => {
    fetchSalaries();
  }, []);

  const fetchSalaries = async () => {
    setLoading(true);
    try {
      const response = await axios.get("http://localhost:4000/api/salary");
      if (response.data.success) {
        setSalaries(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching salaries:", error);
    }
    setLoading(false);
  };

  const handleExport = () => {
    const csv = salaries
      .map(
        (s) =>
          `${s.teacher_name},${s.period_start},${s.period_end},${s.total_salary}`
      )
      .join("\n");
    const element = document.createElement("a");
    element.setAttribute("href", "data:text/csv;charset=utf-8," + encodeURIComponent("Teacher,Start,End,Total\n" + csv));
    element.setAttribute("download", "salary_report.csv");
    element.style.display = "none";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="space-y-6">
      {/* Notifications */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold mb-4">Notifications</h2>
        {alerts.length === 0 ? (
          <p className="text-gray-600">No notifications</p>
        ) : (
          <div className="space-y-2">
            {alerts.map((alert) => (
              <div key={alert.id} className="p-3 bg-gray-50 rounded border-l-4 border-blue-500">
                <p className="font-semibold text-sm">{alert.message}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Salary Reports */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Salary Reports</h2>
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            📥 Export CSV
          </button>
        </div>

        {loading ? (
          <p className="text-center text-gray-600">Loading...</p>
        ) : salaries.length === 0 ? (
          <p className="text-center text-gray-600">No salary records found</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 text-left">Teacher</th>
                  <th className="px-4 py-2 text-left">Period</th>
                  <th className="px-4 py-2 text-left">Salary</th>
                  <th className="px-4 py-2 text-left">Status</th>
                  <th className="px-4 py-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {salaries.map((salary) => (
                  <tr key={salary.id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-2">{salary.teacher_name}</td>
                    <td className="px-4 py-2">{salary.period_start} to {salary.period_end}</td>
                    <td className="px-4 py-2">₱{salary.total_salary.toLocaleString()}</td>
                    <td className="px-4 py-2">
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${salary.status === "Finalized" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}
                      >
                        {salary.status}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex gap-2">
                        <button
                          onClick={async () => {
                            try {
                              const resp = await axios.get(`http://localhost:4000/api/salary/${salary.id}`);
                              if (resp.data.success && resp.data.data) {
                                const s = resp.data.data;
                                const content = `PAYSLIP\n\nTeacher: ${salary.teacher_name}\nPeriod: ${s.period_start} to ${s.period_end}\nVerified Hours: ${s.verified_hours}\nBasic Pay: ₱${Number(s.basic_pay).toLocaleString()}\nAllowances: ₱${Number(s.allowances).toLocaleString()}\nDeductions: ₱${Number(s.deductions).toLocaleString()}\nTotal Salary: ₱${Number(s.total_salary).toLocaleString()}\nStatus: ${s.status}`;
                                const w = window.open('', '_blank');
                                if (w) {
                                  w.document.write(`<pre style="font-family:inherit; font-size:14px;">${content}</pre>`);
                                  w.document.close();
                                  w.focus();
                                  w.print();
                                } else {
                                  alert('Unable to open print window');
                                }
                              }
                            } catch (err) {
                              console.error('Error fetching salary for print:', err);
                              alert('Error preparing payslip for print');
                            }
                          }}
                          className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                        >
                          🖨️ Print
                        </button>

                        {salary.status !== 'Finalized' ? (
                          <button
                            onClick={() => setConfirmSendId(salary.id)}
                            className="px-3 py-1 bg-indigo-600 text-white rounded text-sm hover:bg-indigo-700"
                          >
                            ✉️ Send Payslip
                          </button>
                        ) : (
                          <span className="text-sm text-gray-600">—</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {confirmSendId && (
        <Modal title="Send Payslip" onClose={() => setConfirmSendId(null)}>
          <p>Send payslip to teacher?</p>
          <div className="mt-4 flex justify-end gap-2">
            <button onClick={() => setConfirmSendId(null)} className="px-4 py-2 bg-gray-200 rounded">Cancel</button>
            <button 
              onClick={async () => {
                if (!confirmSendId) return;
                setSendingPayslipId(confirmSendId);
                try {
                  const resp = await axios.post(`http://localhost:4000/api/salary/${confirmSendId}/send`);
                  if (resp.data.success) {
                    alert('Payslip sent successfully');
                    fetchSalaries();
                  } else {
                    alert('Failed to send payslip');
                  }
                } catch (err) {
                  console.error('Error sending payslip:', err);
                  alert('Error sending payslip');
                }
                setSendingPayslipId(null);
                setConfirmSendId(null);
              }}
              disabled={sendingPayslipId !== null}
              className="px-4 py-2 bg-indigo-600 text-white rounded disabled:bg-gray-400"
            >
              {sendingPayslipId === confirmSendId ? 'Sending...' : 'Send'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};

const ManageTeachers: React.FC<{ teachers: any[]; onRefresh: () => void }> = ({ teachers, onRefresh }) => {
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [confirmDeleteName, setConfirmDeleteName] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedTeacherForProfile, setSelectedTeacherForProfile] = useState<any | null>(null);
  const [formData, setFormData] = useState({
    email: "",
    name: "",
    department: "",
    basic_pay: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState<number | null>(null);

  const handleAddTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.name || !formData.department || !formData.basic_pay || !formData.password) {
      alert("Please fill all fields");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post("http://localhost:4000/api/teachers", {
        email: formData.email,
        name: formData.name,
        department: formData.department,
        basic_pay: parseFloat(formData.basic_pay),
        password: formData.password,
      });

      if (response.data.success) {
        alert("Teacher added successfully!");
        setFormData({ email: "", name: "", department: "", basic_pay: "", password: "" });
        setShowAddForm(false);
        onRefresh();
      } else {
        alert(response.data.message || "Error adding teacher");
      }
    } catch (error: any) {
      console.error("Error adding teacher:", error);
      alert(error.response?.data?.message || "Error adding teacher");
    }
    setLoading(false);
  };

  const handleDeleteTeacher = async (id: number) => {
    // performs delete after confirmation modal
    setDeleteLoading(id);
    try {
      const response = await axios.delete(`http://localhost:4000/api/teachers/${id}`);
      if (response.data.success) {
        alert("Teacher deleted successfully!");
        onRefresh();
      } else {
        alert("Error deleting teacher");
      }
    } catch (error) {
      console.error("Error deleting teacher:", error);
      alert("Error deleting teacher");
    }
    setDeleteLoading(null);
    setConfirmDeleteId(null);
    setConfirmDeleteName(null);
  };

  return (
    <div className="space-y-6">
      {/* Add Teacher Button */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl text-white font-bold">Manage Teachers</h2>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          {showAddForm ? "✕ Cancel" : "➕ Add New Teacher"}
        </button>
      </div>

      {/* Add Teacher Form */}
      {showAddForm && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold mb-4">Add New Teacher</h3>
          <form onSubmit={handleAddTeacher} className="space-y-4 max-w-md">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="teacher@school.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="John Doe"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Department *</label>
              <input
                type="text"
                required
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                placeholder="Mathematics"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Basic Pay *</label>
              <input
                type="number"
                required
                value={formData.basic_pay}
                onChange={(e) => setFormData({ ...formData, basic_pay: e.target.value })}
                placeholder="30000"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Initial Password *</label>
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="e.g., Teacher@123"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">Teacher can change this after first login</p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400"
            >
              {loading ? "Adding..." : "Add Teacher"}
            </button>
          </form>
        </div>
      )}

      {/* Teachers List */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-bold mb-4">All Teachers ({teachers.length})</h3>

        {teachers.length === 0 ? (
          <p className="text-center text-gray-600">No teachers found. Add one to get started!</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 text-left">Name</th>
                  <th className="px-4 py-2 text-left">Email</th>
                  <th className="px-4 py-2 text-left">Department</th>
                  <th className="px-4 py-2 text-left">Basic Pay</th>
                  <th className="px-4 py-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {teachers.map((teacher) => (
                  <tr key={teacher.id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-2 font-semibold">{teacher.name}</td>
                    <td className="px-4 py-2">{teacher.email}</td>
                    <td className="px-4 py-2">{teacher.department}</td>
                    <td className="px-4 py-2">₱{parseFloat(teacher.basic_pay).toLocaleString()}</td>
                    <td className="px-4 py-2">
                      <div className="flex gap-2">
                        <button
                          onClick={() => setSelectedTeacherForProfile(teacher)}
                          className="px-3 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
                        >
                          View Profile
                        </button>
                        <button
                          onClick={() => { setConfirmDeleteId(teacher.id); setConfirmDeleteName(teacher.name); }}
                          disabled={deleteLoading === teacher.id}
                          className="px-3 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600 disabled:bg-gray-400"
                        >
                          {deleteLoading === teacher.id ? "..." : "Delete"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {confirmDeleteId && (
          <Modal title="Confirm Delete" onClose={() => { setConfirmDeleteId(null); setConfirmDeleteName(null); }}>
            <p>Are you sure you want to delete <strong>{confirmDeleteName}</strong>?</p>
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => { setConfirmDeleteId(null); setConfirmDeleteName(null); }} className="px-4 py-2 bg-gray-200 rounded">Cancel</button>
              <button onClick={() => confirmDeleteId && handleDeleteTeacher(confirmDeleteId)} className="px-4 py-2 bg-red-600 text-white rounded">Delete</button>
            </div>
          </Modal>
        )}

        {selectedTeacherForProfile && (
          <Modal 
            title={`${selectedTeacherForProfile.name}'s Profile`} 
            onClose={() => setSelectedTeacherForProfile(null)}
          >
            <div className="space-y-4">
              {/* Profile Image */}
              {selectedTeacherForProfile.profile_image ? (
                <div className="flex justify-center">
                  <img
                    src={selectedTeacherForProfile.profile_image}
                    alt="Profile"
                    className="w-32 h-32 rounded-full object-cover border-4 border-gray-300"
                  />
                </div>
              ) : (
                <div className="flex justify-center">
                  <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center text-5xl">
                    👤
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <p className="text-gray-900">{selectedTeacherForProfile.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <p className="text-gray-900">{selectedTeacherForProfile.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Department</label>
                  <p className="text-gray-900">{selectedTeacherForProfile.department}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Basic Pay</label>
                  <p className="text-gray-900">₱{parseFloat(selectedTeacherForProfile.basic_pay).toLocaleString()}</p>
                </div>
              </div>
              
              {selectedTeacherForProfile.phone && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone</label>
                  <p className="text-gray-900">{selectedTeacherForProfile.phone}</p>
                </div>
              )}

              {selectedTeacherForProfile.address && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Address</label>
                  <p className="text-gray-900">{selectedTeacherForProfile.address}</p>
                </div>
              )}

              {selectedTeacherForProfile.bio && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Bio</label>
                  <p className="text-gray-900 whitespace-pre-wrap">{selectedTeacherForProfile.bio}</p>
                </div>
              )}

              <div className="mt-4 flex justify-end">
                <button 
                  onClick={() => setSelectedTeacherForProfile(null)} 
                  className="px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500"
                >
                  Close
                </button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </div>
  );
};

// Manage Teaching Load Component
const ManageTeachingLoad: React.FC<{ teachers: any[] }> = ({ teachers }) => {
  const [teachingLoads, setTeachingLoads] = useState<any[]>([]);
  const [selectedTeacher, setSelectedTeacher] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    subject: "",
    class_section: "",
    day: "",
    start_time: "",
    end_time: "",
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: string; text: string } | null>(null);

  useEffect(() => {
    fetchTeachingLoads();
  }, []);

  const fetchTeachingLoads = async () => {
    setLoading(true);
    try {
      const response = await axios.get("http://localhost:4000/api/teaching-load");
      if (response.data.success) {
        setTeachingLoads(response.data.data || []);
      }
    } catch (error) {
      console.error("Error fetching teaching loads:", error);
    }
    setLoading(false);
  };

  const handleAssignTeachingLoad = async () => {
    if (!selectedTeacher || !formData.subject || !formData.class_section || !formData.day || !formData.start_time || !formData.end_time) {
      setMessage({ type: "error", text: "Please fill all fields" });
      return;
    }

    setSubmitting(true);
    try {
      const response = await axios.post("http://localhost:4000/api/teaching-load", {
        teacher_id: selectedTeacher,
        subject: formData.subject,
        class_section: formData.class_section,
        day: formData.day,
        start_time: formData.start_time,
        end_time: formData.end_time,
      });

      if (response.data.success) {
        setMessage({ type: "success", text: "Teaching load assigned successfully!" });
        setFormData({ subject: "", class_section: "", day: "", start_time: "", end_time: "" });
        setSelectedTeacher(null);
        fetchTeachingLoads();
      }
    } catch (error: any) {
      setMessage({ type: "error", text: error.response?.data?.message || "Error assigning teaching load" });
    }
    setSubmitting(false);
  };

  const selectedTeacherName = teachers.find((t) => t.id === selectedTeacher)?.name || "Select Teacher";
  const teacherLoads = selectedTeacher
    ? teachingLoads.filter((load) => load.teacher_id === selectedTeacher)
    : [];

  const computeDurationHours = (load: any) => {
    try {
      const [sh, sm] = (load.start_time || '').split(':').map((v: string) => parseInt(v, 10));
      const [eh, em] = (load.end_time || '').split(':').map((v: string) => parseInt(v, 10));
      if (isNaN(sh) || isNaN(eh)) return 0;
      let start = sh + (sm || 0) / 60;
      let end = eh + (em || 0) / 60;
      if (end < start) end += 24; // handle overnight classes
      return +(end - start).toFixed(2);
    } catch (err) {
      return 0;
    }
  };

  const handleDeleteTeachingLoad = async (loadId: number) => {
    if (!window.confirm("Are you sure you want to remove this teaching load entry?")) {
      return;
    }

    try {
      const response = await axios.delete(`http://localhost:4000/api/teaching-load/${loadId}`);
      if (response.data.success) {
        setMessage({ type: "success", text: "Teaching load removed successfully!" });
        fetchTeachingLoads();
      }
    } catch (error: any) {
      setMessage({ type: "error", text: error.response?.data?.message || "Error removing teaching load" });
    }
  };

  return (
    <div className="space-y-6">
      {/* Assignment Form */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-6">📚 Assign Teaching Load</h2>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Teacher</label>
            <select
              value={selectedTeacher || ""}
              onChange={(e) => setSelectedTeacher(e.target.value ? parseInt(e.target.value) : null)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Choose a teacher</option>
              {teachers.map((teacher) => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
            <input
              type="text"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              placeholder="e.g., Mathematics"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Class/Section</label>
            <input
              type="text"
              value={formData.class_section}
              onChange={(e) => setFormData({ ...formData, class_section: e.target.value })}
              placeholder="e.g., 10-A"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Day</label>
            <select
              value={formData.day}
              onChange={(e) => setFormData({ ...formData, day: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select day</option>
              <option value="Monday">Monday</option>
              <option value="Tuesday">Tuesday</option>
              <option value="Wednesday">Wednesday</option>
              <option value="Thursday">Thursday</option>
              <option value="Friday">Friday</option>
              <option value="Saturday">Saturday</option>
              <option value="Sunday">Sunday</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Start Time</label>
            <input
              type="time"
              value={formData.start_time}
              onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">End Time</label>
            <input
              type="time"
              value={formData.end_time}
              onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <button
          onClick={handleAssignTeachingLoad}
          disabled={submitting}
          className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 font-semibold transition"
        >
          {submitting ? "Assigning..." : "Assign Teaching Load"}
        </button>

        {message && (
          <div
            className={`mt-4 p-4 rounded-lg ${
              message.type === "success"
                ? "bg-green-100 text-green-800 border border-green-300"
                : "bg-red-100 text-red-800 border border-red-300"
            }`}
          >
            {message.text}
          </div>
        )}
      </div>

      {/* Teaching Loads Table */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-bold mb-4">
          {selectedTeacher ? `${selectedTeacherName}'s Teaching Load` : "All Teaching Loads"}
        </h3>

        {loading ? (
          <p className="text-center text-gray-600">Loading...</p>
        ) : (teachingLoads.length === 0 || teacherLoads.length === 0) && selectedTeacher ? (
          <p className="text-center text-gray-600">No teaching loads assigned to this teacher</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 border-b-2 border-gray-300">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Teacher</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Subject</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Class/Section</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Hours/Session</th>
                  <th className="px-6 py-3 text-center text-sm font-semibold">Status</th>
                  <th className="px-6 py-3 text-center text-sm font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {(selectedTeacher ? teacherLoads : teachingLoads).map((load, index) => {
                  const hours = computeDurationHours(load);
                  const isCompleted = hours >= 1.67; // Consider completed if >= 1.67 hours
                  return (
                    <tr key={index} className={`border-b hover:bg-blue-50 transition ${isCompleted ? 'opacity-60 bg-gray-50' : ''}`}>
                      <td className="px-6 py-3">
                        {teachers.find((t) => t.id === load.teacher_id)?.name || "Unknown"}
                      </td>
                      <td className="px-6 py-3">{load.subject}</td>
                      <td className="px-6 py-3">{load.class_section}</td>
                      <td className="px-6 py-3">
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          isCompleted 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {hours} hrs {isCompleted && '✓'}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          isCompleted
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {isCompleted ? 'Completed ✓' : 'Active'}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-center">
                        {isCompleted ? (
                          <button
                            onClick={() => handleDeleteTeachingLoad(load.id)}
                            className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-xs font-semibold transition"
                          >
                            Remove
                          </button>
                        ) : (
                          <button
                            onClick={() => handleDeleteTeachingLoad(load.id)}
                            className="px-3 py-1 bg-gray-300 text-gray-600 rounded hover:bg-gray-400 text-xs font-semibold transition"
                          >
                            Delete
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

// Admin Settings Component
const AdminSettings: React.FC = () => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: string; text: string } | null>(null);

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordMessage({ type: "error", text: "All fields are required" });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: "error", text: "New passwords do not match" });
      return;
    }
    if (newPassword.length < 6) {
      setPasswordMessage({ type: "error", text: "Password must be at least 6 characters" });
      return;
    }

    setPasswordLoading(true);
    try {
      const adminId = localStorage.getItem("adminId");
      const response = await axios.put(
        `http://localhost:4000/api/admin/${adminId}/change-password`,
        { currentPassword, newPassword }
      );
      if (response.data.success) {
        setPasswordMessage({ type: "success", text: "Password changed successfully!" });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setPasswordMessage({ type: "error", text: response.data.message || "Error changing password" });
      }
    } catch (error: any) {
      setPasswordMessage({ type: "error", text: error.response?.data?.message || "Error changing password" });
    }
    setPasswordLoading(false);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-8 max-w-2xl mx-auto">
      <h2 className="text-3xl font-bold mb-8">⚙️ Admin Settings</h2>

      {/* Change Password Section */}
      <div className="space-y-6">
        <div className="border-b-2 border-gray-200 pb-6">
          <h3 className="text-2xl font-bold text-gray-800 mb-4">🔐 Change Password</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter current password"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter new password"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Confirm new password"
              />
            </div>
            <button
              onClick={handleChangePassword}
              disabled={passwordLoading}
              className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 font-semibold transition"
            >
              {passwordLoading ? "Updating..." : "Change Password"}
            </button>
            {passwordMessage && (
              <div
                className={`p-4 rounded-lg ${
                  passwordMessage.type === "success"
                    ? "bg-green-100 text-green-800 border border-green-300"
                    : "bg-red-100 text-red-800 border border-red-300"
                }`}
              >
                {passwordMessage.text}
              </div>
            )}
          </div>
        </div>

        {/* Teacher Online Class Status */}
        <div>
          <h3 className="text-2xl font-bold text-gray-800 mb-4">📹 Teacher Online Classes</h3>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-gray-600 mb-4">Monitor which teachers are currently hosting online classes:</p>
            <TeacherOnlineClassStatus />
          </div>
        </div>
      </div>
    </div>
  );
};

// Teacher Online Class Status Component
const TeacherOnlineClassStatus: React.FC = () => {
  const [onlineTeachers, setOnlineTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOnlineTeachers();
    const interval = setInterval(fetchOnlineTeachers, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchOnlineTeachers = async () => {
    try {
      // Fetch real teachers from backend
      const response = await axios.get("http://localhost:4000/api/teachers");
      if (response.data.success) {
        // Add mock online status - in real app, this would come from a separate online status tracking system
        const teachersWithStatus = response.data.data.map((teacher: any, index: number) => ({
          id: teacher.id,
          name: teacher.name,
          subject: teacher.department || "General",
          class: "Class " + String.fromCharCode(65 + (index % 3)), // A, B, C
          status: index % 2 === 0 ? "online" : "offline",
          startTime: index % 2 === 0 ? "10:00 AM" : null,
        }));
        setOnlineTeachers(teachersWithStatus);
      }
    } catch (error) {
      console.error("Error fetching online teachers:", error);
      setOnlineTeachers([]);
    }
    setLoading(false);
  };

  if (loading) return <p className="text-gray-600">Loading...</p>;

  return (
    <div className="space-y-3">
      {onlineTeachers.length === 0 ? (
        <p className="text-gray-600">No teachers online at the moment</p>
      ) : (
        <div className="grid gap-3">
          {onlineTeachers.map((teacher) => (
            <div
              key={teacher.id}
              className={`p-4 rounded-lg border-l-4 ${
                teacher.status === "online"
                  ? "bg-green-50 border-l-green-500"
                  : "bg-gray-50 border-l-gray-300"
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold text-gray-800">{teacher.name}</p>
                  <p className="text-sm text-gray-600">{teacher.subject} - Class {teacher.class}</p>
                  {teacher.status === "online" && (
                    <p className="text-xs text-green-600 mt-1">🟢 Online since {teacher.startTime}</p>
                  )}
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    teacher.status === "online"
                      ? "bg-green-200 text-green-800"
                      : "bg-gray-200 text-gray-800"
                  }`}
                >
                  {teacher.status === "online" ? "🟢 Online" : "⚪ Offline"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Admin Messages Component
const AdminMessages: React.FC = () => {
  const [messages, setMessages] = useState<any[]>([]);
  const [selectedTeacher, setSelectedTeacher] = useState<number | null>(null);
  const [replyMessage, setReplyMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [teachers, setTeachers] = useState<any[]>([]);

  useEffect(() => {
    fetchTeachers();
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, []);

  const fetchTeachers = async () => {
    try {
      const response = await axios.get("http://localhost:4000/api/teachers");
      if (response.data.success) {
        setTeachers(response.data.data || []);
      }
    } catch (error) {
      console.error("Error fetching teachers:", error);
    }
  };

  const fetchMessages = async () => {
    try {
      const adminId = localStorage.getItem("adminId") || "1";
      const response = await axios.get(
        `http://localhost:4000/api/messages/${adminId}/admin`
      );
      if (response.data.success) {
        const allMessages = response.data.data || [];
        console.log("All messages received:", allMessages);
        // Store ALL messages (both from teacher and replies from admin)
        setMessages(allMessages);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
    setLoading(false);
  };

  const handleReply = async () => {
    if (!replyMessage.trim() || !selectedTeacher) return;

    try {
      const adminId = localStorage.getItem("adminId") || "1"; // Use stored admin ID or default to 1
      const response = await axios.post(
        "http://localhost:4000/api/messages/send",
        {
          sender_id: parseInt(adminId),
          sender_type: "admin",
          receiver_id: selectedTeacher,
          receiver_type: "teacher",
          content: replyMessage,
        }
      );

      if (response.data.success) {
        setReplyMessage("");
        fetchMessages();
      } else {
        alert(response.data.message || "Error sending reply");
      }
    } catch (error: any) {
      console.error("Error sending reply:", error);
      alert(error.response?.data?.message || "Error sending reply. Please try again.");
    }
  };

  const teacherMessages = selectedTeacher
    ? messages.filter((m) => m.sender_id === selectedTeacher)
    : [];

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-6">📨 Teacher Messages</h2>

      <div className="grid grid-cols-3 gap-4">
        {/* Teachers List */}
        <div className="border border-gray-300 rounded-lg p-4 max-h-96 overflow-y-auto">
          <h3 className="font-semibold mb-4 text-gray-800">Teachers with Messages</h3>
          {messages.length === 0 ? (
            <p className="text-gray-600 text-sm">No messages from teachers</p>
          ) : (
            <div className="space-y-2">
              {Array.from(
                new Map(
                  messages.map((msg) => [
                    msg.sender_id,
                    {
                      teacherId: msg.sender_id,
                      teacherName: teachers.find((t) => t.id === msg.sender_id)?.name || "Unknown Teacher",
                      messageCount: messages.filter((m) => m.sender_id === msg.sender_id).length,
                    },
                  ])
                ).values()
              ).map(({ teacherId, teacherName, messageCount }) => (
                <button
                  key={teacherId}
                  onClick={() => setSelectedTeacher(teacherId)}
                  className={`w-full p-3 rounded-lg text-left transition relative ${
                    selectedTeacher === teacherId
                      ? "bg-blue-500 text-white"
                      : "bg-gray-100 hover:bg-gray-200"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <p className="font-semibold">{teacherName}</p>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-bold ${
                        selectedTeacher === teacherId
                          ? "bg-white text-blue-500"
                          : "bg-red-500 text-white"
                      }`}
                    >
                      {messageCount}
                    </span>
                  </div>
                  <p
                    className={`text-xs mt-1 ${selectedTeacher === teacherId ? "text-blue-100" : "text-red-600"}`}
                  >
                    💬 New messages
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Messages */}
        <div className="col-span-2 border border-gray-300 rounded-lg p-4 flex flex-col">
          {selectedTeacher ? (
            <>
              <h3 className="font-semibold mb-4 text-gray-800">
                Messages from {teachers.find((t) => t.id === selectedTeacher)?.name}
              </h3>

              {/* Messages List */}
              <div className="flex-1 bg-gray-50 rounded-lg p-4 mb-4 h-64 overflow-y-auto space-y-3 border border-gray-200">
                {loading ? (
                  <p className="text-center text-gray-600">Loading...</p>
                ) : teacherMessages.length === 0 ? (
                  <p className="text-center text-gray-600">No messages from this teacher</p>
                ) : (
                  teacherMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`p-3 rounded-lg ${
                        msg.sender_type === "teacher"
                          ? "bg-blue-100 text-blue-900 border-l-4 border-blue-500"
                          : "bg-green-100 text-green-900 border-l-4 border-green-500"
                      }`}
                    >
                      <p className="text-sm">{msg.content}</p>
                      <p className="text-xs mt-2 opacity-70">
                        {new Date(msg.created_at).toLocaleString()}
                      </p>
                    </div>
                  ))
                )}
              </div>

              {/* Reply Input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleReply()}
                  placeholder="Type your reply..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleReply}
                  className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-semibold transition"
                >
                  Reply
                </button>
              </div>
            </>
          ) : (
            <p className="text-center text-gray-600">Select a teacher to view messages</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
