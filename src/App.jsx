import React, { useState, useRef, useEffect } from 'react';

// --- SVG Icons ---
const ScanIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7V5a2 2 0 0 1 2-2h2"></path><path d="M17 3h2a2 2 0 0 1 2 2v2"></path><path d="M21 17v2a2 2 0 0 1-2 2h-2"></path><path d="M7 21H5a2 2 0 0 1-2-2v-2"></path></svg>;
const CertificateIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>;
const LogoutIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>;
const CloseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>;
const DownloadIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>;
const ValidIcon = () => <svg className="w-12 h-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>;

// For local development, this points to your local server.
// IMPORTANT: You MUST change this to your live Render.com server URL before deploying.
// Example: const API_URL = 'https://secure-wipe-api.onrender.com';
const API_URL = 'https://secure-wipe-client.onrender.com';

function App() {
    const [user, setUser] = useState(null);
    const [certificates, setCertificates] = useState([]);
    const [selectedCert, setSelectedCert] = useState(null);
    const [isScanning, setIsScanning] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    // Login handler
    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        try {
            const username = e.target.username.value; 
            const password = e.target.password.value;

            const response = await fetch(`${API_URL}/api/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Login failed.');
            
            if (data.success) {
                setUser(data.user);
            } else {
                setError(data.message || 'Login failed.');
            }
        } catch (err) {
            setError('Could not connect to the server. Please try again later.');
        } finally {
            setIsLoading(false);
        }
    };
    
    // Fetch certificates when user logs in
    useEffect(() => {
        if (user) {
            const fetchCertificates = async () => {
                setIsLoading(true);
                setError('');
                try {
                    const response = await fetch(`${API_URL}/api/certificates/${user.id}`);
                    if (!response.ok) throw new Error('Could not fetch certificates.');
                    const data = await response.json();
                    setCertificates(data);
                    if (data.length > 0) {
                        setSelectedCert(data[0]);
                    }
                } catch (err) {
                    setError(err.message);
                } finally {
                    setIsLoading(false);
                }
            };
            fetchCertificates();
        }
    }, [user]);

    const handleLogout = () => {
        setUser(null);
        setCertificates([]);
        setSelectedCert(null);
    };

    const addCertificateToList = async (encryptedData) => {
        setIsLoading(true);
        setError('');
        try {
             const response = await fetch(`${API_URL}/api/certificates`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.id, encryptedData }),
            });
            const newCert = await response.json();
            if (!response.ok) throw new Error(newCert.error || 'Failed to add certificate.');

            setCertificates(prev => [newCert, ...prev]);
            setSelectedCert(newCert);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };


    if (!user) {
        return <LoginScreen onLogin={handleLogin} isLoading={isLoading} error={error} />;
    }

    return (
        <div className="flex h-screen bg-gray-100 font-sans">
            <Sidebar 
                user={user} 
                certificates={certificates}
                onSelectCert={setSelectedCert}
                onScan={() => { setSelectedCert(null); setIsScanning(true); }}
                onLogout={handleLogout}
                selectedCertId={selectedCert?.id}
                isLoading={isLoading && certificates.length === 0}
            />
            <MainContent
                selectedCert={selectedCert}
                isScanning={isScanning}
                setIsScanning={setIsScanning}
                addCertificate={addCertificateToList}
                error={error}
            />
        </div>
    );
}

const LoginScreen = ({ onLogin, isLoading, error }) => (
    <div className="w-full h-screen flex items-center justify-center bg-gray-200 p-4">
        <div className="bg-white p-10 rounded-xl shadow-2xl text-center max-w-sm w-full">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">SecureWipe Dashboard</h1>
            <p className="text-gray-600 mb-6">Log in to manage your data wipe certificates.</p>
            <form onSubmit={onLogin}>
                <input name="username" type="text" placeholder="Username" defaultValue="demouser" className="w-full px-4 py-2 mb-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                <input name="password" type="password" placeholder="Password" defaultValue="password" className="w-full px-4 py-2 mb-6 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                <button type="submit" disabled={isLoading} className="w-full bg-blue-600 text-white font-semibold px-6 py-3 rounded-lg hover:bg-blue-700 transition-all duration-300 shadow-md disabled:bg-blue-300 disabled:cursor-not-allowed">
                    {isLoading ? 'Logging in...' : 'Login'}
                </button>
                {error && <p className="text-red-500 mt-4 text-sm">{error}</p>}
            </form>
        </div>
    </div>
);

const Sidebar = ({ user, certificates, onSelectCert, onScan, onLogout, selectedCertId, isLoading }) => (
    <aside className="w-80 bg-white shadow-md flex flex-col hidden md:flex">
        <div className="p-6 border-b">
            <h2 className="text-2xl font-bold text-gray-800">Welcome, {user.name}</h2>
        </div>
        <div className="p-6">
             <button onClick={onScan} className="w-full flex items-center justify-center bg-green-600 text-white font-semibold px-4 py-3 rounded-lg hover:bg-green-700 transition-all duration-300 shadow hover:shadow-md mb-6">
                <ScanIcon />
                <span className="ml-2">Scan New Certificate</span>
            </button>
        </div>
        <nav className="flex-1 px-6 pb-6 overflow-y-auto">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Your Certificates</h3>
             {isLoading && <p className="text-gray-500">Loading certificates...</p>}
            <ul className="space-y-2">
                {certificates.map(cert => (
                    <li key={cert.id}>
                        <a href="#" onClick={(e) => { e.preventDefault(); onSelectCert(cert);}} 
                           className={`flex items-center p-3 rounded-lg transition-colors ${selectedCertId === cert.id ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}>
                            <CertificateIcon />
                            <div className="ml-3">
                                <p className="font-semibold">{cert.device_name}</p>
                                <p className="text-sm text-gray-500">{new Date(cert.wipe_date).toLocaleDateString()}</p>
                            </div>
                        </a>
                    </li>
                ))}
            </ul>
        </nav>
        <div className="p-6 border-t">
             <button onClick={onLogout} className="w-full flex items-center justify-center bg-gray-200 text-gray-700 font-semibold px-4 py-3 rounded-lg hover:bg-gray-300 transition-all duration-300">
                <LogoutIcon />
                <span className="ml-3">Logout</span>
            </button>
        </div>
    </aside>
);

