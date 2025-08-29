// admin/admin.jsx
import React, { useEffect, useMemo, useState } from "react";

/**
 * Admin Dashboard for dz_portal
 * لإضافة/تعديل/حذف الخدمات وحفظها في JSON على GitHub
 */

// ---------- Helpers ----------
const uid = () => Math.random().toString(36).slice(2, 10);
const b64 = (s) =>
  typeof btoa !== "undefined"
    ? btoa(unescape(encodeURIComponent(s)))
    : Buffer.from(s, "utf-8").toString("base64");
const fromB64 = (s) =>
  typeof atob !== "undefined"
    ? decodeURIComponent(escape(atob(s)))
    : Buffer.from(s, "base64").toString("utf-8");

const ls = {
  get(k, d) {
    try {
      return JSON.parse(localStorage.getItem(k) || "null") ?? d;
    } catch {
      return d;
    }
  },
  set(k, v) {
    localStorage.setItem(k, JSON.stringify(v));
  },
  del(k) {
    localStorage.removeItem(k);
  },
};

const defaultSettings = {
  owner: "imadtbn",
  repo: "dz_portal",
  branch: "main",
  path: "data/services.json",
};

const emptyService = {
  id: "",
  title: "",
  url: "",
  category: "",
  icon: "fas fa-link",
  color: "#1f2937",
  description: "",
  tags: [],
  active: true,
  phone: "",
};

// ---------- Component ----------
export default function AdminDashboard() {
  const [services, setServices] = useState([]);
  const [draft, setDraft] = useState(emptyService);
  const [editId, setEditId] = useState(null);
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [settings, setSettings] = useState(ls.get("dzp_settings", defaultSettings));
  const [githubToken, setGithubToken] = useState(ls.get("dzp_token", ""));
  const [loading, setLoading] = useState(false);
  const [fileSha, setFileSha] = useState(null);
  const [toast, setToast] = useState("");

  const categories = useMemo(() => {
    const set = new Set(services.map((s) => s.category).filter(Boolean));
    return Array.from(set).sort();
  }, [services]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return services
      .filter((s) => categoryFilter === "all" || s.category === categoryFilter)
      .filter((s) =>
        !q
          ? true
          : [s.title, s.url, s.category, s.description, (s.tags || []).join(" ")]
              .some((v) => (v || "").toLowerCase().includes(q))
      );
  }, [services, query, categoryFilter]);

  // Autosave
  useEffect(() => {
    ls.set("dzp_services", services);
  }, [services]);
  useEffect(() => {
    ls.set("dzp_draft", draft);
  }, [draft]);
  useEffect(() => {
    ls.set("dzp_settings", settings);
  }, [settings]);
  useEffect(() => {
    ls.set("dzp_token", githubToken);
  }, [githubToken]);

  useEffect(() => {
    const saved = ls.get("dzp_services", null);
    const savedDraft = ls.get("dzp_draft", null);
    if (saved) setServices(saved);
    if (savedDraft) setDraft(savedDraft);
  }, []);

  // ---------- CRUD ----------
  function sanitizeServices(arr) {
    return arr.map((s, i) => ({
      id: s.id || uid(),
      title: s.title?.trim() || `خدمة ${i + 1}`,
      url: s.url?.trim() || "",
      category: s.category?.trim() || "عام",
      icon: s.icon?.trim() || "fas fa-link",
      color: s.color || "#1f2937",
      description: s.description || "",
      tags: Array.isArray(s.tags) ? s.tags : [],
      active: s.active !== false,
      phone: s.phone || "",
    }));
  }

  function startAdd() {
    setEditId(null);
    setDraft({ ...emptyService, id: uid() });
  }

  function startEdit(id) {
    const s = services.find((x) => x.id === id);
    if (!s) return;
    setEditId(id);
    setDraft({ ...s, tags: [...(s.tags || [])] });
  }

  function remove(id) {
    if (!confirm("حذف الخدمة؟")) return;
    setServices((prev) => prev.filter((x) => x.id !== id));
    if (editId === id) {
      setEditId(null);
      setDraft(emptyService);
    }
  }

  function up(id) {
    setServices((prev) => {
      const i = prev.findIndex((x) => x.id === id);
      if (i <= 0) return prev;
      const arr = [...prev];
      [arr[i - 1], arr[i]] = [arr[i], arr[i - 1]];
      return arr;
    });
  }
  function down(id) {
    setServices((prev) => {
      const i = prev.findIndex((x) => x.id === id);
      if (i === -1 || i >= prev.length - 1) return prev;
      const arr = [...prev];
      [arr[i], arr[i + 1]] = [arr[i + 1], arr[i]];
      return arr;
    });
  }

  function saveDraftService() {
    const clean = {
      ...draft,
      title: draft.title.trim(),
      url: draft.url.trim(),
      category: draft.category.trim() || "عام",
      icon: draft.icon.trim() || "fas fa-link",
      color: draft.color || "#1f2937",
      tags: (draft.tags || []).map((t) => t.trim()).filter(Boolean),
    };
    if (!clean.title || !clean.url) {
      alert("العنوان والرابط إجباريان");
      return;
    }
    if (!/^https?:\\/\\//i.test(clean.url) && !clean.url.startsWith("tel:")) {
      alert("الرابط يجب أن يبدأ بـ http أو https أو tel:");
      return;
    }
    setServices((prev) => {
      const i = prev.findIndex((x) => x.id === clean.id);
      if (i === -1) return [clean, ...prev];
      const arr = [...prev];
      arr[i] = clean;
      return arr;
    });
    setEditId(clean.id);
    setToast("تم الحفظ");
  }

  // ---------- UI ----------
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="flex justify-between items-center">
          <h1 className="text-xl font-bold">لوحة التحكم — dz_portal</h1>
          <div className="flex gap-2">
            <button onClick={startAdd}>جديد</button>
            <button onClick={saveDraftService}>حفظ</button>
          </div>
        </header>

        <section className="grid grid-cols-3 gap-6">
          {/* النموذج */}
          <div className="col-span-1 space-y-2 bg-white p-3 rounded-xl shadow">
            <Field label="العنوان">
              <input
                value={draft.title}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              />
            </Field>
            <Field label="الرابط">
              <input
                value={draft.url}
                onChange={(e) => setDraft({ ...draft, url: e.target.value })}
              />
            </Field>
            <Field label="التصنيف">
              <input
                value={draft.category}
                onChange={(e) =>
                  setDraft({ ...draft, category: e.target.value })
                }
              />
            </Field>
          </div>

          {/* القائمة */}
          <div className="col-span-2 space-y-2">
            {filtered.map((s) => (
              <div key={s.id} className="p-3 bg-white rounded-xl shadow flex justify-between">
                <div>
                  <div className="font-semibold">{s.title}</div>
                  <div className="text-sm text-gray-500">{s.url}</div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => up(s.id)}>↑</button>
                  <button onClick={() => down(s.id)}>↓</button>
                  <button onClick={() => startEdit(s.id)}>تعديل</button>
                  <button onClick={() => remove(s.id)}>حذف</button>
                </div>
              </div>
            ))}
          </div>
        </section>
        {toast && <div className="p-2 bg-green-100">{toast}</div>}
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <div className="text-sm">{label}</div>
      {children}
    </label>
  );
}