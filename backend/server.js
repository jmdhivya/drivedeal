const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const nodemailer = require('nodemailer');
require('dotenv').config();
const sendEnquiryEmail = require('./sendEmail');

const app = express();
const PORT = process.env.PORT || 5000;

const adminEmail = process.env.ADMIN_EMAIL || 'drivedealvk@gmail.com';

const createEmailTransporter = () => {
  // Use Gmail SMTP configuration
  const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
  const smtpPort = Number(process.env.SMTP_PORT) || 587;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpDebug = process.env.SMTP_DEBUG === 'true';

  if (smtpUser && smtpPass) {
    return nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: false, // Use TLS (port 587)
      requireTLS: true, // Require TLS
      auth: {
        user: smtpUser,
        pass: smtpPass
      },
      // Helpful timeouts for clearer failures (e.g., blocked outbound SMTP)
      connectionTimeout: 20_000,
      greetingTimeout: 20_000,
      socketTimeout: 30_000,
      // Optional debug logging
      logger: smtpDebug,
      debug: smtpDebug
    });
  }
  // Fallback to JSON transport for development/testing
  console.warn('⚠️  Gmail SMTP credentials not configured. Emails will be logged to console.');
  return nodemailer.createTransport({ jsonTransport: true });
};

const emailTransporter = createEmailTransporter();

const enquiryRateLimit = new Map();

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir);
}

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Multer Configuration for Image Upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname)
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only images are allowed'));
    }
  }
});

// MongoDB Connection

const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/drivedeal';

if (!mongoUri.startsWith('mongodb://') && !mongoUri.startsWith('mongodb+srv://')) {
  console.error(
    '❌ MongoDB Connection Error: Invalid MONGO_URI scheme. Expected URI to start with "mongodb://" or "mongodb+srv://".'
  );
  console.error('Received MONGO_URI:', mongoUri);
  process.exit(1);
}

mongoose
  .connect(mongoUri, {
    serverSelectionTimeoutMS: 10_000
  })
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.error('❌ MongoDB Connection Error:', err));

// Mongoose Schemas and Models

// User Schema
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  password: { type: String, required: true },
  firstName: { type: String, default: '' },
  lastName: { type: String, default: '' },
  location: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

// Car Schema
const carSchema = new mongoose.Schema({
  brand: { type: String, required: true },
  model: { type: String, required: true },
  year: { type: Number, required: true },
  fuelType: { type: String, required: true },
  transmissionType: { type: String, enum: ['Manual', 'Automatic'], default: 'Manual' },
  bodyType: { type: String },
  color: { type: String, required: true },
  price: { type: Number, required: true },
  location: { type: String, required: true },
  kilometers: { type: Number, required: true },
  owners: { type: Number, required: true },
  registrationRTO: { type: String },
  seatingCapacity: { type: Number },
  insuranceInfo: { type: String },
  serviceHistory: { type: String },
  condition: { type: String },
  description: { 
    en: { type: String },
    ta: { type: String },
    kn: { type: String },
    te: { type: String }
  },
  images: [{ type: String }], // Array of image paths
  primaryImage: { type: String },
  status: { type: String, enum: ['available', 'booked', 'sold', 'new', 'hot'], default: 'available' },
  createdAt: { type: Date, default: Date.now }
});

const Car = mongoose.model('Car', carSchema);

// Wishlist Schema
const wishlistSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  carId: { type: mongoose.Schema.Types.ObjectId, ref: 'Car', required: true },
  createdAt: { type: Date, default: Date.now }
});

const Wishlist = mongoose.model('Wishlist', wishlistSchema);

// Compare Schema
const compareSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  carId: { type: mongoose.Schema.Types.ObjectId, ref: 'Car', required: true },
  createdAt: { type: Date, default: Date.now }
});

const Compare = mongoose.model('Compare', compareSchema);

