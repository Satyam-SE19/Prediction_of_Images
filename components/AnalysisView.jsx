import React from 'react';
import { CheckCircle, AlertTriangle, Activity, Utensils, Info, Tag } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const AnalysisView = ({ data, imageSrc, onReset }) => {
  const isCattle = data.classification === 'Cattle';
  const confidenceData = [
    { name: 'Confidence', value: data.confidence },
    { name: 'Uncertainty', value: 100 - data.confidence }
  ];
  const COLORS = ['#10B981', '#E5E7EB'];

  // Defensive defaults
  const careTips = data.careTips || [];
  const dietaryRecommendations = data.dietaryRecommendations || [];

  return (
    <div className="w-full max-w-6xl mx-auto p-4 animate-fadeIn">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Image and Key Stats */}
        <div className="space-y-6">
          <div className="relative group overflow-hidden rounded-2xl shadow-xl bg-white">
            <img 
              src={imageSrc} 
              alt="Analyzed Animal" 
              className="w-full h-96 object-cover transform transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 text-white">
              <div className="flex items-center gap-2">
                 {isCattle ? <Tag className="text-yellow-400" /> : <Tag className="text-blue-400" />}
                 <h2 className="text-3xl font-bold">{data.classification}</h2>
              </div>
              <p className="text-lg opacity-90">{data.breed}</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
             <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
               <Activity className="w-5 h-5 text-indigo-500" /> AI Confidence
             </h3>
             <div className="h-48 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={confidenceData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      fill="#8884d8"
                      paddingAngle={5}
                      dataKey="value"
                      startAngle={90}
                      endAngle={-270}
                    >
                      {confidenceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute text-center">
                  <span className="text-3xl font-bold text-gray-800">{data.confidence}%</span>
                </div>
             </div>
          </div>
        </div>

        {/* Right Column: Detailed Info */}
        <div className="space-y-6">
          {/* Health Card */}
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500 transition-all hover:shadow-xl">
            <h3 className="text-xl font-bold text-gray-800 mb-3 flex items-center gap-2">
              <CheckCircle className="w-6 h-6 text-green-500" /> Health Assessment
            </h3>
            <p className="text-gray-600 leading-relaxed">{data.healthStatus}</p>
            <div className="mt-4 flex items-center gap-2 text-sm text-gray-500 bg-gray-50 p-3 rounded-lg">
              <Info className="w-4 h-4" />
              <span>Estimated Age: <span className="font-semibold text-gray-700">{data.estimatedAge}</span></span>
            </div>
          </div>

          {/* Care Tips */}
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500 transition-all hover:shadow-xl">
            <h3 className="text-xl font-bold text-gray-800 mb-3 flex items-center gap-2">
              <AlertTriangle className="w-6 h-6 text-blue-500" /> Care Recommendations
            </h3>
            <ul className="space-y-2">
              {careTips.length > 0 ? (
                careTips.map((tip, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold">{idx + 1}</span>
                    <span className="text-gray-600">{tip}</span>
                  </li>
                ))
              ) : (
                <li className="text-gray-500 italic">No specific care tips generated.</li>
              )}
            </ul>
          </div>

          {/* Dietary */}
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-orange-500 transition-all hover:shadow-xl">
             <h3 className="text-xl font-bold text-gray-800 mb-3 flex items-center gap-2">
              <Utensils className="w-6 h-6 text-orange-500" /> Diet Plan
            </h3>
            <div className="flex flex-wrap gap-2">
              {dietaryRecommendations.length > 0 ? (
                dietaryRecommendations.map((item, idx) => (
                  <span key={idx} className="bg-orange-50 text-orange-700 px-3 py-1 rounded-full text-sm font-medium border border-orange-100">
                    {item}
                  </span>
                ))
              ) : (
                 <span className="text-gray-500 italic">No dietary recommendations generated.</span>
              )}
            </div>
          </div>

          <button 
            onClick={onReset}
            className="w-full py-4 bg-gray-800 text-white rounded-xl font-semibold hover:bg-gray-900 transition-colors shadow-lg"
          >
            Analyze Another Animal
          </button>
        </div>
      </div>
    </div>
  );
};

export default AnalysisView;