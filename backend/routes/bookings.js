const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { bookingValidation } = require('../utils/validators');
const bookingController = require('../controllers/bookingController');

router.get('/', authenticate, bookingController.getBookings);
router.get('/calendar', authenticate, bookingController.getBookingCalendar);
router.get('/bookable-assets', authenticate, bookingController.getBookableAssets);
router.post('/', authenticate, bookingValidation, bookingController.createBooking);
router.delete('/:bookingId', authenticate, bookingController.cancelBooking);

module.exports = router;
