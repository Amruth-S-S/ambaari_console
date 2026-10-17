// Empty records describing each list page's CSV columns for <CsvTools>.
// Typed against the API's create shapes, so TypeScript flags a missing or
// misspelled column. Strings become text columns; arrays become JSON columns
// (exported as JSON, read back as JSON on import).
import type {
  AccountEntryInput,
  BookingData,
  CurrencyEntryInput,
  DmcAccountInput,
  HotelVoucherInput,
  OfferInput,
  PackageData,
  RoomEntryInput,
  UpcomingPackageInput,
} from "@/lib/api";

export const ACCOUNT_CSV: AccountEntryInput = {
  slNo: "",
  date: "",
  invoiceNo: "",
  agent: "",
  clientName: "",
  name: "",
  destination: "",
  handOverTo: "",
  debit: "",
  credit: "",
  balance: "",
  paymentMode: "",
  description: "",
};

export const CURRENCY_CSV: CurrencyEntryInput = {
  slNo: "",
  travelDate: "",
  passportNumber: "",
  clientName: "",
  name: "",
  phoneNumber: "",
  currency: "",
  amount: "",
  clientAmount: "",
  currencyConversion: "",
  bankConversion: "",
  companyCurrencyConversion: "",
  paymentMode: "",
  handOverTo: "",
  transferTo: "",
  surname: "",
  givenName: "",
  sex: "",
  dob: "",
  nationality: "",
  placeOfBirth: "",
  placeOfIssue: "",
  dateOfIssue: "",
  dateOfExpiry: "",
  fatherName: "",
  motherName: "",
  spouseName: "",
  address: "",
  fileNo: "",
};

export const DMC_CSV: DmcAccountInput = {
  slNo: "",
  name: "",
  travelDate: "",
  paymentFrom: "",
  paymentTo: "",
  paymentMode: "",
  destination: "",
  numberOfTravelers: "",
  perPersonQuotation: "",
  totalAmount: "",
  debit: "",
  credit: "",
  balance: "",
  note: "",
};

export const VOUCHER_CSV: HotelVoucherInput = {
  voucherNo: "",
  date: "",
  agent: "",
  country: "",
  nationality: "",
  adults: "",
  children: "",
  contactPerson: "",
  meetingPoint: "",
  boardName: "",
  arrival: "",
  arrivalFlight: "",
  departure: "",
  departureFlight: "",
  specialRequirements: "",
  guests: [],
  hotels: [],
  holidayPackage: "",
  transferDetail: "",
};

export const UPCOMING_CSV: UpcomingPackageInput = {
  month: "",
  dates: "",
  packageName: "",
  landCost: "",
  packageType: "",
};

export const OFFER_CSV: OfferInput = {
  packageName: "",
  targetAmount: "",
  fromDate: "",
  toDate: "",
};

export const ROOM_CSV: RoomEntryInput = {
  slNo: "",
  packageType: "international",
  packageId: "",
  packageTitle: "",
  clientName: "",
  invoiceNumber: "",
  roomType: "",
  numberOfRooms: "",
  sharingPerRoom: "",
  travelers: [],
};

// logo / poster are base64 images — left out of the CSV (see PACKAGE_OMIT).
export const PACKAGE_CSV: PackageData = {
  companyName: "",
  logo: null,
  poster: null,
  packageTitle: "",
  packageType: "domestic",
  duration: "",
  highlights: [],
  days: [],
  inclusions: [],
  exclusions: [],
  adultPrice: "",
  childPrice: "",
  bookingAmount: "",
  gst: "",
  dates: [],
  cancellationPolicy: "",
  additionalInfo: "",
  termsConditions: "",
};
export const PACKAGE_OMIT = ["logo", "poster"];

// ID-document uploads (base64) are left out — see BOOKING_OMIT.
export const BOOKING_CSV: Required<BookingData> = {
  userId: "",
  clientName: "",
  clientPhone: "",
  clientEmail: "",
  location: "",
  packageType: "domestic",
  packageId: "",
  landPackage: "",
  travelDate: "",
  finalPaymentDate: "",
  adults: "1",
  children: "0",
  infants: "0",
  adultPrice: "",
  childPrice: "",
  infantPrice: "",
  flightAmount: "",
  adultLandPrice: "",
  childLandPrice: "",
  infantLandPrice: "",
  advancePayments: [],
  invoiceNumber: "",
  invoiceDate: "",
  amount: "",
  transactionId: "",
  specialRequirements: "",
  note: "",
  aadharDoc: [],
  panDoc: [],
  passportDoc: [],
  otherDocs: [],
};
export const BOOKING_OMIT = ["aadharDoc", "panDoc", "passportDoc", "otherDocs"];

export const USER_CSV = { name: "", email: "", phone: "", password: "", roleIds: [] as string[] };
export const ROLE_CSV = { name: "" };
