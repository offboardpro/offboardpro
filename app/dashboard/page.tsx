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
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isPro, setIsPro] = useState(false); 
  const [isDarkMode, setIsDarkMode] = useState(false); 
  const [showToast, setShowToast] = useState(false);
  const [loading, setLoading] = useState(true); 
  
  const [clientName, setClientName] = useState("");
  const [tools, setTools] = useState("");
  const [offboardDate, setOffboardDate] = useState("");
  const [notes, setNotes] = useState("");
  
  const [clients, setClients] = useState<any[]>([]);

  // --- NEW: SMART ALERTS CALCULATION (INTERNAL ONLY) ---
  const activeAlerts = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return clients.filter(c => {
      const pDate = new Date(c.date);
      const diffTime = pDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      // Alert if project is overdue OR due within the next 48 hours
      return c.status !== "completed" && diffDays <= 2;
    });
  }, [clients]);

  // --- DYNAMIC HEALTH SCORE CALCULATION ---
  const healthMetrics = useMemo(() => {
    if (clients.length === 0) return { score: "A+", color: "#9BCB3B" };
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const overdueRisks = clients.filter(c => {
      const projectDate = new Date(c.date);
      return projectDate < today && c.status !== "completed";
    });

    if (overdueRisks.length === 0) return { score: "A+", color: "#9BCB3B" };
    if (overdueRisks.length === 1) return { score: "B", color: "#facc15" };
    return { score: "DANGER", color: "#ef4444" };
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
            const firestoreIsPro = docSnap.data().isPro || false;
            setIsPro(firestoreIsPro);
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

  // --- PRO FEATURE: PDF GENERATION ---
  const generatePDF = () => {
    if (!isPro) return;
    const docPdf = new jsPDF();
    docPdf.setFontSize(18);
    docPdf.text("Security Offboarding Report", 14, 20);
    docPdf.setFontSize(10);
    docPdf.text(`Generated on: ${new Date().toLocaleString()}`, 14, 28);
    
    autoTable(docPdf, {
      startY: 35,
      head: [['Client Name', 'Tools/Access', 'Exit Date', 'Status']],
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

  // --- PRO FEATURE: CSV EXPORT ---
  const exportCSV = () => {
    if (!isPro) return;
    const headers = ["Client Name", "Tools", "Exit Date", "Status", "Notes"];
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

  // --- PRO FEATURE: BULK DELETE ---
  const handleBulkDelete = async () => {
    if (!isPro || clients.length === 0) return;
    const confirmBulk = confirm("Are you sure you want to delete ALL projects? This cannot be undone.");
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

  // --- DELETE ACCOUNT FEATURE (FIXED WITH RE-AUTH) ---
  const handleDeleteAccount = async () => {
    if (!user) return;
    const confirmDelete = confirm("CRITICAL: This will permanently wipe your account and all projects. This cannot be undone. Proceed?");
    
    if (confirmDelete) {
      try {
        setLoading(true);

        // --- STEP 1: Re-authenticate to fix 'auth/requires-recent-login' ---
        const provider = new GoogleAuthProvider();
        await reauthenticateWithPopup(user, provider);
        
        // --- STEP 2: Wipe Firestore Data ---
        const q = query(collection(db, "clients"), where("userId", "==", user.uid));
        const querySnapshot = await getDocs(q);
        const batch = writeBatch(db);
        querySnapshot.forEach((doc) => batch.delete(doc.ref));
        
        batch.delete(doc(db, "users", user.uid));
        await batch.commit();

        // --- STEP 3: Delete Auth Account ---
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

  const copySharedLink = (id: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/shared/${id}`);
    alert("Client Portal Link Copies!");
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
        alert("Please provide a client name and offboarding date.");
        return;
    }
    
    setIsSaving(true);
    try {
      await addDoc(collection(db, "clients"), {
        userId: user.uid,
        name: clientName,
        tools: tools,
        date: offboardDate,
        notes: isPro ? notes : "",
        status: "pending",
        createdAt: serverTimestamp()
      });

      setClientName(""); 
      setTools(""); 
      setOffboardDate(""); 
      setNotes(""); 
      setIsModalOpen(false);
      
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      
    } catch (error) {
      console.error("Save Error:", error);
      alert("Failed to save project.");
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
          ✓ Project Saved
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

            <button onClick={() => setIsSettingsOpen(true)} className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-all shadow-sm ${isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-slate-50 border-slate-100 text-[#243F74]'}`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            </button>
        </div>
      </nav>

      {/* MAIN CONTENT */}
      <main className="flex-grow w-full max-w-7xl mx-auto pt-40 md:pt-48 pb-16 px-4 md:px-8">
        
        {/* DASHBOARD ALERTS (PRO ONLY) */}
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
                      <p className={`text-[10px] font-black uppercase tracking-tight ${isDarkMode ? 'text-slate-400' : 'text-red-500'}`}>Access Revoke Overdue</p>
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
              {/* UPDATED: Displays Full Name + Hi Emoji */}
              Welcome, <span style={{ color: '#9BCB3B' }}>{user?.displayName || "Freelancer"} 👋</span>
            </h1>
            <p className="text-slate-400 font-bold text-xs uppercase tracking-widest italic">
              {clients.length} / {isPro ? '∞' : '3'} Projects used
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
            <input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className={`w-full sm:w-64 border-2 rounded-2xl px-4 py-3 text-sm font-bold outline-none transition-all ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white focus:border-[#9BCB3B]' : 'bg-white border-slate-100 focus:border-[#9BCB3B]'}`} />
            <button onClick={() => setIsModalOpen(true)} style={{ backgroundColor: '#9BCB3B' }} className="w-full sm:w-auto text-white px-8 py-3 rounded-2xl font-black text-sm uppercase shadow-xl shadow-[#9BCB3B]/30 hover:scale-[1.05] active:scale-95 transition-all">
              + Add Project
            </button>
          </div>
        </div>

        {/* PRO TOOLS ACTIONS */}
        {isPro && (
          <div className="flex flex-wrap items-center gap-4 mb-8 p-5 rounded-[2rem] border-2 bg-slate-500/5 border-slate-500/10 transition-all">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mr-2">Admin Tools:</span>
            <button onClick={generatePDF} className="bg-[#243F74] text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg shadow-[#243F74]/20">
              📄 Export PDF
            </button>
            <button onClick={exportCSV} className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all border-2 ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-100 text-[#243F74]'}`}>
              📊 Export CSV
            </button>
            <button onClick={handleBulkDelete} className="bg-red-50 text-red-500 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest ml-auto hover:bg-red-500 hover:text-white transition-all border-2 border-red-100">
              🗑 Clear All
            </button>
          </div>
        )}

        {/* STATS CARDS */}
        {isPro && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-10">
            <div className={`p-6 md:p-8 rounded-[2rem] border-2 text-center transition-colors ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Total Assets</span>
              <span className={`text-2xl md:text-3xl font-black italic ${isDarkMode ? 'text-white' : 'text-[#243F74]'}`}>{clients.length}</span>
            </div>
            
            <div className={`p-6 md:p-8 rounded-[2rem] border-2 text-center border-b-8 transition-colors ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`} style={{ borderBottomColor: healthMetrics.color }}>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Health Score</span>
              <span style={{ color: healthMetrics.color }} className="text-2xl md:text-3xl font-black italic">{healthMetrics.score}</span>
            </div>

            <div className={`p-6 md:p-8 rounded-[2rem] border-2 text-center transition-colors ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Smart Alerts</span>
              <span className={`text-2xl md:text-3xl font-black italic ${activeAlerts.length > 0 ? 'text-red-500' : 'text-[#9BCB3B]'}`}>{activeAlerts.length}</span>
            </div>

            <div className={`p-6 md:p-8 rounded-[2rem] border-2 text-center transition-colors ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Next Exit</span>
              <span className={`text-xs font-black uppercase truncate block px-2 ${isDarkMode ? 'text-slate-200' : 'text-[#243F74]'}`}>
                {clients.length > 0 ? clients[0].date : "None"}
              </span>
            </div>
          </div>
        )}

        {/* PROJECTS TABLE */}
        <div className={`hidden md:block rounded-[2.5rem] border-2 shadow-2xl overflow-hidden transition-colors ${isDarkMode ? 'bg-slate-900 border-slate-800 shadow-none' : 'bg-white border-slate-100'}`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[800px]">
              <thead className={`${isDarkMode ? 'bg-slate-800/50 border-slate-800' : 'bg-slate-50 border-slate-100'} border-b-2`}>
                <tr>
                  <th className="px-8 py-5 text-slate-400 uppercase text-[10px] font-black tracking-widest">Client & Tools</th>
                  <th className="px-8 py-5 text-slate-400 uppercase text-[10px] font-black tracking-widest text-center">Offboard Date</th>
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
                      <button 
                        onClick={() => toggleStatus(client.id, client.status)}
                        className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${client.status === 'completed' ? 'bg-[#9BCB3B] text-white' : 'bg-slate-100 text-slate-400'}`}
                      >
                        {client.status === 'completed' ? '✓ Completed' : '○ Pending'}
                      </button>
                    </td>
                    <td className="px-8 py-6 text-right whitespace-nowrap">
                      {isPro && (
                        <button onClick={() => copySharedLink(client.id)} className="text-[#9BCB3B] font-black text-[10px] uppercase tracking-widest mr-5">Copy Link</button>
                      )}
                      <button onClick={() => handleDelete(client.id)} className="text-slate-500 hover:text-red-400 font-black text-[10px] uppercase transition-colors">Remove</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* MOBILE VIEW */}
        <div className="md:hidden space-y-4">
          {filteredClients.map((client) => (
            <div key={client.id} className={`p-6 rounded-[2rem] border-2 transition-all ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-xl'}`}>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className={`font-black italic text-xl leading-tight ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>{client.name}</h3>
                  <p style={{ color: '#9BCB3B' }} className="text-[10px] font-black uppercase tracking-widest mt-1">{client.tools}</p>
                </div>
                <button 
                  onClick={() => toggleStatus(client.id, client.status)}
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${client.status === 'completed' ? 'bg-[#9BCB3B] text-white shadow-lg shadow-[#9BCB3B]/40' : 'bg-slate-100 text-slate-400'}`}
                >
                  {client.status === 'completed' ? <span className="font-black">✓</span> : <span className="font-black">○</span>}
                </button>
              </div>
              <div className="flex items-center justify-between pt-4 border-t-2 border-slate-100 dark:border-slate-800">
                <span className="text-slate-400 font-black text-sm">{client.date}</span>
                <div className="flex gap-4">
                  {isPro && <button onClick={() => copySharedLink(client.id)} className="text-[#9BCB3B] font-black text-xs uppercase tracking-widest">Link</button>}
                  <button onClick={() => handleDelete(client.id)} className="text-red-400 font-black text-xs uppercase tracking-widest">Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* SETTINGS MODAL */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xl flex items-center justify-center z-[100] px-4">
            <div className={`w-full max-w-[380px] rounded-[2.5rem] p-8 md:p-10 shadow-2xl border-t-[10px] transition-all animate-in zoom-in duration-300 ${isDarkMode ? 'bg-slate-900 border-[#9BCB3B]' : 'bg-white border-[#243F74]'}`}>
              <div className="flex justify-between items-center mb-6">
                 <h2 className={`text-2xl font-black italic ${isDarkMode ? 'text-white' : 'text-[#243F74]'}`}>Settings</h2>
                 <button onClick={() => setIsSettingsOpen(false)} className="text-slate-400 hover:text-red-500 transition-colors text-2xl font-black">✕</button>
              </div>
              <div className="space-y-4">
                <div className={`p-4 rounded-2xl text-left border-2 ${isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
                  <span className="text-[10px] font-black uppercase tracking-widest block mb-1 opacity-60 text-slate-400">Account</span>
                  <p className={`text-sm font-black truncate ${isDarkMode ? 'text-slate-200' : 'text-slate-600'}`}>{user?.email}</p>
                </div>
                <div className={`p-4 rounded-2xl border-2 flex items-center justify-between transition-all ${isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-100 shadow-sm'}`}>
                  <div className="text-left">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-0.5">Tier</span>
                    <h3 className={`text-lg font-black italic ${isDarkMode ? 'text-[#9BCB3B]' : 'text-[#243F74]'}`}>{isPro ? "Professional" : "Free Starter"}</h3>
                  </div>
                  {!isPro && <Link href="/pricing" className="bg-[#9BCB3B] text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-[#9BCB3B]/30">Upgrade</Link>}
                </div>
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <button onClick={handleLogout} className="py-4 rounded-2xl bg-slate-100 text-slate-600 font-black text-[10px] uppercase tracking-widest transition-colors hover:bg-slate-200">Log Out</button>
                  <button onClick={handleDeleteAccount} className="py-4 rounded-2xl bg-red-50 text-red-500 font-black text-[10px] uppercase tracking-widest hover:bg-red-500 border-2 border-red-100 hover:text-white transition-all shadow-lg shadow-red-500/10">Delete</button>
                </div>
              </div>
              <button onClick={() => setIsSettingsOpen(false)} className="mt-8 text-slate-400 text-xs font-black uppercase block w-full transition-colors tracking-widest text-center">Close</button>
            </div>
        </div>
      )}

      {/* ADD PROJECT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xl flex items-center justify-center z-[100] px-4">
            <div className={`w-full max-w-[480px] rounded-[2.5rem] p-8 md:p-10 shadow-2xl border-t-[10px] transition-all animate-in zoom-in duration-300 ${isDarkMode ? 'bg-slate-900 border-[#9BCB3B]' : 'bg-white border-[#9BCB3B]'}`}>
              <h2 className={`text-3xl font-black italic mb-6 ${isDarkMode ? 'text-white' : 'text-[#243F74]'}`}>New Entry</h2>
              <div className="space-y-4">
                <input type="text" value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Client Name" className={`w-full border-2 rounded-2xl px-5 py-3.5 font-black outline-none text-sm ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white focus:border-[#9BCB3B]' : 'bg-slate-50 border-slate-100 focus:border-[#9BCB3B]'}`} />
                <input type="text" value={tools} onChange={(e) => setTools(e.target.value)} placeholder="Tools (Slack, AWS...)" className={`w-full border-2 rounded-2xl px-5 py-3.5 font-black outline-none text-sm ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white focus:border-[#9BCB3B]' : 'bg-slate-50 border-slate-100 focus:border-[#9BCB3B]'}`} />
                <input type="date" value={offboardDate} onChange={(e) => setOffboardDate(e.target.value)} className={`w-full border-2 rounded-2xl px-5 py-3.5 font-black outline-none text-sm ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white focus:border-[#9BCB3B]' : 'bg-white border-slate-100 focus:border-[#9BCB3B]'}`} />
                
                <textarea disabled={!isPro} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={isPro ? "Notes..." : "Pro required for notes"} rows={3} className={`w-full border-2 rounded-2xl px-5 py-3.5 font-black outline-none resize-none text-sm ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white focus:border-[#9BCB3B]' : 'bg-white border-slate-100 focus:border-[#9BCB3B]'}`} />
                <div className="flex gap-4 pt-4">
                  <button onClick={() => setIsModalOpen(false)} className={`flex-1 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-colors ${isDarkMode ? 'bg-slate-800 text-slate-400 hover:bg-slate-700' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}>Cancel</button>
                  <button onClick={handleSave} disabled={isSaving} className="flex-1 py-4 bg-[#243F74] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-[#243F74]/30 active:scale-95 transition-all">{isSaving ? "Saving..." : "Save Project"}</button>
                </div>
              </div>
            </div>
        </div>
      )}
    </div>
  );
}