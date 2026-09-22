const joi = require("joi");

const searchQuerySchema = joi.object({
    q: joi.string().trim().min(1).max(50).required(),
});

module.exports ={
    searchQuerySchema,
}