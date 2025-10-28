import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Building2, User, CreditCard, UtensilsCrossed } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface Accommodation {
  id: number;
  name: string;
  description: string;
  price: number;
  available_rooms: number;
  amenities: string;
  address: string;
  latitude: number;
  longitude: number;
  adultPrice?: number;
  childPrice?: number;
  capacity: number; // This will be treated as "Base Capacity" for villas
  type?: string;
  MaxPersonVilla?: number;
  RatePerPerson?: number; // This is the "Extra Person Charge" for villas
}

interface Coupon {
  id: number;
  code: string;
  discount: string;
  discountType: 'percentage' | 'fixed';
  minAmount?: string | null;
  maxDiscount?: string | null;
  active: boolean;
  accommodationType: string | null;
}

interface BlockedDate {
  id: number;
  accommodation_id: number;
  blocked_date: string;
  rooms_blocked: number;
}

const _BASE_URL = 'https://a.plumeriaretreat.com';

// Helper function to calculate the number of nights
const calculateNumberOfDays = (checkIn: string, checkOut: string): number => {
  if (!checkIn || !checkOut) return 0;
  
  const startDate = new Date(checkIn);
  const endDate = new Date(checkOut);

  // Don't calculate if dates are invalid
  if (endDate <= startDate) return 0;

  const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
  
  // This is the number of nights
  return diffDays;
};

