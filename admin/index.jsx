// admin/index.jsx
const { useState, useEffect } = React;

function AdminDashboard() {
  const [services, setServices] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const empty = { id: "", title: "", url: "", category: "", icon: "", color: "", description: "", tags: "", active: true, phone: "" };
  const [newService, setNewService] = useState(empty);

  useEffect(() => {
    // حاول تحميل البيانات من repo/data ثم fallback إلى localStorage
    fetch("../data/services.json")
      .then(res => {
        if (!res.ok) throw new Error("no remote JSON");
        return res.json();
      })
      .then(data => setServices(data))
      .catch(() => {
        const stored = localStorage.getItem("admin.services");
        setServices(stored ? JSON.parse(stored) : []);
      });
  }, []);

  useEffect(() => {
    // حفظ محلي تلقائي
    localStorage.setItem("admin.services", JSON.stringify(services));
  }, [services]);

  const handleChange = (key, value) => setNewService(prev => ({ ...prev, [key]: value }));

  const addService = () => {
    if (!newService.id.trim() || !newService.title.trim()) return alert("id و title مطلوبان");
    if (services.find(s => s.id === newService.id)) return alert("id موجود مسبقًا");
    const s = { ...newService, tags: newService.tags ? newService.tags.split(",").map(t=>t.trim()) : [] };
    setServices(prev => [...prev, s]);
    setNewService(empty);
  };

  const startEdit = (id) => {
    const s = services.find(x => x.id === id);
    if (!s) return;
    setNewService({ ...s, tags: (s.tags||[]).join(", ") });
    setEditingId(id);
  };

  const saveEdit = () => {
    setServices(prev => prev.map(s => s.id === editingId ? { ...newService, tags: newService.tags ? newService.tags.split(",").map(t=>t.trim()) : [] } : s));
    setEditingId(null);
    setNewService(empty);
  };

  const cancelEdit = () => { setEditingId(null); setNewService(empty); };

  const deleteService = (id) => {
    if (!confirm("تأكيد حذف الخدمة؟")) return;
    setServices(prev => prev.filter(s => s.id !== id));
    if (editingId === id) cancelEdit();
  };

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(services, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "services.json"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">لوحة تحكم الخدمات</h1>

      <div className="bg-white p-4 rounded-xl shadow mb-6">
        <h2 className="font-semibold mb-2">{editingId ? "تعديل خدمة" : "إضافة خدمة جديدة"}</h2>
        <div className="grid grid-cols-2 gap-3">
          <input className="border p-2 rounded" placeholder="id" value={newService.id}
            onChange={e => handleChange("id", e.target.value)} />
          <input className="border p-2 rounded" placeholder="العنوان" value={newService.title}
            onChange={e => handleChange("title", e.target.value)} />
          <input className="border p-2 rounded" placeholder="الرابط أو الهاتف" value={newService.url}
            onChange={e => handleChange("url", e.target.value)} />
          <input className="border p-2 rounded" placeholder="الفئة" value={newService.category}
            onChange={e => handleChange("category", e.target.value)} />
          <input className="border p-2 rounded" placeholder="أيقونة (FontAwesome)" value={newService.icon}
            onChange={e => handleChange("icon", e.target.value)} />
          <input className="border p-2 rounded" placeholder="اللون (#HEX)" value={newService.color}
            onChange={e => handleChange("color", e.target.value)} />
          <input className="border p-2 rounded col-span-2" placeholder="الوصف" value={newService.description}
            onChange={e => handleChange("description", e.target.value)} />
          <input className="border p-2 rounded col-span-2" placeholder="الكلمات المفتاحية مفصولة بفواصل"
            value={newService.tags}
            onChange={e => handleChange("tags", e.target.value)} />
        </div>

        <div className="mt-3 space-x-2">
          {editingId ? (
            <>
              <button className="bg-yellow-500 text-white px-4 py-2 rounded" onClick={saveEdit}>حفظ التعديل</button>
              <button className="bg-gray-300 px-4 py-2 rounded" onClick={cancelEdit}>إلغاء</button>
            </>
          ) : (
            <button className="bg-green-600 text-white px-4 py-2 rounded" onClick={addService}>إضافة</button>
          )}
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow">
        <h2 className="font-semibold mb-2">قائمة الخدمات ({services.length})</h2>
        <ul>
          {services.map(s => (
            <li key={s.id} className="flex justify-between items-center border-b py-2">
              <div>
                <i className={s.icon} style={{ color: s.color, marginRight:8 }}></i>
                <strong>{s.title}</strong>
                <div className="text-sm text-gray-600">{s.url || s.phone} — {s.category}</div>
              </div>
              <div className="space-x-2">
                <button className="text-blue-600" onClick={() => startEdit(s.id)}>تعديل</button>
                <button className="text-red-600" onClick={() => deleteService(s.id)}>حذف</button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-4">
        <button className="bg-blue-600 text-white px-4 py-2 rounded" onClick={exportJSON}>تصدير JSON</button>
      </div>
    </div>
  );
}

// تصدير افتراضي لوضعه في صفحة التجربة (non-build)
window.AdminDashboard = AdminDashboard;