// Booking Schema
const bookingSchema = new mongoose.Schema({
  carId: { type: mongoose.Schema.Types.ObjectId, ref: 'Car', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Optional if guest booking allowed
  customerName: { type: String, required: true },
  customerPhone: { type: String, required: true },
  customerEmail: { type: String, required: true },
  customerAddress: { type: String, required: true },
  customerDistrict: { type: String, required: true },
  customerState: { type: String, required: true },
  customerCountry: { type: String, required: true },
  bookingDate: { type: Date, default: Date.now },
  visitDate: { type: Date, required: true },
  visitTime: { type: String, required: true },
  paymentPreference: { 
    type: String, 
    enum: ['Ready Cost', 'Initial Amount', 'No Payment (Visit Only)'],
    required: true 
  },
  initialAmount: { type: Number },
  status: { type: String, enum: ['Pending', 'Accepted', 'Cancelled'], default: 'Pending' }
});

const Booking = mongoose.model('Booking', bookingSchema);

// Enquiry/Contact Schema
const enquirySchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String, required: true },
  message: { type: String, required: true },
  preferredBrand: { type: String },
  preferredModel: { type: String },
  budgetRange: { type: String },
  city: { type: String },
  type: { type: String, enum: ['general', 'car_enquiry', 'page_enquiry'], default: 'general' },
  status: { type: String, enum: ['New', 'Contacted', 'Closed'], default: 'New' },
  statusHistory: [
    {
      status: { type: String, enum: ['New', 'Contacted', 'Closed'], required: true },
      updatedAt: { type: Date, default: Date.now }
    }
  ],
  carId: { type: mongoose.Schema.Types.ObjectId, ref: 'Car' },
  createdAt: { type: Date, default: Date.now }
});

const Enquiry = mongoose.model('Enquiry', enquirySchema);

// Sold Car Schema
const soldCarSchema = new mongoose.Schema({
  carId: { type: mongoose.Schema.Types.ObjectId, ref: 'Car', required: true },
  buyerName: { type: String, required: true },
  buyerEmail: { type: String, required: true },
  buyerPhone: { type: String, required: true },
  buyerAddress: { type: String, required: true },
  buyerDistrict: { type: String, required: true },
  buyerState: { type: String, required: true },
  buyerCountry: { type: String, required: true },
  carName: { type: String, required: true },
  carModel: { type: String, required: true },
  salePrice: { type: Number, required: true },
  saleDate: { type: Date, required: true },
  paymentMethod: { type: String, required: true },
  additionalNotes: { type: String },
  createdAt: { type: Date, default: Date.now }
});

const SoldCar = mongoose.model('SoldCar', soldCarSchema);


// --- API Endpoints ---

// Car Management Endpoints
app.post('/api/cars', upload.array('images', 10), async (req, res) => {
  try {
    const { 
      brand, model, year, fuelType, color, price, location, kilometers, owners, 
      description, transmissionType, bodyType, registrationRTO, seatingCapacity, 
      insuranceInfo, serviceHistory, condition 
    } = req.body;
    
    let parsedDescription = description;
    try {
        if (typeof description === 'string') {
            parsedDescription = JSON.parse(description);
        }
    } catch (e) {
        console.warn('Description is not a valid JSON string, using as is (en)', e);
        parsedDescription = { en: description };
    }

    const images = req.files.map(file => file.path.replace(/\\/g, '/')); // Normalize paths
    const primaryImage = images.length > 0 ? images[0] : null;

    const newCar = new Car({
      brand, model, year, fuelType, color, price, location, kilometers, owners, 
      description: parsedDescription,
      transmissionType, bodyType, registrationRTO, seatingCapacity, 
      insuranceInfo, serviceHistory, condition,
      images,
      primaryImage
    });

    await newCar.save();
    res.status(201).json({ success: true, message: 'Car added successfully', data: newCar });
  } catch (error) {
    console.error('Error adding car:', error);
    res.status(500).json({ success: false, message: 'Server error adding car' });
  }
});

