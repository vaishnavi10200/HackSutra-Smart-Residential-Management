// src/components/landlord/PropertyManagement.jsx

import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Building, Plus, Edit, Trash2, User, X, DollarSign, Home } from 'lucide-react';
import {
  subscribeToLandlordProperties,
  addProperty,
  updateProperty,
  deleteProperty,
  assignTenant,
  removeTenant
} from '../../services/landlordService';
import { formatCurrency } from '../../utils/realtimeUtils';
import Alert from '../common/Alert';

export default function PropertyManagement() {
  const { user } = useAuth();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showTenantModal, setShowTenantModal] = useState(false);
  const [editingProperty, setEditingProperty] = useState(null);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [propertyForm, setPropertyForm] = useState({
    flatNumber: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    propertyType: 'apartment',
    bhk: '1',
    area: '',
    monthlyRent: '',
    securityDeposit: '',
    maintenanceCharges: '',
    parkingSlots: '0',
    waterCharges: '5',
    electricityCharges: '8',
    amenities: []
  });

  const [tenantForm, setTenantForm] = useState({
    tenantName: '',
    tenantEmail: '',
    tenantPhone: '',
    leaseStartDate: '',
    leaseEndDate: ''
  });

  const amenitiesList = [
    'Parking',
    'Gym',
    'Swimming Pool',
    'Security',
    'Elevator',
    'Power Backup',
    'Water Supply',
    'Garden',
    'Play Area',
    'Club House'
  ];

  // Subscribe to real-time properties
  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    const unsubscribe = subscribeToLandlordProperties(user.uid, (data) => {
      setProperties(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // Update the handlePropertySubmit function in PropertyManagement.jsx

const handlePropertySubmit = async (e) => {
  e.preventDefault();
  setSubmitting(true);

  try {
    const propertyData = {
      flatNumber: propertyForm.flatNumber,
      address: propertyForm.address,
      city: propertyForm.city,
      state: propertyForm.state,
      pincode: propertyForm.pincode,
      propertyType: propertyForm.propertyType,
      bhk: propertyForm.bhk,
      area: parseFloat(propertyForm.area),
      monthlyRent: parseFloat(propertyForm.monthlyRent),
      securityDeposit: parseFloat(propertyForm.securityDeposit),
      maintenanceCharges: parseFloat(propertyForm.maintenanceCharges) || 0,
      parkingSlots: parseInt(propertyForm.parkingSlots) || 0,
      waterCharges: parseFloat(propertyForm.waterCharges) || 5,
      electricityCharges: parseFloat(propertyForm.electricityCharges) || 8,
      amenities: propertyForm.amenities,
      landlordId: user.uid
    };

    console.log('Submitting property data:', propertyData);

    if (editingProperty) {
      await updateProperty(editingProperty.id, propertyData);
      setAlert({ type: 'success', message: 'Property updated successfully!' });
    } else {
      await addProperty(propertyData);
      setAlert({ type: 'success', message: 'Property added successfully!' });
    }

    resetPropertyForm();
    setShowModal(false);
  } catch (error) {
    console.error('Error saving property:', error);
    setAlert({ 
      type: 'error', 
      message: error.message || 'Failed to save property. Please try again.' 
    });
  } finally {
    setSubmitting(false);
  }
};

  const handleTenantSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      console.log('Assigning tenant to property:', selectedProperty.id);
      console.log('Tenant data:', tenantForm);
      
      await assignTenant(selectedProperty.id, tenantForm);
      
      setAlert({ type: 'success', message: 'Tenant assigned successfully! Property status updated to Occupied.' });
      resetTenantForm();
      setShowTenantModal(false);
      setSelectedProperty(null);
    } catch (error) {
      console.error('Error assigning tenant:', error);
      setAlert({ type: 'error', message: error.message || 'Failed to assign tenant' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveTenant = async (propertyId) => {
    if (!confirm('Are you sure you want to remove this tenant?')) return;

    try {
      await removeTenant(propertyId);
      setAlert({ type: 'success', message: 'Tenant removed successfully! Property status updated to Vacant.' });
    } catch (error) {
      console.error('Error removing tenant:', error);
      setAlert({ type: 'error', message: 'Failed to remove tenant' });
    }
  };

  const handleDeleteProperty = async (propertyId) => {
    if (!confirm('Are you sure you want to delete this property? This action cannot be undone.')) return;

    try {
      await deleteProperty(propertyId);
      setAlert({ type: 'success', message: 'Property deleted successfully!' });
    } catch (error) {
      console.error('Error deleting property:', error);
      setAlert({ type: 'error', message: 'Failed to delete property' });
    }
  };

  const openEditModal = (property) => {
    setEditingProperty(property);
    setPropertyForm({
      flatNumber: property.flatNumber,
      address: property.address,
      city: property.city,
      state: property.state,
      pincode: property.pincode,
      propertyType: property.propertyType,
      bhk: property.bhk,
      area: property.area,
      monthlyRent: property.monthlyRent,
      securityDeposit: property.securityDeposit,
      maintenanceCharges: property.maintenanceCharges || '',
      parkingSlots: property.parkingSlots || '0',
      waterCharges: property.waterCharges || '5',
      electricityCharges: property.electricityCharges || '8',
      amenities: property.amenities || []
    });
    setShowModal(true);
  };

  const openTenantModal = (property) => {
    setSelectedProperty(property);
    setShowTenantModal(true);
  };

  const resetPropertyForm = () => {
    setPropertyForm({
      flatNumber: '',
      address: '',
      city: '',
      state: '',
      pincode: '',
      propertyType: 'apartment',
      bhk: '1',
      area: '',
      monthlyRent: '',
      securityDeposit: '',
      maintenanceCharges: '',
      parkingSlots: '0',
      waterCharges: '5',
      electricityCharges: '8',
      amenities: []
    });
    setEditingProperty(null);
  };

  const resetTenantForm = () => {
    setTenantForm({
      tenantName: '',
      tenantEmail: '',
      tenantPhone: '',
      leaseStartDate: '',
      leaseEndDate: ''
    });
  };

  const toggleAmenity = (amenity) => {
    setPropertyForm(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-green-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading properties...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 p-6">
      {alert && (
        <Alert
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert(null)}
        />
      )}

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-800 mb-2">Property Management</h1>
            <p className="text-gray-600">Manage your properties and tenants</p>
          </div>
          <button
            onClick={() => {
              resetPropertyForm();
              setShowModal(true);
            }}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-green-600 text-white rounded-lg hover:shadow-lg transition-all font-medium flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add Property
          </button>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium mb-1">Total Properties</p>
                <p className="text-3xl font-bold text-gray-900">{properties.length}</p>
              </div>
              <Building className="w-10 h-10 text-blue-500" />
            </div>
          </div>
          <div className="bg-green-50 rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-700 text-sm font-medium mb-1">Occupied</p>
                <p className="text-3xl font-bold text-green-900">
                  {properties.filter(p => p.status === 'occupied' || p.tenant).length}
                </p>
              </div>
              <User className="w-10 h-10 text-green-500" />
            </div>
          </div>
          <div className="bg-orange-50 rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-700 text-sm font-medium mb-1">Vacant</p>
                <p className="text-3xl font-bold text-orange-900">
                  {properties.filter(p => p.status !== 'occupied' && !p.tenant).length}
                </p>
              </div>
              <Home className="w-10 h-10 text-orange-500" />
            </div>
          </div>
        </div>

        {/* Properties List */}
        {properties.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <Building className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-xl font-bold text-gray-800 mb-2">No Properties Yet</h3>
            <p className="text-gray-600 mb-6">
              Add your first property to start managing your real estate portfolio
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-green-600 text-white rounded-lg hover:shadow-lg transition-all font-medium inline-flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add First Property
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map(property => {
              const isOccupied = property.status === 'occupied' || property.tenant;
              
              return (
                <div key={property.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                  {/* Property Header */}
                  <div className={`p-4 ${isOccupied ? 'bg-green-50' : 'bg-gray-50'}`}>
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-xl font-bold text-gray-800">{property.flatNumber}</h3>
                        <p className="text-sm text-gray-600">{property.bhk} BHK {property.propertyType}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        isOccupied
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {isOccupied ? 'Occupied' : 'Vacant'}
                      </span>
                    </div>
                  </div>

                  {/* Property Details */}
                  <div className="p-6">
                    <div className="space-y-3 mb-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Building className="w-4 h-4" />
                        <span>{property.address}, {property.city}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Home className="w-4 h-4" />
                        <span>{property.area} sq.ft</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <DollarSign className="w-4 h-4 text-green-600" />
                        <span className="font-bold text-green-600">
                          {formatCurrency(property.monthlyRent)}/month
                        </span>
                      </div>
                    </div>

                    {/* Tenant Info */}
                    {isOccupied ? (
                      <div className="bg-green-50 rounded-lg p-4 mb-4 border border-green-200">
                        <div className="flex items-center gap-2 mb-2">
                          <User className="w-4 h-4 text-green-700" />
                          <span className="font-medium text-green-900">Current Tenant</span>
                        </div>
                        <p className="text-sm text-green-800 font-semibold">{property.tenant}</p>
                        <p className="text-xs text-green-700">{property.tenantEmail}</p>
                        {property.tenantPhone && (
                          <p className="text-xs text-green-700">{property.tenantPhone}</p>
                        )}
                        {property.leaseStartDate && property.leaseEndDate && (
                          <div className="mt-2 pt-2 border-t border-green-200">
                            <p className="text-xs text-green-700">
                              Lease: {new Date(property.leaseStartDate).toLocaleDateString()} - {new Date(property.leaseEndDate).toLocaleDateString()}
                            </p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="bg-gray-50 rounded-lg p-4 mb-4 border border-gray-200">
                        <p className="text-sm text-gray-600 text-center">No tenant assigned</p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEditModal(property)}
                        className="flex-1 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium flex items-center justify-center gap-1"
                      >
                        <Edit className="w-4 h-4" />
                        Edit
                      </button>
                      {isOccupied ? (
                        <button
                          onClick={() => handleRemoveTenant(property.id)}
                          className="flex-1 px-3 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm font-medium"
                        >
                          Remove Tenant
                        </button>
                      ) : (
                        <button
                          onClick={() => openTenantModal(property)}
                          className="flex-1 px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm font-medium flex items-center justify-center gap-1"
                        >
                          <User className="w-4 h-4" />
                          Assign
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteProperty(property.id)}
                        className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add/Edit Property Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center">
              <h2 className="text-3xl font-bold text-gray-800">
                {editingProperty ? 'Edit Property' : 'Add New Property'}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  resetPropertyForm();
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handlePropertySubmit} className="p-6 space-y-6">
              {/* Basic Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Flat/House Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={propertyForm.flatNumber}
                    onChange={(e) => setPropertyForm({...propertyForm, flatNumber: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., A-101"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Property Type *
                  </label>
                  <select
                    required
                    value={propertyForm.propertyType}
                    onChange={(e) => setPropertyForm({...propertyForm, propertyType: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="apartment">Apartment</option>
                    <option value="house">Independent House</option>
                    <option value="villa">Villa</option>
                    <option value="studio">Studio</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    BHK *
                  </label>
                  <select
                    required
                    value={propertyForm.bhk}
                    onChange={(e) => setPropertyForm({...propertyForm, bhk: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="1">1 BHK</option>
                    <option value="2">2 BHK</option>
                    <option value="3">3 BHK</option>
                    <option value="4">4 BHK</option>
                    <option value="5">5+ BHK</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Area (sq.ft) *
                  </label>
                  <input
                    type="number"
                    required
                    value={propertyForm.area}
                    onChange={(e) => setPropertyForm({...propertyForm, area: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="1000"
                  />
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address *
                </label>
                <input
                  type="text"
                  required
                  value={propertyForm.address}
                  onChange={(e) => setPropertyForm({...propertyForm, address: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Street address"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    City *
                  </label>
                  <input
                    type="text"
                    required
                    value={propertyForm.city}
                    onChange={(e) => setPropertyForm({...propertyForm, city: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="City"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    State *
                  </label>
                  <input
                    type="text"
                    required
                    value={propertyForm.state}
                    onChange={(e) => setPropertyForm({...propertyForm, state: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="State"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pincode *
                  </label>
                  <input
                    type="text"
                    required
                    value={propertyForm.pincode}
                    onChange={(e) => setPropertyForm({...propertyForm, pincode: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="411001"
                  />
                </div>
              </div>

              {/* Financial Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Monthly Rent (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    value={propertyForm.monthlyRent}
                    onChange={(e) => setPropertyForm({...propertyForm, monthlyRent: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="15000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Security Deposit (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    value={propertyForm.securityDeposit}
                    onChange={(e) => setPropertyForm({...propertyForm, securityDeposit: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="30000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Maintenance Charges (₹)
                  </label>
                  <input
                    type="number"
                    value={propertyForm.maintenanceCharges}
                    onChange={(e) => setPropertyForm({...propertyForm, maintenanceCharges: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="2000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Parking Slots
                  </label>
                  <input
                    type="number"
                    value={propertyForm.parkingSlots}
                    onChange={(e) => setPropertyForm({...propertyForm, parkingSlots: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Water Charges (₹/unit)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={propertyForm.waterCharges}
                    onChange={(e) => setPropertyForm({...propertyForm, waterCharges: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="5"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Electricity Charges (₹/unit)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={propertyForm.electricityCharges}
                    onChange={(e) => setPropertyForm({...propertyForm, electricityCharges: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="8"
                  />
                </div>
              </div>

              {/* Amenities */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Amenities
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {amenitiesList.map(amenity => (
                    <label key={amenity} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={propertyForm.amenities.includes(amenity)}
                        onChange={() => toggleAmenity(amenity)}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{amenity}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetPropertyForm();
                  }}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-green-600 text-white rounded-lg hover:shadow-lg transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Saving...' : editingProperty ? 'Update Property' : 'Add Property'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Tenant Modal */}
      {showTenantModal && selectedProperty && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-3xl font-bold text-gray-800">Assign Tenant</h2>
                <p className="text-gray-600">Property: {selectedProperty.flatNumber}</p>
              </div>
              <button
                onClick={() => {
                  setShowTenantModal(false);
                  resetTenantForm();
                  setSelectedProperty(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleTenantSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tenant Name *
                </label>
                <input
                  type="text"
                  required
                  value={tenantForm.tenantName}
                  onChange={(e) => setTenantForm({...tenantForm, tenantName: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tenant Email *
                </label>
                <input
                  type="email"
                  required
                  value={tenantForm.tenantEmail}
                  onChange={(e) => setTenantForm({...tenantForm, tenantEmail: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="john@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tenant Phone *
                </label>
                <input
                  type="tel"
                  required
                  value={tenantForm.tenantPhone}
                  onChange={(e) => setTenantForm({...tenantForm, tenantPhone: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="+91 9876543210"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Lease Start Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={tenantForm.leaseStartDate}
                    onChange={(e) => setTenantForm({...tenantForm, leaseStartDate: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Lease End Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={tenantForm.leaseEndDate}
                    onChange={(e) => setTenantForm({...tenantForm, leaseEndDate: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> The tenant will be assigned to this property and status will be updated to "Occupied".
                </p>
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowTenantModal(false);
                    resetTenantForm();
                    setSelectedProperty(null);
                  }}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:shadow-lg transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Assigning...' : 'Assign Tenant'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}