const CreateBooking: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [accommodations, setAccommodations] = useState<Accommodation[]>([]);
  const [selectedAccommodation, setSelectedAccommodation] = useState<Accommodation | null>(null);
  const [availableCoupons, setAvailableCoupons] = useState<Coupon[]>([]);
  const [allApplicableCoupons, setAllApplicableCoupons] = useState<Coupon[]>([]);
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [availableRooms, setAvailableRooms] = useState<number>(0);
  const [bookedRooms, setBookedRooms] = useState<number>(0);
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [dateError, setDateError] = useState<string | null>(null);
  const [showRoomAvailability, setShowRoomAvailability] = useState(false);
  const [blockedRoomsCount, setBlockedRoomsCount] = useState<number>(0);
  const [formData, setFormData] = useState({
    guest_name: '',
    guest_email: '',
    guest_phone: '',
    accommodation_id: '',
    check_in: '',
    check_out: '',
    adults: '1',
    children: '0',
    extra_adults: '0', // This is for extra guests *above* base capacity
    rooms: '1',
    food_veg: '0',
    food_nonveg: '0',
    food_jain: '0',
    total_amount: '',
    discounted_amount: '',
    advance_amount: '0',
    payment_method: 'cash',
    coupon_code: '',
    notes: ''
  });

  const paymentMethods = [
    { id: 'cash', name: 'Cash' },
    { id: 'bank', name: 'Bank Transfer' },
    { id: 'card', name: 'Credit/Debit Card' },
    { id: 'gpay', name: 'Google Pay' },
    { id: 'phonepe', name: 'PhonePe' },
    { id: 'paytm', name: 'Paytm' }
  ];

  useEffect(() => {
    const fetchAccommodations = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${_BASE_URL}/admin/properties/accommodations`);
        const data = await response.json();

        const accommodationsData = data.data || [];
        if (Array.isArray(accommodationsData)) {
          setAccommodations(accommodationsData);
        } else {
          console.error('Unexpected accommodations data format:', data);
          setAccommodations([]);
        }
      } catch (error) {
        console.error('Error fetching accommodations:', error);
        alert('Failed to load accommodations');
      } finally {
        setLoading(false);
      }
    };

    fetchAccommodations();
  }, []);

  useEffect(() => {
    const fetchBlockedDates = async () => {
      try {
        const response = await fetch(`${_BASE_URL}/admin/calendar/blocked-dates`);
        const data = await response.json();
        if (data.success && Array.isArray(data.data)) {
          setBlockedDates(data.data);
        }
      } catch (error) {
        console.error('Error fetching blocked dates:', error);
      }
    };

    fetchBlockedDates();
  }, []);

  useEffect(() => {
    const fetchApplicableCoupons = async () => {
      if (!selectedAccommodation) {
        setAllApplicableCoupons([]);
        return;
      }

      try {
        const response = await fetch(`${_BASE_URL}/admin/coupons`);
        const data = await response.json();

        if (data.success && Array.isArray(data.data)) {
          const filteredCoupons = data.data.filter((coupon: Coupon) => {
            if (!coupon.active) return false;
            if (coupon.accommodationType === "All") return true;
            if (!coupon.accommodationType) return true;
            return coupon.accommodationType === selectedAccommodation.name;
          });

          setAllApplicableCoupons(filteredCoupons);
        } else {
          setAllApplicableCoupons([]);
        }
      } catch (error) {
        console.error('Error fetching coupons:', error);
        setAllApplicableCoupons([]);
      }
    };

    fetchApplicableCoupons();
  }, [selectedAccommodation]);

  useEffect(() => {
    if (formData.coupon_code) {
      const searchTerm = formData.coupon_code.toLowerCase();
      const filtered = allApplicableCoupons.filter(coupon =>
        coupon.code.toLowerCase().includes(searchTerm)
      );
      setAvailableCoupons(filtered);
    } else {
      setAvailableCoupons(allApplicableCoupons);
    }
  }, [formData.coupon_code, allApplicableCoupons]);

  const fetchAccommodationDetails = async (id: string) => {
    try {
      const response = await fetch(`${_BASE_URL}/admin/properties/accommodations/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch accommodation details');
      }
      const data = await response.json();
      console.log(data);
      const accommodation: Accommodation = {
        id: data.id,
        name: data.basicInfo?.name || 'Unnamed Accommodation',
        description: data.basicInfo?.description || '',
        price: data.basicInfo?.price || 0,
        available_rooms: data.basicInfo?.rooms || 0,
        amenities: data.amenities || '',
        address: data.location?.address || '',
        latitude: data.location?.coordinates?.latitude || 0,
        longitude: data.location?.coordinates?.longitude || 0,
        adultPrice: data.packages?.pricing?.adult || 0, // This is the FLAT VILLA RATE
        childPrice: data.packages?.pricing?.child || 0,
        capacity: data.basicInfo?.capacity || 4, // This is the BASE CAPACITY
        type: data.basicInfo?.type || undefined,
        
        // --- 🚀 HERE IS THE FIX ---
        // We read the property 'RatePersonVilla' from the API response
        // and assign it to our 'RatePerPerson' variable.
        // We do the same for 'MaxPersonVilla' just in case.
        
        MaxPersonVilla: data.basicInfo?.MaxPersonVilla || undefined, 
        RatePerPerson: data.basicInfo?.RatePersonVilla || undefined 
      };
      
      setSelectedAccommodation(accommodation);
      setAvailableRooms(0);
      setShowRoomAvailability(false);
      setAppliedCoupon(null);
      // Reset conditional fields when accommodation changes
      setFormData(prev => ({
        ...prev,
        coupon_code: '',
        children: accommodation.type === 'Villa' ? '0' : prev.children,
        extra_adults: accommodation.type !== 'Villa' ? '0' : prev.extra_adults,
        rooms: '1' // Always reset rooms to 1
      }));
    } catch (error) {
      console.error('Error fetching accommodation details:', error);
    }
  }
  const fetchBookedRooms = async (accommodationId: number, checkInDate: string) => {
    try {
      const response = await fetch(`${_BASE_URL}/admin/bookings/room-occupancy?check_in=${checkInDate}&id=${accommodationId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch booked rooms');
      }
      const data = await response.json();
      return data.total_rooms || 0;
    } catch (error) {
      console.error('Error fetching booked rooms:', error);
      return 0;
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === 'coupon_code') {
      setAppliedCoupon(null);
    }
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCouponSelect = (coupon: Coupon) => {
    setAppliedCoupon(coupon);
    setFormData(prev => ({
      ...prev,
      coupon_code: coupon.code
    }));
    setAvailableCoupons([]);
  };

  useEffect(() => {
    if (formData.check_in) {
      const nextDay = new Date(formData.check_in);
      nextDay.setDate(nextDay.getDate() + 1);
      const nextDayString = nextDay.toISOString().split('T')[0];

      if (!formData.check_out || new Date(formData.check_out) <= new Date(formData.check_in)) {
        setFormData(prev => ({ ...prev, check_out: nextDayString }));
      }

      validateDates(formData.check_in, nextDayString);
    }
  }, [formData.check_in]);

  useEffect(() => {
    const calculateAvailableRooms = async () => {
      if (!formData.accommodation_id || !formData.check_in || !selectedAccommodation) {
        setAvailableRooms(0);
        return;
      }

      const accommodationId = parseInt(formData.accommodation_id);
      const booked = await fetchBookedRooms(accommodationId, formData.check_in);

      setBookedRooms(booked);

      const blockedForDate = blockedDates.find(
        b => b.accommodation_id === accommodationId && b.blocked_date === formData.check_in
      );
      const blockedRooms = blockedForDate ? blockedForDate.rooms_blocked : 0;
      setBlockedRoomsCount(blockedRooms);

      const totalRooms = selectedAccommodation.available_rooms || 0;
      const bookedCount = booked || 0;
      const blockedCount = blockedRooms || 0;

      const available = totalRooms - bookedCount - blockedCount;
      const availableRoomsValue = Math.max(available, 0);
      setAvailableRooms(availableRoomsValue);
      setShowRoomAvailability(true);
      
      // Only adjust room count if it's not a villa
      if (selectedAccommodation.type !== 'Villa') {
        if (parseInt(formData.rooms) > availableRoomsValue) {
          setFormData(prev => ({
            ...prev,
            rooms: availableRoomsValue > 0 ? availableRoomsValue.toString() : '0'
          }));
        }
      }
    };

    calculateAvailableRooms();
  }, [formData.accommodation_id, formData.check_in, blockedDates, selectedAccommodation]);

  const validateDates = (checkIn: string, checkOut: string) => {
    if (!checkIn || !checkOut) return;

    const startDate = new Date(checkIn);
    const endDate = new Date(checkOut);
    const accommodationId = parseInt(formData.accommodation_id);

    if (!accommodationId) return;

    const accommodationBlockedDates = blockedDates.filter(
      date => date.accommodation_id === accommodationId
    );

    let errorDate: string | null = null;
    for (let d = new Date(startDate); d < endDate; d.setDate(d.getDate() + 1)) {
      const dateString = d.toISOString().split('T')[0];

      const isBlocked = accommodationBlockedDates.some(
        blocked => blocked.blocked_date === dateString
      );

      if (isBlocked) {
        errorDate = dateString;
        break;
      }
    }

    setDateError(errorDate ? `The date ${errorDate} is blocked for this accommodation` : null);
  };

  const calculateDiscount = (totalAmount: number, coupon: Coupon | null): number => {
    if (!coupon) return totalAmount;

    const discount = parseFloat(coupon.discount);
    const minAmount = coupon.minAmount ? parseFloat(coupon.minAmount) : 0;
    const maxDiscount = coupon.maxDiscount ? parseFloat(coupon.maxDiscount) : Infinity;

    if (totalAmount < minAmount) {
      return totalAmount;
    }

    let discountedAmount = totalAmount;

    if (coupon.discountType === 'percentage') {
      const discountValue = totalAmount * (discount / 100);
      const finalDiscount = Math.min(discountValue, maxDiscount);
      discountedAmount = totalAmount - finalDiscount;
    } else {
      discountedAmount = totalAmount - discount;
    }

    return Math.max(0, discountedAmount);
  };

  //
  // --- *** 🚀 CHANGE 1: UPDATED PRICE CALCULATION LOGIC *** ---
  //
  useEffect(() => {
    if (!selectedAccommodation) {
      setFormData(prev => ({
        ...prev,
        total_amount: '',
        discounted_amount: ''
      }));
      return;
    }

    const adults = parseInt(formData.adults) || 0;
    const children = parseInt(formData.children) || 0;
    const extra_adults = parseInt(formData.extra_adults) || 0;
    
    // Calculate number of days (or nights)
    const numberOfDays = calculateNumberOfDays(formData.check_in, formData.check_out);

    if (numberOfDays === 0) {
        // If dates are not set or are invalid, set price to 0
        setFormData(prev => ({
        ...prev,
        total_amount: '0.00',
        discounted_amount: '0.00'
      }));
      return;
    }

    let baseTotal = 0;

    // Handle different pricing logic for villas
  

    if (selectedAccommodation.type === 'Villa') {
      
      console.log(selectedAccommodation);
      // NEW LOGIC: (One Villa Price + (Extra Person Rate * extra persons)) * days
      
      // 1. This is the flat "one villa price" (e.g., for up to 15 guests)
      //    We use 'adultPrice' field to store the flat villa rate.
      const villaPricePerDay = (selectedAccommodation.adultPrice || 0);
      
      // 2. This is the "per person charge" only for extra adults
      const extraPersonChargePerDay = (selectedAccommodation.RatePerPerson || 0) * extra_adults;
      console.log('Extra Person Charge Per Day:', extraPersonChargePerDay);
      
      // 3. Add them together for the total daily rate
      const totalPerDayPerVilla = Number(villaPricePerDay) + Number(extraPersonChargePerDay);
      console.log('Total Per Day Per Villa:', Number(totalPerDayPerVilla));
      
      baseTotal = totalPerDayPerVilla * numberOfDays; 

    } else {
      // Regular logic: ((Adult price * adults) + (Child price * children)) * days
      const adultPricePerDay = (selectedAccommodation.adultPrice || 0) * adults;
      const childPricePerDay = (selectedAccommodation.childPrice || 0) * children;
      const totalPerDay = adultPricePerDay + childPricePerDay;
      
      baseTotal = totalPerDay * numberOfDays;
    }

    const discountedTotal = calculateDiscount(baseTotal, appliedCoupon);

    setFormData(prev => ({
      ...prev,
      total_amount: baseTotal.toFixed(2),
      discounted_amount: discountedTotal.toFixed(2)
    }));
  }, [
    selectedAccommodation,
    formData.adults,
    formData.children,
    formData.extra_adults, // This is now a key part of the villa calculation
    formData.rooms, 
    formData.check_in,  
    formData.check_out, 
    appliedCoupon
  ]);
  
  const downloadPdf = (
    email: string,
    name: string,
    BookingId: string,
    CheckinDate: string,
    CheckoutDate: string,
    totalPrice: number,
    advancePayable: number,
    remainingAmount: number,
    mobile: string,
    totalPerson: number,
    adult: number,
    child: number,
    extra_adults: number, // Added param
    vegCount: number,
    nonvegCount: number,
    joinCount: number,
    accommodationName: string,
    accommodationAddress: string,
    latitude: string,
	  coupon : string,
	  discount : number,
	  full_amount : number,
    rooms: number,
    ownerName: string,
    ownerPhone: string,
    longitude: string,
    owner_email: string) => {
    const today: Date = new Date();

    const day: string = String(today.getDate()).padStart(2, '0');
    const month: string = String(today.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
    const year: number = today.getFullYear();

    // Conditionally create the child/extra adult HTML
    const guestDetailHtml = selectedAccommodation?.type === 'Villa'
      ? `<p style="padding-bottom: 5px;margin: 0px;">Extra Adults: <b>${extra_adults}</b></p>`
      : `<p style="padding-bottom: 5px;margin: 0px;">Child: <b>${child}</b></p>`;

    // Conditionally create food count HTML
    const foodDetailHtml = selectedAccommodation?.type !== 'Villa'
    ? `<p style="padding-bottom: 5px;margin: 0px;">Veg Count: <b>${vegCount}</b></p>
       <p style="padding-bottom: 5px;margin: 0px;">Non Veg Count: <b>${nonvegCount}</b></p>
       <p style="padding-bottom: 5px;margin: 0px;">Jain Count: <b>${joinCount}</b></p>`
    : '';

    // Conditionally create rooms HTML (only show if not a villa)
    const roomDetailHtml = selectedAccommodation?.type !== 'Villa'
    ? `<p style="padding-bottom: 5px;margin: 0px;">Rooms: <b>${rooms}</b></p>`
    : '';

    const BookingDate: string = `${year}-${month}-${day}`;
    const html = `<!DOCTYPE html
  PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml"
  xmlns:o="urn:schemas-microsoft-com:office:office">

<head>
  <meta http-equiv="Content-type" content="text/html; charset=utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="format-detection" content="date=no" />
  <meta name="format-detection" content="address=no" />
  <meta name="format-detection" content="telephone=no" />
  <meta name="x-apple-disable-message-reformatting" />
  <link href="https://fonts.googleapis.com/css?family=Lato:400,400i,700,700i" rel="stylesheet" />
  <title>Booking</title>
  <link rel="shortcut icon" href="images/favicon.png">


  <style type="text/css" media="screen">
    body {
      padding: 0 !important;
      margin: 0 !important;
      display: block !important;
      min-width: 100% !important;
      width: 100% !important;
      background: #ffffff;
      -webkit-text-size-adjust: none
    }

    a {
      color: #000001;
      text-decoration: none
    }

    p {
      margin: 0 !important;
    }

    img {
      -ms-interpolation-mode: bicubic;
    }

    .mcnPreviewText {
      display: none !important;
    }

    .cke_editable,
    .cke_editable a,
    .cke_editable span,
    .cke_editable a span {
      color: #000001 !important;
    }

    @media only screen and (max-device-width: 480px),
    only screen and (max-width: 480px) {
      .mobile-shell {
        width: 100% !important;
        min-width: 100% !important;
        padding: 0 3px;
      }

      .bg {
        background-size: 100% auto !important;
        -webkit-background-size: 100% auto !important;
      }

      .text-header,
      .m-center {
        text-align: center !important;
      }

      .center {
        margin: 0 auto !important;
      }

      .container {
        padding: 20px 10px !important
      }

      .td {
        width: 100% !important;
        min-width: 100% !important;
      }

      .m-td,
      .m-hide {
        display: none !important;
        width: 0 !important;
        height: 0 !important;
        font-size: 0 !important;
        line-height: 0 !important;
        min-height: 0 !important;
      }

      .m-block {
        display: block !important;
      }

      .column,
      .column-dir,
      .column-top,
      .column-empty,
      .column-empty2,
      .column-dir-top {
        float: left !important;
        width: 100% !important;
        display: block !important;
      }

      .column-empty {
        padding-bottom: 30px !important;
      }

      .column-empty2 {
        padding-bottom: 10px !important;
      }

      .content-spacing {
        width: 15px !important;
      }

      /*
       * THIS IS THE CRITICAL FIX: "and (screen)"
       * This tells the mobile styles NOT to run during printing.
      */
      @media (max-width:600px) and (screen) {
        .logoimg {
          padding-top: 5px !important;
        }

        .logoimg img {
          width: 130px !important;
          height: 28px !important;
        }

        .mainhead {
          font-size: 12px !important;
        }

        table th,
        table td {
          font-size: 7px !important;
          line-height: 12px !important;
          padding-bottom: 2px !important;
        }

        table.border-table th {
          padding-top: 2px !important;
        }

        .paypd {
          padding: 0px 2px !important;
          font-size: 7px !important;
          margin-bottom: 4px !important;
        }

        .p30-15 {
          padding: 6px 0px 0 !important;
        }

        .socialimgs td,
        .socialimgs td img {
          width: 24px !important;
          height: 24px !important;
          padding: 0 1px;
        }

        .footertd {
          padding: 12px 0 !;
        }

        .bordr {
          border-top-width: 2px !important;
        }

        .mobheadpb {
          padding-bottom: 8px !important;
        }
      }
    }

    /* --- PRINT STYLES --- */
    /* This will override ALL mobile styles when creating a PDF */
    /* This forces the 675px DESKTOP layout for ALL PDFs */
    @media print {
      body {
        background: #ffffff !important;
        width: 675px !important; /* Force desktop width */
        min-width: 675px !important;
        margin: 0 !important;
        padding: 0 !important;
      }

      .mobile-shell {
        width: 675px !important;
        min-width: 675px !important;
        padding: 0 !important; /* Remove mobile padding */
      }

      /* --- RESET ALL MOBILE FONT SIZES --- */

      .mainhead {
        font-size: 22px !important; /* Reset from mobile's 12px */
      }

      table th,
      table td {
        font-size: 13px !important; /* Reset from mobile's 7px */
        line-height: 1.4 !important; /* Reset from mobile's 12px */
      }

      /* Reset specific desktop font sizes */
      table.border-table th {
        font-size: 13.5px !important;
        line-height: 16px !important;
      }

      table.border-table td {
        font-size: 13px !important;
        line-height: 15px !important;
      }

      .pb25 {
        font-size: 15px !important;
        line-height: 22px !important;
      }

      /* --- RESET LOGO IMAGE SIZE --- */
      .logoimg img {
        width: auto !important; /* Reset from mobile's 130px */
        height: 55px !important; /* Reset from mobile's 28px */
      }

      /* --- HIDE UNNECESSARY GUTTERS --- */
      .m-td {
        display: none !important;
      }
    }
  </style>

</head>

<body class="body"
  style="padding:0 !important; margin:0 !important; display:block !important; min-width:100% !important; width:100% !important; background:#ffffff; -webkit-text-size-adjust:none;">
  <span class="mcnPreviewText"
    style="display:none; font-size:0px; line-height:0px; max-height:0px; max-width:0px; opacity:0; overflow:hidden; visibility:hidden; mso-hide:all;"></span>

  <table width="100%" border="0" cellspacing="0" cellpadding="0" bgcolor="#f4f4f4">
    <tr>
      <td align="center" valign="top">
        <div mc:repeatable="Select" mc:variant="Hero Image">
          <table width="100%" border="0" cellspacing="0" cellpadding="0">
            <tr>
              <td class="m-td" valign="top" style="font-size:0pt; line-height:0pt; text-align:left;">
                <table width="100%" border="0" cellspacing="0" cellpadding="0" bgcolor="#f4f4f4" class="border"
                  style="font-size:0pt; line-height:0pt; text-align:center; width:100%; min-width:100%;">
                  <tr>
                    <td bgcolor="#f4f4f4" height="auto" class="border"
                      style="font-size:0pt; line-height:0pt; text-align:center; width:100%; min-width:100%;"> </td>
                  </tr>
                </table>
              </td>
              <td valign="center" align="center" class="bordr mobile-shell" width="675" bgcolor="#ffffff"
                style="border-bottom: 3px solid #216896;">
                <table width="675" border="0" cellspacing="0" cellpadding="0" class="mobile-shell">
                  <tr>
                    <td class="td"
                      style="padding-top: 60px; width:675px; min-width:675px; font-size:0pt; line-height:0pt; padding:0; margin:0; font-weight:normal;">
                      <table width="100%" border="0" cellspacing="0" cellpadding="0">
                        <tr>
                          <td class="p30-15" style="padding: 12px;">
                            <table width="100%" border="0" cellspacing="0" cellpadding="0">
                              <tr>
                                <td class="h2 pb25 mainhead"
                                  style="color:#444444; font-family:Lato, Arial ,sans-serif; font-size:22px; font-weight:bold; line-height:24px;padding-bottom:8px;">
                                  <div mc:edit="text_2">${accommodationName} </div>
                                </td>
                              </tr>
                              <tr>
                                <td class="pb25"
                                  style="color:#000000; font-family:Lato, Arial,sans-serif; font-size:15px; line-height:15px; padding-bottom:8px;width:100%;padding-right: 6px;">
                                  <div mc:edit="text_3">Booking ID - <b>${BookingId}</b></div>
                                </td>
                              </tr>
                              <tr>
                                <td class="pb25"
                                  style="color:#000000; font-family:Lato, Arial,sans-serif; font-size:14px; line-height:15px; padding-bottom:0;width:100%;padding-right: 5px;">
                                  <div mc:edit="text_3">Booking Date - <span>${BookingDate}</span></div>
                                </td>
                              </tr>
                            </table>
                          </td>
                          <td class="fluid-img logoimg"
                            style="font-size:0pt; line-height:0pt; text-align:right;background:#ffffff;padding-right: 6px;">
                            <img src="https://plumeriaretreat.com/assets/plumeria-removebg-preview-CWtMayYt.png"
                              width="auto" height="55" mc:edit="image_2" style="max-height:55px;" border="0"
                              alt="Logo" />
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
              <td class="m-td" valign="top" style="font-size:0pt; line-height:0pt; text-align:left;">
                <table width="100%" border="0" cellspacing="0" cellpadding="0" bgcolor="#f4f4f4" class="border"
                  style="font-size:0pt; line-height:0pt; text-align:center; width:100%; min-width:100%;">
                  <tr>
                    <td bgcolor="#f4f4f4" height="auto" class="border"
                      style="font-size:0pt; line-height:0pt; text-align:center; width:100%; min-width:100%;"> </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </div>


        <div mc:repeatable="Select" mc:variant="Intro">
          <table width="100%" border="0" cellspacing="0" cellpadding="0" bgcolor="#f4f4f4">
            <tr>
              <td class="m-td" valign="top" style="font-size:0pt; line-height:0pt; text-align:left;">
                <table width="100%" border="0" cellspacing="0" cellpadding="0" bgcolor="#ffffff" class="border"
                  style="font-size:0pt; line-height:0pt; text-align:center; width:100%; min-width:100%;">
                  <tr>
                    <td bgcolor="#f4f4f4" height="150" class="border"
                      style="font-size:0pt; line-height:0pt; text-align:center; width:100%; min-width:100%;"> </td>
                  </tr>
                </table>
              </td>
              <td valign="top" align="center" class="mobile-shell p0-15" width="675" bgcolor="#ffffff">
                <table width="675" border="0" cellspacing="0" cellpadding="0" class="mobile-shell">
                  <tr>
                    <td class="td"
                      style="width:675px; min-width:675px; font-size:0pt; line-height:0pt; padding:0; margin:0; font-weight:normal;">
                      <table width="100%" border="0" cellspacing="0" cellpadding="0">
                        <tr>
                          <td class="bbrr" bgcolor="#ffffff" style="border-radius:0px 0px 12px 12px;">
                            <table width="100%" border="0" cellspacing="0" cellpadding="0">
                              <tr>
                                <td class="p30-15" style="padding: 12px;">

                                  <table width="100%" border="0" cellspacing="0" cellpadding="0">
                                    <tr>
                                      <td class="pb25"
                                        style="color:#000000; font-family:Lato, Arial,sans-serif; font-size:15px; line-height:22px; padding-bottom:8px;width:50%;">
                                        <div mc:edit="text_3"><b>Dear <span>${name}</span>,</b></div>
                                      </td>
                                    </tr>
                                    <tr>
                                      <td class="pb25"
                                        style="color:#000000; font-family:Lato, Arial,sans-serif; font-size:15px; line-height:22px; padding-bottom:8px;width:50%;">
                                        <div mc:edit="text_3"><span>${accommodationName} </span> has
                                          received a request for booking of
                                          your Camping as per the details below. The primary guest <span>${name}</span>
                                          will be
                                          carrying a copy of this e-voucher. </div>
                                      </td>
                                    </tr>
                                    <tr>
                                      <td class="pb25"
                                        style="color:#000000; font-family:Lato, Arial,sans-serif; font-size:15px; line-height:22px; padding-bottom:8px;width:50%;">
                                        <div mc:edit="text_3">For your reference, Booking ID is
                                          <span><b>${BookingId}</b></span>.</div>
                                      </td>
                                    </tr>
                                    <tr>
                                      <td class="pb25"
                                        style="color:#000000; font-family:Lato, Arial,sans-serif; font-size:15px; line-height:22px; padding-bottom:8px;width:50%;">
                                        <div mc:edit="text_3"><b>The amount payable to <span>Plumeria Retreat Pawna lake
                                              AC cottage </span> for this booking
                                            is <span>INR ${advancePayable}</span> as per the details below. Please email
                                            us at
                                            <a href="mailto: ${owner_email}"
                                              style="color: #216896;">booking@plumeriaretreat.com</a> if there is any
                                            discrepancy in this payment
                                            amount.</b></div>
                                      </td>
                                    </tr>
                                    <tr>
                                      <td class="pb25"
                                        style="color:#000000; font-family:Lato, Arial,sans-serif; font-size:15px; line-height:22px; padding-bottom:8px;width:100%;">
                                        <div mc:edit="text_3">Kindly consider this e-voucher for booking confirmation
                                          with the
                                          following inclusions and services. </div>
                                      </td>
                                    </tr>
                                  </table>

                                  <table width="100%" border="0" cellspacing="0" cellpadding="0">
                                    <tr>
                                      <td class="pb25"
                                        style="color:#000000; font-family:Lato, Arial,sans-serif; font-size:15px; line-height:22px; padding-bottom:8px;width:100%;">
                                        <div mc:edit="text_3"><b>Team <span>${accommodationName}
                                            </span></b></div>
                                      </td>
                                    </tr>
                                    <tr>
                                      <td class="pb25"
                                        style="color:#878887; font-family:Lato, Arial,sans-serif; font-size:14px; line-height:22px; padding-bottom:8px;width:100%;text-align:right;">
                                        <div mc:edit="text_3">All prices indicated below are in INR</div>
                                      </td>
                                    </tr>
                                  </table>

                                  <table class="border-table" width="100%"
                                    style="font-family: arial, sans-serif;border-collapse: collapse;width: 100%; margin-bottom: 10px;"
                                    cellspacing="0" cellpadding="0">
                                    <tr>
                                      <th class="bordr"
                                        style="border: 1px solid #dddddd;border-top: 3px solid #216896;text-align: left;padding: 9px 7px 10px;color: #878887;font-family: Lato, Arial,sans-serif;font-size: 13.5px;line-height: 16px;">
                                        BOOKING DETAILS</th>
                                      <th class="bordr"
                                        style="border: 1px solid #dddddd;border-top: 3px solid #216896;text-align: left;padding: 9px 7px 10px;color: #878887;font-family: Lato, Arial,sans-serif;font-size: 13.5px;line-height: 16px;">
                                        PAYMENT BREAKUP</th>
                                    </tr>
                                    <tr>
                                      <td valign="top"
                                        style="border: 1px solid #dddddd;text-align: left;padding: 6px 7px 8px;color: #000000;font-family: Lato, Arial,sans-serif;font-size: 13px;line-height: 15px;">
                                        <p style="padding-bottom: 5px;margin: 0px;">Mobile: <b>${mobile}</b></p>
                                        <p style="padding-bottom: 5px;margin: 0px;">Check In: <b>${CheckinDate}</b></p>
                                        <p style="padding-bottom: 5px;margin: 0px;">Check Out: <b>${CheckoutDate}</b>
                                        </p>
                                        <p style="padding-bottom: 5px;margin: 0px;">Total Person:
                                          <b>${totalPerson}</b></p>
                                        <p style="padding-bottom: 5px;margin: 0px;">Adult: <b>${adult}</b></p>

                                        ${guestDetailHtml}
                                        ${roomDetailHtml}

                                        ${foodDetailHtml} </td>
                                      <td
                                        style="border: 1px solid #dddddd;text-align: left;padding: 6px 7px 8px;color: #000000;font-family: Lato, Arial,sans-serif;font-size: 14px;line-height: 16px;">
                                        <table style="width: 100%;">
                                          <tr>
                                            <td valign="top" style="width: 100%;padding-right: 8px;">
                                              <p style="padding-top: 5px;padding-bottom: 10px;margin: 0px;">
                                                <b>TARRIF</b></p>
                                              <p style="padding-bottom: 10px;margin: 0px;">Full Amount: <b
                                                  style="float:right;">${full_amount}</b></p>
                                              <p style="padding-bottom: 10px;margin: 0px;">Discount: <b
                                                  style="float:right;">${discount}</b></p>
                                              <p style="padding-bottom: 10px;margin: 0px;">Coupon: <b
                                                  style="float:right;">${coupon}</b></p>

                                              <p style="padding-bottom: 10px;margin: 0px;">Total Amount: <b
                                                  style="float:right;">${totalPrice}</b></p>
                                              <p style="padding-bottom: 10px;margin: 0px;">Advance Amount: <b
                                                  style="float:right;">${advancePayable}</b></p>
                                              <p style="padding-bottom: 10px;margin: 0px;">Remaining Amount: <b
                                                  style="float:right;">${remainingAmount}</b></p>
                                            </td>
                                          </tr>
                                        </table>
                                      </td>
                                    </tr>
                                  </table>

                                  <table width="100%" border="0" cellspacing="0" cellpadding="0">
                                    <tr>
                                      <td class="pb25 mobheadpb"
                                        style="color:#000000; font-family:Lato, Arial,sans-serif; font-size:15px; line-height:22px; padding-bottom:24px;">
                                        <div mc:edit="text_3"><b>Booking Cancellation Policy:</b> From
                                          ${BookingDate},100%
                                          penalty will be
                                          charged. In case of no show : no refund.Booking cannot be
                                          cancelled/modified on or after the booking date and time mentioned in
                                          the Camping Confirmation Voucher. All time mentioned above is in
                                          destination time.</div>
                                      </td>
                                    </tr>
                                    <tr>
                                      <td class="pb25 bordr"
                                        style="color:#216896;border-bottom: 3px solid #216896; font-family:Lato, Arial,sans-serif; font-size:15px; line-height:22px; padding-bottom:6px;">
                                        <div mc:edit="text_3"><b>Note</b></div>
                                      </td>
                                    </tr>
                                    <tr>
                                      <td class="pb25"
                                        style="color:#000000; font-family:Lato, Arial,sans-serif; font-size:15px; line-height:22px; padding-bottom:8px;padding-top:8px;">
                                        <div mc:edit="text_3">If your contact details have changed, please notify us so
                                          that the
                                          same can be updated in our records.</div>
                                      </td>
                                    </tr>
                                    <tr>
                                      <td class="pb25 mobheadpb"
                                        style="color:#000000; font-family:Lato, Arial,sans-serif; font-size:15px; line-height:22px; padding-bottom:24px;">
                                        <div mc:edit="text_3">If the booking is cancelled or changed by guest at a later
                                          stage,
                                          you will be notified and this confirmation email & Plumeria Retreat Pawna lake
                                          AC cottage Booking ID will be null and void.</div>
                                      </td>
                                    </tr>
                                  </table>

                                  <table width="100%" border="0" cellspacing="0" cellpadding="0">
                                    <tr>
                                      <td>
                                        <table width="100%" border="0" cellspacing="0" cellpadding="0">
                                          <tr>
                                            <td class="pb25 bordr"
                                              style="color:#216896;border-bottom: 3px solid #216896; font-family:Lato, Arial,sans-serif; font-size:15px; line-height:22px; padding-bottom:6px;">
                                              <div mc:edit="text_3"><b>${accommodationName} Contact
                                                  Info</b></div>
                                            </td>
                                          </tr>
                                        </table>
                                      </td>
                                    </tr>
                                  </table>
                                  <table width="100%" border="0" cellspacing="0" cellpadding="0">
                                    <tr>
                                      <td style="padding-top:8px;padding-bottom:8px;width:50%;">
                                        <table width="100%" border="0" cellspacing="0" cellpadding="0">
                                          <tr>
                                            <td class="pb25"
                                              style="color:#000000; font-family:Lato, Arial,sans-serif; font-size:15px; line-height:22px;">
                                              <div mc:edit="text_3"><b>${accommodationName} </b></div>
                                            </td>
                                          </tr>
                                          <tr>
                                            <td class="pb25"
                                              style="color:#000000; font-family:Lato, Arial,sans-serif; font-size:15px; line-height:22px;">
                                              <div mc:edit="text_3">At- <span>${accommodationAddress}</span></div>
                                            </td>
                                          </tr>
                                          <tr>
                                            <td class="pb25"
                                              style="color:#000000; font-family:Lato, Arial,sans-serif; font-size:15px; line-height:22px;">
                                              <div mc:edit="text_3"><span>pawna lake</span></div>
                                            </td>
                                          </tr>
                                          <tr>
                                            <td class="pb25"
                                              style="color:#216896; font-family:Lato, Arial,sans-serif; font-size:14px; line-height:22px;">
                                              <div mc:edit="text_3">
                                                <a href="http://maps.google.com/maps?q=${latitude},${longitude}"
                                                  style="color: #216896;">Google Maps Link</a>
                                              </div>
                                            </td>
                                          </tr>
                                        </table>
                                      </td>
                                      <td style="padding-top:8px;padding-bottom:8px;width:50%;">
                                        <table width="100%" border="0" cellspacing="0" cellpadding="0">
                                          <tr>
                                            <td class="pb25"
                                              style="color:#000000; font-family:Lato, Arial,sans-serif; font-size:14px; line-height:22px;">
                                              <div mc:edit="text_3">
                                                <span><b>Email- </b></span><span><a
                                                    href="mailto:${owner_email}"
                                                    style="color: #164e6f;"><b>booking@plumeriaretreat.com</b></a></span>
                                              </div>
                                            </td>
                                          </tr>
                                          <tr>
                                            <td class="pb25"
                                              style="color:#000000; font-family:Lato, Arial,sans-serif; font-size:14px; line-height:22px;">
                                              <div mc:edit="text_3">
                                                <span><b>Contact Number- </b></span>
                                                <span>${ownerName}</span>- <span>${ownerPhone}</span>
                                              </div>
                                            </td>
                                          </tr>
                                        </table>
                                      </td>
                                    </tr>
                                  </table>



                                  <table width="100%" border="0" cellspacing="0" cellpadding="0"
                                    style="padding-top: 10px;border-top:1px solid #dddddd;">
                                    <tr>
                                      <td class="pb25"
                                        style="color:#000000; font-family:Lato, Arial,sans-serif; font-size:15px; line-height:22px; padding-bottom:8px;">
                                        <div mc:edit="text_3"><b>Note</b> - Please do not reply to this email. It has
                                          been sent from an
                                          email account that is not monitored. To ensure that you receive
                                          communication related to your booking from Plumeria Retreat Pawna lake AC
                                          cottage , please add <a href="mailto:booking@plumeriaretreat.com "
                                            style="color: #164e6f;"><b>booking@plumeriaretreat.com </b></a> to your
                                          contact list
                                          and
                                          address book.</div>
                                      </td>
                                    </tr>
                                  </table>
                                  <table width="100%" border="0" cellspacing="0" cellpadding="0"
                                    style="padding-top: 15px;">
                                    <tr>
                                      <td class="pb25 bordr"
                                        style="color:#216896;border-bottom: 3px solid #216896; font-family:Lato, Arial,sans-serif; font-size:15px; line-height:22px; padding-bottom:6px;">
                                        <div mc:edit="text_3"><b>Things to Carry</b></div>
                                      </td>
                                    </tr>
                                    <tr>
                                      <td class-"pb25"
                                        style="color:#000000; font-family:Lato, Arial,sans-serif; font-size:15px; line-height:22px; padding-top:8px; padding-bottom:8px;">
                                        • Always good to carry extra pair of clothes<br>
                                        • Winter and warm clothes as it will be cold night<br>
                                        • Toothbrush and paste (toiletries)<br>
                                        • Any other things you feel necessary<br>
                                        • Personal medicine if any
                                      </td>
                                    </tr>
                                  </table>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
              <td class="m-td" valign="top" style="font-size:0pt; line-height:0pt; text-align:left;">
                <table width="100%" border="0" cellspacing="0" cellpadding="0" bgcolor="#ffffff" class="border"
                  style="font-size:0pt; line-height:0pt; text-align:left; width:100%; min-width:100%;">
                  <tr>
                    <td bgcolor="#f4f4f4" height="150" class="border"
                      style="font-size:0pt; line-height:0pt; text-align:left; width:100%; min-width:100%;"> </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </div>

      </td>
    </tr>
  </table>
</body>

</html>`
    const container = document.createElement('div');
  container.innerHTML = html;

  container.style.position = 'absolute';
  container.style.top = '-9999px';
  container.style.left = '-9999px';
  container.style.width = '794px'; // A4 width in pixels at 96 DPI
  container.style.background = 'white';
  container.style.padding = '0';
  container.style.margin = '0';

  document.body.appendChild(container);

  html2canvas(container, {
    scale: 2,
    useCORS: true
  }).then((canvas) => {
    const imgData = canvas.toDataURL('image/png');

    // Use image size to create a custom-height PDF
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;

    const pdfWidth = 595.28; // A4 width in pt
    const pdfHeight = (imgHeight * pdfWidth) / imgWidth; // dynamic height

    const pdf = new jsPDF('p', 'pt', [pdfWidth, pdfHeight]);
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`Booking-${BookingId}.pdf`);

    document.body.removeChild(container);
  }).catch((error) => {
    console.error("PDF generation failed:", error);
    document.body.removeChild(container);
  });
  }
  useEffect(() => {
    if (formData.accommodation_id) {
      fetchAccommodationDetails(formData.accommodation_id);
    }
  }, [formData.accommodation_id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.guest_name ||
      !formData.guest_email ||
      !formData.accommodation_id ||
      !formData.check_in ||
      !formData.check_out ||
      !formData.total_amount
    ) {
      alert('Please fill in all required fields');
      return;
    }
    
    // This check is valid for villas too (a villa is 1 room, if availableRooms is 0, it's booked)
    if (availableRooms === 0) {
      alert('This accommodation is fully booked for the selected date. Please choose another date or accommodation.');
      return;
    }

    const adults = parseInt(formData.adults);
    const children = parseInt(formData.children) || 0; // Default to 0
    const extra_adults = parseInt(formData.extra_adults) || 0; // Default to 0
    const rooms = parseInt(formData.rooms);
    const food_veg = parseInt(formData.food_veg);
    const food_nonveg = parseInt(formData.food_nonveg);
    const food_jain = parseInt(formData.food_jain);
    const totalGuests = adults + children + extra_adults; // Updated total
    const totalFood = food_veg + food_nonveg + food_jain;

    //
    // --- *** 🚀 CHANGE 2: UPDATED VALIDATION LOGIC *** ---
    //
    if (selectedAccommodation) {
      const baseCapacity = selectedAccommodation.capacity;
      
      if (selectedAccommodation.type === 'Villa') {
        // Validation for Villa:
        // Check if the "Adults" field (base guests) exceeds the "Base Capacity"
        if (adults > baseCapacity) {
          alert(`Base capacity for the villa is ${baseCapacity}. Please enter ${baseCapacity} or fewer guests in the "Adults" field. Use the "Extra Adult Guest" field for any additional guests.`);
          return;
        }
      } else {
        // Validation for regular rooms (your original logic)
        if (totalGuests > rooms * baseCapacity) {
          alert(`Maximum ${baseCapacity} guests per room. You have ${totalGuests} guests for ${rooms} room(s).`);
          return;
        }
      }
    }

    // Only validate food count if the accommodation type is NOT 'villa'
    if (selectedAccommodation?.type !== 'Villa') {
      if (totalFood !== totalGuests) {
        alert('Food preferences must match total guests count');
        return;
      }
    }

    if (new Date(formData.check_in) >= new Date(formData.check_out)) {
      alert('Check-out must be after check-in');
      return;
    }

    if (adults < 1 || rooms < 1) {
      alert('Must have at least 1 adult and 1 room');
      return;
    }

    // Only check rooms > availableRooms if NOT a villa
    if (selectedAccommodation?.type !== 'Villa' && rooms > availableRooms) {
      alert(`Only ${availableRooms} room(s) available for this accommodation`);
      return;
    }

    setLoading(true);
    try {
      const bookingPayload = {
        guest_name: formData.guest_name,
        guest_email: formData.guest_email,
        guest_phone: formData.guest_phone || null,
        accommodation_id: parseInt(formData.accommodation_id),
        check_in: formData.check_in,
        check_out: formData.check_out,
        adults,
        children,
        extra_adults, // Add to payload
        rooms,
        food_veg,
        food_nonveg,
        food_jain,
        coupon : formData.coupon_code,
	      discount : parseFloat(formData.total_amount || '0') - parseFloat(formData.discounted_amount || '0'),
	      full_amount : parseFloat(formData.total_amount),
        total_amount: parseFloat(formData.discounted_amount || formData.total_amount),
        advance_amount: parseFloat(formData.advance_amount || '0'),
        isvilla: selectedAccommodation?.type === 'Villa' ? true : false,
        
        
      };
      console.log("bookingPayload :",bookingPayload);
      const response = await fetch(`https://a.plumeriaretreat.com/admin/bookings/offline`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingPayload),
      });
      console.log("response :",response);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create booking');
      }

      const result = await response.json();
      console.log("result",result)
      // Updated total person calculation
      const totalPerson = bookingPayload.adults + bookingPayload.children + bookingPayload.extra_adults;

      // Use selectedAccommodation state for PDF details (cleaner)
      const accommodationName = selectedAccommodation?.name || '';
      const accommodationAddress = selectedAccommodation?.address || '';
      const latitude = (selectedAccommodation?.latitude || 0).toString();
      const longitude = (selectedAccommodation?.longitude || 0).toString();

