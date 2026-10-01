"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Search,
  Plus,
  Trash2,
  CheckCircle2,
  FileText,
  UserPlus,
  Users,
  ShoppingCart,
  User,
  CreditCard,
  X,
  Phone,
  Mail,
  MapPin,
  IdCard,
  Sparkles,
  Loader2,
  Package,
  Layers,
  HelpCircle,
  Tag,
  Lock,
  Banknote,
  Clock,
  Check
} from "lucide-react";

export default function POSPage() {
  // Data States
  const [patients, setPatients] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [deals, setDeals] = useState<any[]>([]);

  // Selection States
  const [selectedPatientId, setSelectedPatientId] = useState<string>("");
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>("");
  const [sessionRemarks, setSessionRemarks] = useState<string>("");

  // Search States
  const [patientSearch, setPatientSearch] = useState("");
  const [serviceSearch, setServiceSearch] = useState("");

  // Cart State
  const [cart, setCart] = useState<any[]>([]);

  // Checkout States
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<string>("Cash");

  // Token & Success State
  const [nextToken, setNextToken] = useState("");
  const [nextInvoice, setNextInvoice] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [successData, setSuccessData] = useState<any>(null);

  // Quick Add Patient Modal State
  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);
  const [newPatient, setNewPatient] = useState({
    name: "",
    phone: "",
    cnic: "",
    email: "",
    address: ""
  });
  const [patientSaving, setPatientSaving] = useState(false);
  const [patientError, setPatientError] = useState("");

  // Custom Package / Deal Modal State
  const [isPackageModalOpen, setIsPackageModalOpen] = useState(false);
  const [packageForm, setPackageForm] = useState<{
    name: string;
    price: string;
    items: Array<{ product_id: string; sessions: number }>;
  }>({
    name: "",
    price: "",
    items: [{ product_id: "", sessions: 1 }],
  });
  const [packageSaving, setPackageSaving] = useState(false);
  const [packageError, setPackageError] = useState("");

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [patRes, empRes, prodRes, dealRes, tokenRes] = await Promise.all([
          fetch("/api/patients"),
          fetch("/api/employees"),
          fetch("/api/products"),
          fetch("/api/deals"),
          fetch("/api/sales/next-invoice")
        ]);

        setPatients((await patRes.json()) || []);
        setEmployees((await empRes.json()) || []);
        setProducts((await prodRes.json()) || []);
        setDeals((await dealRes.json()) || []);

        const tokenData = await tokenRes.json();
        setNextToken(tokenData?.token || "");
        setNextInvoice(tokenData?.invoiceNumber || "");
      } catch (error) {
        console.error("Error fetching POS data:", error);
      }
    };
    fetchData();
  }, []);

  const selectedPatient = useMemo(() => {
    return patients.find((p) => p.id === selectedPatientId);
  }, [patients, selectedPatientId]);

  const filteredPatients = useMemo(() => {
    if (!patientSearch) return patients.slice(0, 10);
    const lower = patientSearch.toLowerCase();
    return patients
      .filter(
        (p) =>
          p.name.toLowerCase().includes(lower) ||
          (p.phone && p.phone.includes(lower)) ||
          p.medical_id.toLowerCase().includes(lower)
      )
      .slice(0, 10);
  }, [patients, patientSearch]);

  const filteredServices = useMemo(() => {
    if (!serviceSearch) return [];
    const lower = serviceSearch.toLowerCase();
    const matchedProducts = products
      .filter((p) => p.name.toLowerCase().includes(lower) || (p.sku && p.sku.toLowerCase().includes(lower)))
      .map((p) => ({ ...p, type: "product" }));
    const matchedDeals = deals
      .filter((d) => d.name.toLowerCase().includes(lower))
      .map((d) => ({ ...d, type: "deal" }));
    return [...matchedProducts, ...matchedDeals];
  }, [products, deals, serviceSearch]);

  // Cart Calculations
  const subtotal = cart.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);
  const grandTotal = Math.max(0, subtotal - discountAmount);
  const remainingDue = Math.max(0, grandTotal - paidAmount);

  // Handle Payment Method Switch
  const handlePaymentMethodChange = (method: string) => {
    setPaymentMethod(method);
    if (method === "Credit") {
      setPaidAmount(0);
    } else if (method === "Card") {
      setPaidAmount(grandTotal);
    } else if (method === "Cash") {
      if (paidAmount === 0 && grandTotal > 0) {
        setPaidAmount(grandTotal);
      }
    }
  };

  // Auto-sync paid amount when grand total changes
  useEffect(() => {
    if (paymentMethod === "Credit") {
      setPaidAmount(0);
    } else if (paymentMethod === "Card") {
      setPaidAmount(grandTotal);
    } else if (paymentMethod === "Cash") {
      if (paidAmount === 0 && grandTotal > 0 && cart.length > 0) {
        setPaidAmount(grandTotal);
      }
    }
  }, [grandTotal, paymentMethod, cart.length]);

  // Handlers
  const handleAddPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPatient.name.trim()) {
      setPatientError("Patient name is required");
      return;
    }

    setPatientSaving(true);
    setPatientError("");

    try {
      let finalAddress = newPatient.address?.trim() || "";
      if (newPatient.cnic?.trim()) {
        finalAddress = finalAddress
          ? `CNIC: ${newPatient.cnic.trim()} | ${finalAddress}`
          : `CNIC: ${newPatient.cnic.trim()}`;
      }

      const res = await fetch("/api/patients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newPatient.name.trim(),
          phone: newPatient.phone.trim() || null,
          email: newPatient.email.trim() || null,
          address: finalAddress || null,
        }),
      });

      if (res.ok) {
        const createdPatient = await res.json();
        setPatients((prev) => [createdPatient, ...prev]);
        setSelectedPatientId(createdPatient.id);
        setIsPatientModalOpen(false);
        setNewPatient({ name: "", phone: "", cnic: "", email: "", address: "" });
        setPatientSearch("");
      } else {
        const err = await res.json();
        setPatientError(err.error || "Failed to create patient");
      }
    } catch (e: any) {
      console.error(e);
      setPatientError(e.message || "Failed to create patient");
    } finally {
      setPatientSaving(false);
    }
  };

  const handleCreatePackage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!packageForm.name.trim()) {
      setPackageError("Package name is required");
      return;
    }

    const validItems = packageForm.items.filter((it) => it.product_id);
    if (validItems.length === 0) {
      setPackageError("Please select at least one service for the package");
      return;
    }

    setPackageSaving(true);
    setPackageError("");

    try {
      const priceNum = packageForm.price !== "" ? parseFloat(packageForm.price) : 0;

      const res = await fetch("/api/deals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: packageForm.name.trim(),
          price: isNaN(priceNum) ? 0 : priceNum,
          items: validItems.map((it) => ({
            product_id: it.product_id,
            sessions: Number(it.sessions) || 1,
          })),
        }),
      });

      if (res.ok) {
        const createdDeal = await res.json();
        // Update deals state
        setDeals((prev) => [createdDeal, ...prev]);
        // Automatically add to POS cart
        addToCart({ ...createdDeal, type: "deal" });
        // Close modal and reset form
        setIsPackageModalOpen(false);
        setPackageForm({ name: "", price: "", items: [{ product_id: "", sessions: 1 }] });
      } else {
        const err = await res.json();
        setPackageError(err.error || "Failed to create custom package");
      }
    } catch (e: any) {
      console.error(e);
      setPackageError(e.message || "Failed to create custom package");
    } finally {
      setPackageSaving(false);
    }
  };

  const addToCart = (item: any) => {
    if (item.type === "deal" || (item.items && Array.isArray(item.items))) {
      // Expand deal into component products
      const dealItems = item.items.map((di: any) => {
        const product = di.product || products.find((p) => p.id === di.product_id);
        const totalDealPrice = Number(item.total_price !== undefined ? item.total_price : item.price || 0);
        const itemCount = item.items.length || 1;
        return {
          id: `${item.id}-${di.product_id}-${Date.now()}-${Math.random()}`,
          product_id: di.product_id,
          name: `${item.name} - ${product?.name || "Service"}`,
          unit_price: totalDealPrice / itemCount,
          quantity: 1,
          sessions_allowed: di.sessions_allowed || di.sessions || 1,
          sessions_consumed: 1,
          item_group_name: item.name,
        };
      });
      setCart((prev) => [...prev, ...dealItems]);
    } else {
      setCart((prev) => [
        ...prev,
        {
          id: `${item.id}-${Date.now()}-${Math.random()}`,
          product_id: item.id,
          name: item.name,
          unit_price: item.selling_price || 0,
          quantity: 1,
          sessions_allowed: 1,
          sessions_consumed: 1,
          item_group_name: null,
        },
      ]);
    }
    setServiceSearch("");
  };

  const removeFromCart = (index: number) => {
    const newCart = [...cart];
    newCart.splice(index, 1);
    setCart(newCart);
  };

  const updateCartItem = (index: number, field: string, value: number) => {
    const newCart = [...cart];
    newCart[index] = { ...newCart[index], [field]: value };
    setCart(newCart);
  };

  const completeSale = async () => {
    if (!selectedPatientId) return alert("Please select a patient.");
    if (cart.length === 0) return alert("Cart is empty.");

    try {
      const finalPaidAmount = paymentMethod === "Credit" ? 0 : paidAmount;

      const payload = {
        customer_id: selectedPatientId,
        doctor_id: selectedDoctorId || null,
        subtotal: subtotal,
        discount_amount: discountAmount,
        grand_total: grandTotal,
        paid_amount: finalPaidAmount,
        payment_method: paymentMethod,
        session_remarks: sessionRemarks,
        items: cart.map((c) => ({
          product_id: c.product_id,
          quantity: c.quantity,
          unit_price: c.unit_price,
          sessions_allowed: c.sessions_allowed,
          sessions_consumed: c.sessions_consumed,
          total_price: c.unit_price * c.quantity,
          item_group_name: c.item_group_name,
        })),
      };

      const res = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        setSuccessData({ ...data, invoice: nextInvoice, token: data.token || nextToken });
        setIsSuccess(true);
      } else {
        const err = await res.json();
        alert(`Error: ${err.error}`);
      }
    } catch (e) {
      console.error(e);
      alert("An error occurred during checkout.");
    }
  };

  const resetPOS = async () => {
    setCart([]);
    setSelectedPatientId("");
    setSelectedDoctorId("");
    setSessionRemarks("");
    setDiscountAmount(0);
    setPaidAmount(0);
    setPaymentMethod("Cash");
    setPatientSearch("");
    setServiceSearch("");
    setIsSuccess(false);
    setSuccessData(null);

    // Refresh token and patients to get updated balances
    const [patRes, tokenRes] = await Promise.all([
      fetch("/api/patients"),
      fetch("/api/sales/next-invoice"),
    ]);
    setPatients((await patRes.json()) || []);
    const tokenData = await tokenRes.json();
    setNextToken(tokenData?.token || "");
    setNextInvoice(tokenData?.invoiceNumber || "");
  };

  // Estimate total sum of selected services in custom package builder
  const packageEstimatedSum = useMemo(() => {
    return packageForm.items.reduce((sum, item) => {
      const p = products.find((prod) => prod.id === item.product_id);
      return sum + (p?.selling_price || 0) * (item.sessions || 1);
    }, 0);
  }, [packageForm.items, products]);

  if (isSuccess && successData) {
    return (
      <div className="max-w-2xl mx-auto mt-12 bg-white rounded-2xl shadow-md border border-gray-100 p-8 text-center animate-in fade-in zoom-in-95">
        <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Sale Completed!</h2>
        <p className="text-gray-500 mb-8">Invoice and queue token generated successfully.</p>

        <div className="bg-gray-50 rounded-2xl p-6 mb-8 max-w-sm mx-auto space-y-4 border border-gray-100">
          <div className="flex justify-between items-center border-b border-gray-200/80 pb-4">
            <span className="text-gray-500 font-medium text-sm">Queue Token</span>
            <span className="text-3xl font-black text-indigo-600">{successData.token}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-500 font-medium text-sm">Invoice Number</span>
            <span className="font-bold text-gray-900">{successData.invoice}</span>
          </div>
        </div>

        <div className="flex space-x-4 justify-center">
          <button className="px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-semibold flex items-center shadow-sm">
            <FileText className="w-5 h-5 mr-2 text-indigo-600" /> Print Invoice
          </button>
          <button
            onClick={resetPOS}
            className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-semibold shadow-md shadow-indigo-600/30"
          >
            New Sale
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col lg:flex-row gap-6 w-full min-w-0 p-2 sm:p-0">
      {/* LEFT PANEL */}
      <div className="flex-1 flex flex-col gap-6 overflow-hidden w-full min-w-0">
        {/* PATIENT SELECTION CARD */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-gray-100 shrink-0">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900 flex items-center">
              <User className="w-5 h-5 mr-2 text-indigo-600" /> Patient Selection
            </h2>
            <span className="text-xs text-gray-400 font-medium">MRID auto-generated</span>
          </div>

          {!selectedPatient ? (
            <div className="relative">
              {/* Search bar with Instant "+" Add Patient Button */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-slate-900 bg-white font-medium shadow-2xs placeholder:text-gray-400"
                    placeholder="Search by name, phone, or MRID..."
                    value={patientSearch}
                    onChange={(e) => setPatientSearch(e.target.value)}
                  />
                  {patientSearch && (
                    <button
                      type="button"
                      onClick={() => setPatientSearch("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Prominent Instant + Button */}
                <button
                  type="button"
                  onClick={() => {
                    setNewPatient({ name: "", phone: "", cnic: "", email: "", address: "" });
                    setPatientError("");
                    setIsPatientModalOpen(true);
                  }}
                  className="h-12 px-3.5 sm:px-4.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-semibold rounded-xl shadow-md shadow-indigo-600/20 flex items-center gap-1.5 shrink-0 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                  title="Add New Patient (Instant MRID)"
                >
                  <Plus className="w-5 h-5" />
                  <span className="hidden sm:inline text-sm">New Patient</span>
                </button>
              </div>

              {/* Patient Search Results Dropdown */}
              {patientSearch && (
                <div className="absolute z-20 w-full mt-2 bg-white border border-gray-100 shadow-xl rounded-2xl overflow-hidden max-h-64 overflow-y-auto divide-y divide-gray-50">
                  {filteredPatients.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => {
                        setSelectedPatientId(p.id);
                        setPatientSearch("");
                      }}
                      className="p-3.5 hover:bg-indigo-50/70 cursor-pointer flex justify-between items-center transition-colors"
                    >
                      <div>
                        <div className="font-semibold text-gray-900">{p.name}</div>
                        <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-2">
                          <span className="font-medium text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                            {p.medical_id}
                          </span>
                          {p.phone && <span>• {p.phone}</span>}
                        </div>
                      </div>
                      <div className="text-right text-xs">
                        {p.current_balance > 0 && (
                          <div className="font-medium text-red-600">Due: Rs. {p.current_balance.toFixed(2)}</div>
                        )}
                        {p.advance_balance > 0 && (
                          <div className="font-medium text-emerald-600">Credit: Rs. {p.advance_balance.toFixed(2)}</div>
                        )}
                      </div>
                    </div>
                  ))}
                  {filteredPatients.length === 0 && (
                    <div className="p-4 text-center text-gray-500 text-sm">
                      No matching patients found.
                    </div>
                  )}
                  <div
                    onClick={() => {
                      setNewPatient({
                        name: patientSearch,
                        phone: "",
                        cnic: "",
                        email: "",
                        address: ""
                      });
                      setPatientError("");
                      setIsPatientModalOpen(true);
                      setPatientSearch("");
                    }}
                    className="p-3.5 bg-indigo-50/50 hover:bg-indigo-100/70 cursor-pointer flex items-center justify-center text-indigo-700 font-semibold text-sm transition-colors"
                  >
                    <Plus className="w-4 h-4 mr-2 text-indigo-600" /> Add &quot;{patientSearch}&quot; as New Patient
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-between p-4 border border-indigo-100 bg-gradient-to-r from-indigo-50/50 via-white to-indigo-50/30 rounded-xl shadow-2xs">
              <div>
                <div className="font-bold text-gray-900 flex items-center gap-2.5">
                  <span className="text-base">{selectedPatient.name}</span>
                  <span className="text-xs font-semibold bg-indigo-100 text-indigo-700 px-2.5 py-0.5 rounded-full">
                    MRID: {selectedPatient.medical_id}
                  </span>
                </div>
                <div className="flex flex-wrap gap-4 mt-2 text-xs sm:text-sm">
                  {selectedPatient.phone && (
                    <span className="text-gray-500 flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-gray-400" /> {selectedPatient.phone}
                    </span>
                  )}
                  <span
                    className={`font-semibold ${
                      selectedPatient.current_balance > 0 ? "text-red-600" : "text-gray-600"
                    }`}
                  >
                    Due: Rs. {selectedPatient.current_balance.toFixed(2)}
                  </span>
                  <span
                    className={`font-semibold ${
                      selectedPatient.advance_balance > 0 ? "text-emerald-600" : "text-gray-600"
                    }`}
                  >
                    Advance: Rs. {selectedPatient.advance_balance.toFixed(2)}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPatientId("")}
                className="text-xs sm:text-sm text-indigo-600 hover:text-indigo-800 font-semibold underline underline-offset-2 ml-3"
              >
                Change Patient
              </button>
            </div>
          )}

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
                Assign Doctor / Staff
              </label>
              <select
                className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 text-slate-900 bg-white"
                value={selectedDoctorId}
                onChange={(e) => setSelectedDoctorId(e.target.value)}
              >
                <option value="">-- None (General Clinic) --</option>
                {employees.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name} {e.is_doctor ? "(Doctor)" : ""}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
                Session Remarks / Notes
              </label>
              <input
                type="text"
                className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 text-slate-900 bg-white"
                placeholder="Visit notes or procedure details..."
                value={sessionRemarks}
                onChange={(e) => setSessionRemarks(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* SERVICES & CART CARD */}
        <div className="bg-white flex-1 p-5 sm:p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900 flex items-center">
              <ShoppingCart className="w-5 h-5 mr-2 text-indigo-600" /> Services & Procedures
            </h2>
            <span className="text-xs text-gray-400 font-medium">
              {cart.length} {cart.length === 1 ? "item" : "items"} in cart
            </span>
          </div>

          {/* Search bar with Instant "+" Create Custom Package Button */}
          <div className="flex items-center gap-2 mb-5">
            <div className="relative flex-1">
              <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-slate-900 bg-white font-medium placeholder:text-gray-400 shadow-2xs"
                placeholder="Search services, procedures, or package deals to add..."
                value={serviceSearch}
                onChange={(e) => setServiceSearch(e.target.value)}
              />
              {serviceSearch && (
                <button
                  type="button"
                  onClick={() => setServiceSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              )}

              {/* Service Search Dropdown */}
              {serviceSearch && (
                <div className="absolute z-20 w-full mt-2 bg-white border border-gray-100 shadow-xl rounded-2xl overflow-hidden max-h-60 overflow-y-auto divide-y divide-gray-50">
                  {filteredServices.map((s: any) => (
                    <div
                      key={s.id + s.type}
                      onClick={() => addToCart(s)}
                      className="p-3.5 hover:bg-indigo-50/70 cursor-pointer flex justify-between items-center transition-colors"
                    >
                      <div>
                        <div className="font-semibold text-gray-900 flex items-center gap-2">
                          {s.name}
                          {s.type === "deal" && (
                            <span className="bg-purple-100 text-purple-700 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                              Package / Deal
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          Rs. {(s.selling_price !== undefined ? s.selling_price : s.total_price || 0).toFixed(2)}
                        </div>
                      </div>
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center hover:bg-indigo-600 hover:text-white transition-colors">
                        <Plus className="w-4 h-4" />
                      </div>
                    </div>
                  ))}
                  {filteredServices.length === 0 && (
                    <div className="p-4 text-center text-gray-500 text-sm">
                      No matching services found.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Custom Package Builder Button */}
            <button
              type="button"
              onClick={() => {
                setPackageForm({
                  name: "",
                  price: "",
                  items: [{ product_id: "", sessions: 1 }]
                });
                setPackageError("");
                setIsPackageModalOpen(true);
              }}
              className="h-12 px-3.5 sm:px-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 active:scale-95 text-white font-semibold rounded-xl shadow-md shadow-purple-600/20 flex items-center gap-1.5 shrink-0 transition-all focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
              title="Create Custom Package / Deal for Customer"
            >
              <Package className="w-5 h-5" />
              <span className="hidden sm:inline text-sm">New Package</span>
            </button>
          </div>

          {/* Cart Table with Editable Price */}
          <div className="flex-1 overflow-x-auto border border-gray-100 rounded-xl bg-gray-50/40 w-full min-w-0">
            {cart.length === 0 ? (
              <div className="h-full min-h-[160px] flex flex-col items-center justify-center text-gray-400 p-8">
                <ShoppingCart className="w-12 h-12 mb-3 text-gray-300" />
                <p className="font-medium text-sm">No items in cart.</p>
                <p className="text-xs text-gray-400 mt-1">Search services or create a custom package above to add to cart.</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse min-w-[580px]">
                <thead className="bg-white sticky top-0 shadow-2xs border-b border-gray-200">
                  <tr>
                    <th className="p-3 font-semibold text-xs text-gray-600 uppercase tracking-wider">Item / Service</th>
                    <th className="p-3 font-semibold text-xs text-gray-600 uppercase tracking-wider w-24 text-center">
                      Sessions
                    </th>
                    <th className="p-3 font-semibold text-xs text-gray-600 uppercase tracking-wider text-right w-36">
                      Unit Price (Editable)
                    </th>
                    <th className="p-3 font-semibold text-xs text-gray-600 uppercase tracking-wider text-right w-28">
                      Total
                    </th>
                    <th className="p-3 w-12 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {cart.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-indigo-50/30 transition-colors">
                      {/* Item Name */}
                      <td className="p-3">
                        <div className="font-semibold text-gray-900 text-sm">{item.name}</div>
                        {item.item_group_name && (
                          <div className="text-xs text-purple-700 font-semibold bg-purple-50 inline-block px-1.5 py-0.5 rounded mt-0.5">
                            Bundle: {item.item_group_name}
                          </div>
                        )}
                        <div className="text-xs text-gray-400 mt-0.5">Allows up to {item.sessions_allowed} sessions</div>
                      </td>

                      {/* Sessions Consumed */}
                      <td className="p-3 text-center">
                        <input
                          type="number"
                          min="1"
                          max={item.sessions_allowed}
                          className="w-16 border border-gray-200 rounded-lg text-center py-1.5 px-2 text-sm text-slate-900 bg-white font-semibold focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          value={item.sessions_consumed}
                          onChange={(e) => updateCartItem(idx, "sessions_consumed", parseInt(e.target.value) || 1)}
                        />
                      </td>

                      {/* Editable Price Column */}
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end">
                          <div className="relative w-32">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-semibold pointer-events-none">
                              Rs.
                            </span>
                            <input
                              type="number"
                              min="0"
                              step="any"
                              title="Click to edit charged unit price"
                              placeholder="0.00"
                              className="w-full pl-8 pr-2.5 py-1.5 border border-gray-200 hover:border-indigo-400 rounded-lg text-right text-sm font-bold text-slate-900 bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-2xs transition-all"
                              value={item.unit_price === 0 ? "0" : item.unit_price}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value);
                                updateCartItem(idx, "unit_price", isNaN(val) ? 0 : val);
                              }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Total */}
                      <td className="p-3 text-right font-bold text-gray-900 text-sm">
                        Rs. {(item.unit_price * item.quantity).toFixed(2)}
                      </td>

                      {/* Remove */}
                      <td className="p-3 text-center">
                        <button
                          type="button"
                          onClick={() => removeFromCart(idx)}
                          className="text-gray-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                          title="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* RIGHT PANEL - CHECKOUT */}
      <div className="w-full lg:w-[380px] shrink-0 flex flex-col gap-6">
        {/* TOKEN & INVOICE SUMMARY */}
        <div className="bg-gradient-to-br from-indigo-950 via-indigo-900 to-slate-900 p-6 rounded-2xl shadow-xl text-white">
          <div className="flex justify-between items-start mb-6">
            <div>
              <div className="text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-1">Queue Token</div>
              <div className="text-4xl font-black text-indigo-300 tracking-tight">{nextToken || "---"}</div>
            </div>
            <div className="text-right">
              <div className="text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-1">Next Invoice</div>
              <div className="text-base font-bold text-white bg-indigo-800/60 px-2.5 py-1 rounded-lg">
                {nextInvoice || "---"}
              </div>
            </div>
          </div>

          <div className="space-y-3.5 border-t border-indigo-800/60 pt-5 text-sm">
            <div className="flex justify-between items-center text-indigo-100">
              <span>Subtotal</span>
              <span className="font-semibold text-white">Rs. {subtotal.toFixed(2)}</span>
            </div>

            <div className="flex justify-between items-center text-indigo-100">
              <span>Discount (Rs.)</span>
              <input
                type="number"
                min="0"
                className="w-24 bg-indigo-950/80 border border-indigo-700/80 rounded-lg text-right px-2.5 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-white font-bold"
                value={discountAmount}
                onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || 0)}
              />
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-indigo-800/60">
              <span className="text-base font-bold text-white">Grand Total</span>
              <span className="text-2xl font-black text-white">Rs. {grandTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* PAYMENT COLLECTION */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex-1 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900 flex items-center">
              <CreditCard className="w-5 h-5 mr-2 text-indigo-600" /> Payment Details
            </h3>
            <span
              className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                paymentMethod === "Credit"
                  ? "bg-amber-100 text-amber-800"
                  : paymentMethod === "Card"
                  ? "bg-purple-100 text-purple-800"
                  : "bg-emerald-100 text-emerald-800"
              }`}
            >
              {paymentMethod === "Credit" ? "On Account" : paymentMethod === "Card" ? "Online" : "Cash Desk"}
            </span>
          </div>

          <div className="space-y-4 flex-1">
            {/* Payment Method Selector */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                Payment Method
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "Cash", label: "Cash", icon: Banknote },
                  { id: "Card", label: "Card", icon: CreditCard },
                  { id: "Credit", label: "Credit", icon: Clock },
                ].map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => handlePaymentMethodChange(id)}
                    className={`py-2.5 px-2 text-xs sm:text-sm font-semibold rounded-xl border transition-all flex flex-col sm:flex-row items-center justify-center gap-1.5 ${
                      paymentMethod === id
                        ? id === "Credit"
                          ? "bg-amber-600 border-amber-600 text-white shadow-md shadow-amber-600/30"
                          : "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-600/30"
                        : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Amount Paid Now Input */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Amount Paid Now (Rs.)
                </label>
                {paymentMethod === "Credit" && (
                  <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Locked (0 Paid)
                  </span>
                )}
                {paymentMethod === "Cash" && grandTotal > 0 && (
                  <button
                    type="button"
                    onClick={() => setPaidAmount(grandTotal)}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold underline underline-offset-2"
                  >
                    Set Full (Rs. {grandTotal.toFixed(2)})
                  </button>
                )}
              </div>

              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400 pointer-events-none">
                  Rs.
                </span>
                <input
                  type="number"
                  min="0"
                  step="any"
                  disabled={paymentMethod === "Credit"}
                  className={`w-full pl-11 pr-4 py-3 border rounded-xl text-xl font-bold transition-all ${
                    paymentMethod === "Credit"
                      ? "bg-gray-100/90 border-gray-200 text-gray-400 cursor-not-allowed select-none"
                      : "border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-900 bg-white"
                  }`}
                  value={paymentMethod === "Credit" ? "0.00" : paidAmount === 0 ? "0" : paidAmount}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setPaidAmount(isNaN(val) ? 0 : val);
                  }}
                  placeholder="0.00"
                />
              </div>

              {/* Informative Guidance Box under Input */}
              {paymentMethod === "Credit" && (
                <p className="text-xs text-amber-800 bg-amber-50/90 p-2.5 rounded-xl mt-2 border border-amber-200 font-medium flex items-start gap-1.5">
                  <Lock className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-600" />
                  <span>
                    Full bill amount of <strong>Rs. {grandTotal.toFixed(2)}</strong> will be recorded under patient&apos;s outstanding dues.
                  </span>
                </p>
              )}
              {paymentMethod === "Card" && (
                <p className="text-xs text-indigo-800 bg-indigo-50/90 p-2.5 rounded-xl mt-2 border border-indigo-200 font-medium">
                  Full bill of <strong>Rs. {grandTotal.toFixed(2)}</strong> will be charged via Card / Online transaction.
                </p>
              )}
              {paymentMethod === "Cash" && (
                <p className="text-[11px] text-gray-500 mt-1.5 font-medium">
                  {paidAmount >= grandTotal
                    ? "Full cash payment received (Invoice marked PAID)."
                    : paidAmount > 0
                    ? `Partial cash received. Remaining Rs. ${(grandTotal - paidAmount).toFixed(2)} will be saved to patient's due balance.`
                    : "No cash received. Full bill will be saved to patient's due balance."}
                </p>
              )}
            </div>

            {/* Remaining Due / Change Box */}
            <div
              className={`p-4 rounded-xl mt-4 flex justify-between items-center border transition-all ${
                paymentMethod === "Credit" || remainingDue > 0
                  ? "bg-red-50 text-red-700 border-red-200/80"
                  : "bg-emerald-50 text-emerald-700 border-emerald-200/80"
              }`}
            >
              <div>
                <span className="font-semibold text-xs uppercase tracking-wider block">
                  {paymentMethod === "Credit"
                    ? "Total Added to Patient Due"
                    : remainingDue > 0
                    ? "Remaining Due (Credit Balance)"
                    : paidAmount > grandTotal
                    ? "Change to Return"
                    : "Payment Status"}
                </span>
                <span className="text-[11px] opacity-80">
                  {paymentMethod === "Credit"
                    ? "100% On Credit"
                    : remainingDue > 0
                    ? "Will be added to ledger"
                    : paidAmount > grandTotal
                    ? "Return to customer"
                    : "Fully Settled"}
                </span>
              </div>
              <span className="text-xl font-black">
                Rs.{" "}
                {paymentMethod === "Credit"
                  ? grandTotal.toFixed(2)
                  : remainingDue > 0
                  ? remainingDue.toFixed(2)
                  : Math.abs(paidAmount - grandTotal).toFixed(2)}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={completeSale}
            disabled={!selectedPatientId || cart.length === 0}
            className="w-full py-4 mt-6 bg-indigo-600 text-white rounded-xl font-bold text-base hover:bg-indigo-700 active:scale-98 shadow-md shadow-indigo-600/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            <Check className="w-5 h-5" />
            <span>Complete Sale &amp; Print</span>
          </button>
        </div>
      </div>

      {/* ==================================================== */}
      {/* QUICK ADD PATIENT MODAL (MRID auto-assigned, CNIC optional) */}
      {/* ==================================================== */}
      {isPatientModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden mx-auto border border-gray-100">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-indigo-50/50 to-violet-50/50">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/20">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-base">Quick Add Patient</h3>
                  <p className="text-xs text-indigo-600 font-medium">System will auto-assign MRID</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPatientModalOpen(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleAddPatient} className="p-6 space-y-4">
              {patientError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
                  {patientError}
                </div>
              )}

              {/* Patient Name */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                  Patient Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  type="text"
                  autoFocus
                  placeholder="e.g. Fatima Ali"
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-900 bg-white font-medium"
                  value={newPatient.name}
                  onChange={(e) => setNewPatient({ ...newPatient, name: e.target.value })}
                />
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    required
                    type="tel"
                    placeholder="e.g. 0300-1234567"
                    className="w-full pl-10 pr-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-900 bg-white font-medium"
                    value={newPatient.phone}
                    onChange={(e) => setNewPatient({ ...newPatient, phone: e.target.value })}
                  />
                </div>
              </div>

              {/* CNIC (Optional) */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    CNIC / ID Card
                  </label>
                  <span className="text-[11px] text-gray-400 font-medium">(Optional)</span>
                </div>
                <div className="relative">
                  <IdCard className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="e.g. 35201-1234567-1 (Optional)"
                    className="w-full pl-10 pr-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-900 bg-white font-medium"
                    value={newPatient.cnic}
                    onChange={(e) => setNewPatient({ ...newPatient, cnic: e.target.value })}
                  />
                </div>
              </div>

              {/* Email (Optional) */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Email Address
                  </label>
                  <span className="text-[11px] text-gray-400 font-medium">(Optional)</span>
                </div>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    placeholder="patient@example.com"
                    className="w-full pl-10 pr-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-900 bg-white font-medium"
                    value={newPatient.email}
                    onChange={(e) => setNewPatient({ ...newPatient, email: e.target.value })}
                  />
                </div>
              </div>

              {/* Address (Optional) */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    City / Address
                  </label>
                  <span className="text-[11px] text-gray-400 font-medium">(Optional)</span>
                </div>
                <div className="relative">
                  <MapPin className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="e.g. Lahore / DHA Phase 5"
                    className="w-full pl-10 pr-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-900 bg-white font-medium"
                    value={newPatient.address}
                    onChange={(e) => setNewPatient({ ...newPatient, address: e.target.value })}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsPatientModalOpen(false)}
                  className="flex-1 py-2.5 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 font-semibold text-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={patientSaving}
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white rounded-xl font-semibold text-sm shadow-md shadow-indigo-600/20 disabled:opacity-60 transition-all flex items-center justify-center gap-2"
                >
                  {patientSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Save &amp; Select
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* CUSTOM PACKAGE / DEAL BUILDER MODAL (INSTANT POS)     */}
      {/* ==================================================== */}
      {isPackageModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden mx-auto border border-gray-100 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-purple-50 via-indigo-50 to-violet-50 shrink-0">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-purple-600/20">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-base">Create Custom Package / Deal</h3>
                  <p className="text-xs text-purple-700 font-medium">Build tailored treatment bundle for patient</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPackageModalOpen(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreatePackage} className="p-6 space-y-4 overflow-y-auto flex-1">
              {packageError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
                  {packageError}
                </div>
              )}

              {/* Package Name */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                  Package / Deal Name <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  type="text"
                  autoFocus
                  placeholder="e.g. Custom Bridal Glow Package (3 Sessions)"
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-slate-900 bg-white font-medium"
                  value={packageForm.name}
                  onChange={(e) => setPackageForm({ ...packageForm, name: e.target.value })}
                />
              </div>

              {/* Total Selling Price (Optional) */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Total Package Selling Price (Rs.)
                  </label>
                  <span className="text-[11px] text-gray-400 font-medium">(Optional)</span>
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-semibold pointer-events-none">
                    Rs.
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    placeholder={`e.g. ${packageEstimatedSum > 0 ? packageEstimatedSum : "0.00"} (Optional)`}
                    className="w-full pl-10 pr-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-slate-900 bg-white font-bold"
                    value={packageForm.price}
                    onChange={(e) => setPackageForm({ ...packageForm, price: e.target.value })}
                  />
                </div>
                {packageEstimatedSum > 0 && (
                  <p className="text-[11px] text-gray-500 mt-1">
                    Standard service sum: <span className="font-semibold text-gray-700">Rs. {packageEstimatedSum.toFixed(2)}</span>
                  </p>
                )}
              </div>

              {/* Services & Sessions List */}
              <div className="pt-2">
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Included Services &amp; Sessions <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setPackageForm({
                        ...packageForm,
                        items: [...packageForm.items, { product_id: "", sessions: 1 }],
                      });
                    }}
                    className="text-xs text-purple-700 hover:text-purple-900 font-semibold flex items-center gap-1 hover:underline"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Another Service
                  </button>
                </div>

                <div className="space-y-2.5 bg-gray-50/80 p-3.5 rounded-xl border border-gray-200/80">
                  {packageForm.items.map((field, index) => (
                    <div key={index} className="flex items-center gap-2">
                      {/* Service Dropdown */}
                      <div className="flex-1 min-w-0">
                        <select
                          required
                          value={field.product_id}
                          onChange={(e) => {
                            const newItems = [...packageForm.items];
                            newItems[index].product_id = e.target.value;
                            setPackageForm({ ...packageForm, items: newItems });
                          }}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white text-slate-900 font-medium"
                        >
                          <option value="">Select Service / Treatment...</option>
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} (Rs. {(p.selling_price || 0).toFixed(2)})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Sessions Input */}
                      <div className="w-24 shrink-0">
                        <div className="relative">
                          <input
                            type="number"
                            min="1"
                            required
                            placeholder="Sessions"
                            title="Number of sessions"
                            className="w-full border border-gray-200 rounded-lg px-2.5 py-2 text-center text-sm font-semibold text-slate-900 bg-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                            value={field.sessions}
                            onChange={(e) => {
                              const newItems = [...packageForm.items];
                              newItems[index].sessions = parseInt(e.target.value) || 1;
                              setPackageForm({ ...packageForm, items: newItems });
                            }}
                          />
                        </div>
                      </div>

                      {/* Remove Row Button */}
                      {packageForm.items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            const newItems = packageForm.items.filter((_, i) => i !== index);
                            setPackageForm({ ...packageForm, items: newItems });
                          }}
                          className="text-gray-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-colors shrink-0"
                          title="Remove this service"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsPackageModalOpen(false)}
                  className="flex-1 py-2.5 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 font-semibold text-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={packageSaving}
                  className="flex-1 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 active:scale-98 text-white rounded-xl font-semibold text-sm shadow-md shadow-purple-600/20 disabled:opacity-60 transition-all flex items-center justify-center gap-2"
                >
                  {packageSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creating Package...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Create &amp; Add to Cart
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