app.get('/api/cars/filters', async (req, res) => {
    try {
        const { 
            status, brand, model, fuelType, color, location, 
            priceMin, priceMax, yearMin, yearMax, kmMin, kmMax, owners,
            search 
        } = req.query;

        const query = {};

        if (search) {
            const searchRegex = new RegExp(search, 'i');
            const searchConditions = [
                { brand: searchRegex },
                { model: searchRegex },
                { fuelType: searchRegex },
                { location: searchRegex },
                { color: searchRegex }
            ];
            query.$or = searchConditions;
        }

        if (status) {
            const statusList = status.split(',');
            query.status = { $in: statusList };
        } else {
            query.status = { $ne: 'sold' };
        }

        if (brand) query.brand = { $in: brand.split(',') };
        if (model) query.model = { $in: model.split(',') };
        if (fuelType) query.fuelType = { $in: fuelType.split(',') };
        if (color) query.color = { $in: color.split(',') };
        if (location) query.location = { $in: location.split(',') };

        if (priceMin || priceMax) {
            query.price = {};
            if (priceMin) query.price.$gte = Number(priceMin);
            if (priceMax) query.price.$lte = Number(priceMax);
        }

        if (yearMin || yearMax) {
            query.year = {};
            if (yearMin) query.year.$gte = Number(yearMin);
            if (yearMax) query.year.$lte = Number(yearMax);
        }

        if (kmMin || kmMax) {
            query.kilometers = {};
            if (kmMin) query.kilometers.$gte = Number(kmMin);
            if (kmMax) query.kilometers.$lte = Number(kmMax);
        }

        if (owners) {
            const ownerList = owners.split(',');
            const exactOwners = ownerList.filter(o => !o.includes('+')).map(Number);
            const hasPlus = ownerList.some(o => o.includes('+'));
            
            if (hasPlus) {
                if (exactOwners.length > 0) {
                     query.$or = [
                        { owners: { $in: exactOwners } },
                        { owners: { $gte: 3 } }
                     ];
                } else {
                     query.owners = { $gte: 3 };
                }
            } else {
                query.owners = { $in: exactOwners };
            }
        }

        const matchStages = Object.keys(query).length ? [{ $match: query }] : [];

        const brandAgg = await Car.aggregate([
            ...matchStages,
            { $group: { _id: '$brand', count: { $sum: 1 } } },
            { $sort: { _id: 1 } }
        ]);

        const modelAgg = await Car.aggregate([
            ...matchStages,
            { $group: { _id: '$model', count: { $sum: 1 } } },
            { $sort: { _id: 1 } }
        ]);

        const colorAgg = await Car.aggregate([
            ...matchStages,
            { $group: { _id: '$color', count: { $sum: 1 } } },
            { $sort: { _id: 1 } }
        ]);

        const fuelAgg = await Car.aggregate([
            ...matchStages,
            { $group: { _id: '$fuelType', count: { $sum: 1 } } },
            { $sort: { _id: 1 } }
        ]);

        const locationAgg = await Car.aggregate([
            ...matchStages,
            { $group: { _id: '$location', count: { $sum: 1 } } },
            { $sort: { _id: 1 } }
        ]);

        const statusAgg = await Car.aggregate([
            ...matchStages,
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);

        const ownersAggRaw = await Car.aggregate([
            ...matchStages,
            { $group: { _id: '$owners', count: { $sum: 1 } } }
        ]);

        const ownersBuckets = { '1': 0, '2': 0, '3+': 0 };
        ownersAggRaw.forEach(o => {
            if (o._id === 1) ownersBuckets['1'] += o.count;
            else if (o._id === 2) ownersBuckets['2'] += o.count;
            else if (typeof o._id === 'number' && o._id >= 3) ownersBuckets['3+'] += o.count;
        });

        const ownersOptions = Object.entries(ownersBuckets)
            .filter(([, count]) => count > 0)
            .map(([value, count]) => ({ value, count }));

        const priceStats = await Car.aggregate([
            ...matchStages,
            { $group: { _id: null, min: { $min: '$price' }, max: { $max: '$price' } } }
        ]);
        
        const yearStats = await Car.aggregate([
            ...matchStages,
            { $group: { _id: null, min: { $min: '$year' }, max: { $max: '$year' } } }
        ]);
        
        const kmStats = await Car.aggregate([
            ...matchStages,
            { $group: { _id: null, min: { $min: '$kilometers' }, max: { $max: '$kilometers' } } }
        ]);

        res.json({
            success: true,
            data: {
                brands: brandAgg.map(b => ({ value: b._id, count: b.count })),
                models: modelAgg.map(m => ({ value: m._id, count: m.count })),
                colors: colorAgg.map(c => ({ value: c._id, count: c.count })),
                fuelTypes: fuelAgg.map(f => ({ value: f._id, count: f.count })),
                locations: locationAgg.map(l => ({ value: l._id, count: l.count })),
                owners: ownersOptions,
                statuses: statusAgg.map(s => ({ value: s._id, count: s.count })),
                priceRange: priceStats[0] || { min: 0, max: 10000000 },
                yearRange: yearStats[0] || { min: 2000, max: new Date().getFullYear() },
                kmRange: kmStats[0] || { min: 0, max: 200000 }
            }
        });
    } catch (error) {
        console.error('Error fetching filter options:', error);
        res.status(500).json({ success: false, message: 'Server error fetching filter options' });
    }
});

app.get('/api/cars', async (req, res) => {
  try {
    const { 
        status, brand, model, fuelType, color, location, 
        priceMin, priceMax, yearMin, yearMax, kmMin, kmMax, owners,
        search 
    } = req.query;

    const query = {};
    
    // Search Logic (Global Text Search)
    if (search) {
        const searchRegex = new RegExp(search, 'i');
        const searchConditions = [
            { brand: searchRegex },
            { model: searchRegex },
            { fuelType: searchRegex },
            { location: searchRegex },
            { color: searchRegex }
        ];
        
        // If we already have an $or (e.g. from owners logic), we need to use $and to combine them
        if (query.$or) {
            query.$and = [
                { $or: query.$or },
                { $or: searchConditions }
            ];
            delete query.$or;
        } else {
            query.$or = searchConditions;
        }
    }
    
    // Status Logic: Default to excluding 'sold' if no status provided
    if (status) {
        // If status is provided as comma-separated list
        const statusList = status.split(',');
        query.status = { $in: statusList };
    } else {
        // Default: Show available, booked, new, hot. Hide sold.
        query.status = { $ne: 'sold' };
    }

    if (brand) query.brand = { $in: brand.split(',') };
    if (model) query.model = { $in: model.split(',') }; // Note: This might need to be smarter if models are free-text
    if (fuelType) query.fuelType = { $in: fuelType.split(',') };
    if (color) query.color = { $in: color.split(',') };
    if (location) query.location = { $in: location.split(',') }; // Exact match for locations from dropdown
    
    if (priceMin || priceMax) {
        query.price = {};
        if (priceMin) query.price.$gte = Number(priceMin);
        if (priceMax) query.price.$lte = Number(priceMax);
    }

    if (yearMin || yearMax) {
        query.year = {};
        if (yearMin) query.year.$gte = Number(yearMin);
        if (yearMax) query.year.$lte = Number(yearMax);
    }

    if (kmMin || kmMax) {
        query.kilometers = {};
        if (kmMin) query.kilometers.$gte = Number(kmMin);
        if (kmMax) query.kilometers.$lte = Number(kmMax);
    }
    
    if (owners) {
        // owners can be "1", "2", "3+"
        // logic: if "3+" is in the list, we need special handling
        const ownerList = owners.split(',');
        const exactOwners = ownerList.filter(o => !o.includes('+')).map(Number);
        const hasPlus = ownerList.some(o => o.includes('+'));
        
        if (hasPlus) {
            // If 3+ is selected, we want (owners IN exactOwners) OR (owners >= 3)
            // But usually 3+ means >= 3. Let's assume the filter sends "3" for 3rd owner. 
            // If the UI sends "3+" specifically, we handle it.
            // For simplicity, let's assume exact match for 1, 2. And for 3+, we handle >= 3.
            if (exactOwners.length > 0) {
                 query.$or = [
                    { owners: { $in: exactOwners } },
                    { owners: { $gte: 3 } }
                 ];
            } else {
                 query.owners = { $gte: 3 };
            }
        } else {
            query.owners = { $in: exactOwners };
        }
    }



    const cars = await Car.find(query).sort({ createdAt: -1 });
    res.json({ success: true, data: cars });
  } catch (error) {
    console.error('Error fetching cars:', error);
    res.status(500).json({ success: false, message: 'Server error fetching cars' });
  }
});

app.get('/api/cars/:id', async (req, res) => {
    try {
        const car = await Car.findById(req.params.id);
        if (!car) {
            return res.status(404).json({ success: false, message: 'Car not found' });
        }
        
        // Count bookings for this car
        const bookingCount = await Booking.countDocuments({ carId: req.params.id });
        
        // Fetch related cars (same brand, similar price)
        const relatedCars = await Car.find({
            _id: { $ne: car._id },
            brand: car.brand,
            price: { $gte: car.price * 0.8, $lte: car.price * 1.2 }
        }).limit(4);

        res.json({ success: true, data: car, related: relatedCars, bookingCount });
    } catch (error) {
        console.error('Error fetching car details:', error);
        res.status(500).json({ success: false, message: 'Server error fetching car details' });
    }
});

app.put('/api/cars/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    if (!['available', 'booked', 'sold'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }
    const car = await Car.findByIdAndUpdate(req.params.id, { status }, { new: true });
    res.json({ success: true, message: 'Car status updated', data: car });
  } catch (error) {
    console.error('Error updating car status:', error);
    res.status(500).json({ success: false, message: 'Server error updating status' });
  }
});

