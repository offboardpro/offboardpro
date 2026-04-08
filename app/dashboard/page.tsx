"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { 
  onAuthStateChanged, 
  signOut, 
  deleteUser, 
  GoogleAuthProvider, 
  reauthenticateWithPopup 
} from "firebase/auth";
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  onSnapshot, 
  deleteDoc, 
  doc, 
  writeBatch,
  updateDoc,
  getDocs,
  serverTimestamp 
} from "firebase/firestore";

// --- PDF LIBRARIES ---
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false); 
  const [viewingSubscription, setViewingSubscription] = useState(false); 
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isPro, setIsPro] = useState(false); 
  const [isDarkMode, setIsDarkMode] = useState(false); 
  const [showToast, setShowToast] = useState(false);
  const [loading, setLoading] = useState(true); 
  const [subscriptionData, setSubscriptionData] = useState<any>(null); 
  
  const [clientName, setClientName] = useState("");
  const [tools, setTools] = useState("");
  const [offboardDate, setOffboardDate] = useState("");
  const [notes, setNotes] = useState("");
  
  // NEW: Toggle state for Email Reminders
  const [emailEnabled, setEmailEnabled] = useState(true);

  const [clients, setClients] = useState<any[]>([]);

  // --- SMART ALERTS CALCULATION ---
  const activeAlerts = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return clients.filter(c => {
      const pDate = new Date(c.date);
      const diffTime = pDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return c.status !== "completed" && diffDays <= 2;
    });
  }, [clients]);

  // --- DYNAMIC SECURITY RATING CALCULATION ---
  const securityMetrics = useMemo(() => {
    if (clients.length === 0) return { score: "NOT RATED", color: "#94a3b8" }; 
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const overdueRisks = clients.filter(c => {
      const projectDate = new Date(c.date);
      return projectDate < today && c.status !== "completed";
    });

    if (overdueRisks.length === 0) return { score: "SECURED", color: "#9BCB3B" };
    if (overdueRisks.length === 1) return { score: "WARNING", color: "#facc15" };
    return { score: "AT RISK", color: "#ef4444" };
  }, [clients]);

  useEffect(() => {
    const emergencyTimer = setTimeout(() => {
      setLoading(false);
    }, 5000);

    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        router.replace("/");
      } else {
        setUser(currentUser);

        const userRef = doc(db, "users", currentUser.uid);
        const unsubscribeUser = onSnapshot(userRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            const firestoreIsPro = data.isPro || false;
            const expiryDate = data.expiresAt?.toDate(); 
            
            setSubscriptionData({
                expiry: expiryDate ? expiryDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : "N/A",
                plan: firestoreIsPro ? "Professional" : "Free Starter"
            });

            const today = new Date();

            if (firestoreIsPro && expiryDate && today > expiryDate) {
              setIsPro(false);
              updateDoc(userRef, { isPro: false });
            } else {
              setIsPro(firestoreIsPro);
            }
          } else {
            setIsPro(false);
          }
          setLoading(false); 
          clearTimeout(emergencyTimer);
        }, (error) => {
          console.error("User sync error:", error);
          setLoading(false); 
        });

        const q = query(
          collection(db, "clients"), 
          where("userId", "==", currentUser.uid)
        );

        const unsubscribeData = onSnapshot(q, (snapshot) => {
          const clientData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setClients(clientData);
        });

        return () => {
          unsubscribeUser();
          unsubscribeData();
        };
      }
    });

    return () => {
      unsubscribeAuth();
      clearTimeout(emergencyTimer);
    };
  }, [router]);

  const generatePDF = () => {
    if (!isPro) return;
    const docPdf = new jsPDF();
    docPdf.setFontSize(18);
    docPdf.text("Security Offboarding Report", 14, 20);
    docPdf.setFontSize(10);
    docPdf.text(`Generated on: ${new Date().toLocaleString()}`, 14, 28);
    
    autoTable(docPdf, {
      startY: 35,
      head: [['Client Name', 'Tools/Access', 'Review Date', 'Status']],
      body: filteredClients.map(c => [
        c.name, 
        c.tools, 
        c.date, 
        c.status === 'completed' ? 'SECURED' : 'PENDING'
      ]),
      headStyles: { fillColor: [36, 63, 116] },
    });
    
    docPdf.save(`OffboardPro_Report_${new Date().getTime()}.pdf`);
  };

  const exportCSV = () => {
    if (!isPro) return;
    const headers = ["Client Name", "Tools", "Review Date", "Status", "Notes"];
    const csvData = filteredClients.map(c => [
      c.name,
      c.tools,
      c.date,
      c.status,
      c.notes || ""
    ]);

    const content = [headers, ...csvData].map(e => e.join(",")).join("\n");
    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "offboarding_data.csv");
    link.click();
  };

  const handleBulkDelete = async () => {
    if (!isPro || clients.length === 0) return;
    const confirmBulk = confirm("Are you sure you want to delete ALL clients? This cannot be undone.");
    if (confirmBulk) {
      try {
        const batch = writeBatch(db);
        clients.forEach((client) => {
          batch.delete(doc(db, "clients", client.id));
        });
        await batch.commit();
        alert("All data cleared successfully.");
      } catch (e) {
        console.error("Bulk delete error", e);
      }
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    const confirmDelete = confirm("CRITICAL: This will permanently wipe your account and all projects. This cannot be undone. Proceed?");
    
    if (confirmDelete) {
      try {
        setLoading(true);
        const provider = new GoogleAuthProvider();
        await reauthenticateWithPopup(user, provider);
        
        const q = query(collection(db, "clients"), where("userId", "==", user.uid));
        const querySnapshot = await getDocs(q);
        const batch = writeBatch(db);
        querySnapshot.forEach((doc) => batch.delete(doc.ref));
        
        batch.delete(doc(db, "users", user.uid));
        await batch.commit();

        await deleteUser(user);
        router.push("/");
      } catch (error: any) {
        console.error(error);
        if (error.code === "auth/requires-recent-login") {
           alert("Session expired. Please log out and log back in to verify your identity for deletion.");
        } else {
           alert("Account deletion failed. Please try again later.");
        }
        setLoading(false);
      }
    }
  };

  const toggleStatus = async (id: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === "completed" ? "pending" : "completed";
      await updateDoc(doc(db, "clients", id), { status: newStatus });
    } catch (error) {
      console.error("Status update failed:", error);
    }
  };

  const viewPortal = (id: string) => {
    if (!isPro) return;
    const portalUrl = `${window.location.origin}/shared/${id}`;
    window.open(portalUrl, "_blank");
    navigator.clipboard.writeText(portalUrl);
    alert("Client Portal link copied to clipboard!");
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    if (!isPro && clients.length >= 3) {
      alert("Starter plan is limited to 3 clients.");
      router.push("/pricing");
      return;
    }
    if (clientName.trim() === "" || offboardDate === "") {
        alert("Please provide a client name and access review date.");
        return;
    }
    setIsSaving(true);
    try {
      await addDoc(collection(db, "clients"), {
        userId: user.uid,
        userEmail: user.email, // <--- SYNC EMAIL TO CLIENT RECORD FOR THE ROBOT
        name: clientName,
        tools: tools,
        date: offboardDate,
        notes: isPro ? notes : "",
        status: "pending",
        // SAVE TOGGLE STATE:
        emailEnabled: isPro ? emailEnabled : false,
        createdAt: serverTimestamp()
      });
      setClientName(""); setTools(""); setOffboardDate(""); setNotes(""); 
      setEmailEnabled(true); // Reset toggle for next client
      setIsModalOpen(false);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (error) {
      console.error("Save Error:", error);
      alert("Failed to save client.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, "clients", id));
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  const filteredClients = clients.filter(client => 
    client.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.tools?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white">
        <div className="w-10 h-10 border-4 border-slate-100 border-t-[#243F74] rounded-full animate-spin mb-4"></div>
        <p className="text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] animate-pulse">Syncing Dashboard...</p>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-500 ${isDarkMode ? 'bg-[#0F172A]' : 'bg-[#F8FAFC]'} pb-10 relative text-sm`}>
      {showToast && (
        <div className="fixed top-24 right-4 md:right-10 z-[70] bg-[#9BCB3B] text-white px-5 py-2 rounded-xl font-black text-xs uppercase shadow-2xl animate-bounce">
          ✓ Client Saved
        </div>
      )}

      {/* NAVIGATION */}
      <nav className={`fixed w-full top-0 z-40 backdrop-blur-md border-b px-4 md:px-10 py-4 flex justify-between items-center transition-all ${isDarkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white/90 border-slate-100 shadow-sm'}`}>
        <div className="flex items-center gap-3">
          <Link href="/">
              <Image src="/logo.png" alt="OffboardPro" width={110} height={35} className={`object-contain transition-all ${isDarkMode ? 'invert brightness-200' : ''}`} priority />
          </Link>
          <span className={`${isPro ? 'bg-[#9BCB3B] text-white' : 'bg-slate-200 text-slate-500'} text-[9px] px-2.5 py-0.5 rounded-full font-black uppercase tracking-widest shadow-sm`}>
            {isPro ? "PRO" : "FREE"}
          </span>
        </div>
        
        <div className="flex items-center gap-3">
            {isPro && (
              <button 
                onClick={() => setIsDarkMode(!isDarkMode)}
                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all shadow-sm ${isDarkMode ? 'bg-slate-800 text-yellow-400 border-slate-700' : 'bg-slate-50 text-slate-400 border-slate-100'} border`}
              >
                {isDarkMode ? "☀️" : "🌙"}
              </button>
            )}

            <button onClick={() => { setIsSettingsOpen(true); setViewingSubscription(false); }} className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-all shadow-sm ${isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-slate-50 border-slate-100 text-[#243F74]'}`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            </button>
        </div>
      </nav>

      {/* MAIN CONTENT */}
      <main className="flex-grow w-full max-w-7xl mx-auto pt-40 md:pt-48 pb-16 px-4 md:px-8">
        
        {/* --- PRO ONLY: EMAIL WHITELIST NOTE --- */}
        {isPro && (
          <div className={`mb-8 p-4 rounded-2xl border-2 border-dashed flex flex-col md:flex-row items-center justify-between gap-4 transition-all animate-in fade-in slide-in-from-top-4 duration-700 ${isDarkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-blue-50/30 border-blue-100'}`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 flex-shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className={`text-[10px] font-black uppercase tracking-widest ${isDarkMode ? 'text-slate-300' : 'text-[#243F74]'}`}>
                  Ensure Pro Delivery
                </p>
                <p className="text-[11px] font-bold text-slate-400">
                  Add <span className="text-[#9BCB3B]">offboardpro@gmail.com</span> to your contacts to ensure your automated alerts land in your primary inbox.
                </p>
              </div>
            </div>
            <button 
              onClick={() => alert("Check your spam folder and click 'Not Spam' to help our robot learn!")}
              className="text-[9px] font-black uppercase tracking-widest px-4 py-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all text-slate-500 shadow-sm"
            >
              Learn More
            </button>
          </div>
        )}
        {/* --- END OF NOTE --- */}

        {/* PRO AUTOMATION BADGE */}
        {isPro && (
          <div className="flex items-center gap-2 mb-6 p-3 bg-blue-50/50 border border-blue-100 rounded-2xl w-fit animate-in fade-in slide-in-from-left-4 duration-700">
            <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse"></div>
            <span className="text-[10px] font-black uppercase tracking-widest text-blue-600">
              Pro Automation: Daily 9:00 AM Scan Active
            </span>
          </div>
        )}

        {isPro && activeAlerts.length > 0 && (
          <div className="mb-10 animate-in fade-in slide-in-from-top-4 duration-500">
             <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-red-500 mb-3 flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
                Smart Security Alerts
             </h4>
             <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                {activeAlerts.map(alert => (
                  <div key={alert.id} className={`min-w-[300px] border-2 p-5 rounded-[2rem] flex items-center justify-between transition-all ${isDarkMode ? 'bg-red-500/10 border-red-500/20' : 'bg-red-50 border-red-100 shadow-lg shadow-red-500/5'}`}>
                    <div>
                      <p className={`font-black text-sm italic mb-1 ${isDarkMode ? 'text-red-400' : 'text-[#243F74]'}`}>{alert.name}</p>
                      <p className={`text-[10px] font-black uppercase tracking-tight ${isDarkMode ? 'text-slate-400' : 'text-red-500'}`}>Access Review Overdue</p>
                    </div>
                    <button onClick={() => toggleStatus(alert.id, alert.status)} className={`px-4 py-2 rounded-xl font-black text-[9px] uppercase tracking-widest shadow-sm transition-all hover:scale-105 active:scale-95 ${isDarkMode ? 'bg-red-500 text-white' : 'bg-white text-red-500'}`}>Secure</button>
                  </div>
                ))}
             </div>
          </div>
        )}

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-10 text-center lg:text-left">
          <div>
            <h1 className={`text-3xl md:text-5xl font-black tracking-tight italic mb-2 transition-colors ${isDarkMode ? 'text-white' : 'text-[#243F74]'}`}>
              Welcome, <span style={{ color: '#9BCB3B' }}>{user?.displayName || "Freelancer"} 👋</span>
            </h1>
            <p className="text-slate-400 font-bold text-xs uppercase tracking-widest italic">
              {clients.length === 0 ? "No client access tracked yet." : `${clients.length} / ${isPro ? '∞' : '3'} clients tracked`}
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
            <input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className={`w-full sm:w-64 border-2 rounded-2xl px-4 py-3 text-sm font-bold outline-none transition-all ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white focus:border-[#9BCB3B]' : 'bg-white border-slate-100 focus:border-[#9BCB3B]'}`} />
            
            <div className="flex items-center gap-3 w-full sm:w-auto">
              {!isPro && (
                <Link 
                  href="/pricing"
                  className="flex-1 sm:flex-none bg-[#9BCB3B] text-white px-6 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-[#9BCB3B]/20 hover:scale-[1.05] active:scale-95 transition-all text-center flex items-center justify-center gap-2"
                >
                  🚀 Upgrade
                </Link>
              )}
              
              <button 
                onClick={() => setIsModalOpen(true)} 
                style={{ backgroundColor: '#243F74' }} 
                className="group flex-1 sm:flex-none text-white px-8 py-3.5 rounded-2xl font-black text-sm uppercase shadow-xl shadow-[#243F74]/20 hover:scale-[1.05] active:scale-95 transition-all flex items-center justify-center gap-3"
              >
                <span className="bg-[#9BCB3B] rounded-lg p-0.5 group-hover:rotate-90 transition-transform duration-300">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M12 4v16m8-8H4" /></svg>
                </span>
                Add Client Project
              </button>
            </div>
          </div>
        </div>

        {/* PRO TOOLS ACTIONS */}
        {isPro && (
          <div className="flex flex-wrap items-center gap-4 mb-8 p-5 rounded-[2rem] border-2 bg-slate-500/5 border-slate-500/10 transition-all">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mr-2">Admin Tools:</span>
            <button onClick={generatePDF} className="bg-[#243F74] text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg shadow-[#243F74]/20">📄 Export PDF</button>
            <button onClick={exportCSV} className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all border-2 ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-100 text-[#243F74]'}`}>📊 Export CSV</button>
            <button onClick={handleBulkDelete} className="bg-red-50 text-red-500 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest ml-auto hover:bg-red-500 hover:text-white transition-all border-2 border-red-100">🗑 Clear All</button>
          </div>
        )}

        {/* STATS CARDS */}
        {isPro && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-10">
            <div className={`p-6 md:p-8 rounded-[2rem] border-2 text-center transition-colors ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Client Tools Tracked</span>
              <span className={`text-2xl md:text-3xl font-black italic ${isDarkMode ? 'text-white' : 'text-[#243F74]'}`}>{clients.length === 0 ? "0" : clients.length}</span>
            </div>
            <div className={`p-6 md:p-8 rounded-[2rem] border-2 text-center border-b-8 transition-colors ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`} style={{ borderBottomColor: securityMetrics.color }}>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Access Status</span>
              <span style={{ color: securityMetrics.color }} className="text-sm md:text-lg font-black uppercase tracking-[0.15em] italic block mt-2">{securityMetrics.score}</span>
            </div>
            <div className={`p-6 md:p-8 rounded-[2rem] border-2 text-center transition-colors ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Access Alerts</span>
              <span className={`text-2xl md:text-3xl font-black italic ${activeAlerts.length > 0 ? 'text-red-500' : 'text-[#9BCB3B]'}`}>{activeAlerts.length === 0 ? "ALL CLEAR" : activeAlerts.length}</span>
            </div>
            <div className={`p-6 md:p-8 rounded-[2rem] border-2 text-center transition-colors ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Next Access Review</span>
              <span className={`text-xs font-black uppercase truncate block px-2 ${isDarkMode ? 'text-slate-200' : 'text-[#243F74]'}`}>{clients.length > 0 ? clients[0].date : "NONE"}</span>
            </div>
          </div>
        )}

        {/* DYNAMIC EMPTY STATE VS TABLE */}
        {clients.length === 0 ? (
          <div className={`flex flex-col items-center justify-center py-24 px-6 rounded-[3rem] border-2 border-dashed transition-colors text-center ${isDarkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-50/50 border-slate-200'}`}>
            <div className={`w-20 h-20 rounded-full flex items-center justify-center shadow-sm mb-6 ${isDarkMode ? 'bg-slate-800' : 'bg-white'}`}>
              <svg className="w-10 h-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
            </div>
            <h3 className={`text-2xl font-black italic mb-3 ${isDarkMode ? 'text-white' : 'text-[#243F74]'}`}>No client access tracked.</h3>
            <p className="text-slate-400 max-w-sm font-bold leading-relaxed mb-8 uppercase text-[10px] tracking-widest">Add your first client to track tools and avoid forgotten access later.</p>
            <button onClick={() => setIsModalOpen(true)} className="text-[#243F74] dark:text-[#9BCB3B] font-black uppercase text-xs tracking-widest border-b-2 border-[#9BCB3B] pb-1 hover:opacity-70 transition-all">Add First Client &rarr;</button>
          </div>
        ) : (
          <>
            <div className={`hidden md:block rounded-[2.5rem] border-2 shadow-2xl overflow-hidden transition-colors ${isDarkMode ? 'bg-slate-900 border-slate-800 shadow-none' : 'bg-white border-slate-100'}`}>
              <div className="overflow-x-auto">
                <table className="w-full text-left min-w-[800px]">
                  <thead className={`${isDarkMode ? 'bg-slate-800/50 border-slate-800' : 'bg-slate-50 border-slate-100'} border-b-2`}>
                    <tr>
                      <th className="px-8 py-5 text-slate-400 uppercase text-[10px] font-black tracking-widest">Client & Tools</th>
                      <th className="px-8 py-5 text-slate-400 uppercase text-[10px] font-black tracking-widest text-center">Review Date</th>
                      <th className="px-8 py-5 text-slate-400 uppercase text-[10px] font-black text-center">Status</th>
                      <th className="px-8 py-5 text-slate-400 uppercase text-[10px] font-black text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredClients.map((client) => (
                      <tr key={client.id} className={`border-b-2 transition-colors ${isDarkMode ? 'border-slate-800 hover:bg-slate-800/30' : 'border-slate-50 hover:bg-slate-50/50'}`}>
                        <td className="px-8 py-6">
                          <div className={`font-black italic text-lg leading-tight ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>{client.name}</div>
                          <div style={{ color: '#9BCB3B' }} className="text-[10px] font-black uppercase mt-1 tracking-widest">{client.tools}</div>
                        </td>
                        <td className={`px-8 py-6 text-center font-black text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{client.date}</td>
                        <td className="px-8 py-6 text-center">
                          <button onClick={() => toggleStatus(client.id, client.status)} className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${client.status === 'completed' ? 'bg-[#9BCB3B] text-white' : 'bg-slate-100 text-slate-400'}`}>{client.status === 'completed' ? '✓ Secured' : '○ Pending'}</button>
                        </td>
                        <td className="px-8 py-6 text-right whitespace-nowrap">
                          {isPro && <button onClick={() => viewPortal(client.id)} className="text-[#9BCB3B] font-black text-[10px] uppercase tracking-widest mr-5 hover:underline decoration-2">View Portal</button>}
                          <button onClick={() => handleDelete(client.id)} className="text-slate-500 hover:text-red-400 font-black text-[10px] uppercase transition-colors">Remove</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="md:hidden space-y-4">
              {filteredClients.map((client) => (
                <div key={client.id} className={`p-6 rounded-[2rem] border-2 transition-all ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-xl'}`}>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className={`font-black italic text-xl leading-tight ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>{client.name}</h3>
                      <p style={{ color: '#9BCB3B' }} className="text-[10px] font-black uppercase tracking-widest mt-1">{client.tools}</p>
                    </div>
                    <button onClick={() => toggleStatus(client.id, client.status)} className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${client.status === 'completed' ? 'bg-[#9BCB3B] text-white shadow-lg shadow-[#9BCB3B]/40' : 'bg-slate-100 text-slate-400'}`}>{client.status === 'completed' ? '✓' : '○'}</button>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t-2 border-slate-100 dark:border-slate-800">
                    <span className="text-slate-400 font-black text-sm">{client.date}</span>
                    <div className="flex gap-4">
                      {isPro && <button onClick={() => viewPortal(client.id)} className="text-[#9BCB3B] font-black text-xs uppercase tracking-widest">Portal</button>}
                      <button onClick={() => handleDelete(client.id)} className="text-red-400 font-black text-xs uppercase tracking-widest">Delete</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </main>

      {/* SETTINGS MODAL */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xl flex items-center justify-center z-[100] px-4">
            <div className={`w-full max-w-[380px] rounded-[2.5rem] p-8 md:p-10 shadow-2xl border-t-[10px] transition-all animate-in zoom-in duration-300 ${isDarkMode ? 'bg-slate-900 border-[#9BCB3B]' : 'bg-white border-[#243F74]'}`}>
              
              {!viewingSubscription ? (
                <>
                  <div className="flex justify-between items-center mb-6">
                     <h2 className={`text-2xl font-black italic ${isDarkMode ? 'text-white' : 'text-[#243F74]'}`}>Settings</h2>
                     <button onClick={() => setIsSettingsOpen(false)} className="text-slate-400 hover:text-red-500 transition-colors text-2xl font-black">✕</button>
                  </div>
                  <div className="space-y-4">
                    <div className={`p-4 rounded-2xl text-left border-2 ${isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
                      <span className="text-[10px] font-black uppercase tracking-widest block mb-1 opacity-60 text-slate-400">Account</span>
                      <p className={`text-sm font-black truncate ${isDarkMode ? 'text-slate-200' : 'text-slate-600'}`}>{user?.email}</p>
                    </div>

                    <button 
                      onClick={() => setViewingSubscription(true)}
                      className={`w-full p-4 rounded-2xl border-2 flex items-center justify-between transition-all group ${isDarkMode ? 'bg-slate-800/50 border-slate-700 hover:border-[#9BCB3B]' : 'bg-white border-slate-100 shadow-sm hover:border-[#243F74]'}`}
                    >
                      <div className="text-left">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-0.5">Subscription</span>
                        <h3 className={`text-lg font-black italic ${isDarkMode ? 'text-[#9BCB3B]' : 'text-[#243F74]'}`}>{isPro ? "Professional" : "Free Starter"}</h3>
                      </div>
                      <span className="text-xl group-hover:translate-x-1 transition-transform">→</span>
                    </button>

                    <div className="grid grid-cols-2 gap-4 pt-2">
                      <button onClick={handleLogout} className="py-4 rounded-2xl bg-slate-100 text-slate-600 font-black text-[10px] uppercase tracking-widest transition-colors hover:bg-slate-200">Log Out</button>
                      <button onClick={handleDeleteAccount} className="py-4 rounded-2xl bg-red-50 text-red-500 font-black text-[10px] uppercase tracking-widest hover:bg-red-500 border-2 border-red-100 hover:text-white transition-all shadow-lg shadow-red-500/10">Delete</button>
                    </div>
                  </div>
                  <button onClick={() => setIsSettingsOpen(false)} className="mt-8 text-slate-400 text-xs font-black uppercase block w-full transition-colors tracking-widest text-center">Close</button>
                </>
              ) : (
                <div className="animate-in slide-in-from-right-4 duration-300">
                  <div className="flex items-center gap-3 mb-6">
                    <button onClick={() => setViewingSubscription(false)} className="text-slate-400 text-lg">←</button>
                    <h2 className={`text-2xl font-black italic ${isDarkMode ? 'text-white' : 'text-[#243F74]'}`}>Billing</h2>
                  </div>

                  <div className={`p-5 rounded-3xl border-2 mb-6 ${isDarkMode ? 'bg-slate-800/30 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
                    <div className="mb-4">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Current Plan</span>
                      <div className="flex items-center justify-between">
                        <h4 className={`text-xl font-black italic ${isDarkMode ? 'text-white' : 'text-[#243F74]'}`}>{subscriptionData?.plan}</h4>
                        <span className="bg-[#9BCB3B]/10 text-[#9BCB3B] text-[9px] px-2 py-1 rounded-md font-black">ACTIVE</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 border-t border-slate-200 dark:border-slate-700 pt-4">
                      <div>
                        <span className="text-[9px] font-black uppercase text-slate-400 block">Provider</span>
                        <p className={`text-xs font-black ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>Razorpay</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {!isPro ? (
                      <button 
                        onClick={() => router.push("/pricing")}
                        className="w-full py-4 bg-[#9BCB3B] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-[#9BCB3B]/20 transition-all hover:scale-[1.02]"
                      >
                        Upgrade to Pro
                      </button>
                    ) : (
                      <button 
                        onClick={() => {
                          if(confirm("Are you sure you want to cancel? You will lose Pro access at the end of your billing cycle.")) {
                             alert("Cancellation request received. Our team will process this within 24 hours.");
                          }
                        }}
                        className="w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest text-red-400 hover:bg-red-50 transition-all border-2 border-transparent hover:border-red-100"
                      >
                        Cancel Subscription
                      </button>
                    )}
                  </div>

                  <p className="text-[8px] text-slate-400 font-bold uppercase text-center mt-6 leading-relaxed">
                    Managed via Razorpay Secure. <br/> Support: support@offboardpro.com
                  </p>
                </div>
              )}
            </div>
        </div>
      )}

      {/* ADD CLIENT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xl flex items-center justify-center z-[100] px-4">
            <div className={`w-full max-w-[480px] rounded-[2.5rem] p-8 md:p-10 shadow-2xl border-t-[10px] transition-all animate-in zoom-in duration-300 ${isDarkMode ? 'bg-slate-900 border-[#9BCB3B]' : 'bg-white border-[#9BCB3B]'}`}>
              
              <h2 className={`text-3xl font-black italic mb-6 ${isDarkMode ? 'text-white' : 'text-[#243F74]'}`}>Add Client Project</h2>
              
              <div className="space-y-4">
                <input 
                  type="text" 
                  value={clientName} 
                  onChange={(e) => setClientName(e.target.value)} 
                  placeholder="Client / Company name" 
                  className={`w-full border-2 rounded-2xl px-5 py-3.5 font-black outline-none text-sm ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white focus:border-[#9BCB3B]' : 'bg-slate-50 border-slate-100 focus:border-[#9BCB3B]'}`} 
                />

                <input 
                  type="text" 
                  value={tools} 
                  onChange={(e) => setTools(e.target.value)} 
                  placeholder="Tools used for this client (Slack, AWS, GA4, etc.)" 
                  className={`w-full border-2 rounded-2xl px-5 py-3.5 font-black outline-none text-sm ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white focus:border-[#9BCB3B]' : 'bg-slate-50 border-slate-100 focus:border-[#9BCB3B]'}`} 
                />

                <div className="relative">
                  <div className="absolute left-5 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none">
                    <svg className="w-4 h-4 text-[#9BCB3B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 whitespace-nowrap">Access review date:</span>
                  </div>
                  <input 
                    type="date" 
                    value={offboardDate} 
                    onChange={(e) => setOffboardDate(e.target.value)} 
                    className={`w-full border-2 rounded-2xl pl-48 md:pl-56 pr-5 py-3.5 font-black outline-none text-sm ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white focus:border-[#9BCB3B]' : 'bg-white border-slate-100 focus:border-[#9BCB3B]'}`} 
                  />
                </div>
                
                <textarea 
                  disabled={!isPro} 
                  value={notes} 
                  onChange={(e) => setNotes(e.target.value)} 
                  placeholder={isPro ? "Notes (optional)" : "Pro required for notes"} 
                  rows={3} 
                  className={`w-full border-2 rounded-2xl px-5 py-3.5 font-black outline-none resize-none text-sm ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white focus:border-[#9BCB3B]' : 'bg-white border-slate-100 focus:border-[#9BCB3B]'}`} 
                />

                {/* EMAIL REMINDER PRO SECTION WITH FUNCTIONAL TOGGLE */}
                {isPro ? (
                  <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-xl">
                        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-blue-700">Email Alerts</p>
                        <p className="text-[9px] font-bold text-blue-500 uppercase">
                          {emailEnabled ? "Active at 9:00 AM" : "Reminders Muted"}
                        </p>
                      </div>
                    </div>
                    {/* CLICKABLE TOGGLE BUTTON */}
                    <button 
                      onClick={() => setEmailEnabled(!emailEnabled)}
                      className={`w-10 h-5 rounded-full relative transition-all duration-300 ${emailEnabled ? 'bg-blue-600' : 'bg-slate-300'}`}
                    >
                      <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all duration-300 ${emailEnabled ? 'right-1' : 'left-1'}`}></div>
                    </button>
                  </div>
                ) : (
                  <div className="p-4 bg-slate-50 border border-slate-100 border-dashed rounded-2xl flex items-center justify-between opacity-60">
                    <div className="flex items-center gap-3">
                      <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2-2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Email Alerts (Pro)</p>
                        <p className="text-[8px] font-bold text-slate-400 uppercase">Upgrade to enable reminders</p>
                      </div>
                    </div>
                    <button onClick={() => router.push("/pricing")} className="text-[8px] font-black bg-slate-200 text-slate-500 px-2 py-1 rounded-md uppercase tracking-widest hover:bg-[#9BCB3B] hover:text-white transition-all">Unlock</button>
                  </div>
                )}

                <div className="flex gap-4 pt-4">
                  <button onClick={() => setIsModalOpen(false)} className={`flex-1 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-colors ${isDarkMode ? 'bg-slate-800 text-slate-400 hover:bg-slate-700' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}>Cancel</button>
                  <button onClick={handleSave} disabled={isSaving} className="flex-1 py-4 bg-[#243F74] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-[#243F74]/30 active:scale-95 transition-all">{isSaving ? "Saving..." : "SAVE CLIENT"}</button>
                </div>
              </div>
            </div>
        </div>
      )}
    </div>
  );
}