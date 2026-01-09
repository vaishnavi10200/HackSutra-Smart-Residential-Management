// src/components/landlord/BillGeneration.jsx

import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { Receipt, Sparkles, Send, Loader, AlertTriangle, CheckCircle, X } from 'lucide-react';
import { getLandlordProperties } from '../../services/landlordService';
import { generateMonthlyBillForProperty } from '../../services/billingService';
import Alert from '../common/Alert';


// Permission Diagnostic Component
function PermissionDiagnostic({ userProfile, currentUser }) {
  const [diagnosticInfo, setDiagnosticInfo] = useState(null);
  const [checking, setChecking] = useState(false);

  async function runDiagnostic() {
    setChecking(true);
    const results = {
      timestamp: new Date().toISOString(),
      checks: []
    };

    try {
      // Check 1: Authentication
      results.checks.push({
        name: '1. User Authentication',
        status: currentUser ? '✅ PASS' : '❌ FAIL',
        details: currentUser ? `Logged in as: ${currentUser.email}` : 'Not logged in',
        data: { uid: currentUser?.uid, email: currentUser?.email }
      });

      // Check 2: User Profile from Context
      results.checks.push({
        name: '2. User Profile (from Context)',
        status: userProfile ? '✅ PASS' : '❌ FAIL',
        details: userProfile ? `Profile loaded` : 'Profile not loaded',
        data: userProfile
      });

      // Check 3: User Document in Firestore
      if (currentUser?.uid) {
        try {
          const userDocRef = doc(db, 'users', currentUser.uid);
          const userDocSnap = await getDoc(userDocRef);
          const exists = userDocSnap.exists();
          const userData = exists ? userDocSnap.data() : null;

          results.checks.push({
            name: '3. User Document in Firestore',
            status: exists ? '✅ PASS' : '❌ FAIL',
            details: exists ? 'Document exists' : 'Document NOT found in /users collection',
            data: userData
          });

          // Check 4: Role Check
          if (exists && userData) {
            const isLandlord = userData.role === 'landlord';
            results.checks.push({
              name: '4. Landlord Role',
              status: isLandlord ? '✅ PASS' : '❌ FAIL',
              details: `Role: "${userData.role}" (expected: "landlord")`,
              data: {
                currentRole: userData.role,
                expectedRole: 'landlord',
                match: isLandlord
              }
            });
          } else {
            results.checks.push({
              name: '4. Landlord Role',
              status: '❌ FAIL',
              details: 'Cannot check role - user document does not exist',
              data: null
            });
          }
        } catch (error) {
          results.checks.push({
            name: '3. User Document in Firestore',
            status: '❌ FAIL',
            details: `Error reading document: ${error.message}`,
            data: { error: error.message, code: error.code }
          });
        }
      }
    } catch (error) {
      results.checks.push({
        name: 'Diagnostic Error',
        status: '❌ ERROR',
        details: error.message,
        data: error
      });
    }

    setDiagnosticInfo(results);
    setChecking(false);
  }

  const allPassed = diagnosticInfo?.checks.every(c => c.status.includes('✅'));
  const hasFails = diagnosticInfo?.checks.some(c => c.status.includes('❌'));

  return (
    <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-6 mb-6">
      <div className="flex items-start gap-3 mb-4">
        <AlertTriangle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-1" />
        <div className="flex-1">
          <h3 className="text-lg font-bold text-yellow-900 mb-2">
            Permission Issue Detected
          </h3>
          <p className="text-sm text-yellow-800 mb-4">
            Run this diagnostic to identify the permission issue before generating bills
          </p>
          <button
            onClick={runDiagnostic}
            disabled={checking}
            className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors font-medium disabled:opacity-50"
          >
            {checking ? 'Running Diagnostic...' : 'Run Diagnostic'}
          </button>
        </div>
      </div>

      {diagnosticInfo && (
        <div className="mt-4 space-y-3">
          {diagnosticInfo.checks.map((check, idx) => (
            <div key={idx} className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="flex items-start gap-3">
                <span className="text-lg">{check.status.split(' ')[0]}</span>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">{check.name}</h4>
                  <p className="text-sm text-gray-600 mt-1">{check.details}</p>
                  {check.data && (
                    <pre className="mt-2 text-xs bg-gray-50 p-2 rounded overflow-x-auto">
                      {JSON.stringify(check.data, null, 2)}
                    </pre>
                  )}
                </div>
              </div>
            </div>
          ))}

          <div className={`rounded-lg p-4 ${allPassed ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <p className={`font-medium ${allPassed ? 'text-green-800' : 'text-red-800'}`}>
              {allPassed ? '✅ All checks passed!' : '❌ Issues found'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function BillGeneration() {
  const { user, userProfile } = useAuth();
  const [properties, setProperties] = useState([]);
  const [selectedProperty, setSelectedProperty] = useState('');
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [alert, setAlert] = useState(null);
  const [generatedBill, setGeneratedBill] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [billSentSuccess, setBillSentSuccess] = useState(false);
  const [showDiagnostic, setShowDiagnostic] = useState(false);

  const [formData, setFormData] = useState({
    month: '',
    waterUsage: '',
    electricityUsage: '',
    additionalCharges: '',
    discount: '',
    additionalChargesDescription: '',
    discountReason: ''
  });

  useEffect(() => {
    loadProperties();
  }, [user]);

  async function loadProperties() {
    if (!user?.uid) return;

    try {
      const props = await getLandlordProperties(user.uid);
      setProperties(props);
    } catch (error) {
      console.error('Error loading properties:', error);
      setAlert({ type: 'error', message: 'Failed to load properties' });
    } finally {
      setLoading(false);
    }
  }

  const handleGenerateBill = async (e) => {
    e.preventDefault();
    setGenerating(true);
    setAlert(null);
    setShowDiagnostic(false);

    try {
      const property = properties.find(p => p.id === selectedProperty);
      if (!property) {
        throw new Error('Please select a property');
      }

      if (!property.tenantId) {
        throw new Error('This property does not have a tenant assigned');
      }

      const billData = {
        property,
        landlordId: user.uid,
        month: formData.month,
        waterUsage: parseFloat(formData.waterUsage) || 0,
        electricityUsage: parseFloat(formData.electricityUsage) || 0,
        additionalCharges: parseFloat(formData.additionalCharges) || 0,
        discount: parseFloat(formData.discount) || 0,
        additionalChargesDescription: formData.additionalChargesDescription,
        discountReason: formData.discountReason
      };

      const result = await generateMonthlyBillForProperty(billData);
      setGeneratedBill(result);
      setShowPreview(true);
      setAlert({
        type: 'success',
        message: 'Bill generated successfully!'
      });
    } catch (error) {
      console.error('Bill generation error:', error);
      
      if (error.message.includes('Permission denied') || error.message.includes('permission-denied')) {
        setShowDiagnostic(true);
      }
      
      setAlert({
        type: 'error',
        message: error.message || 'Failed to generate bill'
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleSendBill = () => {
    setBillSentSuccess(true);
    setAlert({
      type: 'success',
      message: 'Bill sent successfully to tenant!'
    });

    // Reset after 2 seconds
    setTimeout(() => {
      setBillSentSuccess(false);
      setShowPreview(false);
      setGeneratedBill(null);
      setSelectedProperty('');
      setFormData({
        month: '',
        waterUsage: '',
        electricityUsage: '',
        additionalCharges: '',
        discount: '',
        additionalChargesDescription: '',
        discountReason: ''
      });
    }, 2000);
  };

 if (loading) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-green-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>
  );
}

  const selectedPropertyData = properties.find(p => p.id === selectedProperty);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 p-6">
      {alert && (
        <Alert
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert(null)}
        />
      )}

      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-2xl shadow-2xl p-8 mb-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-gradient-to-br from-green-500 to-blue-500 rounded-xl">
              <Receipt className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">AI Bill Generation</h1>
              <p className="text-gray-600">Generate accurate bills using Google Gemini AI</p>
            </div>
          </div>

          {/* AI Feature Card */}
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200 rounded-xl p-6 mb-6">
            <div className="flex items-start gap-4">
              <Sparkles className="w-8 h-8 text-purple-600 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">AI-Powered Calculations</h3>
                <p className="text-sm text-gray-700">
                  Gemini AI automatically calculates complex charges including late fees, discounts,
                  and generates detailed bill breakdowns based on payment history.
                </p>
              </div>
            </div>
          </div>

          {/* Diagnostic Section */}
          {showDiagnostic && (
            <PermissionDiagnostic userProfile={userProfile} currentUser={user} />
          )}

          {/* No Properties Message */}
          {properties.length === 0 ? (
            <div className="text-center py-12">
              <Receipt className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-xl font-bold text-gray-800 mb-2">No Properties Available</h3>
              <p className="text-gray-600">
                You need to add properties and assign tenants before generating bills.
              </p>
            </div>
          ) : (
            <form onSubmit={handleGenerateBill} className="space-y-6">
              {/* Property Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Property *
                </label>
                <select
                  required
                  value={selectedProperty}
                  onChange={(e) => setSelectedProperty(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">Choose a property...</option>
                  {properties.map(prop => (
                    <option key={prop.id} value={prop.id}>
                      {prop.flatNumber} - {prop.tenant || 'No Tenant'} - ₹{prop.monthlyRent}/month
                    </option>
                  ))}
                </select>
              </div>

              {/* Show property details if selected */}
              {selectedPropertyData && (
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <h3 className="font-bold text-gray-800 mb-3">Property Details</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Tenant:</span>
                      <span className="ml-2 font-medium text-gray-900">
                        {selectedPropertyData.tenant || 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Monthly Rent:</span>
                      <span className="ml-2 font-medium text-gray-900">
                        ₹{selectedPropertyData.monthlyRent}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Maintenance:</span>
                      <span className="ml-2 font-medium text-gray-900">
                        ₹{selectedPropertyData.maintenanceCharges || 0}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Parking Slots:</span>
                      <span className="ml-2 font-medium text-gray-900">
                        {selectedPropertyData.parkingSlots || 0}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Billing Month */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Billing Month *
                </label>
                <input
                  type="month"
                  required
                  value={formData.month}
                  onChange={(e) => setFormData({ ...formData, month: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              {/* Usage Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Water Usage (units)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.waterUsage}
                    onChange={(e) => setFormData({ ...formData, waterUsage: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Electricity Usage (units)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.electricityUsage}
                    onChange={(e) => setFormData({ ...formData, electricityUsage: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Additional Charges */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Additional Charges (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.additionalCharges}
                    onChange={(e) => setFormData({ ...formData, additionalCharges: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="0"
                  />
                  <input
                    type="text"
                    value={formData.additionalChargesDescription}
                    onChange={(e) => setFormData({ ...formData, additionalChargesDescription: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent mt-2"
                    placeholder="Reason for additional charges"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Discount (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.discount}
                    onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="0"
                  />
                  <input
                    type="text"
                    value={formData.discountReason}
                    onChange={(e) => setFormData({ ...formData, discountReason: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent mt-2"
                    placeholder="Reason for discount"
                  />
                </div>
              </div>

              {/* Generate Button */}
              <button
                type="submit"
                disabled={generating || !selectedProperty}
                className="w-full px-6 py-4 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg hover:shadow-lg transition-all font-medium text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
              >
                {generating ? (
                  <>
                    <Loader className="w-6 h-6 animate-spin" />
                    Generating with AI...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-6 h-6" />
                    Generate Bill with AI
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Bill Preview Modal */}
        {showPreview && generatedBill && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">Generated Bill</h2>
                <button
                  onClick={() => {
                    setShowPreview(false);
                    setGeneratedBill(null);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6">
                {/* Bill Details */}
                <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6 mb-6">
                  <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                    <div>
                      <p className="text-gray-600">Tenant</p>
                      <p className="font-bold text-gray-900">{generatedBill.tenantName}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Property</p>
                      <p className="font-bold text-gray-900">{generatedBill.flatNumber}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Month</p>
                      <p className="font-bold text-gray-900">{generatedBill.month}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Due Date</p>
                      <p className="font-bold text-gray-900">
                        {new Date(generatedBill.dueDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="border-t-2 border-gray-200 pt-4">
                    <p className="text-gray-600 text-sm mb-2">Total Amount</p>
                    <p className="text-4xl font-bold text-green-600">₹{generatedBill.total}</p>
                  </div>
                </div>

                {/* AI Breakdown */}
                {generatedBill.breakdown && (
                  <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-6 mb-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Sparkles className="w-5 h-5 text-purple-600" />
                      <h3 className="font-bold text-purple-900">AI-Generated Breakdown:</h3>
                    </div>
                    <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-line">
                      {generatedBill.breakdown}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-4">
                  {!billSentSuccess ? (
                    <>
                      <button
                        onClick={() => {
                          setShowPreview(false);
                          setGeneratedBill(null);
                        }}
                        className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                      >
                        Close
                      </button>
                      <button
                        onClick={handleSendBill}
                        className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:shadow-lg transition-all font-medium flex items-center justify-center gap-2"
                      >
                        <Send className="w-5 h-5" />
                        Send to Tenant
                      </button>
                    </>
                  ) : (
                    <div className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg font-medium flex items-center justify-center gap-2">
                      <CheckCircle className="w-5 h-5" />
                      Bill Sent Successfully!
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