app.delete('/api/cars/:id', async (req, res) => {
    try {
        await Car.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Car deleted successfully' });
    } catch (error) {
        console.error('Error deleting car:', error);
        res.status(500).json({ success: false, message: 'Server error deleting car' });
    }
});


// Booking Endpoints
app.post('/api/bookings', async (req, res) => {
    try {
        const booking = new Booking(req.body);
        await booking.save();
        
        // Optionally update car status to 'booked' automatically?
        // Requirement says "Booked... displays Booked badge... Prevents duplicate". 
        // Let's just save booking for now, admin can update status manually or we can trigger it.
        // For now, let's keep it simple.

        res.status(201).json({ success: true, message: 'Booking created', data: booking });
    } catch (error) {
        console.error('Error creating booking:', error);
        res.status(500).json({ success: false, message: 'Server error creating booking' });
    }
});

app.get('/api/bookings', async (req, res) => {
    try {
        const { email } = req.query;
        const filter = email ? { customerEmail: email } : {};
        const bookings = await Booking.find(filter).populate('carId').sort({ createdAt: -1 });
        res.json({ success: true, data: bookings });
    } catch (error) {
        console.error('Error fetching bookings:', error);
        res.status(500).json({ success: false, message: 'Server error fetching bookings' });
    }
});