downloadPdf(
  bookingPayload.guest_email,
  bookingPayload.guest_name,
  result.data.booking.id.toString(),
  bookingPayload.check_in,
  bookingPayload.check_out,
  bookingPayload.total_amount,
  bookingPayload.advance_amount,
  (bookingPayload.total_amount - bookingPayload.advance_amount),
  bookingPayload.guest_phone || '',
  totalPerson,
  bookingPayload.adults,
  bookingPayload.children,
  bookingPayload.extra_adults,
  bookingPayload.food_veg,
  bookingPayload.food_nonveg,
  bookingPayload.food_jain,
  accommodationName,
  accommodationAddress,
  latitude,
  bookingPayload.coupon,
  bookingPayload.discount,
  bookingPayload.full_amount,
  bookingPayload.rooms,
  result.data.owner_name.toString() || '',
  result.data.owner_phone.toString() || '',
  longitude,
  result.data.owner_email.toString()
);

      alert('Booking created successfully!');
      navigate('/bookings');

    } catch (error) {
      console.error('Error creating booking:', error);
      alert(`Error creating booking: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading && accommodations.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16 md:pb-0 w-full max-w-full overflow-x-auto">
      <div className="sm:flex sm:items-center sm:justify-between min-w-max">
        <div>
          <div className="flex items-center">
            <button
              onClick={() => navigate('/bookings')}
              className="mr-2 text-gray-400 hover:text-gray-500"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Create New Booking</h1>
          </div>
          <p className="mt-1 text-sm text-gray-500">Add a new booking manually</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8 min-w-max">
        <div className="bg-white shadow rounded-lg overflow-hidden min-w-max">
          <div className="p-6 space-y-6">
            <div className="flex items-center mb-4">
              <User className="h-5 w-5 text-navy-600 mr-2" />
              <h2 className="text-lg font-medium text-gray-900">Guest Information</h2>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 min-w-max">
              <div>
                <label htmlFor="guest_name" className="block text-sm font-medium text-gray-700">
                  Guest Name *
                </label>
                <input
                  type="text"
                  id="guest_name"
                  name="guest_name"
                  value={formData.guest_name}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-navy-500 focus:border-navy-500 sm:text-sm"
                  required
                />
              </div>

              <div>
                <label htmlFor="guest_email" className="block text-sm font-medium text-gray-700">
                  Email *
                </label>
                <input
                  type="email"
                  id="guest_email"
                  name="guest_email"
                  value={formData.guest_email}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-navy-500 focus:border-navy-500 sm:text-sm"
                  required
                />
              </div>

              <div>
                <label htmlFor="guest_phone" className="block text-sm font-medium text-gray-700">
                  Phone
                </label>
                <input
                  type="tel"
                  id="guest_phone"
                  name="guest_phone"
                  value={formData.guest_phone}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-navy-500 focus:border-navy-500 sm:text-sm"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg overflow-hidden min-w-max">
          <div className="p-6 space-y-6">
            <div className="flex items-center mb-4">
              <Building2 className="h-5 w-5 text-navy-600 mr-2" />
              <h2 className="text-lg font-medium text-gray-900">Booking Details</h2>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 min-w-max">
              <div>
                <label htmlFor="accommodation_id" className="block text-sm font-medium text-gray-700">
                  Accommodation *
                </label>
                <select
                  id="accommodation_id"
                  name="accommodation_id"
                  value={formData.accommodation_id}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-navy-500 focus:border-navy-500 sm:text-sm"
                  required
                >
                  <option value="">Select Accommodation</option>
                  {accommodations.map(acc => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="check_in" className="block text-sm font-medium text-gray-700">
                  Check In Date *
                </label>
                <input
                  type="date"
                  id="check_in"
                  name="check_in"
                  value={formData.check_in}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-navy-500 focus:border-navy-500 sm:text-sm"
                  required
                />
              </div>

              <div>
                <label htmlFor="check_out" className="block text-sm font-medium text-gray-700">
                  Check Out Date *
                </label>
                <input
                  type="date"
                  id="check_out"
                  name="check_out"
                  value={formData.check_out}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-navy-500 focus:border-navy-500 sm:text-sm"
                  required
                />
              </div>

              {dateError && (
                <div className="sm:col-span-2">
                  <div className="text-sm text-red-600 bg-red-50 p-2 rounded-md">
                    {dateError}
                  </div>
                </div>
              )}

              <div>
                <label htmlFor="adults" className="block text-sm font-medium text-gray-700">
                  {/* Conditionally label for Villa */}
                  {selectedAccommodation?.type === 'Villa' ? 'Base Guests' : 'Adults *'}
                </label>
                <input
                  type="number"
                  id="adults"
                  name="adults"
                  min="1"
                  value={formData.adults}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-navy-500 focus:border-navy-500 sm:text-sm"
                  required
                />
              </div>

              {/* Conditionally render Children input */}
              {selectedAccommodation?.type !== 'Villa' && (
                <div>
                  <label htmlFor="children" className="block text-sm font-medium text-gray-700">
                    Children
                  </label>
                  <input
                    type="number"
                    id="children"
                    name="children"
                    min="0"
                    value={formData.children}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-navy-500 focus:border-navy-500 sm:text-sm"
                  />
                </div>
              )}

              {/* Conditionally render Extra Adult Guest input */}
              {selectedAccommodation?.type === 'Villa' && (
                <div>
                  <label htmlFor="extra_adults" className="block text-sm font-medium text-gray-700">
                    Extra Adult Guest
                  </label>
                  <input
                    type="number"
                    id="extra_adults"
                    name="extra_adults"
                    min="0"
                    value={formData.extra_adults}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-navy-500 focus:border-navy-500 sm:text-sm"
                  />
                   <div className="mt-1 text-sm text-gray-500">
                    Charge: ₹{selectedAccommodation.RatePerPerson || 0} / guest
                  </div>
                </div>
              )}

              {/* Conditionally render Number of Rooms input */}
              {selectedAccommodation?.type !== 'Villa' && (
                <div>
                  <label htmlFor="rooms" className="block text-sm font-medium text-gray-700">
                    Number of Rooms *
                  </label>
                  <input
                    type="number"
                    id="rooms"
                    name="rooms"
                    min={availableRooms > 0 ? 1 : 0}
                    max={availableRooms}
                    value={formData.rooms}
                    onChange={handleChange}
                    className={`mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-navy-500 focus:border-navy-500 sm:text-sm ${availableRooms <= 0 ? 'bg-gray-100 text-gray-500' : ''
                      }`}
                    required
                    disabled={availableRooms <= 0}
                  />
                  <div className="mt-1 text-sm text-gray-500">
                    {showRoomAvailability ? (
                      availableRooms <= 0 ? (
                        <span className="text-red-600 font-medium">
                          All rooms booked for the selected date
                        </span>
                      ) : (
                        `${availableRooms} room(s) available (Total: ${selectedAccommodation?.available_rooms || 0
                        }, Booked: ${bookedRooms}, Blocked: ${blockedRoomsCount})`
                      )
                    ) : formData.accommodation_id && !formData.check_in ? (
                      'Select a date to see availability'
                    ) : null}
                  </div>
                </div>
              )}

              {selectedAccommodation && (
                <div className="sm:col-span-2">
                  {/*
                    // --- *** 🚀 CHANGE 3: UPDATED UI TEXT *** ---
                  */}
                  <div className="text-sm text-gray-700">
                    <strong>
                      {selectedAccommodation.type === 'Villa' ? 'Villa Base Capacity:' : 'Room Capacity:'}
                    </strong>
                    {' '}{selectedAccommodation.capacity} guests
                    {selectedAccommodation.type === 'Villa' ? ' (included in price)' : ' per room'}
                  </div>
                  
                  <div className="text-sm text-gray-700 mt-1">
                    <strong>Current Guests:</strong> {parseInt(formData.adults) + parseInt(formData.children) + parseInt(formData.extra_adults)}
                    {' '}guests
                    {selectedAccommodation.type !== 'Villa' && ` for ${formData.rooms} room(s)`}
                    
                    {/* Hide max allowed for villa as it's confusing */}
                    {selectedAccommodation.type !== 'Villa' && 
                      ` - Max allowed: ${parseInt(formData.rooms) * selectedAccommodation.capacity}`
                    }
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Conditionally render Food Preference section */}
        {selectedAccommodation?.type !== 'Villa' && (
          <div className="bg-white shadow rounded-lg overflow-hidden min-w-max">
            <div className="p-6 space-y-6">
              <div className="flex items-center mb-4">
                <UtensilsCrossed className="h-5 w-5 text-navy-600 mr-2" />
                <h2 className="text-lg font-medium text-gray-900">Food Preference</h2>
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 min-w-max">
                <div>
                  <label htmlFor="food_veg" className="block text-sm font-medium text-gray-700">
                    Veg Count
                  </label>
                  <input
                    type="number"
                    id="food_veg"
                    name="food_veg"
                    min="0"
                    max={parseInt(formData.adults) + parseInt(formData.children) + parseInt(formData.extra_adults)}
                    value={formData.food_veg}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-navy-500 focus:border-navy-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="food_nonveg" className="block text-sm font-medium text-gray-700">
                    Non-Veg Count
                  </label>
                  <input
                    type="number"
                    id="food_nonveg"
                    name="food_nonveg"
                    min="0"
                    max={parseInt(formData.adults) + parseInt(formData.children) + parseInt(formData.extra_adults)}
                    value={formData.food_nonveg}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-navy-500 focus:border-navy-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="food_jain" className="block text-sm font-medium text-gray-700">
                    Jain Count
                  </label>
                  <input
                    type="number"
                    id="food_jain"
                    name="food_jain"
                    min="0"
                    max={parseInt(formData.adults) + parseInt(formData.children) + parseInt(formData.extra_adults)}
                    value={formData.food_jain}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-navy-500 focus:border-navy-500 sm:text-sm"
                  />
                </div>

                <div className="sm:col-span-3">
                  <div className="text-sm text-gray-700">
                    <strong>Food Preferences:</strong> Veg: {formData.food_veg},
                    Non-Veg: {formData.food_nonveg}, Jain: {formData.food_jain}
                    {' '} | Total: {parseInt(formData.food_veg) + parseInt(formData.food_nonveg) + parseInt(formData.food_jain)}
                  </div>
                  <div className="text-sm text-gray-700 mt-1">
                    <strong>Total Guests:</strong> {parseInt(formData.adults) + parseInt(formData.children) + parseInt(formData.extra_adults)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white shadow rounded-lg overflow-hidden min-w-max">
          <div className="p-6 space-y-6">
            <div className="flex items-center mb-4">
              <CreditCard className="h-5 w-5 text-navy-600 mr-2" />
              <h2 className="text-lg font-medium text-gray-900">Payment Information</h2>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 min-w-max">
              <div>
                <label htmlFor="final_amount" className="block text-sm font-medium text-gray-700">
                  Total Amount (₹) *
                </label>
                <input
                  type="number"
                  id="final_amount"
                  step="0.01"
                  value={formData.discounted_amount}
                  readOnly
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-navy-500 focus:border-navy-500 sm:text-sm bg-gray-100"
                  required
                />
              </div>

              <div>
                <label htmlFor="coupon_code" className="block text-sm font-medium text-gray-700">
                  Coupon Code
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="coupon_code"
                    name="coupon_code"
                    value={formData.coupon_code}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-navy-500 focus:border-navy-500 sm:text-sm"
                    placeholder="Enter coupon code"
                  />
                  {availableCoupons.length > 0 && !appliedCoupon && (
                    <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md border border-gray-200 max-h-60 overflow-auto min-w-[300px]">
                      {availableCoupons.map(coupon => (
                        <div
                          key={coupon.id}
                          className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                          onClick={() => handleCouponSelect(coupon)}
                        >
                          <div className="font-medium">{coupon.code}</div>
                          <div className="text-gray-500">
                            {coupon.discountType === 'percentage'
                              ? `${coupon.discount}% off`
                              : `₹${coupon.discount} off`}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {appliedCoupon && (
                  <div className="mt-1 text-sm text-green-600">
                    Coupon applied: {appliedCoupon.code} - {appliedCoupon.discountType === 'percentage'
                      ? `${appliedCoupon.discount}% discount`
                      : `₹${appliedCoupon.discount} discount`}
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="advance_amount" className="block text-sm font-medium text-gray-700">
                  Advance Amount (₹)
                </label>
                <input
                  type="number"
                  id="advance_amount"
                  name="advance_amount"
                  step="0.01"
                  min="0"
                  value={formData.advance_amount}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-navy-500 focus:border-navy-500 sm:text-sm"
                />
              </div>

              <div>
                <label htmlFor="payment_method" className="block text-sm font-medium text-gray-700">
                  Payment Method
                </label>
                <select
                  id="payment_method"
                  name="payment_method"
                  value={formData.payment_method}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-navy-500 focus:border-navy-500 sm:text-sm"
                >
                  {paymentMethods.map(method => (
                    <option key={method.id} value={method.id}>{method.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                  Notes (Optional)
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-navy-500 focus:border-navy-500 sm:text-sm"
                  rows={3}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3 min-w-max">
          <button
            type="button"
            onClick={() => navigate('/bookings')}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-navy-500"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-navy-600 hover:bg-navy-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-navy-500 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? 'Creating...' : 'Create Booking'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateBooking;