import React, { useState, useEffect } from "react";
import axios from "axios";
import TeacherSettings from "./TeacherSettings";

interface TeacherData {
  id: number;
  name: string;
  email: string;
  department: string;
  basic_pay: number;
}

interface TeacherHomeProps {
  teacher: TeacherData;
  activeTab?: string;
  onLogout: () => void;
}

const TeacherHome: React.FC<TeacherHomeProps> = ({ teacher: initialTeacher, activeTab = "home", onLogout }) => {
  const [teacher, setTeacher] = useState<TeacherData>(initialTeacher);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setTeacher(initialTeacher);
  }, [initialTeacher]);

  const fetchTeacherData = async (teacherId: string) => {
    setLoading(true);
    try {
      const response = await axios.get(`http://localhost:4000/api/teachers/${teacherId}`);
      if (response.data.success) {
        setTeacher(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching teacher data:", error);
    }
    setLoading(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("teacherId");
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
        <div className="absolute top-0 left-0 w-96 h-96 bg-green-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animation: 'float 8s ease-in-out infinite' }}></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animation: 'float 8s ease-in-out infinite 2s' }}></div>
      </div>

      {/* Header with Logo */}
      <div className="relative z-20 mx-6 mt-8 mb-4">
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg px-6 py-4 shadow-lg flex items-center justify-center" style={{ animation: 'slideInDown 0.6s ease-out' }}>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-yellow-400 to-blue-400 bg-clip-text text-transparent" style={{ animation: 'slideInRight 0.6s ease-out 0.2s backwards' }}>
            Payroll System
          </h1>
        </div>
      </div>

      <div className="relative z-10 px-6 py-4 min-h-screen">
        {loading && <p className="text-center text-white text-lg font-semibold animate-pulse">Loading...</p>}

        {activeTab === "home" && (
          <div className="bg-white/10 backdrop-blur-sm rounded-lg shadow-lg p-6 border border-white/20 hover:bg-white/20 transition-all duration-300" style={{ animation: 'slideIn 0.6s ease-out' }}>
            <h2 className="text-3xl font-bold mb-6 text-center text-white drop-shadow-lg">Welcome, {teacher?.name || "Teacher"}! 👋</h2>
            <div className="grid grid-cols-1 gap-4">
              <div className="bg-white/20 backdrop-blur-sm p-4 rounded-lg border border-white/30 hover:bg-white/30 transition-all duration-300 hover:scale-105 transform" style={{ animation: 'slideIn 0.6s ease-out 0.1s backwards' }}>
                <p className="text-sm text-white/80">Email</p>
                <p className="text-lg font-semibold text-white">{teacher?.email}</p>
              </div>
              <div className="bg-white/20 backdrop-blur-sm p-4 rounded-lg border border-white/30 hover:bg-white/30 transition-all duration-300 hover:scale-105 transform" style={{ animation: 'slideIn 0.6s ease-out 0.2s backwards' }}>
                <p className="text-sm text-white/80">Department</p>
                <p className="text-lg font-semibold text-white">{teacher?.department}</p>
              </div>
              <div className="bg-white/20 backdrop-blur-sm p-4 rounded-lg border border-white/30 hover:bg-white/30 transition-all duration-300 hover:scale-105 transform" style={{ animation: 'slideIn 0.6s ease-out 0.3s backwards' }}>
                <p className="text-sm text-white/80">Basic Pay</p>
                <p className="text-lg font-semibold text-white">₱{teacher?.basic_pay.toLocaleString()}</p>
              </div>
              <div className="bg-white/20 backdrop-blur-sm p-4 rounded-lg border border-white/30 hover:bg-white/30 transition-all duration-300 hover:scale-105 transform" style={{ animation: 'slideIn 0.6s ease-out 0.4s backwards' }}>
                <p className="text-sm text-white/80">Teacher ID</p>
                <p className="text-lg font-semibold text-white">{teacher?.id}</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === "profile" && <TeacherSettings teacherId={teacher?.id} />}
        {activeTab === "attendance" && <AttendanceSubmission teacherId={teacher?.id} />}
        {activeTab === "teaching_load" && <TeachingLoadView teacherId={teacher?.id} />}
        {activeTab === "salary" && <SalaryView teacherId={teacher?.id} />}
        {activeTab === "messages" && <MessagesComponent teacherId={teacher?.id} teacherName={teacher?.name} />}
        {activeTab === "settings" && <TeacherSettings teacherId={teacher?.id} />}
      </div>
    </div>
  );
};

const AttendanceSubmission: React.FC<{ teacherId?: number }> = ({ teacherId }) => {
  const [formData, setFormData] = useState({
    date: "",
    subject: "",
    class_section: "",
    hours_taught: ""
  });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formData.date || !formData.subject || !formData.class_section || !formData.hours_taught) {
      setError("All fields are required");
      return;
    }

    try {
      const response = await axios.post("http://localhost:4000/api/attendance", {
        teacher_id: teacherId,
        date: formData.date,
        subject: formData.subject,
        class_section: formData.class_section,
        hours_taught: parseFloat(formData.hours_taught)
      });

      if (response.data.success) {
        setSubmitted(true);
        setFormData({ date: "", subject: "", class_section: "", hours_taught: "" });
        setTimeout(() => setSubmitted(false), 3000);
      }
    } catch (err) {
      setError("Failed to submit attendance");
      console.error(err);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-4">Submit Attendance</h2>
      {submitted && <div className="mb-4 p-4 bg-green-100 text-green-700 rounded">Attendance submitted successfully!</div>}
      {error && <div className="mb-4 p-4 bg-red-100 text-red-700 rounded">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700">Date</label>
          <input
            type="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700">Subject</label>
          <input
            type="text"
            name="subject"
            value={formData.subject}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700">Class Section</label>
          <input
            type="text"
            name="class_section"
            value={formData.class_section}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700">Hours Taught</label>
          <input
            type="number"
            name="hours_taught"
            value={formData.hours_taught}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded"
            step="0.5"
          />
        </div>
        <button
          type="submit"
          className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Submit
        </button>
      </form>
    </div>
  );
};

const TeachingLoadView: React.FC<{ teacherId?: number }> = ({ teacherId }) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalHours, setTotalHours] = useState(0);
  const [marking, setMarking] = useState<number | null>(null);

  useEffect(() => {
    if (teacherId) {
      fetchData();
    }
  }, [teacherId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`http://localhost:4000/api/teaching-load/teacher/${teacherId}`);
      if (response.data.success) {
        const rows = response.data.data || [];
        setData(rows);
        const total = rows.reduce((sum: number, item: any) => {
          try {
            const [sh, sm] = (item.start_time || '').split(':').map((v: string) => parseInt(v, 10));
            const [eh, em] = (item.end_time || '').split(':').map((v: string) => parseInt(v, 10));
            if (isNaN(sh) || isNaN(eh)) return sum;
            let start = sh + (sm || 0) / 60;
            let end = eh + (em || 0) / 60;
            if (end < start) end += 24;
            return sum + (end - start);
          } catch (err) {
            return sum;
          }
        }, 0);
        setTotalHours(+total.toFixed(2));
      }
    } catch (error) {
      console.error("Error fetching teaching load:", error);
      setData([]);
    }
    setLoading(false);
  };

  const handleMarkAsDone = async (loadId: number) => {
    setMarking(loadId);
    try {
      const response = await axios.patch(`http://localhost:4000/api/teaching-load/${loadId}/mark-done`, {});
      if (response.data.success) {
        fetchData();
        alert("Marked as done! Waiting for admin approval.");
      }
    } catch (error) {
      console.error("Error marking as done:", error);
      alert("Error marking as done");
    }
    setMarking(null);
  };

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <div className="bg-gradient-to-r from-white/30 to-white/30 rounded-lg shadow-md p-6 text-white">
        <h2 className="text-3xl font-bold mb-2">📚 Teaching Load</h2>
        <p className="text-xl">Total Hours/Week: <span className="font-bold">{totalHours.toFixed(1)} hours</span></p>
      </div>

      {/* Teaching Load Table */}
      <div className="bg-white rounded-lg shadow-md p-6">
        {loading ? (
          <p className="text-center text-gray-600">Loading teaching load...</p>
        ) : data.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600 mb-2">📭 No teaching load records assigned yet</p>
            <p className="text-sm text-gray-500">Contact admin to assign classes</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 border-b-2 border-gray-300">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Subject</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Class/Section</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Hours/Session</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Action</th>
                </tr>
              </thead>
              <tbody>
                {data.map((item, index) => (
                  <tr key={index} className="border-b hover:bg-blue-50 transition">
                    <td className="px-6 py-3">{item.subject || "N/A"}</td>
                    <td className="px-6 py-3">{item.class_section || "N/A"}</td>
                    <td className="px-6 py-3">
                      <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
                        {(() => {
                          try {
                            const [sh, sm] = (item.start_time || '').split(':').map((v: string) => parseInt(v, 10));
                            const [eh, em] = (item.end_time || '').split(':').map((v: string) => parseInt(v, 10));
                            if (isNaN(sh) || isNaN(eh)) return '0.0';
                            let start = sh + (sm || 0) / 60;
                            let end = eh + (em || 0) / 60;
                            if (end < start) end += 24;
                            return (end - start).toFixed(2);
                          } catch (err) {
                            return '0.0';
                          }
                        })()} hrs
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-semibold">
                        ✓ Active
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <button
                        onClick={() => handleMarkAsDone(item.id)}
                        disabled={marking === item.id || item.completion_status === 'pending' || item.completion_status === 'approved'}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 text-sm font-semibold"
                      >
                        {marking === item.id ? "Processing..." : item.completion_status === 'approved' ? "✓ Approved" : item.completion_status === 'pending' ? "⏳ Pending" : "Mark Done"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

interface Salary {
  id: number;
  period_start: string;
  period_end: string;
  verified_hours: number;
  basic_pay: number;
  allowances: number;
  deductions: number;
  total_salary: number;
  status: string;
}

const SalaryView: React.FC<{ teacherId?: number }> = ({ teacherId }) => {
  const [salaries, setSalaries] = useState<Salary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSalary, setSelectedSalary] = useState<Salary | null>(null);

  useEffect(() => {
    if (teacherId) {
      fetchSalaries();
    }
  }, [teacherId]);

  const fetchSalaries = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`http://localhost:4000/api/salary/teacher/${teacherId}`);
      if (response.data.success) {
        setSalaries(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching salaries:", error);
    }
    setLoading(false);
  };

  const handlePrint = () => {
    if (selectedSalary) {
      window.print();
    }
  };

  const handleDownload = () => {
    if (selectedSalary) {
      const content = `
PAYSLIP
Period: ${selectedSalary.period_start} to ${selectedSalary.period_end}
Verified Hours: ${selectedSalary.verified_hours}
Basic Pay: ₱${selectedSalary.basic_pay.toLocaleString()}
Allowances: ₱${selectedSalary.allowances.toLocaleString()}
Deductions: ₱${selectedSalary.deductions.toLocaleString()}
Total Salary: ₱${selectedSalary.total_salary.toLocaleString()}
Status: ${selectedSalary.status}
      `;
      const element = document.createElement("a");
      element.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(content));
      element.setAttribute("download", `Payslip_${selectedSalary.period_start}.txt`);
      element.style.display = "none";
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-4">Salary / Payslip View</h2>

      {loading ? (
        <p className="text-center text-gray-600">Loading...</p>
      ) : salaries.length === 0 ? (
        <p className="text-center text-gray-600">No salary records found</p>
      ) : (
        <div className="space-y-4">
          {!selectedSalary ? (
            <div className="space-y-2">
              {salaries.map((salary) => (
                <div
                  key={salary.id}
                  onClick={() => setSelectedSalary(salary)}
                  className="p-4 border border-gray-200 rounded hover:bg-blue-50 cursor-pointer"
                >
                  <p className="font-semibold">
                    {salary.period_start} to {salary.period_end}
                  </p>
                  <p className="text-sm text-gray-600">Total: ₱{salary.total_salary.toLocaleString()}</p>
                </div>
              ))}
            </div>
          ) : (
            <div>
              <button
                onClick={() => setSelectedSalary(null)}
                className="mb-4 px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500"
              >
                ← Back
              </button>

              <div className="bg-gray-50 p-6 rounded border border-gray-200">
                <h3 className="text-lg font-bold mb-4">Salary Breakdown</h3>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Period</p>
                    <p className="font-semibold">
                      {selectedSalary.period_start} to {selectedSalary.period_end}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Verified Hours</p>
                    <p className="font-semibold">{selectedSalary.verified_hours} hrs</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Basic Pay</p>
                    <p className="font-semibold">₱{selectedSalary.basic_pay.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Allowances</p>
                    <p className="font-semibold text-green-600">+₱{selectedSalary.allowances.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Deductions</p>
                    <p className="font-semibold text-red-600">-₱{selectedSalary.deductions.toLocaleString()}</p>
                  </div>
                  <div className="bg-blue-50 p-3 rounded">
                    <p className="text-sm text-gray-600">Total Salary</p>
                    <p className="text-xl font-bold text-blue-600">₱{selectedSalary.total_salary.toLocaleString()}</p>
                  </div>
                </div>

                <div className="mt-6 flex gap-2">
                  <button
                    onClick={handleDownload}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    📥 Download
                  </button>
                  <button
                    onClick={handlePrint}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    🖨️ Print
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Messages Component for Teachers
const MessagesComponent: React.FC<{ teacherId?: number; teacherName?: string }> = ({ teacherId, teacherName }) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (teacherId) {
      fetchMessages();
      const interval = setInterval(() => fetchMessages(), 3000);
      return () => clearInterval(interval);
    }
  }, [teacherId]);

  const fetchMessages = async () => {
    try {
      const response = await axios.get(
        `http://localhost:4000/api/messages/${teacherId}/teacher`
      );
      if (response.data.success) {
        setMessages(response.data.data || []);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
    setLoading(false);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !teacherId) return;

    try {
      const response = await axios.post(
        "http://localhost:4000/api/messages/send",
        {
          sender_id: teacherId,
          sender_type: "teacher",
          receiver_id: null,
          receiver_type: "admin",
          content: newMessage,
        }
      );

      if (response.data.success) {
        setNewMessage("");
        fetchMessages();
      }
    } catch (error) {
      console.error("Error sending message:", error);
      alert("Error sending message");
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 w-full">
      <h2 className="text-2xl font-bold mb-6">📨 Messages</h2>

      <div className="space-y-4">
        {/* Messages List */}
        <div className="bg-gray-50 rounded-lg p-4 h-96 overflow-y-auto space-y-3 border border-gray-200">
          {loading ? (
            <p className="text-center text-gray-600">Loading messages...</p>
          ) : messages.length === 0 ? (
            <p className="text-center text-gray-600">No messages yet</p>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`p-3 rounded-lg ${
                  msg.sender_type === "teacher"
                    ? "bg-blue-100 text-blue-900 ml-8 border-l-4 border-blue-500"
                    : "bg-green-100 text-green-900 mr-8 border-l-4 border-green-500"
                }`}
              >
                <p className="font-semibold text-sm">
                  {msg.sender_type === "teacher" ? "You" : "Admin"}
                </p>
                <p className="text-sm mt-1">{msg.content}</p>
                <p className="text-xs mt-2 opacity-70">
                  {new Date(msg.created_at).toLocaleString()}
                </p>
              </div>
            ))
          )}
        </div>

        {/* Message Input */}
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
            placeholder="Type your message to admin..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleSendMessage}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-semibold transition"
          >
            Send
          </button>
        </div>
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
        @keyframes slideInDown {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
};

export default TeacherHome;