app.put('/api/bookings/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        if (!['Pending', 'Accepted', 'Cancelled'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status' });
        }
        const booking = await Booking.findByIdAndUpdate(req.params.id, { status }, { new: true });
        if (!booking) {
            return res.status(404).json({ success: false, message: 'Booking not found' });
        }
        res.json({ success: true, message: `Booking status updated to ${status}`, data: booking });
    } catch (error) {
        console.error('Error updating booking status:', error);
        res.status(500).json({ success: false, message: 'Server error updating booking status' });
    }
});

// User Management Endpoint (Admin)
app.get('/api/users', async (req, res) => {
    try {
        const users = await User.find().select('-password').sort({ createdAt: -1 });
        res.json({ success: true, data: users });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ success: false, message: 'Server error fetching users' });
    }
});

// Contact/Enquiry form submission endpoint
app.post('/api/contact', async (req, res) => {
  try {
    const { 
      name,
      phone,
      email,
      message,
      carId,
      type,
      preferredBrand,
      preferredModel,
      budgetRange,
      city
    } = req.body;

    const ip = req.ip || (req.connection && req.connection.remoteAddress) || 'unknown';
    const now = Date.now();
    const windowMs = 10 * 60 * 1000;
    const maxRequests = 5;
    const existing = enquiryRateLimit.get(ip) || { count: 0, first: now };
    if (now - existing.first > windowMs) {
      existing.count = 0;
      existing.first = now;
    }
    existing.count += 1;
    enquiryRateLimit.set(ip, existing);
    if (existing.count > maxRequests) {
      return res.status(429).json({
        success: false,
        message: 'Too many enquiries from this IP. Please try again later.'
      });
    }

    const trimmedName = (name || '').trim();
    const trimmedPhone = (phone || '').trim();
    const trimmedEmail = (email || '').trim();
    const trimmedMessage = (message || '').trim();

    if (!trimmedName || !trimmedPhone || !trimmedEmail || !trimmedMessage) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Enter a valid email address'
      });
    }

    if (!/^\d+$/.test(trimmedPhone) || trimmedPhone.length < 10 || trimmedPhone.length > 15) {
      return res.status(400).json({
        success: false,
        message: 'Enter a valid mobile number'
      });
    }

    const enquiryType = type || 'general';

    const enquiry = new Enquiry({
      name: trimmedName,
      phone: trimmedPhone,
      email: trimmedEmail,
      message: trimmedMessage,
      preferredBrand,
      preferredModel,
      budgetRange,
      city,
      type: enquiryType,
      status: 'New',
      statusHistory: [
        {
          status: 'New',
          updatedAt: new Date()
        }
      ],
      carId: carId || undefined
    });

    await enquiry.save();

    let carData = {
        brand: preferredBrand || 'Not specified',
        model: preferredModel || 'Not specified',
        year: 'Not specified',
        fuelType: 'Not specified',
        price: budgetRange || 'Not specified'
    };

    if (carId) {
      try {
        const car = await Car.findById(carId);
        if (car) {
          carData = {
            brand: car.brand,
            model: car.model,
            year: car.year,
            fuelType: car.fuelType,
            price: car.price
          };
        }
      } catch (carError) {
        console.error('Error fetching car for enquiry email:', carError);
      }
    }

    const createdAt = enquiry.createdAt || new Date();
    const dateTimeString = createdAt.toLocaleString();

    // Format price if it's a number
    const formatPriceValue = (price) => {
      if (typeof price === 'number') {
        return new Intl.NumberFormat('en-IN', {
          style: 'currency',
          currency: 'INR',
          maximumFractionDigits: 0
        }).format(price);
      }
      return price || 'Not specified';
    };

    const formattedPrice = formatPriceValue(carData.price);

    const mailOptions = {
      from: `"DriveDeal Enquiries" <${process.env.SMTP_USER || adminEmail}>`,
      to: adminEmail,
      subject: 'New Customer Enquiry Received',
      text: [
        'A new customer enquiry has been received.',
        '',
        'Customer Details:',
        `Customer Name: ${name}`,
        `Customer Email: ${email}`,
        `Customer Phone Number: ${phone}`,
        `Location: ${city || 'Not specified'}`,
        '',
        'Vehicle Details:',
        `Vehicle Brand: ${carData.brand}`,
        `Vehicle Model: ${carData.model}`,
        `Vehicle Year: ${carData.year}`,
        `Fuel Type: ${carData.fuelType}`,
        `Price: ${formattedPrice}`,
        '',
        'Customer Message:',
        message,
        '',
        `Date and Time of Enquiry: ${dateTimeString}`
      ].join('\n'),
      html: [
        '<!DOCTYPE html>',
        '<html>',
        '<head>',
        '<meta charset="UTF-8">',
        '<style>',
        '  body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }',
        '  .container { max-width: 600px; margin: 0 auto; padding: 20px; }',
        '  .header { background-color: #1e40af; color: white; padding: 20px; text-align: center; }',
        '  .content { background-color: #f9fafb; padding: 20px; }',
        '  .section { margin-bottom: 20px; }',
        '  .section h3 { color: #1e40af; border-bottom: 2px solid #1e40af; padding-bottom: 5px; }',
        '  .field { margin: 10px 0; }',
        '  .field strong { color: #374151; }',
        '  .message-box { background-color: white; padding: 15px; border-left: 4px solid #1e40af; margin: 15px 0; }',
        '  .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 20px; }',
        '</style>',
        '</head>',
        '<body>',
        '<div class="container">',
        '<div class="header">',
        '<h2>New Customer Enquiry Received</h2>',
        '</div>',
        '<div class="content">',
        '<div class="section">',
        '<h3>Customer Details</h3>',
        `<div class="field"><strong>Customer Name:</strong> ${name}</div>`,
        `<div class="field"><strong>Email:</strong> ${email}</div>`,
        `<div class="field"><strong>Phone Number:</strong> ${phone}</div>`,
        `<div class="field"><strong>Location:</strong> ${city || 'Not specified'}</div>`,
        '</div>',
        '<div class="section">',
        '<h3>Vehicle Details</h3>',
        `<div class="field"><strong>Vehicle Brand:</strong> ${carData.brand}</div>`,
        `<div class="field"><strong>Vehicle Model:</strong> ${carData.model}</div>`,
        `<div class="field"><strong>Year:</strong> ${carData.year}</div>`,
        `<div class="field"><strong>Fuel Type:</strong> ${carData.fuelType}</div>`,
        `<div class="field"><strong>Price:</strong> ${formattedPrice}</div>`,
        '</div>',
        '<div class="section">',
        '<h3>Customer Message</h3>',
        `<div class="message-box">${message.replace(/\n/g, '<br>')}</div>`,
        '</div>',
        '<div class="footer">',
        `<p>Enquiry received on: ${dateTimeString}</p>`,
        '<p>This is an automated notification from DriveDeal Enquiry System</p>',
        '</div>',
        '</div>',
        '</div>',
        '</body>',
        '</html>'
      ].join('')
    };

    // Send notification email ONLY after successful DB save using helper
    try {
      const enquiryData = {
        name: name,
        email: email,
        phone: phone,
        location: city,
        brand: carData.brand,
        model: carData.model,
        year: carData.year,
        fuelType: carData.fuelType,
        price: carData.price,
        message: message
      };
      const info = await sendEnquiryEmail(enquiryData);
      console.log('✅ Enquiry notification email sent:', {
        to: adminEmail,
        messageId: info && info.messageId,
        response: info && info.response
      });
    } catch (emailError) {
      console.error('❌ Error sending enquiry notification email:', emailError);
    }

    res.status(200).json({
      success: true,
      message: 'Thank you! We will contact you soon.',
      data: enquiry
    });
  } catch (error) {
    console.error('Error processing enquiry:', error);
    res.status(500).json({
      success: false,
      message: 'Server error. Please try again later.'
    });
  }
});

