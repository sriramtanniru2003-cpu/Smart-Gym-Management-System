import { useState, useEffect } from "react";
import api from "../../utils/api";

export default function SelectTrainer() {
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTrainerId, setSelectedTrainerId] = useState("");
  const [message, setMessage] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Fetch all trainers
  useEffect(() => {
    fetchTrainers();
  }, []);

  const fetchTrainers = async () => {
    try {
      setLoading(true);
      setMessage("");
      const response = await api.get("/member/trainers");
      
      // ✅ FIX: Handle different response structures
      const responseData = response.data;
      
      // Check if response is an array
      if (Array.isArray(responseData)) {
        setTrainers(responseData);
      } 
      // Check if response is an object with a trainers property
      else if (responseData && Array.isArray(responseData.trainers)) {
        setTrainers(responseData.trainers);
      }
      // Check if response is an object with a data property
      else if (responseData && Array.isArray(responseData.data)) {
        setTrainers(responseData.data);
      }
      // If response is an object that's not an array
      else if (responseData && typeof responseData === 'object') {
        console.warn("API returned object instead of array:", responseData);
        // Try to extract any array from the object
        const possibleArray = Object.values(responseData).find(val => Array.isArray(val));
        setTrainers(possibleArray || []);
      }
      // Fallback to empty array
      else {
        console.error("Unexpected API response format:", responseData);
        setTrainers([]);
      }
      
    } catch (error) {
      console.error("Error fetching trainers:", error);
      setMessage({
        type: "error",
        text: "Failed to load trainers. Please try again later."
      });
      setTrainers([]); // Ensure trainers is always an array
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTrainer = async () => {
    if (!selectedTrainerId) {
      setMessage({
        type: "error",
        text: "Please select a trainer"
      });
      return;
    }

    try {
      setIsProcessing(true);
      setMessage("");
      
      const response = await api.post("/member/select-trainer", {
        trainerId: selectedTrainerId
      });
      
      setMessage({
        type: "success",
        text: "Trainer selected successfully! Redirecting to dashboard..."
      });
      
      // Optional: Redirect after successful selection
      setTimeout(() => {
        window.location.href = "/member/dashboard";
      }, 2000);
      
    } catch (error) {
      console.error("Error selecting trainer:", error);
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Failed to select trainer. Please try again."
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeselectTrainer = () => {
    setSelectedTrainerId("");
    setMessage("");
  };

  // ✅ SAFE FIX: Ensure trainers is an array before using .find()
  const selectedTrainer = Array.isArray(trainers) 
    ? trainers.find(trainer => trainer && trainer._id === selectedTrainerId)
    : null;

  if (loading && trainers.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600"></div>
        <p className="mt-4 text-gray-600">Loading trainers...</p>
      </div>
    );
  }

  // ✅ ADDED: Safety check before rendering trainers
  const safeTrainers = Array.isArray(trainers) ? trainers : [];
  
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            Choose Your Personal Trainer
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Select a certified trainer who matches your fitness goals and training preferences.
          </p>
        </div>
        
        {message && (
          <div className={`mb-6 mx-auto max-w-2xl p-4 rounded-lg border ${
            message.type === "success" 
              ? "bg-green-50 border-green-200 text-green-800" 
              : "bg-red-50 border-red-200 text-red-800"
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                {message.type === "success" ? (
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                )}
                <span>{message.text}</span>
              </div>
              <button
                onClick={() => setMessage("")}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {selectedTrainer && (
          <div className="mb-8 max-w-2xl mx-auto p-6 bg-blue-50 border border-blue-200 rounded-xl">
            <div className="flex flex-col md:flex-row items-center justify-between">
              <div className="flex items-center mb-4 md:mb-0">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                  <span className="font-bold text-blue-600 text-2xl">
                    {selectedTrainer.name?.charAt(0) || 'T'}
                  </span>
                </div>
                <div>
                  <h3 className="font-bold text-xl text-gray-900">{selectedTrainer.name || 'Unknown Trainer'}</h3>
                  <p className="text-gray-600">{selectedTrainer.email || 'No email provided'}</p>
                  {selectedTrainer.specialization && (
                    <p className="text-sm text-blue-700 mt-1">
                      Specialization: {selectedTrainer.specialization}
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={handleDeselectTrainer}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Change Selection
              </button>
            </div>
          </div>
        )}

        {safeTrainers.length === 0 && !loading ? (
          <div className="text-center py-16 bg-white rounded-xl shadow-sm border">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Trainers Available</h3>
            <p className="text-gray-600 mb-6">Check back later or contact support.</p>
            <button
              onClick={fetchTrainers}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Refresh
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
              {safeTrainers.map((trainer) => (
                trainer && (
                  <div
                    key={trainer._id || trainer.id || Math.random()}
                    className={`p-6 bg-white rounded-xl border-2 transition-all duration-300 transform hover:-translate-y-1 cursor-pointer ${
                      selectedTrainerId === trainer._id
                        ? "border-blue-500 shadow-lg shadow-blue-100"
                        : "border-gray-200 hover:border-gray-300 hover:shadow-md"
                    }`}
                    onClick={() => setSelectedTrainerId(trainer._id)}
                  >
                    <div className="flex items-start mb-4">
                      <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-blue-50 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="font-bold text-blue-600 text-2xl">
                          {trainer.name?.charAt(0) || 'T'}
                        </span>
                      </div>
                      <div className="ml-4">
                        <h3 className="font-bold text-gray-900 text-lg">{trainer.name || 'Unknown Trainer'}</h3>
                        <p className="text-gray-600 text-sm truncate">{trainer.email || 'No email'}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      {trainer.specialization && (
                        <div className="flex items-center">
                          <svg className="w-4 h-4 text-blue-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
                          </svg>
                          <span className="text-sm text-gray-700">{trainer.specialization}</span>
                        </div>
                      )}
                      
                      {trainer.phone && (
                        <div className="flex items-center">
                          <svg className="w-4 h-4 text-gray-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                          </svg>
                          <span className="text-sm text-gray-600">{trainer.phone}</span>
                        </div>
                      )}
                      
                      {trainer.experience && (
                        <div className="flex items-center">
                          <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <span className="text-sm text-gray-600">{trainer.experience} years experience</span>
                        </div>
                      )}
                    </div>
                    
                    {selectedTrainerId === trainer._id && (
                      <div className="mt-6 pt-4 border-t border-gray-100">
                        <div className="flex items-center justify-center">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            Selected
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )
              ))}
            </div>

            <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-4">
              <button
                onClick={fetchTrainers}
                disabled={loading}
                className="px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? "Refreshing..." : "Refresh Trainers"}
              </button>
              
              <button
                onClick={handleSelectTrainer}
                disabled={isProcessing || !selectedTrainerId}
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-md hover:shadow-lg"
              >
                {isProcessing ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </span>
                ) : (
                  "Confirm Trainer Selection"
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}