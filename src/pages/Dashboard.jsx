import { useEffect, useMemo, useState } from "react";

const API_URL = "http://localhost:8080";

function Dashboard() {
  const [tasks, setTasks] = useState([]);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [dueDate, setDueDate] = useState("");
  const [status, setStatus] = useState("TODO");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const [editingTaskId, setEditingTaskId] = useState(null);

  // AI state
  const [aiLoading, setAiLoading] = useState(false);
  const [aiMessage, setAiMessage] = useState("");
  const [estimatedTime, setEstimatedTime] = useState("");

  const token = localStorage.getItem("token");

  // =========================
  // AUTH CHECK
  // =========================

  useEffect(() => {
    if (!token) {
      window.location.href = "/login";
      return;
    }

    fetchTasks();
  }, []);

  // =========================
  // FETCH TASKS
  // =========================

  const fetchTasks = async () => {
    try {
      setLoading(true);
      setErrorMessage("");

      const response = await fetch(`${API_URL}/api/tasks`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem("token");
        window.location.href = "/login";
        return;
      }

      if (!response.ok) {
        throw new Error("Unable to load tasks.");
      }

      const data = await response.json();
      setTasks(data);
    } catch (error) {
      console.error(error);
      setErrorMessage("Unable to load tasks. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // STATISTICS
  // =========================

  const statistics = useMemo(() => {
    return {
      total: tasks.length,
      todo: tasks.filter((task) => task.status === "TODO").length,
      progress: tasks.filter(
        (task) => task.status === "IN_PROGRESS"
      ).length,
      completed: tasks.filter(
        (task) => task.status === "DONE"
      ).length,
    };
  }, [tasks]);

  // =========================
  // CLEAR FORM
  // =========================

  const clearForm = () => {
    setTitle("");
    setDescription("");
    setPriority("MEDIUM");
    setDueDate("");
    setStatus("TODO");

    setEditingTaskId(null);

    setAiMessage("");
    setEstimatedTime("");
    setMessage("");
    setErrorMessage("");
  };

  // =========================
  // VALIDATION
  // =========================

  const validateForm = () => {
    if (!title.trim()) {
      setErrorMessage("Task title is required.");
      return false;
    }

    if (title.trim().length < 3) {
      setErrorMessage(
        "Task title must contain at least 3 characters."
      );
      return false;
    }

    if (title.trim().length > 100) {
      setErrorMessage(
        "Task title cannot exceed 100 characters."
      );
      return false;
    }

    if (description.length > 1000) {
      setErrorMessage(
        "Description cannot exceed 1000 characters."
      );
      return false;
    }

    if (dueDate) {
      const selectedDate = new Date(dueDate);
      const today = new Date();

      today.setHours(0, 0, 0, 0);

      if (selectedDate < today) {
        setErrorMessage(
          "Due date cannot be in the past."
        );
        return false;
      }
    }

    return true;
  };

  // =========================
  // AI GENERATION
  // =========================

  const handleGenerateAI = async () => {
    if (!title.trim()) {
      setAiMessage("Please enter a task title first.");
      return;
    }

    if (title.trim().length < 3) {
      setAiMessage(
        "Please enter a more descriptive task title."
      );
      return;
    }

    if (!token) {
      setAiMessage("Please login again.");
      return;
    }

    setAiLoading(true);
    setAiMessage("");
    setEstimatedTime("");

    try {
      // =========================
      // AI DESCRIPTION
      // =========================

      const descriptionResponse = await fetch(
        `${API_URL}/api/ai/description?title=${encodeURIComponent(
          title
        )}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (descriptionResponse.status === 401 ||
          descriptionResponse.status === 403) {
        localStorage.removeItem("token");
        window.location.href = "/login";
        return;
      }

      if (!descriptionResponse.ok) {
        throw new Error(
          "Failed to generate description"
        );
      }

      const generatedDescription =
        await descriptionResponse.text();

      setDescription(generatedDescription);

      // =========================
      // AI PRIORITY
      // =========================

      const priorityResponse = await fetch(
        `${API_URL}/api/ai/priority?title=${encodeURIComponent(
          title
        )}&description=${encodeURIComponent(
          generatedDescription
        )}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (priorityResponse.status === 401 ||
          priorityResponse.status === 403) {
        localStorage.removeItem("token");
        window.location.href = "/login";
        return;
      }

      if (!priorityResponse.ok) {
        throw new Error(
          "Failed to generate priority"
        );
      }

      const suggestedPriority =
        await priorityResponse.text();

      const cleanPriority =
        suggestedPriority.trim().toUpperCase();

      if (
        ["LOW", "MEDIUM", "HIGH"].includes(
          cleanPriority
        )
      ) {
        setPriority(cleanPriority);
      }

      // =========================
      // AI ESTIMATE
      // =========================

      const estimateResponse = await fetch(
        `${API_URL}/api/ai/estimate?title=${encodeURIComponent(
          title
        )}&description=${encodeURIComponent(
          generatedDescription
        )}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (estimateResponse.status === 401 ||
          estimateResponse.status === 403) {
        localStorage.removeItem("token");
        window.location.href = "/login";
        return;
      }

      if (!estimateResponse.ok) {
        throw new Error(
          "Failed to estimate completion time"
        );
      }

      const estimated =
        await estimateResponse.text();

      setEstimatedTime(estimated);

      setAiMessage(
        "AI suggestions generated successfully."
      );

    } catch (error) {
      console.error("AI Error:", error);

      setAiMessage(
        "Unable to generate AI suggestions. Please try again."
      );
    } finally {
      setAiLoading(false);
    }
  };

  // =========================
  // CREATE TASK
  // =========================

  const handleCreateTask = async (event) => {
    event.preventDefault();

    setMessage("");
    setErrorMessage("");

    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);

      const response = await fetch(
        `${API_URL}/api/tasks`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title: title.trim(),
            description,
            priority,
            dueDate: dueDate || null,
            status,
            estimatedTime,
          }),
        }
      );

      if (response.status === 401 ||
          response.status === 403) {
        localStorage.removeItem("token");
        window.location.href = "/login";
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        setErrorMessage(
          data.message || "Unable to create task."
        );
        return;
      }

      setTasks((previousTasks) => [
        ...previousTasks,
        data,
      ]);

      clearForm();
      setMessage("Task created successfully.");

    } catch (error) {
      console.error(error);

      setErrorMessage(
        "Unable to connect to the server."
      );
    } finally {
      setSaving(false);
    }
  };

  // =========================
  // EDIT
  // =========================

  const handleEditClick = (task) => {
    setEditingTaskId(task.id);

    setTitle(task.title || "");
    setDescription(task.description || "");
    setPriority(task.priority || "MEDIUM");
    setDueDate(task.dueDate || "");
    setStatus(task.status || "TODO");
    setEstimatedTime(task.estimatedTime || "");

    setMessage("");
    setErrorMessage("");
    setAiMessage("");
  };

  // =========================
  // UPDATE
  // =========================

  const handleUpdateTask = async (event) => {
    event.preventDefault();

    setMessage("");
    setErrorMessage("");

    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);

      const response = await fetch(
        `${API_URL}/api/tasks/${editingTaskId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title: title.trim(),
            description,
            priority,
            dueDate: dueDate || null,
            status,
            estimatedTime,
          }),
        }
      );

      if (response.status === 401 ||
          response.status === 403) {
        localStorage.removeItem("token");
        window.location.href = "/login";
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        setErrorMessage(
          data.message || "Unable to update task."
        );
        return;
      }

      setTasks((previousTasks) =>
        previousTasks.map((task) =>
          task.id === editingTaskId
            ? data
            : task
        )
      );

      clearForm();
      setMessage("Task updated successfully.");

    } catch (error) {
      console.error(error);

      setErrorMessage(
        "Unable to connect to the server."
      );
    } finally {
      setSaving(false);
    }
  };

  // =========================
  // DELETE
  // =========================

  const handleDeleteTask = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this task?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setErrorMessage("");
      setMessage("");

      const response = await fetch(
        `${API_URL}/api/tasks/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 401 ||
          response.status === 403) {
        localStorage.removeItem("token");
        window.location.href = "/login";
        return;
      }

      if (!response.ok) {
        throw new Error("Unable to delete task.");
      }

      setTasks((previousTasks) =>
        previousTasks.filter(
          (task) => task.id !== id
        )
      );

      setMessage("Task deleted successfully.");

    } catch (error) {
      console.error(error);

      setErrorMessage(
        "Unable to delete task."
      );
    }
  };

  // =========================
  // LOGOUT
  // =========================

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  // =========================
  // STATUS STYLE
  // =========================

  const getStatusStyle = (taskStatus) => {
    if (taskStatus === "DONE") {
      return "bg-emerald-100 text-emerald-700";
    }

    if (taskStatus === "IN_PROGRESS") {
      return "bg-blue-100 text-blue-700";
    }

    return "bg-slate-100 text-slate-700";
  };

  // =========================
  // PRIORITY STYLE
  // =========================

  const getPriorityStyle = (taskPriority) => {
    if (taskPriority === "HIGH") {
      return "bg-red-100 text-red-700";
    }

    if (taskPriority === "LOW") {
      return "bg-green-100 text-green-700";
    }

    return "bg-yellow-100 text-yellow-700";
  };

  // =========================
  // UI
  // =========================

  return (
    <div className="min-h-screen bg-slate-50">

      {/* NAVBAR */}

      <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">

        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">

          <div className="flex items-center gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-xl text-white shadow-sm">
              ✓
            </div>

            <div>
              <h1 className="text-lg font-bold text-slate-900 sm:text-xl">
                TaskFlow
              </h1>

              <p className="hidden text-xs text-slate-500 sm:block">
                AI-powered task management
              </p>
            </div>

          </div>

          <button
            onClick={handleLogout}
            className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-100"
          >
            Logout
          </button>

        </div>

      </nav>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">

        {/* HEADER */}

        <div className="mb-8">

          <p className="mb-2 text-sm font-semibold text-indigo-600">
            DASHBOARD
          </p>

          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Manage your tasks
          </h2>

          <p className="mt-2 text-slate-500">
            Plan your work, let AI assist you, and stay productive.
          </p>

        </div>

        {/* STATISTICS */}

        <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Total Tasks
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-900">
              {statistics.total}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              To Do
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-700">
              {statistics.todo}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              In Progress
            </p>

            <p className="mt-2 text-3xl font-bold text-blue-600">
              {statistics.progress}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Completed
            </p>

            <p className="mt-2 text-3xl font-bold text-emerald-600">
              {statistics.completed}
            </p>
          </div>

        </div>

        {/* FORM */}

        <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">

          <div className="mb-6">

            <div className="flex items-center gap-3">

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100">
                📝
              </div>

              <div>
                <h3 className="text-xl font-bold text-slate-900">
                  {editingTaskId
                    ? "Edit Task"
                    : "Create New Task"}
                </h3>

                <p className="text-sm text-slate-500">
                  Add details or let AI help you.
                </p>
              </div>

            </div>

          </div>

          <form
            onSubmit={
              editingTaskId
                ? handleUpdateTask
                : handleCreateTask
            }
            className="space-y-5"
          >

            {/* TITLE */}

            <div>

              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Task Title
              </label>

              <input
                type="text"
                placeholder="e.g. Prepare client presentation"
                value={title}
                maxLength={100}
                onChange={(event) =>
                  setTitle(event.target.value)
                }
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />

              <p className="mt-1 text-right text-xs text-slate-400">
                {title.length}/100
              </p>

            </div>

            {/* AI */}

            <div className="rounded-2xl border border-indigo-200 bg-gradient-to-r from-indigo-50 to-purple-50 p-4 sm:p-5">

              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                <div>

                  <p className="font-bold text-indigo-900">
                    ✨ AI Task Assistant
                  </p>

                  <p className="mt-1 text-sm text-indigo-700">
                    Generate description, priority and effort estimate automatically.
                  </p>

                </div>

                <button
                  type="button"
                  onClick={handleGenerateAI}
                  disabled={aiLoading}
                  className="rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {aiLoading
                    ? "🤖 Generating..."
                    : "✨ Generate with AI"}
                </button>

              </div>

              {aiMessage && (
                <p className="mt-3 text-sm font-medium text-indigo-700">
                  {aiMessage}
                </p>
              )}

              {estimatedTime && (
                <div className="mt-4 rounded-xl border border-purple-200 bg-white p-4">

                  <p className="text-xs font-bold uppercase tracking-wide text-purple-600">
                    Estimated Effort
                  </p>

                  <p className="mt-1 font-semibold text-purple-800">
                    ⏱️ {estimatedTime}
                  </p>

                </div>
              )}

            </div>

            {/* DESCRIPTION */}

            <div>

              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Description
              </label>

              <textarea
                placeholder="Describe what needs to be done..."
                value={description}
                maxLength={1000}
                onChange={(event) =>
                  setDescription(event.target.value)
                }
                rows={4}
                className="w-full resize-none rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />

              <p className="mt-1 text-right text-xs text-slate-400">
                {description.length}/1000
              </p>

            </div>

            {/* PRIORITY / DATE */}

            <div className="grid gap-5 sm:grid-cols-2">

              <div>

                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Priority
                </label>

                <select
                  value={priority}
                  onChange={(event) =>
                    setPriority(event.target.value)
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                >

                  <option value="LOW">
                    LOW
                  </option>

                  <option value="MEDIUM">
                    MEDIUM
                  </option>

                  <option value="HIGH">
                    HIGH
                  </option>

                </select>

              </div>

              <div>

                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Due Date
                </label>

                <input
                  type="date"
                  value={dueDate}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={(event) =>
                    setDueDate(event.target.value)
                  }
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />

              </div>

            </div>

            {/* STATUS */}

            <div>

              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Status
              </label>

              <select
                value={status}
                onChange={(event) =>
                  setStatus(event.target.value)
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              >

                <option value="TODO">
                  TODO
                </option>

                <option value="IN_PROGRESS">
                  IN PROGRESS
                </option>

                <option value="DONE">
                  DONE
                </option>

              </select>

            </div>

            {/* BUTTONS */}

            <div className="flex flex-col gap-3 pt-2 sm:flex-row">

              <button
                type="submit"
                disabled={saving}
                className="flex-1 rounded-xl bg-indigo-600 py-3.5 font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-60"
              >
                {saving
                  ? "Saving..."
                  : editingTaskId
                  ? "Save Changes"
                  : "Create Task"}
              </button>

              {editingTaskId && (
                <button
                  type="button"
                  onClick={clearForm}
                  className="rounded-xl bg-slate-200 px-6 py-3.5 font-semibold text-slate-700 transition hover:bg-slate-300"
                >
                  Cancel
                </button>
              )}

            </div>

          </form>

          {/* MESSAGES */}

          {message && (
            <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-medium text-emerald-700">
              ✓ {message}
            </div>
          )}

          {errorMessage && (
            <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
              ⚠ {errorMessage}
            </div>
          )}

        </div>

        {/* TASK LIST */}

        <div>

          <div className="mb-5 flex items-center justify-between">

            <div>

              <h3 className="text-xl font-bold text-slate-900">
                Your Tasks
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                {tasks.length} task
                {tasks.length !== 1 ? "s" : ""} in your workspace
              </p>

            </div>

            <button
              onClick={fetchTasks}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              ↻ Refresh
            </button>

          </div>

          {/* LOADING */}

          {loading ? (

            <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">

              <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600" />

              <p className="text-slate-500">
                Loading your tasks...
              </p>

            </div>

          ) : tasks.length === 0 ? (

            /* EMPTY */

            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">

              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-3xl">
                📋
              </div>

              <h4 className="text-lg font-bold text-slate-800">
                No tasks yet
              </h4>

              <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
                Create your first task above and use the AI assistant to speed things up.
              </p>

            </div>

          ) : (

            /* TASKS */

            <div className="grid gap-5">

              {tasks.map((task) => (

                <div
                  key={task.id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:p-6"
                >

                  {/* HEADER */}

                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

                    <div className="min-w-0">

                      <h4 className="break-words text-xl font-bold text-slate-900">
                        {task.title}
                      </h4>

                      <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-600">
                        {task.description ||
                          "No description provided."}
                      </p>

                    </div>

                    <span
                      className={`w-fit whitespace-nowrap rounded-full px-3 py-1 text-xs font-bold ${getStatusStyle(
                        task.status
                      )}`}
                    >
                      {task.status === "IN_PROGRESS"
                        ? "IN PROGRESS"
                        : task.status}
                    </span>

                  </div>

                  {/* DETAILS */}

                  <div className="mt-5 flex flex-wrap gap-2">

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${getPriorityStyle(
                        task.priority
                      )}`}
                    >
                      Priority: {task.priority || "MEDIUM"}
                    </span>

                    {task.dueDate && (
                      <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-700">
                        📅 Due: {task.dueDate}
                      </span>
                    )}

                    {task.estimatedTime && (
                      <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-700">
                        ⏱️ {task.estimatedTime}
                      </span>
                    )}

                  </div>

                  {/* CREATED */}

                  {task.createdAt && (
                    <p className="mt-4 text-xs text-slate-400">
                      Created{" "}
                      {new Date(
                        task.createdAt
                      ).toLocaleString()}
                    </p>
                  )}

                  {/* ACTIONS */}

                  <div className="mt-5 flex gap-3 border-t border-slate-100 pt-5">

                    <button
                      onClick={() =>
                        handleEditClick(task)
                      }
                      className="rounded-lg bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-100"
                    >
                      Edit
                    </button>

                    <button
                      onClick={() =>
                        handleDeleteTask(task.id)
                      }
                      className="rounded-lg bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-100"
                    >
                      Delete
                    </button>

                  </div>

                </div>

              ))}

            </div>

          )}

        </div>

      </main>

      {/* FOOTER */}

      <footer className="mt-12 border-t border-slate-200 bg-white">

        <div className="mx-auto max-w-7xl px-4 py-6 text-center text-sm text-slate-400">
          TaskFlow · AI-powered task management
        </div>

      </footer>

    </div>
  );
}

export default Dashboard;