// Get all enquiries (for admin panel)
app.get('/api/enquiries', async (req, res) => {
  try {
    const { email } = req.query;
    const filter = email ? { email } : {};
    const enquiries = await Enquiry.find(filter).sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      data: enquiries
    });
  } catch (error) {
    console.error('Error fetching enquiries:', error);
    res.status(500).json({
      success: false,
      message: 'Server error. Please try again later.'
    });
  }
});

app.put('/api/enquiries/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const allowedStatuses = ['New', 'Contacted', 'Closed'];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const enquiry = await Enquiry.findByIdAndUpdate(
      req.params.id,
      {
        status,
        $push: {
          statusHistory: {
            status,
            updatedAt: new Date()
          }
        }
      },
      { new: true }
    );

    if (!enquiry) {
      return res.status(404).json({
        success: false,
        message: 'Enquiry not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Enquiry status updated',
      data: enquiry
    });
  } catch (error) {
    console.error('Error updating enquiry status:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating enquiry status'
    });
  }
});

// Sold Car Endpoints
app.post('/api/sold-cars', async (req, res) => {
    try {
        const { carId, buyerName, buyerEmail, buyerPhone, buyerAddress, buyerDistrict, buyerState, buyerCountry, carName, carModel, salePrice, saleDate, paymentMethod, additionalNotes } = req.body;
        
        // Create sold car record
        const soldCar = new SoldCar({
            carId, buyerName, buyerEmail, buyerPhone, buyerAddress, buyerDistrict, buyerState, buyerCountry, carName, carModel, salePrice, saleDate, paymentMethod, additionalNotes
        });
        await soldCar.save();

        // Update car status to sold
        await Car.findByIdAndUpdate(carId, { status: 'sold' });

        res.status(201).json({ success: true, message: 'Car marked as sold and record saved', data: soldCar });
    } catch (error) {
        console.error('Error saving sold car record:', error);
        res.status(500).json({ success: false, message: 'Server error saving sold car record' });
    }
});

