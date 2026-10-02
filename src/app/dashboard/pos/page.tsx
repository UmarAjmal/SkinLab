"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
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
  Check,
  Printer
} from "lucide-react";
import { printThermalReceipt, ThermalReceiptData } from "@/lib/thermalPrinter";

function POSContent() {
  const searchParams = useSearchParams();
  const urlPatientId = searchParams.get("patientId");

  // Data States
  const [patients, setPatients] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [deals, setDeals] = useState<any[]>([]);

  // Selection States
  const [selectedPatientId, setSelectedPatientId] = useState<string>("");
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>("");
  const [sessionRemarks, setSessionRemarks] = useState<string>("");

  // Active Follow-up Package Invoices States
  const [patientActiveInvoices, setPatientActiveInvoices] = useState<any[]>([]);
  const [selectedFollowUpInvoiceId, setSelectedFollowUpInvoiceId] = useState<string>("");
  const [isLoadingPatientInvoices, setIsLoadingPatientInvoices] = useState<boolean>(false);

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
  const [clinicSettings, setClinicSettings] = useState<any>(null);
  const [lastReceiptData, setLastReceiptData] = useState<ThermalReceiptData | null>(null);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

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

  // Fetch initial data with instant Stale-While-Revalidate local caching
  useEffect(() => {
    try {
      const cachedProd = sessionStorage.getItem("pos_cache_products");
      const cachedDeals = sessionStorage.getItem("pos_cache_deals");
      const cachedEmps = sessionStorage.getItem("pos_cache_employees");
      const cachedSettings = sessionStorage.getItem("pos_cache_settings");
      if (cachedProd) setProducts(JSON.parse(cachedProd));
      if (cachedDeals) setDeals(JSON.parse(cachedDeals));
      if (cachedEmps) setEmployees(JSON.parse(cachedEmps));
      if (cachedSettings) setClinicSettings(JSON.parse(cachedSettings));
    } catch (_) {}

    const fetchData = async () => {
      try {
        const [patRes, empRes, prodRes, dealRes, tokenRes, settingsRes] = await Promise.all([
          fetch("/api/patients"),
          fetch("/api/employees"),
          fetch("/api/products"),
          fetch("/api/deals"),
          fetch("/api/sales/next-invoice"),
          fetch("/api/settings")
        ]);

        const [patData, empData, prodData, dealData, tokenData, setSettings] = await Promise.all([
          patRes.ok ? patRes.json() : [],
          empRes.ok ? empRes.json() : [],
          prodRes.ok ? prodRes.json() : [],
          dealRes.ok ? dealRes.json() : [],
          tokenRes.ok ? tokenRes.json() : null,
          settingsRes.ok ? settingsRes.json() : null,
        ]);

        if (Array.isArray(patData)) setPatients(patData);
        if (Array.isArray(empData)) {
          setEmployees(empData);
          try { sessionStorage.setItem("pos_cache_employees", JSON.stringify(empData)); } catch (_) {}
        }
        if (Array.isArray(prodData)) {
          setProducts(prodData);
          try { sessionStorage.setItem("pos_cache_products", JSON.stringify(prodData)); } catch (_) {}
        }
        if (Array.isArray(dealData)) {
          setDeals(dealData);
          try { sessionStorage.setItem("pos_cache_deals", JSON.stringify(dealData)); } catch (_) {}
        }
        if (tokenData) {
          setNextToken(tokenData?.token || "");
          setNextInvoice(tokenData?.invoiceNumber || "");
        }
        if (setSettings) {
          setClinicSettings(setSettings);
          try { sessionStorage.setItem("pos_cache_settings", JSON.stringify(setSettings)); } catch (_) {}
        }
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

  // Auto-select patient from URL if present
  useEffect(() => {
    if (urlPatientId && urlPatientId !== selectedPatientId) {
      setSelectedPatientId(urlPatientId);
    }
  }, [urlPatientId, selectedPatientId]);

  // Fetch active treatment package invoices when selected patient changes
  useEffect(() => {
    if (!selectedPatientId) {
      setPatientActiveInvoices([]);
      setSelectedFollowUpInvoiceId("");
      return;
    }

    const fetchPatientInvoices = async () => {
      setIsLoadingPatientInvoices(true);
      try {
        const res = await fetch(`/api/patients/${selectedPatientId}`);
        if (!res.ok) return;
        const patientData = await res.json();

        // Find sales that have remaining sessions (sessions_allowed > sessions_consumed)
        const activeSales = (patientData.sales || []).filter((s: any) =>
          (s.items || []).some(
            (it: any) => (Number(it.sessions_allowed) || 1) > (Number(it.sessions_consumed) || 0)
          )
        );
        setPatientActiveInvoices(activeSales);
      } catch (err) {
        console.error("Error loading patient active treatment packages:", err);
      } finally {
        setIsLoadingPatientInvoices(false);
      }
    };

    fetchPatientInvoices();
  }, [selectedPatientId]);

  const selectedFollowUpInvoice = useMemo(() => {
    if (!selectedFollowUpInvoiceId) return null;
    return patientActiveInvoices.find((i) => i.id === selectedFollowUpInvoiceId) || null;
  }, [selectedFollowUpInvoiceId, patientActiveInvoices]);

  const followUpPendingDue = useMemo(() => {
    if (!selectedFollowUpInvoice) return 0;
    return Math.max(
      0,
      (Number(selectedFollowUpInvoice.grand_total) || 0) - (Number(selectedFollowUpInvoice.paid_amount) || 0)
    );
  }, [selectedFollowUpInvoice]);

  const handleFollowUpInvoiceSelect = (invoiceId: string) => {
    setSelectedFollowUpInvoiceId(invoiceId);

    if (!invoiceId) {
      setCart([]);
      return;
    }

    const inv = patientActiveInvoices.find((i) => i.id === invoiceId);
    if (!inv) return;

    // Auto-assign original doctor if available
    if (inv.doctor_id) {
      setSelectedDoctorId(inv.doctor_id);
    }

    // Filter items with remaining sessions
    const remainingItems = (inv.items || []).filter(
      (it: any) => (Number(it.sessions_allowed) || 1) > (Number(it.sessions_consumed) || 0)
    );

    const pendingDue = Math.max(0, (Number(inv.grand_total) || 0) - (Number(inv.paid_amount) || 0));

    const followUpCartItems = remainingItems.map((it: any) => {
      const allowed = Number(it.sessions_allowed) || 1;
      const consumed = Number(it.sessions_consumed) || 0;
      const remaining = Math.max(0, allowed - consumed);

      return {
        id: `followup-${it.id}`,
        type: "follow_up_session",
        product_id: it.product_id,
        name: it.product?.name || it.name || "Treatment Procedure",
        item_group_name: it.item_group_name || inv.invoice_number,
        sessions_allowed: allowed,
        sessions_consumed: consumed,
        sessions_remaining: remaining,
        is_follow_up_session: true,
        original_sale_item_id: it.id,
        original_sale_id: inv.id,
        original_invoice_number: inv.invoice_number,
        unit_price: 0,
        quantity: 1,
        total_price: 0,
      };
    });

    setCart(followUpCartItems);
    setDiscountAmount(0);

    if (pendingDue > 0) {
      setPaidAmount(paymentMethod === "Credit" ? 0 : pendingDue);
    } else {
      setPaidAmount(0);
    }
  };

  // Cart Calculations
  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => {
      if (item.is_follow_up_session) return sum;
      if (item.type === "package") {
        return sum + (Number(item.package_price) || 0);
      }
      return sum + (Number(item.unit_price) || 0) * (Number(item.quantity) || 1);
    }, 0);
  }, [cart]);

  const grandTotal = Math.max(0, subtotal - discountAmount);
  const totalPayable = useMemo(() => {
    if (selectedFollowUpInvoice) {
      return grandTotal + followUpPendingDue;
    }
    return grandTotal;
  }, [grandTotal, selectedFollowUpInvoice, followUpPendingDue]);

  const remainingDue = Math.max(
    0,
    (selectedFollowUpInvoice ? totalPayable : grandTotal) - paidAmount
  );

  // Handle Payment Method Switch
  const handlePaymentMethodChange = (method: string) => {
    setPaymentMethod(method);
    const targetAmount = selectedFollowUpInvoice ? totalPayable : grandTotal;
    if (method === "Credit") {
      setPaidAmount(0);
    } else if (method === "Card") {
      setPaidAmount(targetAmount);
    } else if (method === "Cash") {
      if (paidAmount === 0 && targetAmount > 0) {
        setPaidAmount(targetAmount);
      }
    }
  };

  // Auto-sync paid amount when grand total changes
  useEffect(() => {
    const targetAmount = selectedFollowUpInvoice ? totalPayable : grandTotal;
    if (paymentMethod === "Credit") {
      setPaidAmount(0);
    } else if (paymentMethod === "Card") {
      setPaidAmount(targetAmount);
    } else if (paymentMethod === "Cash") {
      if (paidAmount === 0 && targetAmount > 0 && cart.length > 0) {
        setPaidAmount(targetAmount);
      }
    }
  }, [grandTotal, totalPayable, paymentMethod, cart.length, selectedFollowUpInvoice]);

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
      // Find package price from total_price or price
      const packagePrice = Number(item.total_price !== undefined ? item.total_price : item.price || 0);

      const packageServices = (item.items || []).map((di: any) => {
        const prod = di.product || products.find((p) => p.id === di.product_id);
        return {
          product_id: di.product_id,
          name: prod?.name || "Service",
          sessions_allowed: Number(di.sessions_allowed || di.sessions) || 1,
          sessions_consumed: 1,
        };
      });

      const packageCartItem = {
        id: `pkg-${item.id || "deal"}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        type: "package",
        deal_id: item.id || null,
        name: item.name,
        package_price: packagePrice,
        items: packageServices,
      };

      setCart((prev) => [...prev, packageCartItem]);
    } else {
      setCart((prev) => [
        ...prev,
        {
          id: `svc-${item.id}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          type: "service",
          product_id: item.id,
          name: item.name,
          unit_price: Number(item.selling_price) || 0,
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

  const updateCartItem = (index: number, field: string, value: any) => {
    const newCart = [...cart];
    newCart[index] = { ...newCart[index], [field]: value };
    setCart(newCart);
  };

  const updatePackagePrice = (index: number, newPrice: number) => {
    const newCart = [...cart];
    newCart[index] = { ...newCart[index], package_price: Math.max(0, newPrice) };
    setCart(newCart);
  };

  const completeSale = async () => {
    if (!selectedPatientId) return alert("Please select a patient.");
    if (cart.length === 0) return alert("Cart is empty.");

    setIsCheckingOut(true);
    try {
      const finalPaidAmount = paymentMethod === "Credit" ? 0 : paidAmount;

      const flattenedItems: any[] = [];
      for (const cartEntry of cart) {
        if (cartEntry.is_follow_up_session) {
          flattenedItems.push({
            product_id: cartEntry.product_id,
            name: `${cartEntry.item_group_name ? `${cartEntry.item_group_name} - ` : ""}${cartEntry.name}`,
            quantity: 1,
            unit_price: 0,
            sessions_allowed: cartEntry.sessions_allowed || 1,
            sessions_consumed: (cartEntry.sessions_consumed || 0) + 1,
            total_price: 0,
            item_group_name: cartEntry.item_group_name || null,
            consumed_from_item_id: cartEntry.original_sale_item_id || null,
            is_follow_up: true,
            is_follow_up_session: true,
          });
        } else if (cartEntry.type === "package") {
          const totalPkgPrice = Number(cartEntry.package_price) || 0;
          const pkgItems = cartEntry.items || [];
          const count = pkgItems.length || 1;

          let allocated = 0;
          pkgItems.forEach((pItem: any, idx: number) => {
            let itemPrice = 0;
            if (idx === count - 1) {
              itemPrice = Math.max(0, Math.round((totalPkgPrice - allocated) * 100) / 100);
            } else {
              itemPrice = Math.round((totalPkgPrice / count) * 100) / 100;
              allocated += itemPrice;
            }

            flattenedItems.push({
              product_id: pItem.product_id,
              name: `${cartEntry.name} - ${pItem.name}`,
              quantity: 1,
              unit_price: itemPrice,
              sessions_allowed: pItem.sessions_allowed || 1,
              sessions_consumed: Math.min(1, pItem.sessions_allowed || 1),
              total_price: itemPrice,
              item_group_name: cartEntry.name,
            });
          });
        } else {
          flattenedItems.push({
            product_id: cartEntry.product_id,
            name: cartEntry.name,
            quantity: cartEntry.quantity || 1,
            unit_price: Number(cartEntry.unit_price) || 0,
            sessions_allowed: cartEntry.sessions_allowed || 1,
            sessions_consumed: cartEntry.sessions_consumed || 1,
            total_price: (Number(cartEntry.unit_price) || 0) * (cartEntry.quantity || 1),
            item_group_name: null,
          });
        }
      }

      const payload = {
        customer_id: selectedPatientId,
        doctor_id: selectedDoctorId || null,
        subtotal: subtotal,
        discount_amount: discountAmount,
        grand_total: grandTotal,
        paid_amount: finalPaidAmount,
        payment_method: paymentMethod,
        session_remarks: sessionRemarks || (selectedFollowUpInvoice ? `Follow-up visit for ${selectedFollowUpInvoice.invoice_number}` : ""),
        original_sale_id: selectedFollowUpInvoiceId || null,
        items: flattenedItems,
      };

      const res = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        const activeDoctor = employees.find((e) => e.id === selectedDoctorId) || data.sale?.doctor || null;
        const activePatient = patients.find((p) => p.id === selectedPatientId) || data.customer || data.sale?.customer;

        const isFollowUp = Boolean(data.is_followup || selectedFollowUpInvoice);
        const receiptSale = data.sale || selectedFollowUpInvoice;

        const receiptData: ThermalReceiptData = {
          clinic: data.settings || clinicSettings,
          invoiceNumber: receiptSale?.invoice_number || nextInvoice,
          date: receiptSale?.date || new Date(),
          customer: {
            name: activePatient?.name || "Walk-in Patient",
            phone: activePatient?.phone || null,
            medical_id: activePatient?.medical_id || null,
            current_balance: data.customer?.current_balance ?? activePatient?.current_balance ?? 0,
            advance_balance: data.customer?.advance_balance ?? activePatient?.advance_balance ?? 0,
          },
          doctor: activeDoctor,
          visitNo: data.visitCount || 1,
          tokenNumber: data.token || nextToken,
          items: flattenedItems.map((c) => ({
            name: c.name,
            product_name: c.name,
            item_group_name: c.item_group_name,
            quantity: c.quantity,
            unit_price: c.unit_price,
            total_price: c.total_price,
            sessions_allowed: c.sessions_allowed,
            sessions_consumed: c.sessions_consumed,
          })),
          subtotal: isFollowUp ? (receiptSale?.subtotal || subtotal) : subtotal,
          discount: isFollowUp ? (receiptSale?.discount_amount || discountAmount) : discountAmount,
          grandTotal: isFollowUp ? (receiptSale?.grand_total || grandTotal) : grandTotal,
          paidAmount: isFollowUp ? (data.paid_today !== undefined ? data.paid_today : finalPaidAmount) : finalPaidAmount,
          balanceDue: isFollowUp
            ? Math.max(0, (receiptSale?.grand_total || 0) - (receiptSale?.paid_amount || 0))
            : Math.max(0, grandTotal - finalPaidAmount),
          remainingDue: data.customer?.current_balance ?? (isFollowUp
            ? Math.max(0, (receiptSale?.grand_total || 0) - (receiptSale?.paid_amount || 0))
            : Math.max(0, grandTotal - finalPaidAmount)),
          paymentMethod: paymentMethod,
        };

        setLastReceiptData(receiptData);
        setSuccessData({ ...data, invoice: receiptData.invoiceNumber, token: receiptData.tokenNumber });
        setIsSuccess(true);

        // Open and print 80mm thermal invoice directly in a new tab/popup
        printThermalReceipt(receiptData);
      } else {
        const err = await res.json();
        alert(`Error: ${err.details || err.error || "Failed to complete sale"}`);
      }
    } catch (e: any) {
      console.error(e);
      alert("An error occurred during checkout.");
    } finally {
      setIsCheckingOut(false);
    }
  };

  const resetPOS = async () => {
    setCart([]);
    setSelectedPatientId("");
    setSelectedDoctorId("");
    setSessionRemarks("");
    setSelectedFollowUpInvoiceId("");
    setPatientActiveInvoices([]);
    setDiscountAmount(0);
    setPaidAmount(0);
    setPaymentMethod("Cash");
    setPatientSearch("");
    setServiceSearch("");
    setIsSuccess(false);
    setSuccessData(null);
    setLastReceiptData(null);

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
      <div className="max-w-2xl mx-auto mt-10 bg-white rounded-2xl shadow-xl border border-gray-100 p-8 text-center animate-in fade-in zoom-in-95">
        <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-5 shadow-inner">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h2 className="text-3xl font-extrabold text-gray-900 mb-1.5">Sale Completed!</h2>
        <p className="text-sm text-gray-500 mb-6">
          80mm Thermal Receipt has been generated &amp; sent to print.
        </p>

        <div className="bg-gradient-to-br from-gray-50 to-indigo-50/30 rounded-2xl p-6 mb-8 max-w-md mx-auto space-y-3.5 border border-indigo-100/60 shadow-sm text-left">
          <div className="flex justify-between items-center border-b border-gray-200/80 pb-3">
            <span className="text-gray-500 font-semibold text-xs uppercase tracking-wider">Queue Token</span>
            <span className="text-3xl font-black text-indigo-600 tracking-wide">{successData.token}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-500 font-medium">Invoice Number</span>
            <span className="font-bold text-gray-900">{successData.invoice}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-500 font-medium">Patient</span>
            <span className="font-bold text-gray-900">
              {lastReceiptData?.customer?.name} {lastReceiptData?.customer?.medical_id ? `(${lastReceiptData.customer.medical_id})` : ""}
            </span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-500 font-medium">Total Bill</span>
            <span className="font-bold text-gray-900">Rs. {lastReceiptData?.grandTotal?.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-500 font-medium">Payment Mode</span>
            <span className="font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
              {lastReceiptData?.paymentMethod}
            </span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
          <button
            onClick={() => lastReceiptData && printThermalReceipt(lastReceiptData)}
            className="flex-1 py-3 px-5 bg-white border border-indigo-200 text-indigo-700 rounded-xl hover:bg-indigo-50 font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-all"
          >
            <Printer className="w-4 h-4 text-indigo-600" />
            <span>Re-Print 80mm Receipt</span>
          </button>
          <button
            onClick={resetPOS}
            className="flex-1 py-3 px-5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-bold text-sm shadow-md shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Next Customer</span>
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
                className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 text-slate-900 bg-white font-medium"
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
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span>Active Treatment Package / Invoice</span>
                {isLoadingPatientInvoices && <Loader2 className="w-3 h-3 animate-spin text-indigo-600" />}
              </label>
              <select
                className={`w-full border rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all ${
                  selectedFollowUpInvoiceId
                    ? "border-purple-300 bg-purple-50/60 text-purple-900 focus:ring-2 focus:ring-purple-500"
                    : "border-gray-200 bg-white text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                }`}
                value={selectedFollowUpInvoiceId}
                onChange={(e) => handleFollowUpInvoiceSelect(e.target.value)}
                disabled={!selectedPatientId}
              >
                <option value="">-- Standard Procedure / New Visit --</option>
                {selectedPatientId && patientActiveInvoices.length === 0 && (
                  <option disabled value="">No active multi-session packages</option>
                )}
                {patientActiveInvoices.map((inv) => {
                  const pendingDue = Math.max(0, (Number(inv.grand_total) || 0) - (Number(inv.paid_amount) || 0));
                  const remainingCount = (inv.items || []).reduce((acc: number, it: any) => {
                    const rem = Math.max(0, (Number(it.sessions_allowed) || 1) - (Number(it.sessions_consumed) || 0));
                    return acc + rem;
                  }, 0);
                  const pkgNames = Array.from(
                    new Set(
                      (inv.items || [])
                        .map((it: any) => it.item_group_name || it.product?.name)
                        .filter(Boolean)
                    )
                  ).join(", ");
                  const dueLabel = pendingDue > 0 ? `Pending Due: Rs. ${pendingDue.toLocaleString()}` : "Fully Paid (Rs. 0 Due)";
                  return (
                    <option key={inv.id} value={inv.id}>
                      {inv.invoice_number}: {pkgNames || "Package"} ({remainingCount} rem) • {dueLabel}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          {/* Active Follow-up Banner */}
          {selectedFollowUpInvoice && (
            <div className="mt-3 p-3 bg-gradient-to-r from-purple-50 via-indigo-50 to-purple-50 border border-purple-200 rounded-xl text-xs flex flex-wrap items-center justify-between gap-2 shadow-2xs">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-600 shrink-0" />
                <span className="text-purple-950 font-semibold">
                  Follow-up Visit for: <strong className="font-mono text-purple-800">{selectedFollowUpInvoice.invoice_number}</strong>
                </span>
              </div>
              <div className="flex items-center gap-2">
                {followUpPendingDue > 0 ? (
                  <span className="font-bold text-amber-900 bg-amber-100 border border-amber-300 px-2.5 py-0.5 rounded-full">
                    Pending Due: Rs. {followUpPendingDue.toLocaleString("en-PK", { minimumFractionDigits: 2 })}
                  </span>
                ) : (
                  <span className="font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 rounded-full">
                    Pre-paid Package • No Session Fee (Rs. 0.00)
                  </span>
                )}
              </div>
            </div>
          )}

          <div className="mt-3">
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
              Session Remarks / Notes
            </label>
            <input
              type="text"
              className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 text-slate-900 bg-white font-medium shadow-2xs"
              placeholder="Visit notes or procedure details..."
              value={sessionRemarks}
              onChange={(e) => setSessionRemarks(e.target.value)}
            />
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
                    <th className="p-3.5 font-semibold text-xs text-gray-600 uppercase tracking-wider">Item / Service / Package</th>
                    <th className="p-3.5 font-semibold text-xs text-gray-600 uppercase tracking-wider w-28 text-center">
                      Sessions
                    </th>
                    <th className="p-3.5 font-semibold text-xs text-gray-600 uppercase tracking-wider text-right w-40">
                      Price (Editable)
                    </th>
                    <th className="p-3.5 font-semibold text-xs text-gray-600 uppercase tracking-wider text-right w-32">
                      Total
                    </th>
                    <th className="p-3.5 w-12 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {cart.map((item, idx) => {
                    if (item.is_follow_up_session) {
                      return (
                        <tr key={item.id} className="hover:bg-indigo-50/20 transition-colors bg-indigo-50/10">
                          {/* Item / Service Name */}
                          <td className="p-3.5">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-gray-900 text-sm">{item.name}</span>
                              <span className="bg-indigo-100 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded-lg uppercase tracking-wider border border-indigo-200">
                                Package Follow-up
                              </span>
                            </div>
                            <div className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                              <span>Package: <strong className="text-gray-700">{item.item_group_name}</strong></span>
                              <span>•</span>
                              <span>Invoice: <strong className="font-mono text-indigo-600">{item.original_invoice_number}</strong></span>
                            </div>
                            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                              <span className="bg-emerald-50 text-emerald-700 font-bold px-2.5 py-1 rounded-lg border border-emerald-200 flex items-center gap-1">
                                <Check className="w-3.5 h-3.5" />
                                Attending Session {(item.sessions_consumed || 0) + 1} of {item.sessions_allowed}
                              </span>
                              <span className="text-gray-500 font-medium">
                                ({Math.max(0, item.sessions_remaining - 1)} remaining after this visit)
                              </span>
                            </div>
                          </td>

                          {/* Sessions Column */}
                          <td className="p-3.5 text-center align-top pt-4">
                            <div className="inline-flex flex-col items-center">
                              <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100">
                                {(item.sessions_consumed || 0) + 1} / {item.sessions_allowed}
                              </span>
                              <span className="text-[10px] text-gray-400 mt-0.5 font-medium">
                                {item.sessions_remaining} left
                              </span>
                            </div>
                          </td>

                          {/* Price Breakdown */}
                          <td className="p-3.5 text-right align-top pt-4">
                            {followUpPendingDue > 0 ? (
                              <div className="text-right">
                                <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                  Pending Due
                                </span>
                              </div>
                            ) : (
                              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                Pre-paid (Rs. 0.00)
                              </span>
                            )}
                          </td>

                          {/* Total */}
                          <td className="p-3.5 text-right font-black text-gray-900 text-sm align-top pt-4">
                            {followUpPendingDue > 0
                              ? `Rs. ${followUpPendingDue.toLocaleString("en-PK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                              : "Rs. 0.00"}
                          </td>

                          {/* Remove */}
                          <td className="p-3.5 text-center align-top pt-4">
                            <button
                              type="button"
                              onClick={() => removeFromCart(idx)}
                              className="text-gray-400 hover:text-red-600 p-1.5 rounded-xl hover:bg-red-50 transition-colors"
                              title="Remove service from this visit"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    }

                    const isPackage = item.type === "package";

                    if (isPackage) {
                      const totalSessions = (item.items || []).reduce(
                        (acc: number, s: any) => acc + (Number(s.sessions_allowed) || 1),
                        0
                      );

                      return (
                        <tr key={item.id} className="hover:bg-purple-50/20 transition-colors bg-purple-50/5">
                          {/* Package Name & Included Services Breakdown */}
                          <td className="p-3.5">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-gray-900 text-sm">{item.name}</span>
                              <span className="bg-purple-100 text-purple-700 text-[10px] font-bold px-2 py-0.5 rounded-lg uppercase tracking-wider border border-purple-200">
                                Package Deal
                              </span>
                            </div>

                            {/* Clean breakdown of services and sessions */}
                            <div className="mt-2.5 bg-white border border-purple-100 rounded-xl p-3 shadow-2xs">
                              <div className="text-[11px] font-bold text-purple-800 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                                <Package className="w-3.5 h-3.5 text-purple-600" />
                                <span>{(item.items || []).length} Services Included</span>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {(item.items || []).map((svc: any, sIdx: number) => (
                                  <div
                                    key={sIdx}
                                    className="flex items-center justify-between text-xs bg-slate-50 border border-gray-100 px-2.5 py-1.5 rounded-lg"
                                  >
                                    <span className="text-gray-800 font-semibold truncate max-w-[140px]" title={svc.name}>
                                      {svc.name}
                                    </span>
                                    <span className="bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded-md text-[11px] shrink-0 ml-1.5 border border-indigo-100">
                                      {svc.sessions_allowed} Sessions
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </td>

                          {/* Sessions Column */}
                          <td className="p-3.5 text-center align-top pt-4">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                              {totalSessions} Total
                            </span>
                          </td>

                          {/* Single Package Price Input */}
                          <td className="p-3.5 text-right align-top pt-3.5">
                            <div className="flex items-center justify-end">
                              <div className="relative w-36">
                                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-purple-600 font-bold pointer-events-none">
                                  Rs.
                                </span>
                                <input
                                  type="number"
                                  min="0"
                                  step="any"
                                  title="Edit Complete Package Price"
                                  placeholder="0.00"
                                  className="w-full pl-8 pr-2.5 py-2 border-2 border-purple-200 hover:border-purple-400 rounded-xl text-right text-sm font-black text-purple-950 bg-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 shadow-2xs transition-all"
                                  value={item.package_price === 0 ? "0" : item.package_price}
                                  onChange={(e) => {
                                    const val = parseFloat(e.target.value);
                                    updatePackagePrice(idx, isNaN(val) ? 0 : val);
                                  }}
                                />
                              </div>
                            </div>
                            <div className="text-[10px] text-purple-700 font-semibold mt-1 pr-1">Package Total Price</div>
                          </td>

                          {/* Total */}
                          <td className="p-3.5 text-right font-black text-purple-950 text-sm align-top pt-4">
                            Rs. {Number(item.package_price || 0).toLocaleString("en-PK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>

                          {/* Remove */}
                          <td className="p-3.5 text-center align-top pt-4">
                            <button
                              type="button"
                              onClick={() => removeFromCart(idx)}
                              className="text-gray-400 hover:text-red-600 p-1.5 rounded-xl hover:bg-red-50 transition-colors"
                              title="Remove package from cart"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    }

                    // Standard Individual Service Row
                    return (
                      <tr key={item.id} className="hover:bg-indigo-50/30 transition-colors">
                        {/* Item Name */}
                        <td className="p-3.5">
                          <div className="font-semibold text-gray-900 text-sm">{item.name}</div>
                          <div className="text-xs text-gray-400 mt-0.5">Allows up to {item.sessions_allowed} sessions</div>
                        </td>

                        {/* Sessions Consumed */}
                        <td className="p-3.5 text-center">
                          <input
                            type="number"
                            min="1"
                            max={item.sessions_allowed}
                            className="w-16 border border-gray-200 rounded-xl text-center py-1.5 px-2 text-sm text-slate-900 bg-white font-semibold focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-2xs"
                            value={item.sessions_consumed}
                            onChange={(e) => updateCartItem(idx, "sessions_consumed", parseInt(e.target.value) || 1)}
                          />
                        </td>

                        {/* Editable Price Column */}
                        <td className="p-3.5 text-right">
                          <div className="flex items-center justify-end">
                            <div className="relative w-36">
                              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-semibold pointer-events-none">
                                Rs.
                              </span>
                              <input
                                type="number"
                                min="0"
                                step="any"
                                title="Click to edit charged unit price"
                                placeholder="0.00"
                                className="w-full pl-8 pr-2.5 py-2 border border-gray-200 hover:border-indigo-400 rounded-xl text-right text-sm font-bold text-slate-900 bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-2xs transition-all"
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
                        <td className="p-3.5 text-right font-bold text-gray-900 text-sm">
                          Rs. {((item.unit_price || 0) * (item.quantity || 1)).toLocaleString("en-PK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>

                        {/* Remove */}
                        <td className="p-3.5 text-center">
                          <button
                            type="button"
                            onClick={() => removeFromCart(idx)}
                            className="text-gray-400 hover:text-red-600 p-1.5 rounded-xl hover:bg-red-50 transition-colors"
                            title="Remove item"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
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
              <div className="text-base font-bold text-white bg-indigo-800/60 px-3 py-1 rounded-xl">
                {nextInvoice || "---"}
              </div>
            </div>
          </div>

          <div className="space-y-3.5 border-t border-indigo-800/60 pt-5 text-sm">
            {selectedFollowUpInvoice && (
              <div className="bg-indigo-950/90 p-3 rounded-xl border border-indigo-700/80 text-xs space-y-1.5 mb-2">
                <div className="flex justify-between text-indigo-200">
                  <span>Package Selected:</span>
                  <span className="font-bold text-white">{selectedFollowUpInvoice.invoice_number}</span>
                </div>
                <div className="flex justify-between text-indigo-200">
                  <span>Package Total:</span>
                  <span className="font-semibold text-white">Rs. {Number(selectedFollowUpInvoice.grand_total).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-indigo-200 pt-1 border-t border-indigo-800/50">
                  <span>Pending Package Due:</span>
                  <span className="font-bold text-amber-300">Rs. {followUpPendingDue.toFixed(2)}</span>
                </div>
              </div>
            )}

            <div className="flex justify-between items-center text-indigo-100">
              <span>{selectedFollowUpInvoice ? "New Extra Services" : "Subtotal"}</span>
              <span className="font-semibold text-white">Rs. {subtotal.toFixed(2)}</span>
            </div>

            <div className="flex justify-between items-center text-indigo-100">
              <span>Discount (Rs.)</span>
              <input
                type="number"
                min="0"
                className="w-24 bg-indigo-950/80 border border-indigo-700/80 rounded-xl text-right px-2.5 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-white font-bold"
                value={discountAmount}
                onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || 0)}
              />
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-indigo-800/60">
              <span className="text-base font-bold text-white">
                {selectedFollowUpInvoice ? "Total Payable Today" : "Grand Total"}
              </span>
              <span className="text-2xl font-black text-white">
                Rs. {(selectedFollowUpInvoice ? totalPayable : grandTotal).toFixed(2)}
              </span>
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
                {paymentMethod === "Cash" && (selectedFollowUpInvoice ? totalPayable : grandTotal) > 0 && (
                  <button
                    type="button"
                    onClick={() => setPaidAmount(selectedFollowUpInvoice ? totalPayable : grandTotal)}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold underline underline-offset-2"
                  >
                    Set Full (Rs. {(selectedFollowUpInvoice ? totalPayable : grandTotal).toFixed(2)})
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
                    Amount of <strong>Rs. {(selectedFollowUpInvoice ? totalPayable : grandTotal).toFixed(2)}</strong> will remain under patient&apos;s outstanding dues.
                  </span>
                </p>
              )}
              {paymentMethod === "Card" && (
                <p className="text-xs text-indigo-800 bg-indigo-50/90 p-2.5 rounded-xl mt-2 border border-indigo-200 font-medium">
                  Full bill of <strong>Rs. {(selectedFollowUpInvoice ? totalPayable : grandTotal).toFixed(2)}</strong> will be charged via Card / Online transaction.
                </p>
              )}
              {paymentMethod === "Cash" && (
                <p className="text-[11px] text-gray-500 mt-1.5 font-medium">
                  {paidAmount >= (selectedFollowUpInvoice ? totalPayable : grandTotal)
                    ? "Full payment received today."
                    : paidAmount > 0
                    ? `Partial cash received. Remaining Rs. ${((selectedFollowUpInvoice ? totalPayable : grandTotal) - paidAmount).toFixed(2)} will be saved to patient's due balance.`
                    : "No cash received. Balance will remain in patient's due balance."}
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
            disabled={!selectedPatientId || cart.length === 0 || isCheckingOut}
            className="w-full py-4 mt-6 bg-indigo-600 text-white rounded-xl font-bold text-base hover:bg-indigo-700 active:scale-98 shadow-md shadow-indigo-600/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            {isCheckingOut ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Processing &amp; Printing...</span>
              </>
            ) : (
              <>
                <Printer className="w-5 h-5" />
                <span>
                  {selectedFollowUpInvoice
                    ? grandTotal > 0
                      ? `Complete Visit & Collect Rs. ${grandTotal.toLocaleString("en-PK", { minimumFractionDigits: 2 })}`
                      : "Complete Follow-up Visit (Prepaid)"
                    : "Complete Sale & Print (80mm)"}
                </span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ==================================================== */}
      {/* QUICK ADD PATIENT MODAL (MRID auto-assigned, CNIC optional) */}
      {/* ==================================================== */}
      {isPatientModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden mx-auto border border-gray-100 max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-indigo-50/50 to-violet-50/50 shrink-0">
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
                className="p-1.5 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleAddPatient} className="p-6 space-y-4 overflow-y-auto flex-1">
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
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden mx-auto border border-gray-100 max-h-[92vh] flex flex-col">
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
                className="p-1.5 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
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

                <div className="space-y-2.5 bg-gray-50/80 p-3.5 rounded-2xl border border-gray-200/80">
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
                          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white text-slate-900 font-medium"
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
                            className="w-full border border-gray-200 rounded-xl px-2.5 py-2 text-center text-sm font-semibold text-slate-900 bg-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
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
                          className="text-gray-400 hover:text-red-600 p-1.5 rounded-xl hover:bg-red-50 transition-colors shrink-0"
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

export default function POSPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col h-[80vh] items-center justify-center space-y-4">
          <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
          <p className="text-sm font-semibold text-gray-600">Loading POS Terminal...</p>
        </div>
      }
    >
      <POSContent />
    </Suspense>
  );
}
