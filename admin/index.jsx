// admin/admin.jsx
const { useState, useEffect } = React;

function AdminDashboard() {
  const [services, setServices] = useState([]);
  const [newService, setNewService] = useState({
    id: "",
    title: "",
    url: "",
    category: "",
    icon: "",
    color: "",
    description: "",
    tags: "",
    active: true,
    phone: ""
  });

  // تحميل البيانات من ملف JSON
  useEffect(() => {
    fetch("../data/services.json")
      .then(res => res.json())
      .then(data => setServices(data))
      .catch(() => setServices([]));
  }, []);

  // إضافة خدمة جديدة
  const addService = () => {
    if (!newService.id || !newService.title) return;
    setServices([...services, { ...newService, tags: newService.tags.split(",") }]);
    setNewService({
      id: "",
      title: "",
      url: "",
      category: "",
      icon: "",
      color: "",
      description: "",
      tags: "",
      active: true,
      phone: ""
    });
  };

  // حذف خدمة
  const deleteService = (id) => {
    setServices(services.filter(s => s.id !== id));
  };

  // حفظ الملف المعدل محليًا (تصدير JSON)
  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(services, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "services.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">لوحة تحكم الخدمات</h1>

      <div className="bg-white p-4 rounded-xl shadow mb-6">
        <h2 className="font-semibold mb-2">إضافة خدمة جديدة</h2>
        <div className="grid grid-cols-2 gap-3">
          <input className="border p-2 rounded" placeholder="id" value={newService.id}
            onChange={e => setNewService({ ...newService, id: e.target.value })} />
          <input className="border p-2 rounded" placeholder="العنوان" value={newService.title}
            onChange={e => setNewService({ ...newService, title: e.target.value })} />
          <input className="border p-2 rounded" placeholder="الرابط أو الهاتف" value={newService.url}
            onChange={e => setNewService({ ...newService, url: e.target.value })} />
          <input className="border p-2 rounded" placeholder="الفئة" value={newService.category}
            onChange={e => setNewService({ ...newService, category: e.target.value })} />
          <input className="border p-2 rounded" placeholder="أيقونة (FontAwesome)" value={newService.icon}
            onChange={e => setNewService({ ...newService, icon: e.target.value })} />
          <input className="border p-2 rounded" placeholder="اللون (#HEX)" value={newService.color}
            onChange={e => setNewService({ ...newService, color: e.target.value })} />
          <input className="border p-2 rounded col-span-2" placeholder="الوصف" value={newService.description}
            onChange={e => setNewService({ ...newService, description: e.target.value })} />
          <input className="border p-2 rounded col-span-2" placeholder="الكلمات المفتاحية مفصولة بفواصل"
            value={newService.tags}
            onChange={e => setNewService({ ...newService, tags: e.target.value })} />
        </div>
        <button className="mt-3 bg-green-600 text-white px-4 py-2 rounded" onClick={addService}>
          إضافة
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl shadow">
        <h2 className="font-semibold mb-2">قائمة الخدمات</h2>
        <ul>
          {services.map(s => (
            <li key={s.id} className="flex justify-between items-center border-b py-2">
              <span><i className={`${s.icon}`} style={{ color: s.color }}></i> {s.title}</span>
              <button className="text-red-600" onClick={() => deleteService(s.id)}>حذف</button>
            </li>
          ))}
        </ul>
      </div>

      <button className="mt-4 bg-blue-600 text-white px-4 py-2 rounded" onClick={exportJSON}>
        تصدير JSON
      </button>
    </div>
  );
}