app.get('/api/sold-cars', async (req, res) => {
    try {
        const soldCars = await SoldCar.find().populate('carId').sort({ saleDate: -1 });
        res.json({ success: true, data: soldCars });
    } catch (error) {
        console.error('Error fetching sold cars:', error);
        res.status(500).json({ success: false, message: 'Server error fetching sold cars' });
    }
});

app.get('/api/sold-cars/car/:carId', async (req, res) => {
    try {
        const soldCar = await SoldCar.findOne({ carId: req.params.carId });
        if (!soldCar) {
            return res.status(404).json({ success: false, message: 'Sold record not found for this car' });
        }
        res.json({ success: true, data: soldCar });
    } catch (error) {
        console.error('Error fetching sold car info:', error);
        res.status(500).json({ success: false, message: 'Server error fetching sold car info' });
    }
});

// Signup Endpoint
app.post('/api/signup', async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    const newUser = new User({ name, email, phone, password });
    await newUser.save();

    res.json({ success: true, user: { name, email, phone } });
  } catch (error) {
    console.error('Error signing up:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get user profile by email
app.get('/api/users/profile', async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email required' });
    }
    const user = await User.findOne({ email }).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, user: user.toObject() });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update user profile
app.put('/api/users/profile', async (req, res) => {
  try {
    const { email, firstName, lastName, location, phone } = req.body;
    const clientEmail = req.headers['x-user-email'];
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email required' });
    }
    if (clientEmail && clientEmail.trim() !== email.trim()) {
      return res.status(403).json({ success: false, message: 'User identifier mismatch' });
    }
    const existingUser = await User.findOne({ email });
    if (!existingUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    const update = {};
    if (firstName !== undefined) update.firstName = firstName;
    if (lastName !== undefined) update.lastName = lastName;
    if (location !== undefined) update.location = location;
    if (phone !== undefined) update.phone = phone;
    const fullName = [firstName ?? '', lastName ?? ''].map(s => String(s || '').trim()).filter(Boolean).join(' ');
    if (fullName && (firstName !== undefined || lastName !== undefined)) {
      update.name = fullName;
    }

    const user = await User.findOneAndUpdate(
      { email },
      { $set: update },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, user: user.toObject() });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Login Endpoint
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Check for mock admin
    if (email === 'drivedeal@admin.com' && password === 'admin123') {
        let user = await User.findOne({ email: 'drivedeal@admin.com' });
        if (!user) {
            user = new User({
                name: 'Admin',
                email: 'drivedeal@admin.com',
                phone: '0000000000',
                password: 'admin123' // Not secure, but this is a mock
            });
            await user.save();
        }
        const userObj = user.toObject();
        const { password, ...userWithoutPassword } = userObj;
        return res.json({ success: true, user: userWithoutPassword });
    }

    const user = await User.findOne({ email, password });
    
    if (user) {
      const userObj = user.toObject();
      const { password, ...userWithoutPassword } = userObj;
      res.json({ success: true, user: userWithoutPassword });
    } else {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Mock Google Login Endpoint
app.post('/api/login/google', async (req, res) => {
    try {
        const { email, name } = req.body;
        let user = await User.findOne({ email });
        if (!user) {
            user = new User({
                name: name || 'Google User',
                email: email,
                phone: 'Not provided',
                password: Math.random().toString(36).substring(7) // Random password for mock user
            });
            await user.save();
        }
        const userObj = user.toObject();
        const { password, ...userWithoutPassword } = userObj;
        res.json({ success: true, user: userWithoutPassword });
    } catch (error) {
        console.error('Error in Google login mock:', error);
        res.status(500).json({ success: false, message: 'Server error during mock login' });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    success: true, 
    message: 'Backend API is running with MongoDB' 
  });
});

// Wishlist Endpoints
app.post('/api/wishlist', async (req, res) => {
    try {
        const { userId, carId } = req.body;
        
        if (!userId || !carId) {
            return res.status(400).json({ success: false, message: 'User ID and Car ID are required' });
        }

        if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(carId)) {
            return res.status(400).json({ success: false, message: 'Invalid User ID or Car ID format' });
        }

        const exists = await Wishlist.findOne({ userId, carId });
        if (exists) {
            return res.status(400).json({ success: false, message: 'Already in wishlist' });
        }
        const item = new Wishlist({ userId, carId });
        await item.save();
        res.status(201).json({ success: true, message: 'Added to wishlist' });
    } catch (error) {
        console.error('Error adding to wishlist:', error);
        res.status(500).json({ success: false, message: 'Server error: ' + error.message });
    }
});

app.get('/api/wishlist/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ success: false, message: 'Invalid User ID format' });
        }
        const items = await Wishlist.find({ userId }).populate('carId');
        res.json({ success: true, data: items });
    } catch (error) {
        console.error('Error fetching wishlist:', error);
        res.status(500).json({ success: false, message: 'Server error fetching wishlist' });
    }
});

