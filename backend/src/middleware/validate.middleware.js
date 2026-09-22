const mongoose = require("mongoose");
const validate = (schema) =>{
    return (req, res, next) =>{
        const {error, value} = schema.validate(req.body, {
            abortEarly: false, // Return all errors, not just the first one
            stripUnknown: true, // Remove unknown keys that are not defined in the schema, the controller receives only feilds defined by schema
        }); // ex:role if user sends role in req.body it will be removed
        if(error){
            return res.status(400).json({
                success: false,
                message: "validation failed",
                errors: error.details.map((detail) => detail.message),
            })
        }
        req.body = value;
        next();
    };
};

const validateObjectId = (paramName) => {
  return (req, res, next) => {
    const id = req.params[paramName];

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: `Invalid ${paramName}`,
      });
    }

    next();
  };
};

const validateBody = (schema) =>{
  return (req,res,next) =>{
    const {error} = schema.validate(req.body);

    if(error){
      return res.status(400).json({
        success:false,
        message: error.details[0].message,
      });
    }
    next();
  }
}

const validateQuery = (schema) =>{
  return (req,res,next) =>{
    const {error} = schema.validate(req.query);

    if(error){
      return res.status(400).json({
        success:false,
        message: error.details[0].message,
      });
    }
    next();
  }
}

module.exports = {
  validate,
  validateObjectId,
  validateBody,
  validateQuery,
};