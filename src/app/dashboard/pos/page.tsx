"use client";

import { useState, useEffect, useMemo } from "react";
import { Search, Plus, Trash2, CheckCircle2, FileText, UserPlus, Users, ShoppingCart, User, CreditCard } from "lucide-react";

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

  // New Patient Modal
  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);
  const [newPatient, setNewPatient] = useState({ name: "", phone: "", email: "" });

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

        setPatients(await patRes.json() || []);
        setEmployees(await empRes.json() || []);
        setProducts(await prodRes.json() || []);
        setDeals(await dealRes.json() || []);

        const tokenData = await tokenRes.json();
        setNextToken(tokenData.token);
        setNextInvoice(tokenData.invoiceNumber);
      } catch (error) {
        console.error("Error fetching POS data:", error);
      }
    };
    fetchData();
  }, []);

  const selectedPatient = useMemo(() => {
    return patients.find(p => p.id === selectedPatientId);
  }, [patients, selectedPatientId]);

  const filteredPatients = useMemo(() => {
    if (!patientSearch) return patients.slice(0, 10);
    const lower = patientSearch.toLowerCase();
    return patients.filter(p =>
      p.name.toLowerCase().includes(lower) ||
      (p.phone && p.phone.includes(lower)) ||
      p.medical_id.toLowerCase().includes(lower)
    ).slice(0, 10);
  }, [patients, patientSearch]);

  const filteredServices = useMemo(() => {
    if (!serviceSearch) return [];
    const lower = serviceSearch.toLowerCase();
    const matchedProducts = products.filter(p => p.name.toLowerCase().includes(lower) || (p.sku && p.sku.toLowerCase().includes(lower))).map(p => ({ ...p, type: 'product' }));
    const matchedDeals = deals.filter(d => d.name.toLowerCase().includes(lower)).map(d => ({ ...d, type: 'deal' }));
    return [...matchedProducts, ...matchedDeals];
  }, [products, deals, serviceSearch]);

  // Cart Calculations
  const subtotal = cart.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);
  const grandTotal = Math.max(0, subtotal - discountAmount);
  const remainingDue = Math.max(0, grandTotal - paidAmount);

  // Auto-update paid amount to grand total if nothing typed yet (convenience)
  useEffect(() => {
    if (paidAmount === 0 && grandTotal > 0 && cart.length > 0) {
      setPaidAmount(grandTotal);
    }
  }, [grandTotal, cart.length, paidAmount]);

  // Handlers
  const handleAddPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/patients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newPatient)
      });
      if (res.ok) {
        const p = await res.json();
        setPatients([...patients, p]);
        setSelectedPatientId(p.id);
        setIsPatientModalOpen(false);
        setNewPatient({ name: "", phone: "", email: "" });
        setPatientSearch("");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const addToCart = (item: any) => {
    if (item.type === 'deal') {
      // Expand deal into component products
      const dealItems = item.items.map((di: any) => {
        // Find product
        const product = products.find(p => p.id === di.product_id);
        // Distribute price (simplified: prorate based on product selling price or just set to 0 for components and keep total price? 
        // Actually, requirements say: "expand it into its component services in the cart with sessions_allowed carried over from the deal definition."
        // We need the items to have a price. For Deals, the total price is on the Deal. We can divide equally or just put it on the first item, or assign unit price based on prorated normal prices.
        // Let's divide equally for simplicity, or 0 for items and a master deal item.
        return {
          id: ` {item.id}- {di.product_id}- {Date.now()}`,
          product_id: di.product_id,
          name: ` {item.name} -  {product?.name || 'Service'}`,
          unit_price: item.total_price / item.items.length,
          quantity: 1,
          sessions_allowed: di.sessions_allowed || 1,
          sessions_consumed: 1,
          item_group_name: item.name
        };
      });
      setCart([...cart, ...dealItems]);
    } else {
      setCart([...cart, {
        id: ` {item.id}- {Date.now()}`,
        product_id: item.id,
        name: item.name,
        unit_price: item.selling_price,
        quantity: 1,
        sessions_allowed: 1,
        sessions_consumed: 1,
        item_group_name: null
      }]);
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
      const payload = {
        customer_id: selectedPatientId,
        doctor_id: selectedDoctorId || null,
        subtotal: subtotal,
        discount_amount: discountAmount,
        grand_total: grandTotal,
        paid_amount: paidAmount,
        payment_method: paymentMethod,
        session_remarks: sessionRemarks,
        items: cart.map(c => ({
          product_id: c.product_id,
          quantity: c.quantity,
          unit_price: c.unit_price,
          sessions_allowed: c.sessions_allowed,
          sessions_consumed: c.sessions_consumed,
          total_price: c.unit_price * c.quantity,
          item_group_name: c.item_group_name
        }))
      };

      const res = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        setSuccessData({ ...data, invoice: nextInvoice, token: data.token || nextToken });
        setIsSuccess(true);
      } else {
        const err = await res.json();
        alert(`Error:  {err.error}`);
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
    setPatientSearch("");
    setServiceSearch("");
    setIsSuccess(false);
    setSuccessData(null);

    // Refresh token and patients to get updated balances
    const [patRes, tokenRes] = await Promise.all([
      fetch("/api/patients"),
      fetch("/api/sales/next-invoice")
    ]);
    setPatients(await patRes.json() || []);
    const tokenData = await tokenRes.json();
    setNextToken(tokenData.token);
    setNextInvoice(tokenData.invoiceNumber);
  };

  if (isSuccess && successData) {
    return (
      <div className="max-w-2xl mx-auto mt-12 bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Sale Completed!</h2>
        <p className="text-gray-500 mb-8">Invoice has been successfully generated.</p>

        <div className="bg-gray-50 rounded-xl p-6 mb-8 max-w-sm mx-auto space-y-4">
          <div className="flex justify-between items-center border-b border-gray-200 pb-4">
            <span className="text-gray-500">Queue Token</span>
            <span className="text-3xl font-bold text-indigo-600">{successData.token}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-500">Invoice Number</span>
            <span className="font-semibold text-gray-900">{successData.invoice}</span>
          </div>
        </div>

        <div className="flex space-x-4 justify-center">
          <button className="px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium flex items-center">
            <FileText className="w-5 h-5 mr-2" /> Print Invoice
          </button>
          <button onClick={resetPOS} className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium">
            New Sale
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col lg:flex-row gap-6 w-full min-w-0 p-4 sm:p-0">

      {/* LEFT PANEL */}
      <div className="flex-1 flex flex-col gap-6 overflow-hidden w-full min-w-0">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 shrink-0">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center"><User className="w-5 h-5 mr-2" /> Patient Selection</h2>

          {!selectedPatient ? (
            <div className="relative">
              <div className="relative">
                <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  placeholder="Search by name, phone, or medical ID..."
                  value={patientSearch}
                  onChange={e => setPatientSearch(e.target.value)}
                />
              </div>

              {patientSearch && (
                <div className="absolute z-10 w-full mt-2 bg-white border border-gray-100 shadow-xl rounded-lg overflow-hidden max-h-60 overflow-y-auto">
                  {filteredPatients.map(p => (
                    <div
                      key={p.id}
                      onClick={() => { setSelectedPatientId(p.id); setPatientSearch(""); }}
                      className="p-3 border-b border-gray-50 hover:bg-indigo-50 cursor-pointer flex justify-between items-center"
                    >
                      <div>
                        <div className="font-medium text-gray-900">{p.name}</div>
                        <div className="text-xs text-gray-500">{p.medical_id} • {p.phone}</div>
                      </div>
                    </div>
                  ))}
                  {filteredPatients.length === 0 && (
                    <div className="p-4 text-center text-gray-500">No patients found.</div>
                  )}
                  <div
                    onClick={() => { setIsPatientModalOpen(true); setPatientSearch(""); }}
                    className="p-3 bg-gray-50 hover:bg-gray-100 cursor-pointer flex items-center justify-center text-indigo-600 font-medium"
                  >
                    <Plus className="w-4 h-4 mr-2" /> Add New Patient
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-between p-4 border border-indigo-100 bg-indigo-50/30 rounded-lg">
              <div>
                <div className="font-bold text-gray-900 flex items-center gap-2">
                  {selectedPatient.name}
                  <span className="text-xs font-normal bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">{selectedPatient.medical_id}</span>
                </div>
                <div className="flex gap-4 mt-2 text-sm">
                  <span className={`font-medium  {selectedPatient.current_balance > 0 ? 'text-red-600' : 'text-gray-600'}`}>
                    Due:  {selectedPatient.current_balance.toFixed(2)}
                  </span>
                  <span className={`font-medium  {selectedPatient.advance_balance > 0 ? 'text-green-600' : 'text-gray-600'}`}>
                    Credit:  {selectedPatient.advance_balance.toFixed(2)}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedPatientId("")}
                className="text-sm text-gray-500 hover:text-gray-700 underline"
              >
                Change Patient
              </button>
            </div>
          )}

          <div className="mt-4 grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Assign Doctor/Staff</label>
              <select
                className="w-full border-gray-200 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                value={selectedDoctorId}
                onChange={e => setSelectedDoctorId(e.target.value)}
              >
                <option value="">-- None --</option>
                {employees.map(e => (
                  <option key={e.id} value={e.id}>{e.name} {e.is_doctor ? '(Doctor)' : ''}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Session Remarks</label>
              <input
                type="text"
                className="w-full border-gray-200 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                placeholder="Notes for this visit..."
                value={sessionRemarks}
                onChange={e => setSessionRemarks(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="bg-white flex-1 p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col min-h-0">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center"><ShoppingCart className="w-5 h-5 mr-2" /> Services & Cart</h2>

          <div className="relative mb-6">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              placeholder="Search services or deals to add..."
              value={serviceSearch}
              onChange={e => setServiceSearch(e.target.value)}
            />

            {serviceSearch && (
              <div className="absolute z-10 w-full mt-2 bg-white border border-gray-100 shadow-xl rounded-lg overflow-hidden max-h-60 overflow-y-auto">
                {filteredServices.map((s: any) => (
                  <div
                    key={s.id + s.type}
                    onClick={() => addToCart(s)}
                    className="p-3 border-b border-gray-50 hover:bg-indigo-50 cursor-pointer flex justify-between items-center"
                  >
                    <div>
                      <div className="font-medium text-gray-900 flex items-center gap-2">
                        {s.name}
                        {s.type === 'deal' && <span className="bg-purple-100 text-purple-700 text-[10px] px-1.5 py-0.5 rounded font-bold uppercase">Deal</span>}
                      </div>
                      <div className="text-xs text-gray-500"> {(s.selling_price || s.total_price || 0).toFixed(2)}</div>
                    </div>
                    <Plus className="w-4 h-4 text-indigo-600" />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex-1 overflow-x-auto pr-2 border border-gray-100 rounded-lg bg-gray-50/50 w-full min-w-0">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 p-8">
                <ShoppingCart className="w-12 h-12 mb-3 opacity-20" />
                <p>No items in cart.</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead className="bg-white sticky top-0 shadow-sm border-b border-gray-200">
                  <tr>
                    <th className="p-3 font-semibold text-sm text-gray-600">Item</th>
                    <th className="p-3 font-semibold text-sm text-gray-600 w-24">Sessions Now</th>
                    <th className="p-3 font-semibold text-sm text-gray-600 text-right w-24">Price</th>
                    <th className="p-3 font-semibold text-sm text-gray-600 text-right w-24">Total</th>
                    <th className="p-3 w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {cart.map((item, idx) => (
                    <tr key={item.id} className="border-b border-gray-100 hover:bg-white transition-colors">
                      <td className="p-3">
                        <div className="font-medium text-gray-900">{item.name}</div>
                        {item.item_group_name && <div className="text-xs text-gray-500">from {item.item_group_name}</div>}
                        <div className="text-xs text-gray-400">Allows up to {item.sessions_allowed} sessions</div>
                      </td>
                      <td className="p-3">
                        <input
                          type="number"
                          min="1"
                          max={item.sessions_allowed}
                          className="w-full border-gray-200 rounded text-center py-1 px-2 text-sm"
                          value={item.sessions_consumed}
                          onChange={e => updateCartItem(idx, 'sessions_consumed', parseInt(e.target.value) || 1)}
                        />
                      </td>
                      <td className="p-3 text-right font-medium text-gray-600">
                        {item.unit_price.toFixed(2)}
                      </td>
                      <td className="p-3 text-right font-bold text-gray-900">
                        {(item.unit_price * item.quantity).toFixed(2)}
                      </td>
                      <td className="p-3 text-right">
                        <button onClick={() => removeFromCart(idx)} className="text-red-400 hover:text-red-600 p-1">
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
      <div className="w-full lg:w-[400px] shrink-0 flex flex-col gap-6">
        <div className="bg-gray-900 p-6 rounded-xl shadow-lg text-white">
          <div className="flex justify-between items-start mb-6">
            <div>
              <div className="text-gray-400 text-sm font-medium mb-1">Queue Token</div>
              <div className="text-4xl font-black text-indigo-400 tracking-tight">{nextToken || "---"}</div>
            </div>
            <div className="text-right">
              <div className="text-gray-400 text-sm font-medium mb-1">Invoice</div>
              <div className="text-lg font-bold">{nextInvoice || "---"}</div>
            </div>
          </div>

          <div className="space-y-4 border-t border-gray-700 pt-6">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Subtotal</span>
              <span className="font-medium"> {subtotal.toFixed(2)}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-gray-400">Discount ( )</span>
              <input
                type="number"
                min="0"
                className="w-24 bg-gray-800 border border-gray-700 rounded text-right px-2 py-1 focus:outline-none focus:border-indigo-500 text-white"
                value={discountAmount}
                onChange={e => setDiscountAmount(parseFloat(e.target.value) || 0)}
              />
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-gray-700">
              <span className="text-lg font-medium">Grand Total</span>
              <span className="text-2xl font-bold text-white"> {grandTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex-1 flex flex-col">
          <h3 className="font-bold text-gray-900 mb-4">Payment</h3>

          <div className="space-y-4 flex-1">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
              <div className="grid grid-cols-3 gap-2">
                {["Cash", "Card", "Credit"].map(method => (
                  <button
                    key={method}
                    onClick={() => setPaymentMethod(method)}
                    className={`py-2 px-3 text-sm font-medium rounded-lg border  {paymentMethod === method ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                  >
                    {method}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount Paid Now ( )</label>
              <input
                type="number"
                min="0"
                className="w-full border-gray-200 rounded-lg text-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-bold"
                value={paidAmount}
                onChange={e => setPaidAmount(parseFloat(e.target.value) || 0)}
              />
            </div>

            <div className={`p-4 rounded-lg mt-4 flex justify-between items-center  {remainingDue > 0 ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
              <span className="font-medium">{remainingDue > 0 ? 'Remaining Due' : 'Change / Advance'}</span>
              <span className="text-xl font-bold"> {Math.abs(paidAmount - grandTotal).toFixed(2)}</span>
            </div>
          </div>

          <button
            onClick={completeSale}
            disabled={!selectedPatientId || cart.length === 0}
            className="w-full py-4 mt-6 bg-indigo-600 text-white rounded-xl font-bold text-lg hover:bg-indigo-700 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Complete Sale
          </button>
        </div>
      </div>

      {/* NEW PATIENT MODAL */}
      {isPatientModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden mx-auto">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-900">Quick Add Patient</h3>
              <button onClick={() => setIsPatientModalOpen(false)} className="text-gray-400 hover:text-gray-600"><Trash2 className="w-5 h-5 hidden" /> &times;</button>
            </div>
            <form onSubmit={handleAddPatient} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input required type="text" className="w-full border-gray-200 rounded-lg focus:ring-indigo-500 focus:border-indigo-500" value={newPatient.name} onChange={e => setNewPatient({ ...newPatient, name: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input required type="tel" className="w-full border-gray-200 rounded-lg focus:ring-indigo-500 focus:border-indigo-500" value={newPatient.phone} onChange={e => setNewPatient({ ...newPatient, phone: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email (Optional)</label>
                <input type="email" className="w-full border-gray-200 rounded-lg focus:ring-indigo-500 focus:border-indigo-500" value={newPatient.email} onChange={e => setNewPatient({ ...newPatient, email: e.target.value })} />
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsPatientModalOpen(false)} className="flex-1 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium">Cancel</button>
                <button type="submit" className="flex-1 py-2 bg-indigo-600 rounded-lg text-white hover:bg-indigo-700 font-medium">Save Patient</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
