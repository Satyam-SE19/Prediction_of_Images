import React, { useState, useCallback } from 'react';
import { Upload, Camera, FileImage, Sparkles, Sprout, ArrowRight } from 'lucide-react';
import { classifyAnimalImage } from './services/geminiService.js';
import AnalysisView from './components/AnalysisView.jsx';
import ChatWidget from './components/ChatWidget.jsx';
import MarketSearch from './components/MarketSearch.jsx';
import { AppState } from './types.js';

const App = () => {
  const [appState, setAppState] = useState(AppState.IDLE);
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedMime, setSelectedMime] = useState(null);
  const [analysisData, setAnalysisData] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const handleImageFile = (file) => {
    if (!file.type?.startsWith('image/')) {
      setErrorMsg("Please upload a valid image file.");
      return;
    }

    // 10MB limit guard to avoid model errors on oversized uploads
    const maxBytes = 10 * 1024 * 1024;
    if (file.size > maxBytes) {
      setErrorMsg("Image too large (max 10MB). Please choose a smaller file.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result;
      setSelectedImage(base64String);
      setSelectedMime(file.type || 'image/jpeg');
      processImage(base64String.split(',')[1], file.type); // Send only the base64 data, remove prefix
    };
    reader.readAsDataURL(file);
  };

  const processImage = async (base64Data, mimeType) => {
    setAppState(AppState.ANALYZING);
    setErrorMsg(null);
    try {
      const result = await classifyAnimalImage(base64Data, mimeType);
      setAnalysisData(result);
      setAppState(AppState.SUCCESS);
    } catch (error) {
      console.error(error);
      setAppState(AppState.ERROR);
      setErrorMsg(error?.message || "Failed to analyze image. Please try again.");
    }
  };

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImageFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleImageFile(e.target.files[0]);
    }
  };

  const handleReset = () => {
    setAppState(AppState.IDLE);
    setSelectedImage(null);
    setSelectedMime(null);
    setAnalysisData(null);
    setErrorMsg(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans selection:bg-emerald-200">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-40 backdrop-blur-md bg-white/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="bg-emerald-100 p-2 rounded-lg">
                <Sprout className="h-6 w-6 text-emerald-600" />
              </div>
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-teal-600">
                Cattle & Buffalo Lens
              </span>
            </div>
            <div className="flex items-center gap-4">
              <a href="#" className="text-sm font-medium text-gray-500 hover:text-emerald-600 transition">About</a>
              <a href="#" className="text-sm font-medium text-gray-500 hover:text-emerald-600 transition">Guide</a>
              <button className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition">
                Sign In
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        {appState === AppState.IDLE && (
           <div className="text-center mb-12 animate-fadeIn">
             <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-sm font-medium mb-6">
                <Sparkles className="w-4 h-4" /> Powered by Lovely Institute of Technology
             </div>
             <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 tracking-tight mb-6">
               Smart Classification for <br />
               <span className="text-emerald-600">Cattle & Buffaloes</span>
             </h1>
             <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-10">
               Upload a photo to instantly identify breeds, assess health conditions, and receive AI-powered care recommendations tailored for your livestock.
             </p>

             {/* Upload Zone */}
             <div 
               className={`max-w-2xl mx-auto border-3 border-dashed rounded-3xl p-10 transition-all duration-300 ${
                 dragActive 
                   ? 'border-emerald-500 bg-emerald-50 scale-105' 
                   : 'border-gray-300 hover:border-emerald-400 hover:bg-white bg-white/50'
               }`}
               onDragEnter={handleDrag}
               onDragLeave={handleDrag}
               onDragOver={handleDrag}
               onDrop={handleDrop}
             >
                <div className="flex flex-col items-center justify-center space-y-4">
                  <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-2 animate-float">
                    <Upload className="w-10 h-10 text-emerald-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800">Drag & drop your animal image</h3>
                  <p className="text-gray-500">or</p>
                  <label className="relative cursor-pointer">
                    <span className="bg-emerald-600 text-white px-8 py-3 rounded-xl font-medium shadow-lg hover:bg-emerald-700 transition-all hover:shadow-emerald-500/30 flex items-center gap-2">
                       <FileImage className="w-5 h-5" /> Browse Files
                    </span>
                    <input type="file" className="hidden" onChange={handleChange} accept="image/*" />
                  </label>
                  <p className="text-xs text-gray-400 mt-4">Supported formats: JPG, PNG, WEBP (Max 10MB)</p>
                </div>
             </div>
             
             {/* Features Grid */}
             <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20 text-left">
               <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition">
                 <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                   <Camera className="w-6 h-6 text-blue-600" />
                 </div>
                 <h3 className="font-bold text-lg mb-2">Visual Identification</h3>
                 <p className="text-gray-600 text-sm">Instantly distinguish between cattle breeds and buffalo types with high accuracy.</p>
               </div>
               <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition">
                 <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                   <Sparkles className="w-6 h-6 text-green-600" />
                 </div>
                 <h3 className="font-bold text-lg mb-2">Health Insights</h3>
                 <p className="text-gray-600 text-sm">Get preliminary health assessments and visible condition checks powered by AI vision.</p>
               </div>
               <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition">
                 <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                   <ArrowRight className="w-6 h-6 text-purple-600" />
                 </div>
                 <h3 className="font-bold text-lg mb-2">Smart Recommendations</h3>
                 <p className="text-gray-600 text-sm">Receive tailored diet plans and care tips specific to the identified breed.</p>
               </div>
             </div>
           </div>
        )}

        {appState === AppState.ANALYZING && (
          <div className="flex flex-col items-center justify-center min-h-[50vh] animate-fadeIn">
            <div className="relative w-32 h-32 mb-8">
               <div className="absolute inset-0 border-4 border-gray-200 rounded-full"></div>
               <div className="absolute inset-0 border-4 border-emerald-500 rounded-full border-t-transparent animate-spin"></div>
               <div className="absolute inset-0 flex items-center justify-center">
                 <Sparkles className="w-8 h-8 text-emerald-500 animate-pulse" />
               </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Analyzing Image...</h2>
            <p className="text-gray-500">Identifying species, breed, and health markers</p>
          </div>
        )}

        {appState === AppState.SUCCESS && analysisData && selectedImage && (
          <div className="space-y-12 animate-fadeIn">
             <AnalysisView 
               data={analysisData} 
               imageSrc={selectedImage} 
               onReset={handleReset}
             />
             
             {/* Divider */}
             <div className="border-t border-gray-200" />
             
             {/* Market Section */}
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1">
                   <h3 className="text-xl font-bold mb-4">Why this matters</h3>
                   <p className="text-gray-600 mb-4">
                     Understanding your livestock's breed and health status is crucial for maximizing yield and ensuring animal welfare.
                     Use the market tool to check current prices or disease alerts in your area.
                   </p>
                </div>
                <div className="lg:col-span-2">
                   <MarketSearch />
                </div>
             </div>
          </div>
        )}

        {appState === AppState.ERROR && (
          <div className="text-center py-20 animate-fadeIn">
            <div className="bg-red-50 text-red-600 p-6 rounded-xl inline-block mb-6">
               <span className="text-4xl">⚠️</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Oops! Something went wrong</h2>
            <p className="text-gray-600 mb-6">{errorMsg || "We couldn't analyze that image."}</p>
            <button 
              onClick={handleReset}
              className="px-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition"
            >
              Try Again
            </button>
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-20 py-10">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-500 text-sm">
          <p>&copy; Satyam Singh,
            Ravinder Siyag,
            Leena</p>
        </div>
      </footer>

      {/* Chat Bot Widget */}
      <ChatWidget />
    </div>
  );
};

export default App;