app.delete('/api/wishlist/:userId/:carId', async (req, res) => {
    try {
        const { userId, carId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(carId)) {
            return res.status(400).json({ success: false, message: 'Invalid ID format' });
        }
        await Wishlist.findOneAndDelete({ userId, carId });
        res.json({ success: true, message: 'Removed from wishlist' });
    } catch (error) {
        console.error('Error removing from wishlist:', error);
        res.status(500).json({ success: false, message: 'Server error removing from wishlist' });
    }
});

// Compare Endpoints
app.post('/api/compare', async (req, res) => {
    try {
        const { userId, carId } = req.body;
        const count = await Compare.countDocuments({ userId });
        if (count >= 3) { // Limit to 3 cars for comparison
             return res.status(400).json({ success: false, message: 'Max 3 cars can be compared' });
        }
        const exists = await Compare.findOne({ userId, carId });
        if (exists) {
            return res.status(400).json({ success: false, message: 'Already in compare list' });
        }
        const item = new Compare({ userId, carId });
        await item.save();
        res.status(201).json({ success: true, message: 'Added to compare' });
    } catch (error) {
        console.error('Error adding to compare:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

app.get('/api/compare/:userId', async (req, res) => {
    try {
        const items = await Compare.find({ userId: req.params.userId }).populate('carId');
        res.json({ success: true, data: items });
    } catch (error) {
        console.error('Error fetching compare list:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

app.delete('/api/compare/:userId/:carId', async (req, res) => {
    try {
        await Compare.findOneAndDelete({ userId: req.params.userId, carId: req.params.carId });
        res.json({ success: true, message: 'Removed from compare list' });
    } catch (error) {
        console.error('Error removing from compare list:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

app.listen(PORT, () => {
  console.log(`🚀 Backend server running on http://localhost:${PORT}`);
});
