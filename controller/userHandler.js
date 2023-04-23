const catchAsync = require('./catchAsync');
const OperationalError = require('./../utils/operationalError');
const User = require('./../model/userModel');

//Code inspired from https://www.udemy.com/course/nodejs-express-mongodb-bootcamp/
/**
 * Function used to filter an object based on field passed into the allowedFields variable argument.
 *
 * @param {object} objectToFilter object expected to be filtered
 * @param  {...string} allowedFields expects a sequence of string arguments
 * @returns a new object containing only the required fields
 */
const filterFields = (objectToFilter, ...allowedFields) => {
  filteredObject = {};
  Object.keys(objectToFilter).forEach((element) => {
    if (allowedFields.includes(element)) {
      filterFields[element] = objectToFilter[element];
    }
  });
  return filteredObject;
};

//Code inspired from https://www.udemy.com/course/nodejs-express-mongodb-bootcamp/
/**
 * Middleware function used to update the current user account, based on the  data provided into the request object.
 * @function filterFields will restrict the fields that can be updated.
 * @function catchAsync used to catch and propagate further any occurring error.
 * @param {object} req expects a request object
 * @param {object} res expects a response object
 * @param {function} next expects a function that will be used to  navigate to the next middleware
 */
exports.updateMyAccount = catchAsync(async (req, res, next) => {
  //1 Avoid user trying to update password, and redirect
  if (req.body.password || req.body.confirmPassword) {
    //400 BAD REQUEST
    return next(new OperationalError('This route is not for updating passwords. Try /updatePassword', 400));
  }
  //2 Update the user body -> cannot use User.save because password validation will run, an ther is no password
  //  Must avoid updating attributes like role, password, confPassword by filtering out data coming from the requset body
  const fieldsToUpdate = filterFields(req.body, 'lastName', 'firstName', 'phoneNumber');
  //3 Update and  obtain the user and deselect any unnecessary data, by projecting only the requried fields.
  const updatedUser = await User.findByIdAndUpdate(req.userId, fieldsToUpdate, {
    new: true,
    runValidators: true,
  }).select('-__v -role');
  //4 Couldn't find the user. May not be required.
  if (!updatedUser) {
    next(new OperationalError('No such user found, wrong ID'));
  }
  //5 Send back to the user the new data
  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser,
    },
  });
});

//Code inspired from https://www.udemy.com/course/nodejs-express-mongodb-bootcamp/
/**
 * Middleware function used to get the current information of the logged in user, and send it back to the client.
 * @function catchAsync used to catch and propagate further any occurring error.
 * @param {object} req expects a request object
 * @param {object} res expects a response object
 * @param {function} next expects a function that will be used to  navigate to the next middleware
 */
exports.getMyAccount = catchAsync(async (req, res, next) => {
  //1 Obtain the user and deselect any unnecessary data.
  const user = await Model.findById({ _id: req.userId }).select('-__v -role');
  //the query has not returned anything
  if (!user) {
    next(new OperationalError('No such user found, wrong ID'));
  }
  //5 Send back to the user the new data
  res.status(200).json({
    status: 'success',
    data: { user },
  });
});
