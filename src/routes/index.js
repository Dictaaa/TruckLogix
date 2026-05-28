const { Router } = require('express');
const authRoutes = require('./auth.routes');
const vehicleRoutes = require('./vehicle.routes');
const usersRoutes = require('./users.routes');
const departmentsRoutes = require('./departments.routes');
const municipalitiesRoutes = require('./municipalities.routes');
const documentTypeRoutes = require('./document_type.routes');
const registrationRoutes = require('./registration.routes');
const inspectionItemRoutes = require('./inspection_items.routes');
const vehicleInspectionItemsRoutes = require('./vehicle_inspection_items.routes');
const vehicleDriverAssignment = require('./vehicleDriverAssignment.routes');
const tripRoutes = require('./trip.routes');
const driversRoutes = require('./drivers.routes');
const vehicleDriverAssignmentRoutes = require('./vehicleDriverAssignment.routes');

const router = Router();
vehicleDriverAssignment.routes
router.use('/auth', authRoutes);
router.use('/vehicles', vehicleRoutes);
router.use('/users', usersRoutes);
router.use('/departments', departmentsRoutes);
router.use('/municipalities', municipalitiesRoutes);
router.use('/document-types', documentTypeRoutes);
router.use('/registration', registrationRoutes);
router.use('/inspection-items', inspectionItemRoutes);
router.use('/vehicle-inspection-items', vehicleInspectionItemsRoutes);
router.use('/vehicle-driver-assignment', vehicleDriverAssignment);
router.use('/trip', tripRoutes);
router.use('/drivers', driversRoutes);
router.use('/driver-vehicles', vehicleDriverAssignmentRoutes);


module.exports = router;