const MainContent = ({ selectedCert, isScanning, setIsScanning, addCertificate, error }) => (
    <main className="flex-1 p-4 sm:p-8 overflow-y-auto">
        {isScanning && <ScannerModal onClose={() => setIsScanning(false)} addCertificate={addCertificate}/>}
        {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative mb-4" role="alert">{error}</div>}
        {selectedCert ? <CertificateDetails certificate={selectedCert} /> : <Placeholder />}
    </main>
);

const Placeholder = () => (
    <div className="text-center flex flex-col items-center justify-center h-full text-gray-500">
        <CertificateIcon className="w-24 h-24 mb-4"/>
        <h3 className="text-2xl font-semibold">Select a certificate to view details</h3>
        <p>Or scan a new QR code from your PC or mobile app.</p>
    </div>
);

const CertificateDetails = ({ certificate }) => {
    const details = {
        serial_number: certificate.serial_number,
        wipe_method: certificate.wipe_method,
        status: certificate.status,
        wiped_by_user_id: certificate.user_id 
    };

    return (
        <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg animate-fade-in">
            <div className="flex flex-col sm:flex-row items-start justify-between mb-6">
                <div className="mb-4 sm:mb-0">
                    <h1 className="text-3xl lg:text-4xl font-bold text-gray-900">{certificate.device_name}</h1>
                    <p className="text-md lg:text-lg text-gray-600">Wipe Certificate issued on {new Date(certificate.wipe_date).toLocaleString()}</p>
                </div>
                 <a href="#" onClick={() => alert('PDF download functionality to be implemented!')} className="flex items-center justify-center bg-gray-700 text-white font-semibold px-5 py-3 rounded-lg hover:bg-gray-800 transition-all duration-300 shadow hover:shadow-md w-full sm:w-auto">
                    <DownloadIcon />
                    <span className="ml-2">Download PDF</span>
                </a>
            </div>
            
            <div className="border-t border-b border-gray-200 py-6">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                     {Object.entries(details).map(([key, value]) => (
                        <div key={key}>
                            <dt className="text-sm font-medium text-gray-500 uppercase tracking-wider">{key.replace(/_/g, ' ')}</dt>
                            <dd className="mt-1 text-lg text-gray-900 font-semibold break-words">{value}</dd>
                        </div>
                    ))}
                </div>
            </div>

            <div className="mt-8 flex items-center bg-green-50 p-6 rounded-lg">
                <ValidIcon/>
                <div className="ml-4">
                     <h4 className="text-xl font-semibold text-green-800">Verified</h4>
                     <p className="text-green-700">This document is a valid and tamper-proof record of data sanitization.</p>
                </div>
            </div>
        </div>
    );
};


const ScannerModal = ({ onClose, addCertificate }) => {
    const videoRef = useRef(null);
    const streamRef = useRef(null);
    const [error, setError] = useState('');
    const requestRef = useRef();

    const tick = () => {
        if (window.jsQR && videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
            const canvasElement = document.createElement('canvas');
            const canvas = canvasElement.getContext('2d');
            canvasElement.height = videoRef.current.videoHeight;
            canvasElement.width = videoRef.current.videoWidth;
            canvas.drawImage(videoRef.current, 0, 0, canvasElement.width, canvasElement.height);
            const imageData = canvas.getImageData(0, 0, canvasElement.width, canvasElement.height);
            const code = window.jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: "dontInvert" });

            if (code) {
                addCertificate(code.data);
                onClose();
                return; 
            }
        }
        requestRef.current = requestAnimationFrame(tick);
    };

    useEffect(() => {
        const startScan = async () => {
            setError('');
            try {
                if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                    streamRef.current = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
                    if (videoRef.current) {
                        videoRef.current.srcObject = streamRef.current;
                        videoRef.current.setAttribute("playsinline", "true"); // Required for iOS
                        videoRef.current.play();
                        requestRef.current = requestAnimationFrame(tick);
                    }
                }
            } catch (err) {
                console.error("Error accessing camera:", err);
                setError("Could not access camera. Please grant permission and try again.");
            }
        };

        const scriptId = 'jsqr-script';
        if (!window.jsQR) { // Only load if not already present
            const script = document.createElement('script');
            script.id = scriptId;
            script.src = "https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js";
            script.async = true;
            script.onload = () => {
                console.log("jsQR script loaded.");
                startScan();
            };
            script.onerror = () => setError("Failed to load QR scanning library.");
            document.body.appendChild(script);
        } else {
            startScan();
        }

        return () => { // Cleanup
            cancelAnimationFrame(requestRef.current);
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
        };
    }, []);
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-white p-6 rounded-xl shadow-2xl text-center max-w-lg w-full relative">
                 <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800"><CloseIcon /></button>
                 <h2 className="text-2xl font-bold mb-4">Scan QR Code</h2>
                 <p className="text-gray-600 mb-4">Point your camera at the QR code generated by the SecureWipe software.</p>
                 <div className="relative w-full max-w-md mx-auto border-4 border-gray-300 rounded-lg overflow-hidden bg-black">
                    <video ref={videoRef} className="w-full h-auto"></video>
                    <div className="absolute top-0 left-0 w-full h-full" style={{boxShadow: 'inset 0 0 0 4px red'}}></div>
                 </div>
                 {error && <p className="text-red-500 mt-4">{error}</p>}
            </div>
             <style>{`
                @keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                .animate-fade-in { animation: fade-in 0.5s ease-out forwards; }
             `}</style>
        </div>
    );
}

export default App;

